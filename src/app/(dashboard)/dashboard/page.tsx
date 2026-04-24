import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getI18n } from '@/lib/i18n-server'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'

async function getDashboardData(role: string, branchId: string | null) {
  const shipmentScope = (role === 'admin' || role === 'manager' || !branchId)
    ? {}
    : { OR: [{ originBranchId: branchId }, { destinationBranchId: branchId }] }

  const codScope = (role === 'admin' || role === 'manager' || !branchId)
    ? {}
    : { branchId }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const staleThreshold = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

  const [todayCount, activeCount, deliveredToday, failedCount, receivedCount, inTransitCount, arrivedCount, deliveredCount, returnedCount, pendingCod, pendingCodByCurrency, recentShipments, attentionShipments] =
    await Promise.all([
      prisma.shipment.count({
        where: { ...shipmentScope, createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.shipment.count({
        where: { ...shipmentScope, status: { in: ['received', 'in_transit', 'arrived'] } },
      }),
      prisma.shipment.count({
        where: { ...shipmentScope, status: 'delivered', updatedAt: { gte: today, lt: tomorrow } },
      }),
      prisma.shipment.count({
        where: { ...shipmentScope, status: 'failed_delivery' },
      }),
      prisma.shipment.count({
        where: { ...shipmentScope, status: 'received' },
      }),
      prisma.shipment.count({
        where: { ...shipmentScope, status: 'in_transit' },
      }),
      prisma.shipment.count({
        where: { ...shipmentScope, status: 'arrived' },
      }),
      prisma.shipment.count({
        where: { ...shipmentScope, status: 'delivered' },
      }),
      prisma.shipment.count({
        where: { ...shipmentScope, status: 'returned' },
      }),
      prisma.codTransaction.aggregate({
        where: { ...codScope, status: { in: ['pending', 'collected'] } },
        _count: true,
        _sum: { expectedAmount: true },
      }),
      prisma.codTransaction.groupBy({
        by: ['currency'],
        where: { ...codScope, status: { in: ['pending', 'collected'] } },
        _sum: { expectedAmount: true },
      }),
      prisma.shipment.findMany({
        where: shipmentScope,
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          trackingNo: true,
          status: true,
          currency: true,
          price: true,
          codAmount: true,
          createdAt: true,
          sender: { select: { firstname: true, lastname: true } },
          receiver: { select: { firstname: true, lastname: true } },
          destinationBranch: { select: { branchName: true } },
        },
      }),
      // UX-15: Only failed_delivery + stale arrived (>3 days)
      prisma.shipment.findMany({
        where: {
          ...shipmentScope,
          OR: [
            { status: 'failed_delivery' },
            { status: 'arrived', updatedAt: { lt: staleThreshold } },
          ],
        },
        orderBy: [{ status: 'asc' }, { updatedAt: 'asc' }],
        take: 5,
        select: {
          id: true,
          trackingNo: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          receiver: { select: { firstname: true, lastname: true, phone: true } },
          destinationBranch: { select: { branchName: true } },
        },
      }),
    ])

  return {
    todayCount,
    activeCount,
    deliveredToday,
    failedCount,
    receivedCount,
    inTransitCount,
    arrivedCount,
    deliveredCount,
    returnedCount,
    pendingCod,
    pendingCodByCurrency,
    recentShipments,
    attentionShipments,
  }
}

export default async function DashboardPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const { locale, t } = await getI18n()
  const data = await getDashboardData(user.role, user.branchId)

  const dashboardDate = new Date().toLocaleDateString(locale === 'lo' ? 'lo-LA' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const statCards = [
    {
      title: t('dashboard.todayShipments'),
      value: data.todayCount,
      note: t('dashboard.title'),
      icon: 'package',
      tone: 'bg-[var(--brand-soft)] text-[var(--brand-primary)]',
    },
    {
      title: t('dashboard.activeShipments'),
      value: data.activeCount,
      note: user.role === 'staff' ? t('status.in_transit') : t('dashboard.quickActions'),
      icon: 'truck',
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      title: t('dashboard.deliveredToday'),
      value: data.deliveredToday,
      note: t('status.delivered'),
      icon: 'check-circle',
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: t('dashboard.failedDelivery'),
      value: data.failedCount,
      note: t('dashboard.attentionQueue'),
      icon: 'alert',
      tone: 'bg-rose-50 text-rose-700',
    },
  ] as const

  const quickActions = [
    {
      href: '/dashboard/shipments/new',
      icon: 'plus',
      title: t('shipments.new'),
      description: t('shipments.newSubtitle'),
    },
    {
      href: '/dashboard/scan',
      icon: 'scan',
      title: t('scan.title'),
      description: t('scan.subtitle'),
    },
    {
      href: '/dashboard/cod',
      icon: 'banknote',
      title: t('cod.title'),
      description: t('cod.subtitle'),
    },
    ...(user.role === 'staff'
      ? [
          {
            href: '/dashboard/shipments',
            icon: 'package',
            title: t('shipments.title'),
            description: t('shipments.searchPlaceholder'),
          },
        ]
      : [
          {
            href: '/dashboard/reports',
            icon: 'chart',
            title: t('reports.title'),
            description: t('reports.subtitle'),
          },
          ...(user.role === 'admin'
            ? [
                {
                  href: '/dashboard/admin',
                  icon: 'settings',
                  title: t('admin.title'),
                  description: t('admin.subtitle'),
                },
              ]
            : []),
        ]),
  ]

  // UX-16: Flow board includes delivered + returned
  const flowBoard = [
    { label: t('shipments.received'), value: data.receivedCount, tone: 'status-received' },
    { label: t('shipments.inTransit'), value: data.inTransitCount, tone: 'status-in_transit' },
    { label: t('shipments.arrived'), value: data.arrivedCount, tone: 'status-arrived' },
    { label: t('shipments.failed'), value: data.failedCount, tone: 'status-failed_delivery' },
    { label: t('shipments.delivered'), value: data.deliveredCount, tone: 'status-delivered' },
    { label: t('shipments.returned'), value: data.returnedCount, tone: 'status-returned' },
  ] as const

  return (
    <div className="page-stack">
      <section className="page-header">
        <div className="min-w-0 space-y-3">
          <span className="eyebrow">
            <Icon id="building" size={14} />
            {user.branchName ?? t('common.allBranches')}
          </span>
          <div className="space-y-2">
            <h1 className="page-title">{t('dashboard.title')}</h1>
            <p className="page-subtitle">
              {user.role === 'staff' ? t('dashboard.staffLead') : t('dashboard.managementLead')}
            </p>
          </div>
        </div>

        <div className="surface-panel grid min-w-[18rem] gap-3 p-4 sm:min-w-[22rem]">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-primary)]">
              <Icon id="clipboard" size={20} />
            </span>
            <div className="min-w-0">
              <p className="metric-label">{t('dashboard.operationsDate')}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{dashboardDate}</p>
            </div>
          </div>
          <div className="panel-divider pt-3">
            <p className="text-sm text-muted-foreground">
              {t('dashboard.branchPrefix')}: {user.branchName ?? t('common.allBranches')}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="surface-panel border-0 py-0 shadow-none">
            <CardContent className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="metric-label">{stat.title}</p>
                  <p className="mt-3 metric-value">{stat.value.toLocaleString()}</p>
                  <p className="mt-2 metric-note">{stat.note}</p>
                </div>
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.tone}`}>
                  <Icon id={stat.icon} size={20} />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.32fr)_minmax(19rem,0.88fr)]">
        <div className="page-stack">
          <Card className="surface-panel border-0 py-0 shadow-none">
            <CardContent className="px-4 py-4 sm:px-5">
              <div className="page-header gap-4">
                <div>
                  <p className="metric-label">{t('dashboard.quickActions')}</p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
                    {t('dashboard.operationsBoard')}
                  </h2>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {quickActions.map((action) => (
                  <Link key={action.href} href={action.href} className="action-tile">
                    <span className="action-tile-icon">
                      <Icon id={action.icon} size={20} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{action.title}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel border-0 py-0 shadow-none">
            <CardContent className="px-4 py-4 sm:px-5">
              <div className="page-header gap-4">
                <div>
                  <p className="metric-label">{t('dashboard.recentShipments')}</p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
                    {t('shipments.title')}
                  </h2>
                </div>
                <Link
                  href="/dashboard/shipments"
                  className="touch-target inline-flex items-center gap-2 rounded-full border border-border/80 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {t('common.viewAll')}
                  <Icon id="chevron-right" size={16} />
                </Link>
              </div>

              {data.recentShipments.length === 0 ? (
                <div className="surface-muted mt-5 flex flex-col items-center justify-center px-4 py-12 text-center text-muted-foreground">
                  <Icon id="package" size={42} className="opacity-35" />
                  <p className="mt-3 text-sm">{t('dashboard.emptyShipments')}</p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {data.recentShipments.map((shipment: (typeof data.recentShipments)[number]) => (
                    <Link
                      key={shipment.id}
                      href={`/dashboard/shipments/${shipment.id}`}
                      className="list-card cv-auto flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="mono-tracking text-foreground">{shipment.trackingNo}</span>
                          <StatusBadge status={shipment.status} />
                          {shipment.codAmount > 0 && (
                            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              COD {formatCurrency(shipment.codAmount, shipment.currency as 'THB' | 'LAK')}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {shipment.sender.firstname} {shipment.sender.lastname} {'→'} {shipment.receiver.firstname} {shipment.receiver.lastname}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {shipment.destinationBranch.branchName}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(shipment.price, shipment.currency as 'THB' | 'LAK')}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDate(shipment.createdAt)}</p>
                        </div>
                        <Icon id="chevron-right" size={16} className="text-muted-foreground sm:ml-auto sm:mt-2" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="page-stack">
          <Card className="surface-panel border-0 py-0 shadow-none">
            <CardContent className="px-4 py-4 sm:px-5">
              <p className="metric-label">{t('dashboard.networkFlow')}</p>
              <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
                {user.role === 'staff' ? t('dashboard.staffLeadShort') : t('dashboard.managementLeadShort')}
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {flowBoard.map((item) => (
                  <div key={item.label} className="surface-muted flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.shipmentCountNote')}</p>
                    </div>
                    <span className={`inline-flex min-w-14 justify-center rounded-full px-3 py-1 text-sm font-semibold ${item.tone}`}>
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel border-0 py-0 shadow-none">
            <CardContent className="px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="metric-label">{t('dashboard.codPending')}</p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
                    {data.pendingCod._count.toLocaleString()}
                  </h2>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                  <Icon id="banknote" size={20} />
                </span>
              </div>

              <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50/80 p-4">
                <p className="text-sm font-semibold text-amber-900">{t('dashboard.codExposure')}</p>
                <div className="mt-2 space-y-1">
                  {data.pendingCodByCurrency.length === 0 ? (
                    <p className="text-sm text-amber-800">{t('common.none')}</p>
                  ) : (
                    data.pendingCodByCurrency.map((item: (typeof data.pendingCodByCurrency)[number]) => (
                      <p key={item.currency} className="text-sm text-amber-800">
                        {formatCurrency(item._sum.expectedAmount ?? 0, item.currency as 'THB' | 'LAK')}
                      </p>
                    ))
                  )}
                </div>
              </div>

              <Link
                href="/dashboard/cod"
                className="touch-target mt-4 inline-flex items-center gap-2 rounded-full border border-border/80 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {t('common.viewAll')}
                <Icon id="chevron-right" size={16} />
              </Link>
            </CardContent>
          </Card>

          <Card className="surface-panel border-0 py-0 shadow-none">
            <CardContent className="px-4 py-4 sm:px-5">
              <div className="page-header gap-3">
                <div>
                  <p className="metric-label">{t('dashboard.attentionQueue')}</p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
                    {t('dashboard.attentionQueue')}
                  </h2>
                </div>
              </div>

              {data.attentionShipments.length === 0 ? (
                <div className="surface-muted mt-5 px-4 py-8 text-center text-sm text-muted-foreground">
                  {t('dashboard.noAttention')}
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {data.attentionShipments.map((shipment: (typeof data.attentionShipments)[number]) => (
                    <Link
                      key={shipment.id}
                      href={`/dashboard/shipments/${shipment.id}`}
                      className="list-card cv-auto block px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="mono-tracking text-foreground">{shipment.trackingNo}</span>
                            <StatusBadge status={shipment.status} />
                          </div>
                          <p className="mt-2 text-sm font-medium text-foreground">
                            {shipment.receiver.firstname} {shipment.receiver.lastname}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {shipment.destinationBranch.branchName} · {shipment.receiver.phone}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(shipment.createdAt)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
