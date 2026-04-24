'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  defaultLocale,
  getDictionary,
  localeCookieName,
  translate,
  type Dictionary,
  type Locale,
} from '@/lib/i18n-dictionaries'

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  dictionary: Dictionary
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function LocaleProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? defaultLocale)

  useEffect(() => {
    document.documentElement.lang = locale
    document.cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`
    localStorage.setItem(localeCookieName, locale)
  }, [locale])

  const value = useMemo<I18nContextValue>(() => {
    const dictionary = getDictionary(locale)
    return {
      locale,
      dictionary,
      setLocale: setLocaleState,
      t: (key: string) => translate(dictionary, key),
    }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within LocaleProvider')
  }
  return context
}
