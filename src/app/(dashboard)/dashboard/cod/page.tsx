'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { useState } from 'react'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { CodBadge, StatusBadge } from '@/components/ui/status-badge'
import { Icon } from '@/components/ui/icon'

const fetcher = (url: string) => fetch(url).then((response) => response.json())

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
  shipment: {
    id: string
    trackingNo: string
    status: 'received' | 'in_transit' | 'arrived' | 'delivered' | 'failed_delivery' | 'returned' | 'cancelled'
    receiver: { firstname: string; lastname: string }
  }
  branch: { id: string; branchName: string }
}

function formatCurrencyLines(items: CodItem[], statusFilter: CodItem['status'][] | null) {
  const totals = new Map<'THB' | 'LAK', number>()

  items
    .filter((item: CodItem) => (statusFilter ? statusFilter.includes(item.status) : true))
    .forEach((item) => {
      const amount = item.collectedAmount ?? item.expectedAmount
      totals.set(item.currency, (totals.get(item.currency) ?? 0) + amount)
    })

  return Array.from(totals.entries())
}

export default function CodPage() {
  const { t } = useI18n()
  const [statusFilter, setStatusFilter] = useState('')
  // UX-18: Drawer-based collect form
  const [collectingItem, setCollectingItem] = useState<CodItem | null>(null)
  const [collectAmount, setCollectAmount] = useState('')
  const [note, setNote] = useState('')

  const { data, mutate, isLoading } = useSWR<{ success: boolean; data: CodItem[] }>(
    `/api/v1/cod${statusFilter ? `?status=${statusFilter}` : ''}`,
    fetcher
  )

  const items = data?.data ?? []

  const pending = items.filter((item: CodItem) => item.status === 'pending')
  const transferReady = items.filter((item: CodItem) => item.status === 'collected' || item.status === 'pending_transfer')
  const transferred = items.filter((item: CodItem) => item.status === 'transferred')

  const summary = {
    pending,
    transferReady,
    transferred,
    pendingTotals: formatCurrencyLines(items, ['pending']),
    transferReadyTotals: formatCurrencyLines(items, ['collected', 'pending_transfer']),
    transferredTotals: formatCurrencyLines(items, ['transferred']),
  }

  const filterOptions = [
    ['', t('common.viewAll')],
    ['pending', t('cod.pending')],
    ['collected', t('cod.collected')],
    ['transferred', t('cod.transferred')],
    ['cancelled', t('status.cod_cancelled')],
  ] as const

  async function collect(id: string, expectedAmount: number) {
    const amount = Number(collectAmount || expectedAmount)

    const res = await fetch(`/api/v1/cod/${id}/collect`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectedAmount: amount, discrepancyNote: note || undefined }),
    })

    if (res.ok) {
      toast.success(t('cod.recordCollection'))
      setCollectingItem(null)
      setCollectAmount('')
      setNote('')
      mutate()
      return
    }

    const payload = await res.json().catch(() => null)
    toast.error(payload?.error ?? t('cod.errors.collectionFailed'))
  }

  async function transfer(id: string) {
    const res = await fetch(`/api/v1/cod/${id}/transfer`, { method: 'PATCH' })
    if (res.ok) {
      toast.success(t('cod.confirmTransfer'))
      mutate()
      return
    }

    const payload = await res.json().catch(() => null)
    toast.error(payload?.error ?? t('cod.errors.transferFailed'))
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div className="space-y-3">
          <span className="eyebrow">
            <Icon id="banknote" size={14} />
            {t('cod.title')}
          </span>
          <div>
            <h1 className="page-title">{t('cod.title')}</h1>
            <p className="page-subtitle">{t('cod.subtitle')}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          { title: t('cod.pending'), count: summary.pending.length, totals: summary.pendingTotals, tone: 'bg-amber-50 text-amber-700' },
          { title: t('cod.transferReady'), count: summary.transferReady.length, totals: summary.transferReadyTotals, tone: 'bg-sky-50 text-sky-700' },
          { title: t('cod.transferred'), count: summary.transferred.length, totals: summary.transferredTotals, tone: 'bg-emerald-50 text-emerald-700' },
        ].map((card: { title: string; count: number; totals: [CodItem['currency'], number][]; tone: string }) => (
          <Card key={card.title} className="surface-panel border-0 py-0 shadow-none">
            <CardContent className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="metric-label">{card.title}</p>
                  <p className="mt-3 font-heading text-3xl font-semibold tracking-[-0.05em] text-foreground">
                    {card.count.toLocaleString()}
                  </p>
                </div>
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.tone}`}>
                  <Icon id="banknote" size={20} />
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {card.totals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('common.none')}</p>
                ) : (
                  card.totals.map(([currency, amount]: [CodItem['currency'], number]) => (
                    <div key={currency} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{currency}</span>
                      <span className="font-semibold text-foreground">{formatCurrency(amount, currency)}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="page-stack">
        <Card className="surface-panel sticky-surface border-0 py-0 shadow-none">
          <CardContent className="px-4 py-4 sm:px-5">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filterOptions.map(([value, label]) => (
                <button
                  key={value || 'all'}
                  onClick={() => setStatusFilter(value)}
                  className={`touch-target rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    statusFilter === value
                      ? 'border-transparent bg-[var(--brand-primary)] text-white'
                      : 'border-border/80 bg-white text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="surface-panel border-0 py-0 shadow-none">
          <CardContent className="px-4 py-5 sm:px-5">
            <div className="page-header gap-4">
              <div>
                <p className="metric-label">{t('cod.listTitle')}</p>
                <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
                  {t('cod.listTitle')}
                </h2>
              </div>
            </div>

            {isLoading ? (
              <div className="surface-muted mt-5 px-4 py-10 text-center text-sm text-muted-foreground">
                {t('common.loading')}
              </div>
            ) : items.length === 0 ? (
              <div className="surface-muted mt-5 px-4 py-10 text-center text-sm text-muted-foreground">
                {t('cod.empty')}
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {items.map((item: CodItem) => (
                  <div key={item.id} className="list-card cv-auto px-4 py-4 sm:px-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/dashboard/shipments/${item.shipment.id}`} className="mono-tracking text-foreground">
                            {item.shipment.trackingNo}
                          </Link>
                          <CodBadge status={item.status} />
                          <StatusBadge status={item.shipment.status} />
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <p className="data-label">{t('shipments.detail.receiver')}</p>
                            <p className="mt-1 data-value">
                              {item.shipment.receiver.firstname} {item.shipment.receiver.lastname}
                            </p>
                          </div>
                          <div>
                            <p className="data-label">{t('shipments.detail.destination')}</p>
                            <p className="mt-1 data-value">{item.branch.branchName}</p>
                          </div>
                          <div>
                            <p className="data-label">{t('cod.expected')}</p>
                            <p className="mt-1 data-value">{formatCurrency(item.expectedAmount, item.currency)}</p>
                          </div>
                          <div>
                            <p className="data-label">{t('cod.actual')}</p>
                            <p className="mt-1 data-value">
                              {item.collectedAmount !== null
                                ? formatCurrency(item.collectedAmount, item.currency)
                                : t('common.none')}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>{t('cod.createdAt')} {formatDate(item.createdAt)}</span>
                          {item.discrepancyNote && <span>{item.discrepancyNote}</span>}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {item.status === 'pending' && (
                          <div className="surface-muted p-4">
                            {/* UX-18: Open collect Sheet instead of inline form */}
                            <Button
                              size="lg"
                              className="h-11 w-full rounded-xl"
                              onClick={() => {
                                setCollectingItem(item)
                                setCollectAmount(String(item.expectedAmount))
                                setNote(item.discrepancyNote ?? '')
                              }}
                            >
                              {t('cod.recordCollection')}
                            </Button>
                          </div>
                        )}

                        {(item.status === 'collected' || item.status === 'pending_transfer') && (
                          <div className="surface-muted p-4">
                            <Button size="lg" variant="outline" className="h-11 w-full rounded-xl" onClick={() => transfer(item.id)}>
                              {t('cod.confirmTransfer')}
                            </Button>
                          </div>
                        )}

                        {item.status === 'transferred' && (
                          <div className="surface-muted p-4 text-sm text-muted-foreground">
                            {item.transferredAt ? formatDate(item.transferredAt) : t('status.cod_transferred')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* UX-18: COD collect Sheet/Drawer */}
      <Sheet open={collectingItem !== null} onOpenChange={(open) => { if (!open) { setCollectingItem(null); setCollectAmount(''); setNote('') } }}>
        <SheetContent side="bottom" className="rounded-t-[1.5rem] px-5 pb-8 pt-6">
          <SheetHeader className="mb-5">
            <SheetTitle>{t('cod.recordCollection')}</SheetTitle>
            {collectingItem && (
              <SheetDescription className="text-sm text-muted-foreground">
                {collectingItem.shipment.trackingNo} · {formatCurrency(collectingItem.expectedAmount, collectingItem.currency)}
              </SheetDescription>
            )}
          </SheetHeader>
          {collectingItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('cod.actualAmount')}</label>
                <Input
                  type="number"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('cod.discrepancyNote')}</label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="rounded-xl"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  size="lg"
                  className="h-12 flex-1 rounded-xl"
                  onClick={() => collect(collectingItem.id, collectingItem.expectedAmount)}
                >
                  {t('common.confirm')}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl px-5"
                  onClick={() => { setCollectingItem(null); setCollectAmount(''); setNote('') }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
