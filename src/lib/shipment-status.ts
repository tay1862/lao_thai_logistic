import type { ShipmentStatus } from '@prisma/client'

/**
 * Valid transitions for the shipment state machine.
 * Key = current status → Value = allowed next statuses
 */
export const ALLOWED_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  received:            ['in_transit', 'cancelled'],
  in_transit:          ['arrived_hub'],
  arrived_hub:         ['out_for_delivery'],
  out_for_delivery:    ['delivered', 'failed_delivery'],
  failed_delivery:     ['out_for_delivery', 'return_in_transit'],
  return_in_transit:   ['returned'],
  delivered:           [],
  returned:            [],
  cancelled:           [],
}

export function canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to)
}

export const MAX_DELIVERY_ATTEMPTS = 3
