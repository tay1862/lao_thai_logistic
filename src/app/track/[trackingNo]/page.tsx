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
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(77,154,245,0.14),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,253,0.98))] px-4 py-8 sm:py-12">
      <div className="page-shell">
        <div className="page-stack">
          <section className="page-header">
            <div className="space-y-3">
              <span className="eyebrow">
                <Icon id="package" size={14} />
                {t('tracking.title')}
              </span>
              <div>
                <h1 className="page-title">{shipment.trackingNo}</h1>
                <p className="page-subtitle">{t('tracking.subtitle')}</p>
              </div>
            </div>

            <Link
              href="/track"
              className="touch-target inline-flex items-center gap-2 rounded-full border border-border/80 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Icon id="search" size={16} />
              {t('tracking.searchAction')}
            </Link>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.82fr)]">
            <div className="page-stack">
              <Card className="surface-panel border-0 py-0 shadow-none">
                <CardContent className="px-4 py-5 sm:px-5">
                  <div className="page-header gap-4">
                    <div>
                      <p className="metric-label">{t('tracking.currentStatus')}</p>
                      <div className="mt-3">
                        <StatusBadge status={shipment.status as any} className="px-3 py-1.5 text-sm" />
                      </div>
                    </div>
                    {shipment.codTransaction && (
                      <div>
                        <p className="metric-label">{t('tracking.codStatus')}</p>
                        <div className="mt-3">
                          <CodBadge status={shipment.codTransaction.status as any} className="px-3 py-1.5 text-sm" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="surface-muted p-4">
                      <p className="data-label">{t('tracking.route')}</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {shipment.originBranch.branchName} {'→'} {shipment.destinationBranch.branchName}
                      </p>
                    </div>
                    <div className="surface-muted p-4">
                      <p className="data-label">{t('tracking.codAmount')}</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {shipment.codAmount > 0 ? shipment.codAmount.toLocaleString() : t('common.none')}
                      </p>
                    </div>
                    <div className="surface-muted p-4">
                      <p className="data-label">{t('tracking.history')}</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {shipment.events.length.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="surface-panel border-0 py-0 shadow-none">
                <CardHeader className="px-4 pt-5 sm:px-5">
                  <CardTitle className="font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
                    {t('tracking.history')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-5 sm:px-5">
                  {shipment.events.length === 0 ? (
                    <div className="surface-muted px-4 py-10 text-center text-sm text-muted-foreground">
                      {t('tracking.empty')}
                    </div>
                  ) : (
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
                                {event.status ? t(`status.${event.status}`) : '-'}
                              </span>
                              <span className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</span>
                            </div>
                            {event.location && <p className="mt-2 text-sm text-muted-foreground">{event.location}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <aside className="page-stack">
              <Card className="surface-panel border-0 py-0 shadow-none">
                <CardContent className="px-4 py-5">
                  <p className="metric-label">{t('tracking.searchTitle')}</p>
                  <form action="/track" className="mt-4 space-y-3" method="GET">
                    <input
                      name="trackingNo"
                      defaultValue={shipment.trackingNo}
                      placeholder={t('tracking.searchPlaceholder')}
                      className="h-12 w-full rounded-xl border border-input bg-white px-4 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                    <button
                      type="submit"
                      className="touch-target inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(22,63,143,0.18)]"
                    >
                      <Icon id="search" size={16} />
                      {t('tracking.searchAction')}
                    </button>
                  </form>
                </CardContent>
              </Card>
            </aside>
          </section>
        </div>
      </div>
    </div>
  )
}
