import en from '@/locales/en.json'
import lo from '@/locales/lo.json'

export type Locale = 'en' | 'lo'
export type Dictionary = typeof en

export const dictionaries = { en, lo } satisfies Record<Locale, Dictionary>
export const localeCookieName = 'tll_locale'
const envLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE
export const defaultLocale: Locale = envLocale === 'lo' ? 'lo' : 'en'

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale]
}

export function translate(dictionary: Dictionary, key: string): string {
  const value = key.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[segment]
    }
    return undefined
  }, dictionary)

  return typeof value === 'string' ? value : key
}
