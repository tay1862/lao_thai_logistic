import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getI18n } from '@/lib/i18n-server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'

export default async function ReportsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role === 'staff') redirect('/dashboard')
  const { t } = await getI18n()

  const shipmentScope = (user.role === 'admin' || !user.branchId)
    ? {}
    : { OR: [{ originBranchId: user.branchId }, { destinationBranchId: user.branchId }] }
  const codScope = (user.role === 'admin' || !user.branchId)
    ? {}
    : { branchId: user.branchId }

  const [totalShipments, delivered, cancelled, codSum, codTransferred] = await Promise.all([
    prisma.shipment.count({ where: shipmentScope }),
    prisma.shipment.count({ where: { ...shipmentScope, status: 'delivered' } }),
    prisma.shipment.count({ where: { ...shipmentScope, status: 'cancelled' } }),
    prisma.codTransaction.aggregate({ where: codScope, _sum: { expectedAmount: true } }),
    prisma.codTransaction.aggregate({ where: { ...codScope, status: 'transferred' }, _sum: { collectedAmount: true } }),
  ])

  const deliveryRate = totalShipments > 0 ? (delivered / totalShipments) * 100 : 0

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{t('reports.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('reports.subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href="/api/v1/reports/export?format=xlsx"
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Icon id="download" size={16} />
          {t('reports.exportXlsx')}
        </a>
        <a
          href="/api/v1/reports/export?format=pdf"
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Icon id="download" size={16} />
          {t('reports.exportPdf')}
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{t('reports.totalShipments')}</p><p className="text-2xl font-bold">{totalShipments}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{t('reports.delivered')}</p><p className="text-2xl font-bold text-green-700">{delivered}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{t('reports.cancelled')}</p><p className="text-2xl font-bold text-gray-700">{cancelled}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{t('reports.deliveryRate')}</p><p className="text-2xl font-bold text-[var(--brand-primary)]">{deliveryRate.toFixed(1)}%</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{t('reports.codSummary')}</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>{t('reports.codTotal')}: {formatCurrency(codSum._sum.expectedAmount ?? 0, 'THB')}</p>
          <p>{t('reports.codTransferred')}: {formatCurrency(codTransferred._sum.collectedAmount ?? 0, 'THB')}</p>
        </CardContent>
      </Card>
    </div>
  )
}
