import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getI18n } from '@/lib/i18n-server'
import { prisma } from '@/lib/prisma'
import { Icon } from '@/components/ui/icon'
import { ShipmentCreateForm } from '@/components/shipment/shipment-create-form'

export default async function NewShipmentPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const { t } = await getI18n()

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: [{ country: 'asc' }, { branchName: 'asc' }],
    select: { id: true, branchName: true, country: true, currency: true },
  })

  return (
    <div className="page-stack">
      <section className="page-header">
        <div className="space-y-3">
          <span className="eyebrow">
            <Icon id="plus" size={14} />
            {t('shipments.newTitle')}
          </span>
          <div>
            <h1 className="page-title">{t('shipments.newTitle')}</h1>
            <p className="page-subtitle">{t('shipments.newSubtitle')}</p>
          </div>
        </div>
      </section>

      <ShipmentCreateForm
        branches={branches}
        userRole={user.role}
        userBranchId={user.branchId}
      />
    </div>
  )
}
