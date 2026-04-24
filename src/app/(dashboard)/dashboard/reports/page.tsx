import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getI18n } from '@/lib/i18n-server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { ReportsDateFilter } from '@/components/reports/reports-date-filter'

interface PageProps {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string }>
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role === 'staff') redirect('/dashboard')
  const { t } = await getI18n()

  const sp = await searchParams
  const dateFrom = sp.dateFrom
  const dateTo = sp.dateTo

  const dateScope = (dateFrom || dateTo) ? {
    createdAt: {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo + 'T23:59:59.999Z') }),
    },
  } : {}

  const shipmentScope = (user.role === 'admin' || !user.branchId)
    ? { ...dateScope }
    : { OR: [{ originBranchId: user.branchId }, { destinationBranchId: user.branchId }], ...dateScope }
  const codScope = (user.role === 'admin' || !user.branchId)
    ? { ...dateScope }
    : { branchId: user.branchId, ...dateScope }

  const [totalShipments, delivered, cancelled, activeShipments, codByCurrency, transferredByCurrency] = await Promise.all([
    prisma.shipment.count({ where: shipmentScope }),
    prisma.shipment.count({ where: { ...shipmentScope, status: 'delivered' } }),
    prisma.shipment.count({ where: { ...shipmentScope, status: 'cancelled' } }),
    prisma.shipment.count({ where: { ...shipmentScope, status: { in: ['received', 'in_transit', 'arrived'] } } }),
    prisma.codTransaction.groupBy({
      by: ['currency'],
      where: codScope,
      _sum: { expectedAmount: true },
      _count: true,
    }),
    prisma.codTransaction.groupBy({
      by: ['currency'],
      where: { ...codScope, status: 'transferred' },
      _sum: { collectedAmount: true },
      _count: true,
    }),
  ])

  const deliveryRate = totalShipments > 0 ? (delivered / totalShipments) * 100 : 0

  const statCards = [
    { title: t('reports.totalShipments'), value: totalShipments.toLocaleString(), icon: 'package', tone: 'bg-[var(--brand-soft)] text-[var(--brand-primary)]' },
    { title: t('dashboard.activeShipments'), value: activeShipments.toLocaleString(), icon: 'truck', tone: 'bg-amber-50 text-amber-700' },
    { title: t('reports.delivered'), value: delivered.toLocaleString(), icon: 'check-circle', tone: 'bg-emerald-50 text-emerald-700' },
    { title: t('reports.deliveryRate'), value: `${deliveryRate.toFixed(1)}%`, icon: 'chart', tone: 'bg-sky-50 text-sky-700' },
  ] as const

  return (
    <div className="page-stack">
      <section className="page-header">
        <div className="space-y-3">
          <span className="eyebrow">
            <Icon id="chart" size={14} />
            {t('reports.title')}
          </span>
          <div>
            <h1 className="page-title">{t('reports.title')}</h1>
            <p className="page-subtitle">{t('reports.subtitle')}</p>
          </div>
        </div>
      </section>

      {/* UX-19: Date range filter */}
      <section className="surface-panel px-4 py-4 sm:px-5">
        <ReportsDateFilter dateFrom={dateFrom} dateTo={dateTo} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <div className="page-stack">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <Card key={card.title} className="surface-panel border-0 py-0 shadow-none">
                <CardContent className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="metric-label">{card.title}</p>
                      <p className="mt-3 font-heading text-3xl font-semibold tracking-[-0.05em] text-foreground">
                        {card.value}
                      </p>
                    </div>
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.tone}`}>
                      <Icon id={card.icon} size={20} />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card className="surface-panel border-0 py-0 shadow-none">
            <CardContent className="px-4 py-5 sm:px-5">
              <div className="page-header gap-4">
                <div>
                  <p className="metric-label">{t('reports.codSummary')}</p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
                    {t('reports.currencySummary')}
                  </h2>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {(['THB', 'LAK'] as const).map((currency: 'THB' | 'LAK') => {
                  const totalRow = codByCurrency.find((item: (typeof codByCurrency)[number]) => item.currency === currency)
                  const transferredRow = transferredByCurrency.find((item: (typeof transferredByCurrency)[number]) => item.currency === currency)

                  return (
                    <div key={currency} className="surface-muted p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{currency}</p>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted-foreground">
                          {totalRow?._count ?? 0}
                        </span>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div>
                          <p className="data-label">{t('reports.codTotal')}</p>
                          <p className="mt-1 text-lg font-semibold text-foreground">
                            {formatCurrency(totalRow?._sum.expectedAmount ?? 0, currency as 'THB' | 'LAK')}
                          </p>
                        </div>
                        <div>
                          <p className="data-label">{t('reports.codTransferred')}</p>
                          <p className="mt-1 text-lg font-semibold text-foreground">
                            {formatCurrency(transferredRow?._sum.collectedAmount ?? 0, currency as 'THB' | 'LAK')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="page-stack">
          <Card className="surface-panel border-0 py-0 shadow-none">
            <CardContent className="px-4 py-5">
              <p className="metric-label">{t('reports.exportTitle')}</p>
              <div className="mt-4 space-y-3">
                <a
                  href={`/api/v1/reports/export?format=xlsx${dateFrom ? `&dateFrom=${dateFrom}` : ''}${dateTo ? `&dateTo=${dateTo}` : ''}`}
                  className="action-tile"
                >
                  <span className="action-tile-icon">
                    <Icon id="download" size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('reports.exportXlsx')}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{t('reports.exportXlsxHelp')}</p>
                  </div>
                </a>

                <a
                  href={`/api/v1/reports/export?format=pdf${dateFrom ? `&dateFrom=${dateFrom}` : ''}${dateTo ? `&dateTo=${dateTo}` : ''}`}
                  className="action-tile"
                >
                  <span className="action-tile-icon">
                    <Icon id="download" size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('reports.exportPdf')}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{t('reports.exportPdfHelp')}</p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel border-0 py-0 shadow-none">
            <CardContent className="px-4 py-5">
              <p className="metric-label">{t('reports.deliveryRate')}</p>
              <div className="mt-4 rounded-[1.25rem] border border-border/80 bg-white px-4 py-4">
                <p className="font-heading text-4xl font-semibold tracking-[-0.05em] text-foreground">
                  {deliveryRate.toFixed(1)}%
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {cancelled.toLocaleString()} {t('reports.cancelled')}
                </p>
              </div>

              <div className="mt-4">
                <Link
                  href="/dashboard/shipments?status=failed_delivery"
                  className="touch-target inline-flex items-center gap-2 rounded-full border border-border/80 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {t('dashboard.attentionQueue')}
                  <Icon id="chevron-right" size={14} />
                </Link>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  )
}
