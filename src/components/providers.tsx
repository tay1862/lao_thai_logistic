'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { LocaleProvider } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n-dictionaries'

export function AppProviders({ children, initialLocale }: { children: React.ReactNode; initialLocale: Locale }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
      <LocaleProvider initialLocale={initialLocale}>
        {children}
        <Toaster position="top-right" richColors />
      </LocaleProvider>
    </ThemeProvider>
  )
}
