import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getI18n } from '@/lib/i18n-server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminUsersPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')
  const { t } = await getI18n()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { branch: { select: { branchName: true } } },
    take: 200,
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{t('admin.usersTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.usersSubtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.usersTitle')} ({users.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {users.map((u: (typeof users)[number]) => (
            <div key={u.id} className="rounded-md border p-3 text-sm flex items-center justify-between">
              <div>
                <p className="font-medium">{u.firstname} {u.lastname}</p>
                <p className="text-muted-foreground">{u.email}</p>
                <p className="text-xs text-muted-foreground">{u.branch?.branchName ?? t('common.none')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase">{u.role}</p>
                <p className={`text-xs ${u.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>{u.status}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
