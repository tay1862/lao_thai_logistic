import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withRole, shipmentBranchScope, canAccessBranch } from '@/lib/rbac'
import { writeAuditLog } from '@/lib/audit'
import { generateTrackingNo } from '@/lib/utils'
import type { ApiResponse, SessionUser, ShipmentStatus } from '@/types'

const SHIPPING_PARTNERS = ['internal', 'thailand_post', 'lao_post', 'flash', 'jnt', 'kerry', 'other'] as const
const optionalTrimmedString = (max: number) => z.preprocess((value) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}, z.string().max(max).optional())

// ── List Shipments ────────────────────────────────────────────────────────
async function listHandler(
  req: NextRequest,
  { user }: { params: Record<string, string>; user: SessionUser }
) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Math.max(10, Number(searchParams.get('pageSize') ?? 20)))
  const status = searchParams.get('status')
  const q = searchParams.get('q')?.trim()

  const scope = shipmentBranchScope(user)

  const where = {
    ...scope,
    ...(status && { status: status as ShipmentStatus }),
    ...(q && {
      OR: [
        { trackingNo: { contains: q, mode: 'insensitive' as const } },
        { externalTrackingNo: { contains: q, mode: 'insensitive' as const } },
        { sender: { OR: [
          { firstname: { contains: q, mode: 'insensitive' as const } },
          { lastname: { contains: q, mode: 'insensitive' as const } },
          { phone: { contains: q } },
        ]}},
        { receiver: { OR: [
          { firstname: { contains: q, mode: 'insensitive' as const } },
          { lastname: { contains: q, mode: 'insensitive' as const } },
          { phone: { contains: q } },
        ]}},
      ],
    }),
  }

  const [total, shipments] = await Promise.all([
    prisma.shipment.count({ where }),
    prisma.shipment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        trackingNo: true,
        status: true,
        currency: true,
        price: true,
        codAmount: true,
        weightKg: true,
        createdAt: true,
        sender: { select: { firstname: true, lastname: true, phone: true } },
        receiver: { select: { firstname: true, lastname: true, phone: true } },
        originBranch: { select: { branchName: true, country: true } },
        destinationBranch: { select: { branchName: true, country: true } },
      },
    }),
  ])

  return NextResponse.json<ApiResponse<typeof shipments>>({
    success: true,
    data: shipments,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  })
}

// ── Create Shipment ───────────────────────────────────────────────────────
const CreateSchema = z.object({
  senderFirstname: z.string().min(1).max(100),
  senderLastname: z.string().min(1).max(100),
  senderPhone: z.string().min(6).max(20),
  senderAddress: optionalTrimmedString(500),
  receiverFirstname: z.string().min(1).max(100),
  receiverLastname: z.string().min(1).max(100),
  receiverPhone: z.string().min(6).max(20),
  receiverAddress: optionalTrimmedString(500),
  originBranchId: z.string().min(3).max(80),
  destinationBranchId: z.string().min(3).max(80),
  weightKg: z.number().positive().max(500),
  itemDescription: optionalTrimmedString(1000),
  codAmount: z.number().min(0).max(9_999_999).default(0),
  priceType: z.enum(['calculated', 'manual']),
  manualPrice: z.number().positive().max(9_999_999).optional(),
  manualPriceNote: optionalTrimmedString(500),
  externalTrackingNo: optionalTrimmedString(100),
  shippingPartner: z.enum(SHIPPING_PARTNERS).optional(),
})

async function createHandler(
  req: NextRequest,
  { user }: { params: Record<string, string>; user: SessionUser }
) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const d = parsed.data

  // RBAC: staff can only create for their own branch
  if (!canAccessBranch(user, d.originBranchId)) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Forbidden: wrong branch' }, { status: 403 })
  }

  // Validate manual price
  if (d.priceType === 'manual' && !d.manualPrice) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Manual price required when priceType is manual' },
      { status: 400 }
    )
  }

  // Calculate or use manual price
  let finalPrice: number
  let currency: string

  if (d.priceType === 'calculated') {
    const priceConfig = await prisma.priceConfig.findFirst({
      where: {
        originBranchId: d.originBranchId,
        destinationBranchId: d.destinationBranchId,
        isActive: true,
      },
      orderBy: { effectiveFrom: 'desc' },
    })
    if (!priceConfig) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'ไม่พบตารางราคาสำหรับเส้นทางนี้' },
        { status: 422 }
      )
    }
    const chargeableWeight = Math.max(d.weightKg, priceConfig.minWeightKg)
    finalPrice = Math.ceil(priceConfig.basePrice + chargeableWeight * priceConfig.pricePerKg)
    currency = priceConfig.currency
  } else {
    finalPrice = d.manualPrice!
    const branch = await prisma.branch.findUnique({ where: { id: d.originBranchId }, select: { currency: true } })
    currency = branch?.currency ?? 'THB'
  }

  // Upsert sender + receiver
  const [sender, receiver] = await Promise.all([
    prisma.customer.upsert({
      where: { phone: d.senderPhone },
      update: {},
      create: {
        firstname: d.senderFirstname,
        lastname: d.senderLastname,
        phone: d.senderPhone,
        address: d.senderAddress,
      },
    }),
    prisma.customer.upsert({
      where: { phone: d.receiverPhone },
      update: {},
      create: {
        firstname: d.receiverFirstname,
        lastname: d.receiverLastname,
        phone: d.receiverPhone,
        address: d.receiverAddress,
      },
    }),
  ])

  // Generate tracking number (optimistic — use count for sequence)
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const seqCount = await prisma.shipment.count({ where: { createdAt: { gte: todayStart } } })
  const trackingNo = generateTrackingNo(seqCount + 1)

  // Create shipment + initial event + COD in a transaction
  const shipment = await prisma.$transaction(async (tx: any) => {
    const s = await tx.shipment.create({
      data: {
        trackingNo,
        status: 'received',
        senderId: sender.id,
        receiverId: receiver.id,
        createdById: user.id,
        originBranchId: d.originBranchId,
        destinationBranchId: d.destinationBranchId,
        weightKg: d.weightKg,
        currency: currency as any,
        price: finalPrice,
        priceType: d.priceType as any,
        manualPriceNote: d.manualPriceNote,
        cod: d.codAmount > 0,
        codAmount: d.codAmount,
        itemDescription: d.itemDescription,
        externalTrackingNo: d.externalTrackingNo,
        shippingPartner: d.shippingPartner as any,
      },
    })

    await tx.shipmentEvent.create({
      data: {
        shipmentId: s.id,
        eventType: 'status_change',
        status: 'received',
        location: 'รับพัสดุที่สาขา',
        performedById: user.id,
      },
    })

    if (d.codAmount > 0) {
      await tx.codTransaction.create({
        data: {
          shipmentId: s.id,
          currency: currency as any,
          expectedAmount: d.codAmount,
          status: 'pending',
          branchId: d.destinationBranchId,
        },
      })
    }

    return s
  })

  await writeAuditLog(user.id, 'SHIPMENT_CREATED', 'Shipment', shipment.id, null, { trackingNo, price: finalPrice })

  return NextResponse.json<ApiResponse<{ id: string; trackingNo: string }>>(
    { success: true, data: { id: shipment.id, trackingNo: shipment.trackingNo } },
    { status: 201 }
  )
}

export const GET = withRole(['admin', 'manager', 'staff'], listHandler)
export const POST = withRole(['admin', 'manager', 'staff'], createHandler)
