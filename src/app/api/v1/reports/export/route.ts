import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { prisma } from '@/lib/prisma'
import { getSessionUserFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSessionUserFromRequest(req)
  if (!user || user.role === 'staff') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') ?? 'xlsx'

  const shipmentScope = (user.role === 'admin' || !user.branchId)
    ? {}
    : { OR: [{ originBranchId: user.branchId }, { destinationBranchId: user.branchId }] }
  const codScope = (user.role === 'admin' || !user.branchId)
    ? {}
    : { branchId: user.branchId }

  const [shipments, codItems] = await Promise.all([
    prisma.shipment.findMany({
      where: shipmentScope,
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: {
        trackingNo: true,
        status: true,
        currency: true,
        price: true,
        codAmount: true,
        createdAt: true,
        originBranch: { select: { branchName: true } },
        destinationBranch: { select: { branchName: true } },
      },
    }),
    prisma.codTransaction.findMany({
      where: codScope,
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: {
        status: true,
        currency: true,
        expectedAmount: true,
        collectedAmount: true,
        createdAt: true,
        shipment: { select: { trackingNo: true } },
        branch: { select: { branchName: true } },
      },
    }),
  ])

  if (format === 'pdf') {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Thai-Lao Logistic Report', 14, 18)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25)

    autoTable(doc, {
      startY: 32,
      head: [['Tracking', 'Status', 'Origin', 'Destination', 'Price', 'COD']],
      body: shipments.map((shipment) => [
        shipment.trackingNo,
        shipment.status,
        shipment.originBranch.branchName,
        shipment.destinationBranch.branchName,
        `${shipment.currency} ${shipment.price.toLocaleString()}`,
        `${shipment.currency} ${shipment.codAmount.toLocaleString()}`,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [21, 88, 176] },
    })

    const finalY = (doc as any).lastAutoTable?.finalY ?? 40
    autoTable(doc, {
      startY: finalY + 10,
      head: [['Tracking', 'Branch', 'Status', 'Expected', 'Collected']],
      body: codItems.map((item) => [
        item.shipment.trackingNo,
        item.branch.branchName,
        item.status,
        `${item.currency} ${item.expectedAmount.toLocaleString()}`,
        item.collectedAmount === null ? '-' : `${item.currency} ${item.collectedAmount.toLocaleString()}`,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [14, 116, 144] },
    })

    const pdf = doc.output('arraybuffer')
    return new NextResponse(pdf, {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="thai-lao-report.pdf"',
      },
    })
  }

  const workbook = new ExcelJS.Workbook()
  const shipmentSheet = workbook.addWorksheet('Shipments')
  shipmentSheet.columns = [
    { header: 'Tracking', key: 'tracking', width: 24 },
    { header: 'Status', key: 'status', width: 18 },
    { header: 'Origin', key: 'origin', width: 24 },
    { header: 'Destination', key: 'destination', width: 24 },
    { header: 'Price', key: 'price', width: 14 },
    { header: 'COD', key: 'cod', width: 14 },
    { header: 'Created At', key: 'createdAt', width: 22 },
  ]
  shipments.forEach((shipment) => {
    shipmentSheet.addRow({
      tracking: shipment.trackingNo,
      status: shipment.status,
      origin: shipment.originBranch.branchName,
      destination: shipment.destinationBranch.branchName,
      price: `${shipment.currency} ${shipment.price.toLocaleString()}`,
      cod: `${shipment.currency} ${shipment.codAmount.toLocaleString()}`,
      createdAt: shipment.createdAt.toISOString(),
    })
  })

  const codSheet = workbook.addWorksheet('COD')
  codSheet.columns = [
    { header: 'Tracking', key: 'tracking', width: 24 },
    { header: 'Branch', key: 'branch', width: 24 },
    { header: 'Status', key: 'status', width: 18 },
    { header: 'Expected', key: 'expected', width: 16 },
    { header: 'Collected', key: 'collected', width: 16 },
    { header: 'Created At', key: 'createdAt', width: 22 },
  ]
  codItems.forEach((item) => {
    codSheet.addRow({
      tracking: item.shipment.trackingNo,
      branch: item.branch.branchName,
      status: item.status,
      expected: `${item.currency} ${item.expectedAmount.toLocaleString()}`,
      collected: item.collectedAmount === null ? '-' : `${item.currency} ${item.collectedAmount.toLocaleString()}`,
      createdAt: item.createdAt.toISOString(),
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return new NextResponse(buffer, {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': 'attachment; filename="thai-lao-report.xlsx"',
    },
  })
}