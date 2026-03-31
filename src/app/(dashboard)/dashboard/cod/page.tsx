'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CodBadge } from '@/components/ui/status-badge'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type CodItem = {
  id: string
  status: 'pending' | 'collected' | 'pending_transfer' | 'transferred' | 'cancelled'
  currency: 'THB' | 'LAK'
  expectedAmount: number
  collectedAmount: number | null
  discrepancyNote: string | null
  createdAt: string
  collectedAt: string | null
  transferredAt: string | null
  shipment: { id: string; trackingNo: string; status: string; receiver: { firstname: string; lastname: string } }
  branch: { id: string; branchName: string }
}

export default function CodPage() {
  const { t } = useI18n()
  const [statusFilter, setStatusFilter] = useState('')
  const [collectingId, setCollectingId] = useState('')
  const [collectAmount, setCollectAmount] = useState('')
  const [note, setNote] = useState('')

  const { data, mutate, isLoading } = useSWR<{ success: boolean; data: CodItem[] }>(
    `/api/v1/cod${statusFilter ? `?status=${statusFilter}` : ''}`,
    fetcher
  )

  const items = data?.data ?? []

  async function collect(id: string, expectedAmount: number) {
    const amount = Number(collectAmount || expectedAmount)
    const res = await fetch(`/api/v1/cod/${id}/collect`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectedAmount: amount, discrepancyNote: note || undefined }),
    })
    if (res.ok) {
      toast.success(t('cod.recordCollection'))
      setCollectingId('')
      setCollectAmount('')
      setNote('')
      mutate()
    } else {
      const data = await res.json().catch(() => null)
      toast.error(data?.error ?? t('cod.errors.collectionFailed'))
    }
  }

  async function transfer(id: string) {
    const res = await fetch(`/api/v1/cod/${id}/transfer`, { method: 'PATCH' })
    if (res.ok) {
      toast.success(t('cod.confirmTransfer'))
      mutate()
    } else {
      const data = await res.json().catch(() => null)
      toast.error(data?.error ?? t('cod.errors.transferFailed'))
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{t('cod.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('cod.subtitle')}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          ['', t('common.viewAll')],
          ['pending', t('cod.pending')],
          ['collected', t('cod.collected')],
          ['transferred', t('cod.transferred')],
          ['cancelled', t('status.cod_cancelled')],
        ].map(([value, label]) => (
          <button
            key={value || 'all'}
            onClick={() => setStatusFilter(value)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusFilter === value ? 'text-white' : 'border bg-white text-muted-foreground'}`}
            style={statusFilter === value ? { backgroundColor: 'var(--brand-primary)' } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('cod.listTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">{t('common.loading')}</p>}
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-xs font-semibold">{item.shipment.trackingNo}</p>
                  <p className="text-xs text-muted-foreground">{item.branch.branchName} · {item.shipment.receiver.firstname} {item.shipment.receiver.lastname}</p>
                </div>
                <CodBadge status={item.status} />
              </div>

              <div className="text-sm">
                <p>{t('cod.expected')}: {formatCurrency(item.expectedAmount, item.currency)}</p>
                {item.collectedAmount !== null && <p>{t('cod.actual')}: {formatCurrency(item.collectedAmount, item.currency)}</p>}
                <p className="text-xs text-muted-foreground">{t('cod.createdAt')} {formatDate(item.createdAt)}</p>
              </div>

              {item.status === 'pending' && (
                <div className="space-y-2 rounded-md bg-muted p-2">
                  {collectingId !== item.id ? (
                    <Button size="sm" onClick={() => setCollectingId(item.id)}>{t('cod.recordCollection')}</Button>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        placeholder={t('cod.actualAmount')}
                        value={collectAmount}
                        onChange={(e) => setCollectAmount(e.target.value)}
                      />
                      <Input
                        placeholder={t('cod.discrepancyNote')}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => collect(item.id, item.expectedAmount)}>{t('common.confirm')}</Button>
                        <Button size="sm" variant="outline" onClick={() => setCollectingId('')}>{t('common.cancel')}</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(item.status === 'collected' || item.status === 'pending_transfer') && (
                <Button size="sm" variant="outline" onClick={() => transfer(item.id)}>{t('cod.confirmTransfer')}</Button>
              )}
            </div>
          ))}

          {!isLoading && items.length === 0 && <p className="text-sm text-muted-foreground">{t('cod.empty')}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
