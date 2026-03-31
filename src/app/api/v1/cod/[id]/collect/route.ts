import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withRole, canAccessBranch } from '@/lib/rbac'
import { writeAuditLog } from '@/lib/audit'
import type { ApiResponse, SessionUser } from '@/types'

const CollectSchema = z.object({
  collectedAmount: z.number().nonnegative(),
  discrepancyNote: z.string().max(500).optional(),
})

type Ctx = { params: Promise<{ id: string }>; user: SessionUser }

async function handler(req: NextRequest, { params, user }: Ctx) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = CollectSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const trx = await prisma.codTransaction.findUnique({
    where: { id },
    select: { id: true, branchId: true, status: true, expectedAmount: true, shipmentId: true },
  })

  if (!trx) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'ไม่พบรายการ COD' }, { status: 404 })
  }

  if (!canAccessBranch(user, trx.branchId)) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  if (trx.status !== 'pending') {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'รายการนี้ไม่อยู่ในสถานะรอเก็บเงิน' },
      { status: 422 }
    )
  }

  const discrepancy = trx.expectedAmount - parsed.data.collectedAmount
  if (discrepancy !== 0 && !parsed.data.discrepancyNote) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'กรุณาระบุหมายเหตุส่วนต่างยอดเงิน' },
      { status: 422 }
    )
  }

  await prisma.codTransaction.update({
    where: { id },
    data: {
      status: 'collected',
      collectedAmount: parsed.data.collectedAmount,
      discrepancyNote: parsed.data.discrepancyNote,
      collectedById: user.id,
      collectedAt: new Date(),
    },
  })

  await writeAuditLog(user.id, 'COD_COLLECTED', 'CodTransaction', id, null, {
    expectedAmount: trx.expectedAmount,
    collectedAmount: parsed.data.collectedAmount,
    discrepancy,
  })

  return NextResponse.json<ApiResponse<null>>({ success: true, message: 'อัปเดตการเก็บเงิน COD แล้ว' })
}

export const PATCH = withRole(['admin', 'manager', 'staff'], handler)
