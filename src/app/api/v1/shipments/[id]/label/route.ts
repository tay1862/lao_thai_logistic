import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserFromRequest } from '@/lib/auth'
import { getDictionary, localeCookieName, translate, type Locale } from '@/lib/i18n-dictionaries'
import { prisma } from '@/lib/prisma'
import { canAccessBranch } from '@/lib/rbac'
import { createBarcodeSvg } from '@/lib/barcode'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Ctx {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUserFromRequest(req)
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id } = await params
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      sender: true,
      receiver: true,
      originBranch: true,
      destinationBranch: true,
    },
  })

  if (!shipment) {
    return new NextResponse('Not found', { status: 404 })
  }

  if (!canAccessBranch(user, shipment.originBranchId) && !canAccessBranch(user, shipment.destinationBranchId)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const escapeHtml = (value: string) => value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

  const locale = (req.cookies.get(localeCookieName)?.value as Locale | undefined) === 'lo' ? 'lo' : 'en'
  const dictionary = getDictionary(locale)
  const t = (key: string) => translate(dictionary, key)
  const labelTitle = t('label.title')
  const labelSubtitle = t('label.subtitle')
  const layoutLabel = t('label.layout')
  const printLabel = t('label.print')
  const closeLabel = t('label.close')
  const statusLabel = t('label.status')
  const trackingLabel = t('label.trackingNo')
  const partnerTrackingLabel = t('label.partnerTracking')
  const senderLabel = t('label.sender')
  const receiverLabel = t('label.receiver')
  const originLabel = t('label.origin')
  const destinationLabel = t('label.destination')
  const weightLabel = t('label.weight')
  const shippingFeeLabel = t('label.shippingFee')
  const codLabel = t('label.cod')
  const itemDescriptionLabel = t('shipments.detail.itemDescription')
  const localizedStatus = t(`status.${shipment.status}`)
  const barcodeSvg = createBarcodeSvg(shipment.trackingNo, { height: 60, width: 2 })

  const html = `<!DOCTYPE html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(labelTitle)} ${escapeHtml(shipment.trackingNo)}</title>
    <style>
      :root { --brand:#1558B0; --border:#d7e3f4; }
      * { box-sizing: border-box; }
      body { margin:0; padding:24px; font-family: Arial, sans-serif; background:#f4f8fd; color:#0f172a; }
      .toolbar { display:flex; gap:12px; align-items:center; margin-bottom:16px; }
      .toolbar button, .toolbar select { height:40px; border-radius:10px; border:1px solid var(--border); padding:0 14px; background:white; }
      .toolbar .primary { background:var(--brand); color:white; border-color:var(--brand); }
      .sheet { background:white; border:1px solid var(--border); border-radius:18px; padding:18px; max-width:820px; margin:0 auto; box-shadow:0 10px 30px rgba(21,88,176,.08); }
      .brand { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; }
      .brand-badge { display:inline-flex; padding:6px 10px; border-radius:999px; background:#e8f2ff; color:var(--brand); font-weight:700; font-size:12px; }
      .tracking { margin-top:16px; border:1px dashed var(--border); border-radius:16px; padding:16px; text-align:center; }
      .tracking-no { font-family: ui-monospace, SFMono-Regular, monospace; font-weight:800; letter-spacing:1px; font-size:26px; margin-top:8px; }
      .grid { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:14px; margin-top:16px; }
      .item { border:1px solid var(--border); border-radius:14px; padding:12px; min-height:84px; }
      .label { font-size:12px; color:#64748b; margin-bottom:6px; }
      .value { font-size:14px; font-weight:600; line-height:1.45; word-break:break-word; }
      .barcode-wrap { margin-top:8px; display:flex; justify-content:center; }
      .meta { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:12px; margin-top:16px; }
      .meta .item { min-height:auto; }
      body.thermal .sheet { width:100mm; min-height:150mm; max-width:100mm; padding:10mm; border-radius:0; box-shadow:none; }
      body.thermal .grid, body.thermal .meta { grid-template-columns:1fr; }
      @media print {
        body { background:white; padding:0; }
        .toolbar { display:none !important; }
        .sheet { box-shadow:none; border:0; margin:0 auto; }
        body.a4 .sheet { width:190mm; min-height:277mm; }
        body.thermal { width:100mm; height:150mm; }
      }
    </style>
  </head>
  <body class="a4">
    <div class="toolbar">
      <button class="primary" onclick="window.print()">${escapeHtml(printLabel)}</button>
      <span style="font-size:12px;color:#64748b">${escapeHtml(layoutLabel)}</span>
      <select id="layout-switcher">
        <option value="a4">${escapeHtml(t('label.a4'))}</option>
        <option value="thermal">${escapeHtml(t('label.thermal'))}</option>
      </select>
      <button onclick="window.close()">${escapeHtml(closeLabel)}</button>
    </div>
    <div class="sheet">
      <div class="brand">
        <div>
          <div class="brand-badge">Thai-Lao Logistic</div>
          <h1 style="margin:10px 0 4px;font-size:22px;">${escapeHtml(labelTitle)}</h1>
          <p style="margin:0;color:#64748b;font-size:13px;">${escapeHtml(labelSubtitle)}</p>
        </div>
        <div style="text-align:right">
          <div style="font-size:12px;color:#64748b">${escapeHtml(statusLabel)}</div>
          <div style="font-weight:700">${escapeHtml(localizedStatus)}</div>
        </div>
      </div>
      <div class="tracking">
        <div style="font-size:12px;color:#64748b">${escapeHtml(trackingLabel)}</div>
        <div class="barcode-wrap">${barcodeSvg}</div>
        <div class="tracking-no">${escapeHtml(shipment.trackingNo)}</div>
        ${shipment.externalTrackingNo ? `<div style="margin-top:6px;font-size:12px;color:#64748b">${escapeHtml(partnerTrackingLabel)}: ${escapeHtml(shipment.externalTrackingNo)}</div>` : ''}
      </div>
      <div class="grid">
        <div class="item">
          <div class="label">${escapeHtml(senderLabel)}</div>
          <div class="value">${escapeHtml(`${shipment.sender.firstname} ${shipment.sender.lastname}`)}<br/>${escapeHtml(shipment.sender.phone)}${shipment.sender.address ? `<br/>${escapeHtml(shipment.sender.address)}` : ''}</div>
        </div>
        <div class="item">
          <div class="label">${escapeHtml(receiverLabel)}</div>
          <div class="value">${escapeHtml(`${shipment.receiver.firstname} ${shipment.receiver.lastname}`)}<br/>${escapeHtml(shipment.receiver.phone)}${shipment.receiver.address ? `<br/>${escapeHtml(shipment.receiver.address)}` : ''}</div>
        </div>
      </div>
      <div class="meta">
        <div class="item"><div class="label">${escapeHtml(originLabel)}</div><div class="value">${escapeHtml(shipment.originBranch.branchName)}</div></div>
        <div class="item"><div class="label">${escapeHtml(destinationLabel)}</div><div class="value">${escapeHtml(shipment.destinationBranch.branchName)}</div></div>
        <div class="item"><div class="label">${escapeHtml(weightLabel)}</div><div class="value">${shipment.weightKg} kg</div></div>
        <div class="item"><div class="label">${escapeHtml(shippingFeeLabel)}</div><div class="value">${formatCurrency(shipment.price, shipment.currency as 'THB' | 'LAK')}</div></div>
      </div>
      ${shipment.codAmount > 0 ? `<div class="item" style="margin-top:16px"><div class="label">${escapeHtml(codLabel)}</div><div class="value">${formatCurrency(shipment.codAmount, shipment.currency as 'THB' | 'LAK')}</div></div>` : ''}
      ${shipment.itemDescription ? `<div class="item" style="margin-top:16px"><div class="label">${escapeHtml(itemDescriptionLabel)}</div><div class="value">${escapeHtml(shipment.itemDescription)}</div></div>` : ''}
    </div>
    <script>
      const switcher = document.getElementById('layout-switcher');
      switcher.addEventListener('change', (event) => {
        document.body.classList.remove('a4', 'thermal');
        document.body.classList.add(event.target.value);
      });
    </script>
  </body>
</html>`

  return new NextResponse(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  })
}
