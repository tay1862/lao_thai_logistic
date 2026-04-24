import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withRole, canAccessBranch } from '@/lib/rbac'
import { writeAuditLog } from '@/lib/audit'
import { canTransition, MAX_DELIVERY_ATTEMPTS } from '@/lib/shipment-status'
import type { ApiResponse, SessionUser } from '@/types'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }>; user: SessionUser }

const SHIPMENT_SELECT = {
  id: true, trackingNo: true, status: true, currency: true, price: true,
  priceType: true, manualPriceNote: true, cod: true, codAmount: true,
  weightKg: true, dimensions: true, photoPath: true, itemDescription: true,
  externalTrackingNo: true, shippingPartner: true, deliveryAttempts: true,
  createdAt: true, updatedAt: true,
  sender: { select: { id: true, firstname: true, lastname: true, phone: true, address: true } },
  receiver: { select: { id: true, firstname: true, lastname: true, phone: true, address: true } },
  originBranch: { select: { id: true, branchName: true, country: true } },
  destinationBranch: { select: { id: true, branchName: true, country: true } },
  createdBy: { select: { firstname: true, lastname: true } },
  events: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true, eventType: true, status: true, location: true, note: true, createdAt: true,
      performedBy: { select: { firstname: true, lastname: true } },
    },
  },
  codTransaction: {
    select: {
      id: true, status: true, currency: true, expectedAmount: true,
      collectedAmount: true, discrepancyNote: true, collectedAt: true, transferredAt: true,
    },
  },
} as const

async function getHandler(req: NextRequest, { params, user }: Ctx) {
  const { id } = await params
  const shipment = await prisma.shipment.findUnique({ where: { id }, select: SHIPMENT_SELECT })

  if (!shipment) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'ไม่พบพัสดุ' }, { status: 404 })
  }

  if (!canAccessBranch(user, shipment.originBranch.id) && !canAccessBranch(user, shipment.destinationBranch.id)) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json<ApiResponse<typeof shipment>>({ success: true, data: shipment })
}

// ── Update status ─────────────────────────────────────────────────────────
const UpdateSchema = z.object({
  status: z.enum([
    'in_transit', 'arrived',
    'delivered', 'failed_delivery', 'returned', 'cancelled',
  ]),
  location: z.string().max(200).optional(),
  note: z.string().max(1000).optional(),
})

async function patchHandler(req: NextRequest, { params, user }: Ctx) {
  const { id } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const { status: newStatus, location, note } = parsed.data

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    select: { id: true, status: true, deliveryAttempts: true, originBranchId: true, destinationBranchId: true },
  })

  if (!shipment) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'ไม่พบพัสดุ' }, { status: 404 })
  }

  if (!canAccessBranch(user, shipment.originBranchId) && !canAccessBranch(user, shipment.destinationBranchId)) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  // Cancellation: only staff/manager, only from 'received'
  if (newStatus === 'cancelled') {
    if (shipment.status !== 'received') {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'ยกเลิกได้เฉพาะพัสดุที่ยังไม่ได้จัดส่ง' },
        { status: 422 }
      )
    }
  }

  if (!canTransition(shipment.status, newStatus as any)) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: `ไม่สามารถเปลี่ยนสถานะจาก ${shipment.status} เป็น ${newStatus}` },
      { status: 422 }
    )
  }

  // Delivery attempt count
  let deliveryAttempts = shipment.deliveryAttempts
  if (newStatus === 'failed_delivery') {
    deliveryAttempts += 1
    if (deliveryAttempts > MAX_DELIVERY_ATTEMPTS) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'ครบ 3 ครั้งแล้ว กรุณาเปลี่ยนเป็นส่งคืน' },
        { status: 422 }
      )
    }
  }

  const updated = await prisma.$transaction(async (tx: any) => {
    const s = await tx.shipment.update({
      where: { id },
      data: { status: newStatus as any, deliveryAttempts },
    })
    await tx.shipmentEvent.create({
      data: {
        shipmentId: id,
        eventType: 'status_change',
        status: newStatus as any,
        location: location ?? null,
        note: note ?? null,
        performedById: user.id,
      },
    })

    // Cancel COD if shipment is cancelled
    if (newStatus === 'cancelled') {
      await tx.codTransaction.updateMany({
        where: { shipmentId: id, status: { in: ['pending', 'collected'] } },
        data: { status: 'cancelled' },
      })
    }

    return s
  })

  await writeAuditLog(user.id, 'SHIPMENT_STATUS_CHANGED', 'Shipment', id,
    { status: shipment.status }, { status: newStatus })

  return NextResponse.json<ApiResponse<{ status: string }>>({
    success: true,
    data: { status: updated.status },
  })
}

export const GET = withRole(['admin', 'manager', 'staff'], getHandler)
export const PATCH = withRole(['admin', 'manager', 'staff'], patchHandler)
