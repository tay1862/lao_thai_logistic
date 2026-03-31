import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'

const { PrismaClient } = require('@prisma/client') as { PrismaClient: new (args?: any) => any }
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // ── Branches ─────────────────────────────────────────────────────────
  const branchTH = await prisma.branch.upsert({
    where: { id: 'branch-th-main' },
    update: {},
    create: {
      id: 'branch-th-main',
      branchName: 'สาขาหลัก (ไทย)',
      country: 'TH',
      currency: 'THB',
      location: 'กรุงเทพมหานคร, ประเทศไทย',
      tel: '+66812345678',
      description: 'สาขาหลักฝั่งประเทศไทย',
    },
  })

  const branchLA = await prisma.branch.upsert({
    where: { id: 'branch-la-main' },
    update: {},
    create: {
      id: 'branch-la-main',
      branchName: 'ສາຂາຫຼັກ (ລາວ)',
      country: 'LA',
      currency: 'LAK',
      location: 'ນະຄອນຫຼວງວຽງຈັນ, ລາວ',
      tel: '+85620123456',
      description: 'ສາຂາຫຼັກຝັ່ງລາວ',
    },
  })

  console.log('✓ Branches created')

  // ── Users ─────────────────────────────────────────────────────────────
  const hash = (pw: string) => bcrypt.hashSync(pw, 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@thai-lao.com' },
    update: {},
    create: {
      id: 'user-admin-01',
      firstname: 'Super',
      lastname: 'Admin',
      email: 'admin@thai-lao.com',
      role: 'admin',
      status: 'active',
      passwordHash: hash('Admin@123456'),
    },
  })

  const managerTH = await prisma.user.upsert({
    where: { email: 'manager.th@thai-lao.com' },
    update: {},
    create: {
      id: 'user-manager-th',
      firstname: 'สมชาย',
      lastname: 'ใจดี',
      email: 'manager.th@thai-lao.com',
      role: 'manager',
      branchId: branchTH.id,
      status: 'active',
      passwordHash: hash('Manager@123456'),
      createdById: admin.id,
    },
  })

  const staffTH = await prisma.user.upsert({
    where: { email: 'staff.th@thai-lao.com' },
    update: {},
    create: {
      id: 'user-staff-th',
      firstname: 'สมหญิง',
      lastname: 'รักงาน',
      email: 'staff.th@thai-lao.com',
      role: 'staff',
      branchId: branchTH.id,
      status: 'active',
      passwordHash: hash('Staff@123456'),
      createdById: admin.id,
    },
  })

  const staffLA = await prisma.user.upsert({
    where: { email: 'staff.la@thai-lao.com' },
    update: {},
    create: {
      id: 'user-staff-la',
      firstname: 'ສົມໄຊ',
      lastname: 'ແກ້ວ',
      email: 'staff.la@thai-lao.com',
      role: 'staff',
      branchId: branchLA.id,
      status: 'active',
      passwordHash: hash('Staff@123456'),
      createdById: admin.id,
    },
  })

  console.log('✓ Users created')

  // ── Price Config ──────────────────────────────────────────────────────
  await prisma.priceConfig.upsert({
    where: { id: 'price-th-to-la' },
    update: {},
    create: {
      id: 'price-th-to-la',
      originBranchId: branchTH.id,
      destinationBranchId: branchLA.id,
      currency: 'THB',
      basePrice: 80,
      pricePerKg: 20,
      minWeightKg: 0.5,
      effectiveFrom: new Date('2025-01-01'),
      note: 'ราคามาตรฐาน ไทย → ลาว',
      createdById: admin.id,
    },
  })

  await prisma.priceConfig.upsert({
    where: { id: 'price-la-to-th' },
    update: {},
    create: {
      id: 'price-la-to-th',
      originBranchId: branchLA.id,
      destinationBranchId: branchTH.id,
      currency: 'LAK',
      basePrice: 50000,
      pricePerKg: 15000,
      minWeightKg: 0.5,
      effectiveFrom: new Date('2025-01-01'),
      note: 'ລາຄາມາດຕະຖານ ລາວ → ໄທ',
      createdById: admin.id,
    },
  })

  console.log('✓ Price configs created')

  // ── Demo Customers ────────────────────────────────────────────────────
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { phone: '0812345001' },
      update: {},
      create: { id: 'cust-01', firstname: 'นายสมศักดิ์', lastname: 'มีทรัพย์', phone: '0812345001', address: '123 ถนนสุขุมวิท กรุงเทพ' },
    }),
    prisma.customer.upsert({
      where: { phone: '0812345002' },
      update: {},
      create: { id: 'cust-02', firstname: 'นางสาวมาลี', lastname: 'ดีใจ', phone: '0812345002', address: '456 ถนนพระราม 9 กรุงเทพ' },
    }),
    prisma.customer.upsert({
      where: { phone: '02012345003' },
      update: {},
      create: { id: 'cust-03', firstname: 'ນາງ ສຸດາ', lastname: 'ພູ', phone: '02012345003', address: 'ບ້ານ ໂພນທັນ ວຽງຈັນ' },
    }),
    prisma.customer.upsert({
      where: { phone: '02012345004' },
      update: {},
      create: { id: 'cust-04', firstname: 'ນາຍ ຄຳ', lastname: 'ສີ', phone: '02012345004', address: 'ບ້ານ ສີຫອມ ວຽງຈັນ' },
    }),
  ])

  console.log('✓ Customers created')

  // ── Demo Shipments ────────────────────────────────────────────────────
  const today = new Date()
  const fmtDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')

  const shipmentData = [
    { id: 's001', tracking: `THL-${fmtDate(today)}-00001`, status: 'delivered' as const, senderId: 'cust-01', receiverId: 'cust-03', cod: 0 },
    { id: 's002', tracking: `THL-${fmtDate(today)}-00002`, status: 'in_transit' as const, senderId: 'cust-01', receiverId: 'cust-04', cod: 500 },
    { id: 's003', tracking: `THL-${fmtDate(today)}-00003`, status: 'received' as const, senderId: 'cust-02', receiverId: 'cust-03', cod: 0 },
    { id: 's004', tracking: `THL-${fmtDate(today)}-00004`, status: 'out_for_delivery' as const, senderId: 'cust-03', receiverId: 'cust-01', cod: 1200 },
    { id: 's005', tracking: `THL-${fmtDate(today)}-00005`, status: 'arrived_hub' as const, senderId: 'cust-04', receiverId: 'cust-02', cod: 0 },
  ]

  for (const s of shipmentData) {
    await prisma.shipment.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        trackingNo: s.tracking,
        status: s.status,
        senderId: s.senderId,
        receiverId: s.receiverId,
        createdById: staffTH.id,
        originBranchId: branchTH.id,
        destinationBranchId: branchLA.id,
        weightKg: 1.5,
        currency: 'THB',
        price: 110,
        priceType: 'calculated',
        codAmount: s.cod,
        itemDescription: 'สินค้าทดสอบ',
      },
    })

    // Create initial event
    await prisma.shipmentEvent.upsert({
      where: { id: `evt-${s.id}-init` },
      update: {},
      create: {
        id: `evt-${s.id}-init`,
        shipmentId: s.id,
        eventType: 'status_change',
        status: 'received',
        location: 'สาขาหลัก (ไทย)',
        performedById: staffTH.id,
      },
    })

    // Create COD if needed
    if (s.cod > 0) {
      await prisma.codTransaction.upsert({
        where: { shipmentId: s.id },
        update: {},
        create: {
          shipmentId: s.id,
          currency: 'THB',
          expectedAmount: s.cod,
          status: s.status === 'delivered' ? 'collected' : 'pending',
          branchId: branchTH.id,
        },
      })
    }
  }

  console.log('✓ Demo shipments created')
  console.log('')
  console.log('──────────────────────────────────────────')
  console.log('Seed complete! Demo accounts:')
  console.log('  admin@thai-lao.com    / Admin@123456')
  console.log('  manager.th@thai-lao.com / Manager@123456')
  console.log('  staff.th@thai-lao.com / Staff@123456')
  console.log('  staff.la@thai-lao.com / Staff@123456')
  console.log('──────────────────────────────────────────')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
