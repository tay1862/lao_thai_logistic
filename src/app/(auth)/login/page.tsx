'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@/components/ui/icon'
import { useI18n } from '@/lib/i18n'

export default function LoginPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error ?? t('login.defaultError'))
        return
      }
      toast.success(t('login.submit'))
      window.location.assign('/dashboard')
    } catch {
      setError(t('login.serverError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell w-full">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.06fr)_minmax(24rem,30rem)] lg:items-stretch">
        <section className="surface-panel relative hidden overflow-hidden p-8 lg:flex lg:min-h-[38rem] lg:flex-col">
          <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,rgba(77,154,245,0.32),transparent_65%)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <span className="eyebrow">{t('common.brand')}</span>
              <div className="mt-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.75rem] bg-[linear-gradient(180deg,var(--brand-primary),var(--brand-primary-strong))] text-white shadow-[0_24px_60px_rgba(22,63,143,0.28)]">
                <Icon id="truck" size={34} aria-label="Thai-Lao Logistic" />
              </div>
            </div>
            <LocaleSwitcher />
          </div>

          <div className="relative mt-auto max-w-xl">
            <h1 className="font-heading text-[clamp(2.3rem,4vw,4rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--brand-ink)]">
              {t('login.heroTitle')}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
              {t('login.subtitle')}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {['operations', 'tracking', 'security'].map((item) => (
                <div key={item} className="surface-muted p-4">
                  <p className="metric-label">{t(`login.features.${item}.label`)}</p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {t(`login.features.${item}.value`)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-[1.25rem] border border-[var(--brand-border)] bg-white/84 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-primary)]">
                <Icon id="check-circle" size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{t('login.securityTitle')}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{t('login.securityBody')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-full flex-col justify-center">
          <div className="mb-4 flex justify-end lg:hidden">
            <LocaleSwitcher />
          </div>

          <Card className="surface-panel overflow-visible border-0 py-0 shadow-none">
            <CardContent className="px-5 py-6 sm:px-7 sm:py-7">
              <div className="mb-6 lg:hidden">
                <span className="eyebrow">{t('common.brand')}</span>
                <div className="mt-5 flex h-16 w-16 items-center justify-center rounded-[1.6rem] bg-[linear-gradient(180deg,var(--brand-primary),var(--brand-primary-strong))] text-white shadow-[0_24px_60px_rgba(22,63,143,0.22)]">
                  <Icon id="truck" size={30} aria-label="Thai-Lao Logistic" />
                </div>
              </div>

              <div>
                <p className="metric-label">{t('login.title')}</p>
                <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em] text-foreground">
                  {t('login.welcomeTitle')}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t('login.formHelp')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
                <div className="field-stack">
                  <Label htmlFor="email">{t('login.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="staff@thai-lao.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl bg-white/90 px-4"
                  />
                </div>

                <div className="field-stack">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="password">{t('login.password')}</Label>
                    <span className="text-xs text-muted-foreground">{t('login.passwordHelp')}</span>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 rounded-xl bg-white/90 px-4 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={showPw ? t('login.hidePassword') : t('login.showPassword')}
                    >
                      <Icon id="eye" size={18} />
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    className="flex items-start gap-2 rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--brand-danger)]"
                    role="alert"
                  >
                    <Icon id="alert" size={16} className="mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!isHydrated || loading}
                  size="lg"
                  className="h-12 w-full rounded-xl text-base font-medium shadow-[0_20px_40px_rgba(22,63,143,0.2)]"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Icon id="refresh" size={16} className="animate-spin" />
                      {t('login.submitting')}
                    </span>
                  ) : (
                    t('login.submit')
                  )}
                </Button>
              </form>

              <div className="mt-6 rounded-[1rem] border border-border/80 bg-[var(--brand-soft)] px-4 py-3">
                <p className="text-sm font-medium text-[var(--brand-primary-strong)]">{t('login.supportTitle')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('login.supportBody')}</p>
              </div>
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            © 2026 {t('common.brand')} · {t('login.footer')}
          </p>
        </section>
      </div>
    </div>
  )
}
