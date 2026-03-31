import type { Metadata } from "next";
import { cookies } from 'next/headers'
import { AppProviders } from '@/components/providers'
import { defaultLocale, localeCookieName, type Locale } from '@/lib/i18n-dictionaries'
import "./globals.css";

export const metadata: Metadata = {
  title: 'Thai-Lao Logistic',
  description: 'Cross-border parcel management system for Thailand and Laos',
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
      className="h-full antialiased light"
      style={{
        ['--font-sans' as string]: "'Noto Sans Lao', 'Noto Sans Thai', 'Segoe UI', 'Inter', sans-serif",
        ['--font-geist-mono' as string]: "'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
        colorScheme: 'light',
      }}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders initialLocale={locale}>{children}</AppProviders>
      </body>
    </html>
  )
}
