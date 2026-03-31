import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getI18n } from '@/lib/i18n-server'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { StatusBadge, CodBadge } from '@/components/ui/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'

interface PageProps {
  params: Promise<{ trackingNo: string }>
}

export default async function PublicTrackingPage({ params }: PageProps) {
  const { trackingNo } = await params
  const { t } = await getI18n()

  const shipment = await prisma.shipment.findUnique({
    where: { trackingNo },
    select: {
      trackingNo: true,
      status: true,
      codAmount: true,
      originBranch: { select: { branchName: true } },
      destinationBranch: { select: { branchName: true } },
      codTransaction: { select: { status: true } },
      events: {
        where: { eventType: 'status_change' },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          status: true,
          location: true,
          createdAt: true,
        },
      },
    },
  })

  if (!shipment) notFound()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e8f2ff,white_45%)] px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t('tracking.title')}</h1>
            <p className="text-sm text-muted-foreground">{shipment.trackingNo}</p>
          </div>
          <Link href="/track" className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-muted">
            <Icon id="search" size={16} />
            {t('tracking.searchAction')}
          </Link>
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{t('tracking.currentStatus')}</p>
                <div className="mt-1">
                  <StatusBadge status={shipment.status as any} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('tracking.route')}</p>
                <p className="mt-1 text-sm font-medium">{shipment.originBranch.branchName} → {shipment.destinationBranch.branchName}</p>
              </div>
              {shipment.codAmount > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('tracking.codAmount')}</p>
                  <p className="mt-1 text-sm font-medium">{shipment.codAmount.toLocaleString()}</p>
                </div>
              )}
              {shipment.codTransaction && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('tracking.codStatus')}</p>
                  <div className="mt-1"><CodBadge status={shipment.codTransaction.status as any} /></div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('tracking.history')}</CardTitle>
          </CardHeader>
          <CardContent>
            {shipment.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('tracking.empty')}</p>
            ) : (
              <div className="space-y-4">
                {shipment.events.map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="mt-1 h-3 w-3 rounded-full bg-[var(--brand-primary)]" />
                      {index < shipment.events.length - 1 && <div className="mt-2 h-full min-h-8 w-px bg-[var(--brand-border)]" />}
                    </div>
                    <div className="min-w-0 flex-1 rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium">{event.status ? t(`status.${event.status}`) : '-'}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</span>
                      </div>
                      {event.location && <p className="mt-1 text-sm text-muted-foreground">{event.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}