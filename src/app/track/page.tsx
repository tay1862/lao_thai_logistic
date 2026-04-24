import { redirect } from 'next/navigation'
import { getI18n } from '@/lib/i18n-server'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'

interface PageProps {
  searchParams: Promise<{ trackingNo?: string }>
}

export default async function TrackSearchPage({ searchParams }: PageProps) {
  const { t } = await getI18n()
  const sp = await searchParams
  const trackingNo = sp.trackingNo?.trim()

  if (trackingNo) {
    redirect(`/track/${encodeURIComponent(trackingNo)}`)
  }

  const infoTiles = [
    ['check-circle', t('tracking.currentStatus')],
    ['map-pin', t('tracking.route')],
    ['banknote', t('tracking.codStatus')],
  ] as const

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(77,154,245,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,253,0.98))] px-4 py-8 sm:py-12">
      <div className="page-shell">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.06fr)_minmax(24rem,28rem)] lg:items-stretch">
          <section className="surface-panel hidden border-0 p-8 shadow-none lg:flex lg:flex-col">
            <span className="eyebrow">
              <Icon id="package" size={14} />
              {t('tracking.title')}
            </span>
            <div className="mt-auto">
              <h1 className="font-heading text-[clamp(2.4rem,4vw,4rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--brand-ink)]">
                {t('tracking.publicHeroTitle')}
              </h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
                {t('tracking.subtitle')}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {infoTiles.map(([icon, label]) => (
                  <div key={label} className="surface-muted p-4">
                    <span className="action-tile-icon h-11 w-11 rounded-2xl">
                      <Icon id={icon} size={18} />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Card className="surface-panel border-0 py-0 shadow-none">
            <CardContent className="px-5 py-6 sm:px-7 sm:py-7">
              <div className="lg:hidden">
                <span className="eyebrow">
                  <Icon id="package" size={14} />
                  {t('tracking.title')}
                </span>
              </div>

              <div className="mt-5 lg:mt-0">
                <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-foreground">
                  {t('tracking.title')}
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t('tracking.subtitle')}
                </p>
              </div>

              <form action="/track" className="mt-7 space-y-4" method="GET">
                <label htmlFor="trackingNo" className="data-label">
                  {t('tracking.searchTitle')}
                </label>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="relative">
                    <Icon id="search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="trackingNo"
                      name="trackingNo"
                      placeholder={t('tracking.searchPlaceholder')}
                      className="h-12 w-full rounded-xl border border-input bg-white px-4 pl-11 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  </div>
                  <button
                    type="submit"
                    className="touch-target inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(22,63,143,0.18)]"
                  >
                    <Icon id="search" size={16} />
                    {t('tracking.searchAction')}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">{t('tracking.searchHint')}</p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
