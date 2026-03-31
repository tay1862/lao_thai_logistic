import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserFromRequest, clearSessionCookie } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest) {
  const user = await getSessionUserFromRequest(req)
  if (user) {
    await writeAuditLog(user.id, 'LOGOUT', 'User', user.id)
  }
  const res = NextResponse.json<ApiResponse<null>>({ success: true })
  res.cookies.set(clearSessionCookie())
  return res
}
