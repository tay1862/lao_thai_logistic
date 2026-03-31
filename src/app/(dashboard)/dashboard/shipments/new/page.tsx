import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getI18n } from '@/lib/i18n-server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{t('shipments.newTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('shipments.newSubtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('shipments.detail.details')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ShipmentCreateForm
            branches={branches}
            userRole={user.role}
            userBranchId={user.branchId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
