import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/rbac'
import { writeAuditLog } from '@/lib/audit'
import type { ApiResponse, SessionUser } from '@/types'

export const dynamic = 'force-dynamic'

type Ctx = { params: Record<string, string>; user: SessionUser }

const USER_SELECT = {
  id: true,
  firstname: true,
  lastname: true,
  email: true,
  role: true,
  status: true,
  branchId: true,
  createdAt: true,
  branch: { select: { branchName: true } },
} as const

const CreateSchema = z.object({
  firstname: z.string().trim().min(1).max(100),
  lastname: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(6).max(128),
  role: z.enum(['admin', 'manager', 'staff']),
  status: z.enum(['active', 'inactive']).default('active'),
  branchId: z.string().trim().min(3).max(80).optional(),
})

async function listHandler(_req: NextRequest, _ctx: Ctx) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: USER_SELECT,
  })

  return NextResponse.json<ApiResponse<typeof users>>({ success: true, data: users })
}

async function createHandler(req: NextRequest, { user }: Ctx) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'admin.userCrud.api.invalidJson' },
      { status: 400 }
    )
  }

  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'admin.userCrud.api.invalidInput' },
      { status: 400 }
    )
  }

  const data = parsed.data

  const passwordHash = await bcrypt.hash(data.password, 12)

  try {
    const created = await prisma.user.create({
      data: {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        passwordHash,
        role: data.role,
        status: data.status,
        branchId: data.branchId ?? null,
        createdById: user.id,
      },
      select: USER_SELECT,
    })

    await writeAuditLog(user.id, 'USER_CREATED', 'User', created.id, null, {
      email: created.email,
      role: created.role,
      status: created.status,
      branchId: created.branchId,
    })

    return NextResponse.json<ApiResponse<typeof created>>(
      { success: true, data: created },
      { status: 201 }
    )
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'admin.userCrud.api.emailExists' },
        { status: 409 }
      )
    }
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'admin.userCrud.api.unexpected' },
      { status: 500 }
    )
  }
}

export const GET = withRole(['admin'], listHandler)
export const POST = withRole(['admin'], createHandler)
