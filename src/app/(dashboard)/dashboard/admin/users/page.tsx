import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getI18n } from '@/lib/i18n-server'
import { prisma } from '@/lib/prisma'
import { AdminUsersManager } from '@/components/admin/admin-users-manager'
import { Icon } from '@/components/ui/icon'

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

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: [{ country: 'asc' }, { branchName: 'asc' }],
    select: { id: true, branchName: true, country: true },
  })

  return (
    <div className="page-stack">
      <section className="page-header">
        <div className="space-y-3">
          <span className="eyebrow">
            <Icon id="users" size={14} />
            {t('admin.usersTitle')}
          </span>
          <div>
            <h1 className="page-title">{t('admin.usersTitle')}</h1>
            <p className="page-subtitle">{t('admin.usersSubtitle')}</p>
          </div>
        </div>
      </section>

      <AdminUsersManager
        initialUsers={users.map((u: (typeof users)[number]) => ({
          id: u.id,
          firstname: u.firstname,
          lastname: u.lastname,
          email: u.email,
          role: u.role,
          status: u.status,
          branchId: u.branchId,
          branchName: u.branch?.branchName ?? null,
          createdAt: u.createdAt.toISOString(),
        }))}
        branches={branches}
        currentUserId={user.id}
      />
    </div>
  )
}
