import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserFromRequest } from '@/lib/auth'
import type { SessionUser, ApiResponse } from '@/types'

type Role = 'admin' | 'manager' | 'staff'

type RouteHandler<T = unknown> = (
  req: NextRequest,
  ctx: { params: T; user: SessionUser }
) => Promise<NextResponse>

/**
 * Higher-order function that enforces role-based access.
 * Usage: export const GET = withRole(['admin','manager'], handler)
 */
export function withRole<T = unknown>(allowedRoles: Role[], handler: RouteHandler<T>) {
  return async (req: NextRequest, ctx: { params: Promise<any> }): Promise<NextResponse> => {
    const user = await getSessionUserFromRequest(req)

    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!allowedRoles.includes(user.role as Role)) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    return handler(req, { params: ctx.params as T, user })
  }
}

/**
 * Applies branch scope filter for non-admin/manager users.
 * Staff can only query their own branch.
 */
export function codBranchScope(user: SessionUser): Record<string, unknown> {
  if (user.role === 'admin' || user.role === 'manager') {
    return {}
  }
  if (!user.branchId) {
    throw new Error('Staff user has no branchId assigned')
  }
  return { branchId: user.branchId }
}

export function shipmentBranchScope(user: SessionUser): Record<string, unknown> {
  if (user.role === 'admin' || user.role === 'manager') {
    return {}
  }
  if (!user.branchId) {
    throw new Error('Staff user has no branchId assigned')
  }
  return {
    OR: [
      { originBranchId: user.branchId },
      { destinationBranchId: user.branchId },
    ],
  }
}

/**
 * Ensures a staff user can only operate on their own branch.
 * Returns true if allowed.
 */
export function canAccessBranch(user: SessionUser, branchId: string): boolean {
  if (user.role === 'admin' || user.role === 'manager') return true
  return user.branchId === branchId
}
