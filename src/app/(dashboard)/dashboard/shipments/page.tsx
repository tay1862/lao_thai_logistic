import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getI18n } from '@/lib/i18n-server'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/status-badge'
import { Icon } from '@/components/ui/icon'
import { Card, CardContent } from '@/components/ui/card'
import { ShipmentListCard } from './shipment-list-card'
import type { ShipmentStatus } from '@/types'

const STATUS_TABS = [
  { value: '', labelKey: 'shipments.all' },
  { value: 'received', labelKey: 'shipments.received' },
  { value: 'in_transit', labelKey: 'shipments.inTransit' },
  { value: 'arrived', labelKey: 'shipments.arrived' },
  { value: 'delivered', labelKey: 'shipments.delivered' },
  { value: 'failed_delivery', labelKey: 'shipments.failed' },
  { value: 'returned', labelKey: 'shipments.returned' },
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
        id: true,
        trackingNo: true,
        status: true,
        currency: true,
        price: true,
        codAmount: true,
        weightKg: true,
        createdAt: true,
        externalTrackingNo: true,
        shippingPartner: true,
        sender: { select: { firstname: true, lastname: true, phone: true } },
        receiver: { select: { firstname: true, lastname: true, phone: true } },
        originBranch: { select: { branchName: true } },
        destinationBranch: { select: { branchName: true, country: true } },
      },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currencies: Array<'THB' | 'LAK'> = ['THB', 'LAK']
  const valueByCurrency: Array<{ currency: 'THB' | 'LAK'; shipmentValue: number; codValue: number }> = currencies.map((currency) => ({
    currency,
    shipmentValue: shipments
      .filter((item: (typeof shipments)[number]) => item.currency === currency)
      .reduce((sum: number, item: (typeof shipments)[number]) => sum + item.price, 0),
    codValue: shipments
      .filter((item: (typeof shipments)[number]) => item.currency === currency)
      .reduce((sum: number, item: (typeof shipments)[number]) => sum + item.codAmount, 0),
  }))

  function buildQuery(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (q) params.set('q', q)
    params.set('page', String(page))
    Object.entries(overrides).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    return `?${params.toString()}`
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div className="space-y-3">
          <span className="eyebrow">
            <Icon id="package" size={14} />
            {t('shipments.title')}
          </span>
          <div>
            <h1 className="page-title">{t('shipments.title')}</h1>
            <p className="page-subtitle">{t('shipments.workspaceSubtitle')}</p>
          </div>
        </div>

        <Link
          href="/dashboard/shipments/new"
          className="touch-target inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(22,63,143,0.18)] transition-transform hover:-translate-y-[1px]"
        >
          <Icon id="plus" size={16} />
          {t('shipments.new')}
        </Link>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="page-stack">
          <Card className="surface-panel sticky-surface border-0 py-0 shadow-none">
            <CardContent className="px-4 py-4 sm:px-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <form method="GET" action="/dashboard/shipments" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="relative">
                    <Icon id="search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      name="q"
                      defaultValue={q}
                      placeholder={t('shipments.searchPlaceholder')}
                      className="h-12 w-full rounded-xl border border-input bg-white px-4 pl-11 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                    {status && <input type="hidden" name="status" value={status} />}
                  </div>

                  <button
                    type="submit"
                    className="touch-target rounded-xl border border-border/80 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {t('common.search')}
                  </button>
                </form>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full border border-border/80 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {total.toLocaleString()} {t('shipments.count')}
                  </span>
                  {q && (
                    <span className="inline-flex rounded-full border border-border/80 bg-[var(--brand-soft)] px-3 py-2 text-xs font-semibold text-[var(--brand-primary-strong)]">
                      "{q}"
                    </span>
                  )}
                </div>
              </div>

              {/* UX-14: Scroll fade on status tabs */}
              <div className="relative mt-4">
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {STATUS_TABS.map((tab) => (
                    <Link
                      key={tab.value}
                      href={buildQuery({ status: tab.value, page: '1' })}
                      className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        (status ?? '') === tab.value
                          ? 'border-transparent bg-[var(--brand-primary)] text-white'
                          : 'border-border/80 bg-white text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {t(tab.labelKey)}
                    </Link>
                  ))}
                </div>
                {/* Right fade gradient */}
                <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>

          {shipments.length === 0 ? (
            <Card className="surface-panel border-0 py-0 shadow-none">
              <CardContent className="flex flex-col items-center justify-center px-4 py-16 text-center text-muted-foreground">
                <Icon id="package" size={48} className="opacity-25" />
                <p className="mt-4 text-base font-medium text-foreground">{t('shipments.notFound')}</p>
                <p className="mt-2 max-w-md text-sm">{t('shipments.emptyHint')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {shipments.map((shipment: (typeof shipments)[number]) => (
                <ShipmentListCard key={shipment.id} shipment={shipment} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border/80 bg-white/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              {/* UX-23: Pagination total */}
              <p className="text-sm text-muted-foreground">
                {t('shipments.page')} {page} {t('shipments.pageOf')} {totalPages}{' '}
                <span className="text-foreground font-medium">({total.toLocaleString()} {t('shipments.pageTotal')})</span>
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={buildQuery({ page: String(page - 1) })}
                    className="touch-target inline-flex items-center gap-2 rounded-full border border-border/80 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Icon id="chevron-left" size={14} />
                    {t('shipments.prev')}
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={buildQuery({ page: String(page + 1) })}
                    className="touch-target inline-flex items-center gap-2 rounded-full border border-border/80 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {t('shipments.next')}
                    <Icon id="chevron-right" size={14} />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="page-stack">
          <Card className="surface-panel border-0 py-0 shadow-none">
            <CardContent className="px-4 py-4">
              <p className="metric-label">{t('shipments.summaryTitle')}</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('shipments.count')}</p>
                  <p className="mt-1 font-heading text-3xl font-semibold tracking-[-0.05em] text-foreground">
                    {total.toLocaleString()}
                  </p>
                </div>
                <div className="surface-muted p-4">
                  <p className="data-label">{t('shipments.pageValue')}</p>
                  <div className="mt-2 space-y-1">
                    {valueByCurrency.map((item: (typeof valueByCurrency)[number]) => (
                      <p key={item.currency} className="text-sm font-semibold text-foreground">
                        {formatCurrency(item.shipmentValue, item.currency)}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="surface-muted p-4">
                  <p className="data-label">{t('shipments.codValue')}</p>
                  <div className="mt-2 space-y-1">
                    {valueByCurrency.map((item: (typeof valueByCurrency)[number]) => (
                      <p key={item.currency} className="text-sm font-semibold text-foreground">
                        {formatCurrency(item.codValue, item.currency)}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel border-0 py-0 shadow-none">
            <CardContent className="px-4 py-4">
              <p className="metric-label">{t('dashboard.quickActions')}</p>
              <div className="mt-4 space-y-3">
                <Link href="/dashboard/scan" className="action-tile">
                  <span className="action-tile-icon">
                    <Icon id="scan" size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('scan.title')}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{t('scan.subtitle')}</p>
                  </div>
                </Link>
                <Link href="/dashboard/cod" className="action-tile">
                  <span className="action-tile-icon">
                    <Icon id="banknote" size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('cod.title')}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{t('cod.subtitle')}</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  )
}
