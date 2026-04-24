import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'

interface Ctx {
  params: Promise<{ trackingNo: string }>
}

export async function GET(_req: Request, { params }: Ctx) {
  const { trackingNo } = await params

  const shipment = await prisma.shipment.findUnique({
    where: { trackingNo },
    select: {
      trackingNo: true,
      status: true,
      codAmount: true,
      originBranch: { select: { branchName: true, country: true } },
      destinationBranch: { select: { branchName: true, country: true } },
      codTransaction: { select: { status: true } },
      events: {
        where: { eventType: 'status_change' },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          eventType: true,
          status: true,
          location: true,
          createdAt: true,
        },
      },
    },
  })

  if (!shipment) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Tracking number not found' }, { status: 404 })
  }

  return NextResponse.json<ApiResponse<typeof shipment>>({ success: true, data: shipment })
}
