import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/rbac'
import { shipmentBranchScope, codBranchScope } from '@/lib/rbac'
import type { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'

export interface DashboardStats {
  todayShipments: number
  pendingCod: number
  pendingCodAmount: number
  activeShipments: number
  deliveredToday: number
  failedDelivery: number
}

async function handler(req: NextRequest, { user }: { params: Record<string, string>; user: import('@/types').SessionUser }) {
  const shipmentScope = shipmentBranchScope(user)
  const codScope = codBranchScope(user)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [todayShipments, activeShipments, deliveredToday, failedDelivery, codAgg] = await Promise.all([
    prisma.shipment.count({
      where: {
        ...shipmentScope,
        createdAt: { gte: today, lt: tomorrow },
      },
    }),
    prisma.shipment.count({
      where: {
        ...shipmentScope,
        status: { in: ['received', 'in_transit', 'arrived'] },
      },
    }),
    prisma.shipment.count({
      where: {
        ...shipmentScope,
        status: 'delivered',
        updatedAt: { gte: today, lt: tomorrow },
      },
    }),
    prisma.shipment.count({
      where: {
        ...shipmentScope,
        status: 'failed_delivery',
      },
    }),
    prisma.codTransaction.aggregate({
      where: {
        ...codScope,
        status: { in: ['pending', 'collected'] },
      },
      _count: true,
      _sum: { expectedAmount: true },
    }),
  ])

  const stats: DashboardStats = {
    todayShipments,
    activeShipments,
    deliveredToday,
    failedDelivery,
    pendingCod: codAgg._count,
    pendingCodAmount: codAgg._sum.expectedAmount ?? 0,
  }

  return NextResponse.json<ApiResponse<DashboardStats>>({ success: true, data: stats })
}

export const GET = withRole(['admin', 'manager', 'staff'], handler)
