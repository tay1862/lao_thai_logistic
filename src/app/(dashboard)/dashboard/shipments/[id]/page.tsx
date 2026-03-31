import { notFound, redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getI18n } from '@/lib/i18n-server'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { StatusBadge, CodBadge } from '@/components/ui/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusUpdateForm } from '@/components/shipment/status-update-form'
import { Icon } from '@/components/ui/icon'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ShipmentDetailPage({ params }: PageProps) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const { t } = await getI18n()

  const { id } = await params

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      sender: true,
      receiver: true,
      originBranch: true,
      destinationBranch: true,
      events: {
        orderBy: { createdAt: 'desc' },
        include: { performedBy: { select: { firstname: true, lastname: true } } },
      },
      codTransaction: true,
    },
  })

  if (!shipment) notFound()

  const canView = user.role === 'admin' || user.role === 'manager' ||
    user.branchId === shipment.originBranchId || user.branchId === shipment.destinationBranchId

  if (!canView) redirect('/dashboard/shipments')

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('shipments.detail.details')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-semibold">{shipment.trackingNo}</span>
              <StatusBadge status={shipment.status as any} />
              <a
                href={`/api/v1/shipments/${shipment.id}/label`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium hover:bg-muted"
              >
                <Icon id="printer" size={12} />
                {t('shipments.detail.printLabel')}
              </a>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-muted-foreground">{t('shipments.detail.sender')}</p>
                <p className="font-medium">{shipment.sender.firstname} {shipment.sender.lastname}</p>
                <p>{shipment.sender.phone}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('shipments.detail.receiver')}</p>
                <p className="font-medium">{shipment.receiver.firstname} {shipment.receiver.lastname}</p>
                <p>{shipment.receiver.phone}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('shipments.detail.origin')}</p>
                <p className="font-medium">{shipment.originBranch.branchName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('shipments.detail.destination')}</p>
                <p className="font-medium">{shipment.destinationBranch.branchName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('shipments.detail.weight')}</p>
                <p>{shipment.weightKg} กก.</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('shipments.detail.shippingFee')}</p>
                <p>{formatCurrency(shipment.price, shipment.currency as any)}</p>
              </div>
              {shipment.shippingPartner && (
                <div>
                  <p className="text-muted-foreground">{t('shipments.detail.shippingPartner')}</p>
                  <p>{t(`partners.${shipment.shippingPartner}`)}</p>
                </div>
              )}
              {shipment.externalTrackingNo && (
                <div>
                  <p className="text-muted-foreground">{t('shipments.detail.externalTrackingNo')}</p>
                  <p className="font-mono text-xs font-semibold">{shipment.externalTrackingNo}</p>
                </div>
              )}
            </div>
            {shipment.itemDescription && (
              <div>
                <p className="text-muted-foreground">{t('shipments.detail.itemDescription')}</p>
                <p>{shipment.itemDescription}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('shipments.detail.history')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {shipment.events.map((e: (typeof shipment.events)[number]) => (
                <div key={e.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{e.status ?? e.eventType}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(e.createdAt)}</span>
                  </div>
                  {e.location && <p className="text-muted-foreground mt-1">{e.location}</p>}
                  {e.note && <p className="mt-1">{e.note}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('shipments.detail.updatedBy')} {e.performedBy.firstname} {e.performedBy.lastname}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('shipments.detail.updateStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusUpdateForm shipmentId={shipment.id} />
          </CardContent>
        </Card>

        {shipment.codTransaction && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('shipments.detail.cod')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CodBadge status={shipment.codTransaction.status as any} />
              </div>
              <p>{t('shipments.detail.expected')}: {formatCurrency(shipment.codTransaction.expectedAmount, shipment.codTransaction.currency as any)}</p>
              {shipment.codTransaction.collectedAmount !== null && (
                <p>{t('shipments.detail.collected')}: {formatCurrency(shipment.codTransaction.collectedAmount, shipment.codTransaction.currency as any)}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
