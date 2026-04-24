import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getI18n } from '@/lib/i18n-server'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'

export default async function AdminPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')
  const { t } = await getI18n()

  const items = [
    { href: '/dashboard/admin/users', title: t('admin.users'), desc: t('admin.usersDesc'), icon: 'users' },
    { href: '/dashboard/admin/branches', title: t('admin.branches'), desc: t('admin.branchesDesc'), icon: 'building' },
    { href: '/dashboard/admin/audit', title: t('admin.audit'), desc: t('admin.auditDesc'), icon: 'clipboard' },
  ] as const

  return (
    <div className="page-stack">
      <section className="page-header">
        <div className="space-y-3">
          <span className="eyebrow">
            <Icon id="settings" size={14} />
            {t('admin.title')}
          </span>
          <div>
            <h1 className="page-title">{t('admin.title')}</h1>
            <p className="page-subtitle">{t('admin.subtitle')}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="action-tile min-h-[15rem] justify-between">
              <div>
                <span className="action-tile-icon">
                  <Icon id={item.icon} size={20} />
                </span>
                <h2 className="mt-4 font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.desc}</p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-primary-strong)]">
                {t('common.viewAll')}
                <Icon id="chevron-right" size={14} />
              </span>
            </Link>
          ))}
        </div>

        <Card className="surface-panel border-0 py-0 shadow-none">
          <CardContent className="px-4 py-5 sm:px-5">
            <p className="metric-label">{t('admin.audit')}</p>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
              {t('admin.controlCenterTitle')}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{t('admin.controlCenterBody')}</p>

            <div className="mt-5 space-y-3">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="surface-muted flex items-center gap-3 px-4 py-4 transition-colors hover:bg-white"
                >
                  <span className="action-tile-icon h-11 w-11 rounded-2xl">
                    <Icon id={item.icon} size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <Icon id="chevron-right" size={16} className="text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
