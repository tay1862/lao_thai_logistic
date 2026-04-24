'use client'

import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { useI18n } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n-dictionaries'

export function LocaleSwitcher() {
  const router = useRouter()
  const { locale, setLocale, t } = useI18n()

  return (
    <label className="inline-flex h-11 items-center gap-2 rounded-full border border-border/80 bg-white/88 px-3 text-sm text-foreground shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-primary)]">
        <Icon id="globe" size={15} aria-label={t('language.label')} />
      </span>
      <span className="hidden text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:inline">
        {t('language.label')}
      </span>
      <select
        aria-label={t('language.label')}
        className="min-w-20 bg-transparent pr-1 text-sm font-medium outline-none"
        value={locale}
        onChange={(e) => {
          setLocale(e.target.value as Locale)
          router.refresh()
        }}
      >
        <option value="en">{t('language.en')}</option>
        <option value="lo">{t('language.lo')}</option>
      </select>
    </label>
  )
}
