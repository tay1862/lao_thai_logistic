import { redirect } from 'next/navigation'
import { getI18n } from '@/lib/i18n-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e8f2ff,white_45%)] px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-primary)] text-white shadow-lg">
            <Icon id="package" size={28} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('tracking.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('tracking.subtitle')}</p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{t('tracking.searchTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action="/track" className="flex gap-2" method="GET">
              <input
                name="trackingNo"
                placeholder={t('tracking.searchPlaceholder')}
                className="h-11 flex-1 rounded-lg border border-input bg-white px-3 text-sm outline-none focus:ring-2 ring-[var(--brand-primary)]"
              />
              <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
                <Icon id="search" size={16} />
                {t('tracking.searchAction')}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}