import type { ShipmentStatus } from '@prisma/client'

/**
 * Valid transitions for the shipment state machine.
 * Key = current status → Value = allowed next statuses
 *
 * Flow: received → in_transit → arrived → delivered
 *                                        → failed_delivery → arrived (retry)
 *                                                          → returned
 */
export const ALLOWED_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  received:       ['in_transit', 'cancelled'],
  in_transit:     ['arrived'],
  arrived:        ['delivered', 'failed_delivery'],
  failed_delivery:['arrived', 'returned'],
  delivered:      [],
  returned:       [],
  cancelled:      [],
}

export function canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to)
}

export const MAX_DELIVERY_ATTEMPTS = 3
