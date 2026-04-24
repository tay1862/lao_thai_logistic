import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getI18n } from '@/lib/i18n-server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminBranchesPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')
  const { t } = await getI18n()

  const branches = await prisma.branch.findMany({
    orderBy: [{ country: 'asc' }, { branchName: 'asc' }],
    include: { _count: { select: { users: true } } },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{t('admin.branchesTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.branchesSubtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.branchesTitle')} ({branches.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {branches.map((b: (typeof branches)[number]) => (
            <div key={b.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{b.branchName}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {b.isActive ? 'active' : 'inactive'}
                </span>
              </div>
              <p className="text-muted-foreground">{b.country} · {b.currency}</p>
              <p className="text-xs text-muted-foreground">{t('admin.staffCount')} {b._count.users}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
