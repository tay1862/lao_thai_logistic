import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getI18n } from '@/lib/i18n-server'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'

const ACTION_OPTIONS = [
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DEACTIVATED',
  'SHIPMENT_CREATED',
  'SHIPMENT_STATUS_CHANGED',
  'SHIPMENT_CANCELLED',
  'SHIPMENT_PRICE_MANUAL',
  'COD_COLLECTED',
  'COD_TRANSFERRED',
  'COD_DISCREPANCY',
  'BRANCH_CREATED',
  'BRANCH_UPDATED',
  'PRICE_CONFIG_CREATED',
  'PRICE_CONFIG_UPDATED',
  'LOGIN',
  'LOGIN_FAILED',
  'LOGOUT',
] as const

const ENTITY_OPTIONS = ['User', 'Shipment', 'CodTransaction', 'Branch', 'PriceConfig'] as const

interface PageProps {
  searchParams: Promise<{ q?: string; action?: string; entityType?: string; page?: string }>
}

function stringifyJson(value: unknown) {
  if (!value) return null
  return JSON.stringify(value, null, 2)
}

export default async function AuditPage({ searchParams }: PageProps) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const { t } = await getI18n()
  const sp = await searchParams
  const q = sp.q?.trim()
  const action = ACTION_OPTIONS.find((item) => item === sp.action)
  const entityType = ENTITY_OPTIONS.find((item) => item === sp.entityType)
  const page = Math.max(1, Number(sp.page ?? 1))
  const pageSize = 25

  const where = {
    ...(action && { action }),
    ...(entityType && { entityType }),
    ...(q && {
      OR: [
        { action: { contains: q, mode: 'insensitive' as const } },
        { entityType: { contains: q, mode: 'insensitive' as const } },
        { entityId: { contains: q, mode: 'insensitive' as const } },
        { user: { firstname: { contains: q, mode: 'insensitive' as const } } },
        { user: { lastname: { contains: q, mode: 'insensitive' as const } } },
        { user: { email: { contains: q, mode: 'insensitive' as const } } },
      ],
    }),
  }

  const [total, records] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            firstname: true,
            lastname: true,
            email: true,
          },
        },
      },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function buildQuery(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (action) params.set('action', action)
    if (entityType) params.set('entityType', entityType)
    params.set('page', String(page))
    Object.entries(overrides).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    return `?${params.toString()}`
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{t('admin.auditTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.auditSubtitle')}</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <form method="GET" action="/dashboard/admin/audit" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
            <div className="relative">
              <Icon id="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                defaultValue={q}
                placeholder={t('admin.auditSearchPlaceholder')}
                className="h-10 w-full rounded-md border border-input bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 ring-[var(--brand-primary)]"
              />
            </div>
            <select name="action" defaultValue={action ?? ''} className="h-10 rounded-md border border-input bg-white px-3 text-sm">
              <option value="">{t('admin.allActions')}</option>
              {ACTION_OPTIONS.map((option) => (
                <option key={option} value={option}>{t(`admin.auditActions.${option}`)}</option>
              ))}
            </select>
            <select name="entityType" defaultValue={entityType ?? ''} className="h-10 rounded-md border border-input bg-white px-3 text-sm">
              <option value="">{t('admin.allEntities')}</option>
              {ENTITY_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <button type="submit" className="h-10 rounded-md px-4 text-sm font-medium text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
              {t('common.search')}
            </button>
          </form>
        </CardContent>
      </Card>

      {records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Icon id="clipboard" size={44} className="mb-3 opacity-30" />
            <p>{t('admin.auditEmpty')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const before = stringifyJson(record.oldData)
            const after = stringifyJson(record.newData)

            return (
              <Card key={record.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{t(`admin.auditActions.${record.action}`)}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {record.user.firstname} {record.user.lastname} · {record.user.email}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(record.createdAt)}</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('admin.actor')}</p>
                      <p>{record.user.firstname} {record.user.lastname}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('admin.entity')}</p>
                      <p>{record.entityType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ID</p>
                      <p className="font-mono text-xs break-all">{record.entityId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('admin.ip')}</p>
                      <p>{record.ipAddress ?? '-'}</p>
                    </div>
                  </div>

                  {(before || after) && (
                    <div className="grid gap-3 lg:grid-cols-2">
                      {before && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">{t('admin.before')}</p>
                          <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{before}</pre>
                        </div>
                      )}
                      {after && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">{t('admin.after')}</p>
                          <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{after}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{t('shipments.page')} {page} / {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={buildQuery({ page: String(page - 1) })} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
                <Icon id="chevron-left" size={14} /> {t('shipments.prev')}
              </a>
            )}
            {page < totalPages && (
              <a href={buildQuery({ page: String(page + 1) })} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
                {t('shipments.next')} <Icon id="chevron-right" size={14} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}