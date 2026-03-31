'use client'

import { cn } from '@/lib/utils'
import type { ShipmentStatus, CodStatus } from '@/types'
import { useI18n } from '@/lib/i18n'

const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  received: 'status.received',
  in_transit: 'status.in_transit',
  arrived_hub: 'status.arrived_hub',
  out_for_delivery: 'status.out_for_delivery',
  delivered: 'status.delivered',
  failed_delivery: 'status.failed_delivery',
  return_in_transit: 'status.return_in_transit',
  returned: 'status.returned',
  cancelled: 'status.cancelled',
}

const COD_STATUS_LABELS: Record<CodStatus, string> = {
  pending: 'status.cod_pending',
  collected: 'status.cod_collected',
  pending_transfer: 'status.cod_pending_transfer',
  transferred: 'status.cod_transferred',
  cancelled: 'status.cod_cancelled',
}

interface StatusBadgeProps {
  status: ShipmentStatus
  className?: string
}

interface CodBadgeProps {
  status: CodStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useI18n()
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        `status-${status}`,
        className
      )}
    >
      {t(SHIPMENT_STATUS_LABELS[status])}
    </span>
  )
}

export function CodBadge({ status, className }: CodBadgeProps) {
  const { t } = useI18n()
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        `cod-${status}`,
        className
      )}
    >
      {t(COD_STATUS_LABELS[status])}
    </span>
  )
}
