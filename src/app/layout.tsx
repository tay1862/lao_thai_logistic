import type { Metadata, Viewport } from "next";
import { cookies } from 'next/headers'
import { Manrope, Public_Sans } from 'next/font/google'
import { AppProviders } from '@/components/providers'
import { defaultLocale, localeCookieName, type Locale } from '@/lib/i18n-dictionaries'
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-public-sans',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Thai-Lao Logistic',
    template: '%s | Thai-Lao Logistic',
  },
  description: 'Cross-border parcel management system for Thailand and Laos',
}

export const viewport: Viewport = {
  themeColor: '#1e5fd3',
  colorScheme: 'light',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies()
  const locale = ((cookieStore.get(localeCookieName)?.value as Locale | undefined) ?? defaultLocale)

  return (
    <html
      lang={locale}
      className={`${publicSans.variable} ${manrope.variable} h-full antialiased`}
      style={{
        ['--app-font-sans' as string]: "var(--font-public-sans), 'Noto Sans Lao', 'Noto Sans Thai', 'Segoe UI', sans-serif",
        ['--app-font-heading' as string]: "var(--font-manrope), 'Noto Sans Lao', 'Noto Sans Thai', 'Segoe UI', sans-serif",
        ['--font-geist-mono' as string]: "'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
        colorScheme: 'light',
      }}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppProviders initialLocale={locale}>{children}</AppProviders>
      </body>
    </html>
  )
}
