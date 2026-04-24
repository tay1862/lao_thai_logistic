import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { signToken, buildSessionCookie, shouldUseSecureCookies } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit'
import { checkRateLimit, clearRateLimit, getClientIp } from '@/lib/utils'
import type { ApiResponse, SessionUser } from '@/types'

export const dynamic = 'force-dynamic'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
})

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Invalid JSON' },
      { status: 400 }
    )
  }

  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Invalid input' },
      { status: 400 }
    )
  }

  const { email, password } = parsed.data

  // Rate limit: 5 attempts per email per 15 min
  if (!checkRateLimit(`login:${email}`, 5)) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Too many login attempts. Try again in 15 minutes.' },
      { status: 429 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { branch: { select: { branchName: true } } },
  })

  if (!user || user.status !== 'active') {
    await writeAuditLog(
      user?.id ?? 'unknown',
      'LOGIN_FAILED',
      'User',
      email,
      null,
      { ip, reason: user ? 'inactive' : 'not_found' }
    )
    // Timing-safe: always compare hash even on not-found
    await bcrypt.compare(password, '$2a$12$invalidhashpadding000000000000000000000000000000000000000')
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Invalid email or password' },
      { status: 401 }
    )
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) {
    await writeAuditLog(user.id, 'LOGIN_FAILED', 'User', user.id, null, { ip, reason: 'wrong_password' })
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Invalid email or password' },
      { status: 401 }
    )
  }

  // Clear rate limit on success
  clearRateLimit(`login:${email}`)

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    role: user.role,
    branchId: user.branchId,
    branchName: user.branch?.branchName ?? null,
  }

  const token = await signToken(sessionUser)
  const cookie = buildSessionCookie(token, shouldUseSecureCookies(req))

  await writeAuditLog(user.id, 'LOGIN', 'User', user.id, null, { ip })

  const res = NextResponse.json<ApiResponse<SessionUser>>({
    success: true,
    data: sessionUser,
  })
  res.cookies.set(cookie)
  return res
}
