import { getSessionUser } from '@/lib/auth'
import { getI18n } from '@/lib/i18n-server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'

async function getDashboardData(userId: string, role: string, branchId: string | null) {
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

  const [todayCount, activeCount, deliveredToday, failedCount, pendingCod, recentShipments] =
    await Promise.all([
      prisma.shipment.count({
        where: { ...shipmentScope, createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.shipment.count({
        where: { ...shipmentScope, status: { in: ['received', 'in_transit', 'arrived_hub', 'out_for_delivery'] } },
      }),
      prisma.shipment.count({
        where: { ...shipmentScope, status: 'delivered', updatedAt: { gte: today, lt: tomorrow } },
      }),
      prisma.shipment.count({
        where: { ...shipmentScope, status: 'failed_delivery' },
      }),
      prisma.codTransaction.aggregate({
        where: { ...codScope, status: { in: ['pending', 'collected'] } },
        _count: true,
        _sum: { expectedAmount: true },
      }),
      prisma.shipment.findMany({
        where: shipmentScope,
        orderBy: { createdAt: 'desc' },
        take: 10,
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
          destinationBranch: { select: { branchName: true, country: true } },
        },
      }),
    ])

  return { todayCount, activeCount, deliveredToday, failedCount, pendingCod, recentShipments }
}

export default async function DashboardPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const { locale, t } = await getI18n()

  const data = await getDashboardData(user.id, user.role, user.branchId)

  const statCards = [
    {
      title: t('dashboard.todayShipments'),
      value: data.todayCount,
      icon: 'package',
      color: 'var(--brand-primary)',
      bg: '#EFF6FF',
    },
    {
      title: t('dashboard.activeShipments'),
      value: data.activeCount,
      icon: 'truck',
      color: '#D97706',
      bg: '#FFFBEB',
    },
    {
      title: t('dashboard.deliveredToday'),
      value: data.deliveredToday,
      icon: 'check-circle',
      color: '#16A34A',
      bg: '#F0FDF4',
    },
    {
      title: t('dashboard.failedDelivery'),
      value: data.failedCount,
      icon: 'alert',
      color: '#DC2626',
      bg: '#FEF2F2',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t('dashboard.title')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {user.branchName ? `${t('dashboard.branchPrefix')}: ${user.branchName}` : t('common.allBranches')} ·{' '}
          {new Date().toLocaleDateString(locale === 'lo' ? 'lo-LA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div
                  className="rounded-lg p-2"
                  style={{ backgroundColor: stat.bg, color: stat.color }}
                >
                  <Icon id={stat.icon} size={20} className="text-current" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* COD Summary */}
      {data.pendingCod._count > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-amber-100">
                <Icon id="banknote" size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">{t('dashboard.codPending')}</p>
                <p className="text-xs text-amber-600">
                  {data.pendingCod._count} {t('shipments.count')} ·{' '}
                  {formatCurrency(data.pendingCod._sum.expectedAmount ?? 0, 'THB')}
                </p>
              </div>
            </div>
            <a
              href="/dashboard/cod"
              className="text-sm font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              {t('common.viewAll')} <Icon id="chevron-right" size={16} />
            </a>
          </CardContent>
        </Card>
      )}

      {/* Recent Shipments */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t('dashboard.recentShipments')}</CardTitle>
          <a
            href="/dashboard/shipments"
            className="text-sm text-[var(--brand-primary)] hover:underline flex items-center gap-1"
          >
            {t('common.viewAll')} <Icon id="chevron-right" size={14} />
          </a>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentShipments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Icon id="package" size={40} className="mb-3 opacity-30" />
              <p className="text-sm">{t('dashboard.emptyShipments')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {data.recentShipments.map((s: (typeof data.recentShipments)[number]) => (
                <a
                  key={s.id}
                  href={`/dashboard/shipments/${s.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cv-auto"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-foreground font-medium">
                        {s.trackingNo}
                      </span>
                      <StatusBadge status={s.status} />
                      {s.codAmount > 0 && (
                        <span className="text-xs text-amber-600 font-medium">
                          COD {formatCurrency(s.codAmount, s.currency as 'THB' | 'LAK')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {s.sender.firstname} {s.sender.lastname} →{' '}
                      {s.receiver.firstname} {s.receiver.lastname} ·{' '}
                      {s.destinationBranch.branchName}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium">{formatCurrency(s.price, s.currency as 'THB' | 'LAK')}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
