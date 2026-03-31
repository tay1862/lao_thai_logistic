import { getSessionUser } from '@/lib/auth'
import { getI18n } from '@/lib/i18n-server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/status-badge'
import { Icon } from '@/components/ui/icon'
import { Card, CardContent } from '@/components/ui/card'
import type { ShipmentStatus } from '@/types'

const STATUS_TABS = [
  { value: '', labelKey: 'shipments.all' },
  { value: 'received', labelKey: 'shipments.received' },
  { value: 'in_transit', labelKey: 'shipments.inTransit' },
  { value: 'arrived_hub', labelKey: 'shipments.arrivedHub' },
  { value: 'out_for_delivery', labelKey: 'shipments.outForDelivery' },
  { value: 'delivered', labelKey: 'shipments.delivered' },
  { value: 'failed_delivery', labelKey: 'shipments.failed' },
  { value: 'cancelled', labelKey: 'shipments.cancelled' },
] as const

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>
}

export default async function ShipmentsPage({ searchParams }: PageProps) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const { t } = await getI18n()

  const sp = await searchParams
  const status = sp.status as ShipmentStatus | undefined
  const q = sp.q?.trim()
  const page = Math.max(1, Number(sp.page ?? 1))
  const pageSize = 20

  const scope = (user.role === 'admin' || user.role === 'manager' || !user.branchId)
    ? {}
    : { OR: [{ originBranchId: user.branchId }, { destinationBranchId: user.branchId }] }

  const where = {
    ...scope,
    ...(status && { status }),
    ...(q && {
      OR: [
        { trackingNo: { contains: q, mode: 'insensitive' as const } },
        { externalTrackingNo: { contains: q, mode: 'insensitive' as const } },
        { sender: { phone: { contains: q } } },
        { receiver: { phone: { contains: q } } },
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
        id: true, trackingNo: true, status: true, currency: true, price: true, codAmount: true, createdAt: true,
        externalTrackingNo: true, shippingPartner: true,
        sender: { select: { firstname: true, lastname: true, phone: true } },
        receiver: { select: { firstname: true, lastname: true, phone: true } },
        destinationBranch: { select: { branchName: true, country: true } },
      },
    }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  function buildQuery(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (q) params.set('q', q)
    params.set('page', String(page))
    Object.entries(overrides).forEach(([k, v]) => v ? params.set(k, v) : params.delete(k))
    return `?${params.toString()}`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t('shipments.title')}</h1>
          <p className="text-sm text-muted-foreground">{total.toLocaleString()} {t('shipments.count')}</p>
        </div>
        <Link
          href="/dashboard/shipments/new"
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          <Icon id="plus" size={16} />
          <span className="hidden sm:inline">{t('shipments.new')}</span>
        </Link>
      </div>

      {/* Search */}
      <form method="GET" action="/dashboard/shipments" className="flex gap-2">
        <div className="relative flex-1">
          <Icon id="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder={t('shipments.searchPlaceholder')}
            className="w-full rounded-lg border border-input bg-white pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 ring-[var(--brand-primary)] h-10"
          />
        </div>
        {status && <input type="hidden" name="status" value={status} />}
        <button
          type="submit"
          className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-muted transition-colors h-10"
        >
          {t('common.search')}
        </button>
      </form>

      {/* Status Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={buildQuery({ status: tab.value, page: '1' })}
            className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              (status ?? '') === tab.value
                ? 'text-white'
                : 'bg-white text-muted-foreground border hover:bg-muted'
            }`}
            style={(status ?? '') === tab.value ? { backgroundColor: 'var(--brand-primary)' } : {}}
          >
            {t(tab.labelKey)}
          </Link>
        ))}
      </div>

      {/* List */}
      <Card className="overflow-hidden">
        {shipments.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Icon id="package" size={48} className="mb-3 opacity-25" />
            <p>{t('shipments.notFound')}</p>
          </CardContent>
        ) : (
          <div className="divide-y">
            {shipments.map((s: (typeof shipments)[number]) => (
              <Link
                key={s.id}
                href={`/dashboard/shipments/${s.id}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors cv-auto"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs font-semibold">{s.trackingNo}</span>
                    <StatusBadge status={s.status} />
                    {s.codAmount > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        COD {formatCurrency(s.codAmount, s.currency as 'THB' | 'LAK')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    <span className="font-medium text-foreground">
                      {s.sender.firstname} {s.sender.lastname}
                    </span>
                    {' → '}
                    {s.receiver.firstname} {s.receiver.lastname} ·{' '}
                    {s.destinationBranch.branchName}
                  </p>
                  {(s.externalTrackingNo || s.shippingPartner) && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {s.shippingPartner && <span>{t(`partners.${s.shippingPartner}`)}</span>}
                      {s.shippingPartner && s.externalTrackingNo && <span>{' · '}</span>}
                      {s.externalTrackingNo && <span>{t('shipments.detail.externalTrackingNo')}: {s.externalTrackingNo}</span>}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{s.sender.phone}</p>
                </div>
                <div className="text-right flex-shrink-0 space-y-0.5">
                  <p className="text-sm font-semibold">{formatCurrency(s.price, s.currency as 'THB' | 'LAK')}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</p>
                  <Icon id="chevron-right" size={14} className="text-muted-foreground ml-auto" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('shipments.page')} {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildQuery({ page: String(page - 1) })}
                className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
              >
                <Icon id="chevron-left" size={14} /> {t('shipments.prev')}
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildQuery({ page: String(page + 1) })}
                className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
              >
                {t('shipments.next')} <Icon id="chevron-right" size={14} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
