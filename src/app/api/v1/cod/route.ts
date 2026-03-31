import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole, codBranchScope } from '@/lib/rbac'
import type { ApiResponse, SessionUser } from '@/types'

async function handler(req: NextRequest, { user }: { params: Record<string, string>; user: SessionUser }) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const scope = codBranchScope(user)

  const codItems = await prisma.codTransaction.findMany({
    where: {
      ...scope,
      ...(status ? { status: status as any } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      status: true,
      currency: true,
      expectedAmount: true,
      collectedAmount: true,
      discrepancyNote: true,
      createdAt: true,
      collectedAt: true,
      transferredAt: true,
      shipment: {
        select: {
          id: true,
          trackingNo: true,
          status: true,
          receiver: { select: { firstname: true, lastname: true } },
        },
      },
      branch: { select: { id: true, branchName: true } },
    },
  })

  return NextResponse.json<ApiResponse<typeof codItems>>({ success: true, data: codItems })
}

export const GET = withRole(['admin', 'manager', 'staff'], handler)
