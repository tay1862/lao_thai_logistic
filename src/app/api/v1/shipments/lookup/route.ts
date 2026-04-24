import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { shipmentBranchScope, withRole } from '@/lib/rbac'
import type { ApiResponse, SessionUser } from '@/types'

export const dynamic = 'force-dynamic'

async function handler(
  req: NextRequest,
  { user }: { params: Record<string, string>; user: SessionUser }
) {
  const { searchParams } = new URL(req.url)
  const trackingNo = searchParams.get('trackingNo')?.trim()

  if (!trackingNo) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'trackingNo is required' },
      { status: 400 }
    )
  }

  const scope = shipmentBranchScope(user)

  const shipmentByTracking = await prisma.shipment.findFirst({
    where: {
      ...scope,
      trackingNo,
    },
    select: {
      id: true,
      trackingNo: true,
      status: true,
      codAmount: true,
      currency: true,
      receiver: { select: { firstname: true, lastname: true, phone: true } },
      destinationBranch: { select: { branchName: true } },
    },
  })

  if (shipmentByTracking) {
    return NextResponse.json<ApiResponse<typeof shipmentByTracking>>({
      success: true,
      data: shipmentByTracking,
    })
  }

  const shipmentsByExternalTracking = await prisma.shipment.findMany({
    where: {
      ...scope,
      externalTrackingNo: trackingNo,
    },
    orderBy: { createdAt: 'desc' },
    take: 2,
    select: {
      id: true,
      trackingNo: true,
      status: true,
      codAmount: true,
      currency: true,
      receiver: { select: { firstname: true, lastname: true, phone: true } },
      destinationBranch: { select: { branchName: true } },
    },
  })

  if (shipmentsByExternalTracking.length > 1) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Multiple shipments matched this external tracking number' },
      { status: 409 }
    )
  }

  const matchedShipment = shipmentsByExternalTracking[0]
  if (!matchedShipment) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Shipment not found' },
      { status: 404 }
    )
  }

  return NextResponse.json<ApiResponse<typeof matchedShipment>>({
    success: true,
    data: matchedShipment,
  })
}

export const GET = withRole(['admin', 'manager', 'staff'], handler)
