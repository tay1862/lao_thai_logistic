import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getI18n } from '@/lib/i18n-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{t('admin.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.subtitle')}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon id={item.icon} size={18} />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
