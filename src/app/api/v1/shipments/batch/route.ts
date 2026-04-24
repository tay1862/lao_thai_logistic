import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/rbac'
import { writeAuditLog } from '@/lib/audit'
import { canTransition } from '@/lib/shipment-status'
import type { ApiResponse, SessionUser, ShipmentStatus } from '@/types'

export const dynamic = 'force-dynamic'

const BatchSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  status: z.enum([
    'in_transit', 'arrived', 'delivered',
    'failed_delivery', 'returned', 'cancelled',
  ]),
  location: z.string().max(200).optional(),
  note: z.string().max(1000).optional(),
})

type FailedItem = {
  id: string
  trackingNo: string
  currentStatus: ShipmentStatus
  reason: 'invalid_transition' | 'not_found' | 'branch_mismatch'
}

async function patchHandler(
  req: NextRequest,
  { user }: { params: Record<string, string>; user: SessionUser }
) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Invalid JSON' },
      { status: 400 }
    )
  }

  const parsed = BatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const { ids, status: newStatus, location, note } = parsed.data

  // Fetch all shipments in one query
  const shipments = await prisma.shipment.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      trackingNo: true,
      status: true,
      deliveryAttempts: true,
      originBranchId: true,
      destinationBranchId: true,
    },
  })

  const shipmentMap = new Map(shipments.map((s) => [s.id, s]))

  let successCount = 0
  const failed: FailedItem[] = []

  for (const id of ids) {
    const shipment = shipmentMap.get(id)

    if (!shipment) {
      failed.push({ id, trackingNo: id, currentStatus: 'received' as ShipmentStatus, reason: 'not_found' })
      continue
    }

    // Branch scope check for staff
    if (user.role === 'staff' && user.branchId) {
      const hasAccess =
        shipment.originBranchId === user.branchId ||
        shipment.destinationBranchId === user.branchId
      if (!hasAccess) {
        failed.push({ id, trackingNo: shipment.trackingNo, currentStatus: shipment.status as ShipmentStatus, reason: 'branch_mismatch' })
        continue
      }
    }

    if (!canTransition(shipment.status as ShipmentStatus, newStatus as ShipmentStatus)) {
      failed.push({ id, trackingNo: shipment.trackingNo, currentStatus: shipment.status as ShipmentStatus, reason: 'invalid_transition' })
      continue
    }

    // Update in transaction
    try {
      await prisma.$transaction(async (tx) => {
        await tx.shipment.update({
          where: { id },
          data: {
            status: newStatus,
            deliveryAttempts:
              newStatus === 'failed_delivery'
                ? { increment: 1 }
                : undefined,
            updatedAt: new Date(),
          },
        })
        await tx.shipmentEvent.create({
          data: {
            shipmentId: id,
            eventType: 'status_change',
            status: newStatus,
            location: location ?? null,
            note: note ?? null,
            performedById: user.id,
          },
        })
      })
      successCount++
    } catch {
      failed.push({ id, trackingNo: shipment.trackingNo, currentStatus: shipment.status as ShipmentStatus, reason: 'invalid_transition' })
    }
  }

  // Write single audit log for the batch
  await writeAuditLog(
    user.id,
    'SHIPMENT_STATUS_CHANGED',
    'Shipment',
    ids[0] ?? '',
    null,
    { count: ids.length, status: newStatus, success: successCount, failed: failed.length },
  )

  return NextResponse.json<ApiResponse<{ success: number; failed: FailedItem[] }>>({
    success: true,
    data: { success: successCount, failed },
  })
}

export const PATCH = withRole(['admin', 'manager', 'staff'], patchHandler)
