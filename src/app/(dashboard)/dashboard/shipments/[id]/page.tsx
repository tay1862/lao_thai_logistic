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
    <div className="page-stack">
      <section className="page-header">
        <div className="space-y-3">
          <span className="eyebrow">
            <Icon id="package" size={14} />
            {shipment.originBranch.branchName} {'→'} {shipment.destinationBranch.branchName}
          </span>
          <div>
            <h1 className="page-title">{shipment.trackingNo}</h1>
            <p className="page-subtitle">{t('shipments.detail.details')}</p>
          </div>
        </div>

        <a
          href={`/api/v1/shipments/${shipment.id}/label`}
          target="_blank"
          rel="noreferrer"
          className="touch-target inline-flex items-center gap-2 rounded-full border border-border/80 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Icon id="printer" size={16} />
          {t('shipments.detail.printLabel')}
        </a>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <div className="page-stack">
          <Card className="surface-panel border-0 py-0 shadow-none">
            <CardContent className="px-4 py-5 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono-tracking text-foreground">{shipment.trackingNo}</span>
                <StatusBadge status={shipment.status as any} className="px-3 py-1.5 text-sm" />
                {shipment.shippingPartner && (
                  <span className="rounded-full border border-border/80 bg-white px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {t(`partners.${shipment.shippingPartner}`)}
                  </span>
                )}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="surface-muted p-4">
                  <p className="data-label">{t('shipments.detail.sender')}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {shipment.sender.firstname} {shipment.sender.lastname}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{shipment.sender.phone}</p>
                </div>
                <div className="surface-muted p-4">
                  <p className="data-label">{t('shipments.detail.receiver')}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {shipment.receiver.firstname} {shipment.receiver.lastname}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{shipment.receiver.phone}</p>
                </div>
                <div className="surface-muted p-4">
                  <p className="data-label">{t('shipments.detail.weight')}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{shipment.weightKg} kg</p>
                </div>
                <div className="surface-muted p-4">
                  <p className="data-label">{t('shipments.detail.shippingFee')}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {formatCurrency(shipment.price, shipment.currency as any)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="surface-muted p-4">
                  <p className="data-label">{t('tracking.route')}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {shipment.originBranch.branchName} {'→'} {shipment.destinationBranch.branchName}
                  </p>
                </div>
                <div className="surface-muted p-4">
                  <p className="data-label">{t('shipments.detail.externalTrackingNo')}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {shipment.externalTrackingNo ?? t('common.none')}
                  </p>
                </div>
              </div>

              {shipment.itemDescription && (
                <div className="surface-muted mt-4 p-4">
                  <p className="data-label">{t('shipments.detail.itemDescription')}</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">{shipment.itemDescription}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="surface-panel border-0 py-0 shadow-none">
            <CardHeader className="px-4 pt-5 sm:px-5">
              <CardTitle className="font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
                {t('shipments.detail.history')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5 sm:px-5">
              <div className="space-y-4">
                {shipment.events.map((event: (typeof shipment.events)[number], index: number) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="mt-1 h-3 w-3 rounded-full bg-[var(--brand-primary)]" />
                      {index < shipment.events.length - 1 && (
                        <div className="mt-2 h-full min-h-10 w-px bg-[var(--brand-border)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 rounded-[1.25rem] border border-border/80 bg-white/88 px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {event.status ? t(`status.${event.status}`) : event.eventType}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</span>
                      </div>
                      {event.location && <p className="mt-2 text-sm text-muted-foreground">{event.location}</p>}
                      {event.note && <p className="mt-2 text-sm text-foreground">{event.note}</p>}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t('shipments.detail.updatedBy')} {event.performedBy.firstname} {event.performedBy.lastname}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="page-stack">
          <Card className="surface-panel border-0 py-0 shadow-none">
            <CardHeader className="px-4 pt-5 sm:px-5">
              <CardTitle className="font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
                {t('shipments.detail.updateStatus')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5 sm:px-5">
              <StatusUpdateForm shipmentId={shipment.id} currentStatus={shipment.status as any} />
            </CardContent>
          </Card>

          {shipment.codTransaction && (
            <Card className="surface-panel border-0 py-0 shadow-none">
              <CardHeader className="px-4 pt-5 sm:px-5">
                <CardTitle className="font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
                  {t('shipments.detail.cod')}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-5 sm:px-5">
                <div className="surface-muted p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="data-label">{t('tracking.codStatus')}</p>
                    <CodBadge status={shipment.codTransaction.status as any} className="px-3 py-1.5 text-sm" />
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{t('shipments.detail.expected')}</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(shipment.codTransaction.expectedAmount, shipment.codTransaction.currency as any)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{t('shipments.detail.collected')}</span>
                      <span className="font-semibold text-foreground">
                        {shipment.codTransaction.collectedAmount !== null
                          ? formatCurrency(shipment.codTransaction.collectedAmount, shipment.codTransaction.currency as any)
                          : t('common.none')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </section>
    </div>
  )
}
