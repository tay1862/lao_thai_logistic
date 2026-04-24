import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserFromRequest } from '@/lib/auth'
import type { ApiResponse, SessionUser } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getSessionUserFromRequest(req)
  if (!user) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
  return NextResponse.json<ApiResponse<SessionUser>>({ success: true, data: user })
}
