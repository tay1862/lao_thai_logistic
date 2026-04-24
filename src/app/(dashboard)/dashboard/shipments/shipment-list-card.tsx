'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/status-badge'
import { Icon } from '@/components/ui/icon'
import { useI18n } from '@/lib/i18n'

type ShipmentRow = {
  id: string
  trackingNo: string
  status: string
  currency: string
  price: number
  codAmount: number
  weightKg: number
  createdAt: Date
  externalTrackingNo: string | null
  shippingPartner: string | null
  sender: { firstname: string; lastname: string; phone: string }
  receiver: { firstname: string; lastname: string; phone: string }
  originBranch: { branchName: string }
  destinationBranch: { branchName: string; country: string }
}

interface Props {
  shipment: ShipmentRow
}

export function ShipmentListCard({ shipment }: Props) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="list-card overflow-hidden px-4 py-3 sm:px-5 sm:py-4">
      {/* Mobile compact row — always visible */}
      <div className="flex items-center gap-3 sm:hidden">
        <button
          type="button"
          aria-label="Expand shipment details"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 min-w-0 items-center gap-3 text-left"
          data-testid="shipment-card-expand"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="mono-tracking text-sm font-semibold text-foreground truncate">{shipment.trackingNo}</span>
              <StatusBadge status={shipment.status as Parameters<typeof StatusBadge>[0]['status']} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground truncate">
              {shipment.receiver.firstname} {shipment.receiver.lastname} · {shipment.destinationBranch.branchName}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatCurrency(shipment.price, shipment.currency as 'THB' | 'LAK')}
              {shipment.codAmount > 0 && ` · COD ${formatCurrency(shipment.codAmount, shipment.currency as 'THB' | 'LAK')}`}
            </p>
          </div>
          <Icon
            id={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            className="shrink-0 text-muted-foreground"
          />
        </button>
        <Link
          href={`/dashboard/shipments/${shipment.id}`}
          aria-label="Open shipment detail"
          className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-white text-muted-foreground"
        >
          <Icon id="chevron-right" size={14} />
        </Link>
      </div>

      {/* Mobile expanded detail */}
      {expanded && (
        <div className="mt-3 sm:hidden border-t border-border/60 pt-3 space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="data-label">{t('shipments.detail.sender')}</p>
              <p className="mt-1 data-value">{shipment.sender.firstname} {shipment.sender.lastname}</p>
              <p className="text-xs text-muted-foreground">{shipment.sender.phone}</p>
            </div>
            <div>
              <p className="data-label">{t('tracking.route')}</p>
              <p className="mt-1 data-value">{shipment.originBranch.branchName} → {shipment.destinationBranch.branchName}</p>
              <p className="text-xs text-muted-foreground">{shipment.weightKg} kg</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{formatDate(shipment.createdAt)}</p>
        </div>
      )}

      {/* Desktop full row */}
      <Link
        href={`/dashboard/shipments/${shipment.id}`}
        className="hidden sm:block"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono-tracking text-foreground">{shipment.trackingNo}</span>
              <StatusBadge status={shipment.status as Parameters<typeof StatusBadge>[0]['status']} />
              {shipment.codAmount > 0 && (
                <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  COD {formatCurrency(shipment.codAmount, shipment.currency as 'THB' | 'LAK')}
                </span>
              )}
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="data-label">{t('shipments.detail.sender')}</p>
                <p className="mt-1 data-value">{shipment.sender.firstname} {shipment.sender.lastname}</p>
                <p className="mt-1 text-sm text-muted-foreground">{shipment.sender.phone}</p>
              </div>
              <div>
                <p className="data-label">{t('shipments.detail.receiver')}</p>
                <p className="mt-1 data-value">{shipment.receiver.firstname} {shipment.receiver.lastname}</p>
                <p className="mt-1 text-sm text-muted-foreground">{shipment.receiver.phone}</p>
              </div>
              <div>
                <p className="data-label">{t('tracking.route')}</p>
                <p className="mt-1 data-value">{shipment.originBranch.branchName} → {shipment.destinationBranch.branchName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{shipment.weightKg} kg</p>
              </div>
              <div>
                <p className="data-label">{t('shipments.detail.shippingPartner')}</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {shipment.shippingPartner ? t(`partners.${shipment.shippingPartner}`) : t('shipments.form.noPartner')}
                </p>
                {shipment.externalTrackingNo && (
                  <p className="mt-1 text-xs text-muted-foreground">{shipment.externalTrackingNo}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 lg:block lg:text-right">
            <div>
              <p className="text-lg font-semibold text-foreground">
                {formatCurrency(shipment.price, shipment.currency as 'THB' | 'LAK')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(shipment.createdAt)}</p>
            </div>
            <span className="mt-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-white text-muted-foreground">
              <Icon id="chevron-right" size={16} />
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}
