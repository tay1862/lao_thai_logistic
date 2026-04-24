import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import type { SessionUser } from '@/types'

const COOKIE_NAME = 'tll_session'
const MAX_AGE = 60 * 60 * 24 // 24 hours

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set')
  }
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getSessionUserFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export function shouldUseSecureCookies(req: NextRequest) {
  if (process.env.NODE_ENV !== 'production') return false

  const forwardedProto = req.headers.get('x-forwarded-proto')
  if (forwardedProto) {
    return forwardedProto.split(',')[0]?.trim() === 'https'
  }

  return req.nextUrl.protocol === 'https:'
}

export function buildSessionCookie(token: string, secure: boolean) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure,
    sameSite: 'strict' as const,
    maxAge: MAX_AGE,
    path: '/',
  }
}

export function clearSessionCookie(secure: boolean) {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure,
    sameSite: 'strict' as const,
    maxAge: 0,
    path: '/',
  }
}
