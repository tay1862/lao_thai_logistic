'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@/components/ui/icon'
import { useI18n } from '@/lib/i18n'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

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
      router.replace('/dashboard')
    } catch {
      setError(t('login.serverError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md px-4">
      <div className="mb-4 flex justify-end">
        <LocaleSwitcher />
      </div>

      {/* Logo / Brand header */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          <Icon id="truck" size={32} className="text-white" aria-label="Thai-Lao Logistic" />
        </div>
        <h1 className="text-2xl font-bold text-center" style={{ color: 'var(--brand-primary)' }}>
          {t('common.brand')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 text-center">
          {t('login.subtitle')}
        </p>
      </div>

      <Card className="shadow-xl border-[var(--brand-border)]">
        <CardHeader className="pb-4">
          <h2 className="text-lg font-semibold text-center">{t('login.title')}</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t('login.email')}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="staff@thai-lao.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">{t('login.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPw ? t('login.hidePassword') : t('login.showPassword')}
                >
                  <Icon id="eye" size={18} />
                </button>
              </div>
            </div>

            {error && (
              <div
                className="flex items-center gap-2 rounded-lg p-3 text-sm"
                style={{ backgroundColor: '#FEF2F2', color: 'var(--brand-danger)' }}
                role="alert"
              >
                <Icon id="alert" size={16} />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-base font-medium cursor-pointer"
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
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-6">
        © 2025 {t('common.brand')} · {t('login.footer')}
      </p>
    </div>
  )
}
