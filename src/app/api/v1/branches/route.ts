import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/rbac'
import type { ApiResponse, SessionUser } from '@/types'

async function handler(_req: Request, _ctx: { params: Record<string, string>; user: SessionUser }) {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: [{ country: 'asc' }, { branchName: 'asc' }],
    select: {
      id: true,
      branchName: true,
      country: true,
      currency: true,
      location: true,
    },
  })

  return NextResponse.json<ApiResponse<typeof branches>>({ success: true, data: branches })
}

export const GET = withRole(['admin', 'manager', 'staff'], handler)
