import { cookies } from 'next/headers'
import { defaultLocale, getDictionary, localeCookieName, translate, type Locale } from '@/lib/i18n-dictionaries'

export async function getI18n() {
  const cookieStore = await cookies()
  const locale = (cookieStore.get(localeCookieName)?.value as Locale | undefined) ?? defaultLocale
  const dictionary = getDictionary(locale)

  return {
    locale,
    dictionary,
    t: (key: string) => translate(dictionary, key),
  }
}
