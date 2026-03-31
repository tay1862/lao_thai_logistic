import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole, canAccessBranch } from '@/lib/rbac'
import { writeAuditLog } from '@/lib/audit'
import type { ApiResponse, SessionUser } from '@/types'

type Ctx = { params: Promise<{ id: string }>; user: SessionUser }

async function handler(_req: NextRequest, { params, user }: Ctx) {
  const { id } = await params

  const trx = await prisma.codTransaction.findUnique({
    where: { id },
    select: { id: true, branchId: true, status: true, shipmentId: true, expectedAmount: true, collectedAmount: true },
  })

  if (!trx) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'ไม่พบรายการ COD' }, { status: 404 })
  }

  if (!canAccessBranch(user, trx.branchId)) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  if (!['collected', 'pending_transfer'].includes(trx.status)) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'ต้องเก็บเงินแล้วก่อนโอน' },
      { status: 422 }
    )
  }

  await prisma.codTransaction.update({
    where: { id },
    data: {
      status: 'transferred',
      transferredById: user.id,
      transferredAt: new Date(),
    },
  })

  await writeAuditLog(user.id, 'COD_TRANSFERRED', 'CodTransaction', id, null, {
    expectedAmount: trx.expectedAmount,
    collectedAmount: trx.collectedAmount,
  })

  return NextResponse.json<ApiResponse<null>>({ success: true, message: 'ยืนยันการโอน COD แล้ว' })
}

export const PATCH = withRole(['admin', 'manager'], handler)
