'use client'

import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n-dictionaries'

export function LocaleSwitcher() {
  const router = useRouter()
  const { locale, setLocale, t } = useI18n()

  return (
    <label className="flex items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5 text-xs text-muted-foreground">
      <span className="hidden sm:inline">{t('language.label')}</span>
      <select
        aria-label={t('language.label')}
        className="bg-transparent outline-none"
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
