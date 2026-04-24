import { prisma } from '@/lib/prisma'

type AuditAction =
  | 'USER_CREATED' | 'USER_UPDATED' | 'USER_DEACTIVATED'
  | 'SHIPMENT_CREATED' | 'SHIPMENT_STATUS_CHANGED' | 'SHIPMENT_CANCELLED' | 'SHIPMENT_PRICE_MANUAL'
  | 'COD_COLLECTED' | 'COD_TRANSFERRED' | 'COD_DISCREPANCY'
  | 'BRANCH_CREATED' | 'BRANCH_UPDATED'
  | 'PRICE_CONFIG_CREATED' | 'PRICE_CONFIG_UPDATED'
  | 'LOGIN' | 'LOGIN_FAILED' | 'LOGOUT'

export async function writeAuditLog(
  userId: string,
  action: AuditAction,
  entityType: string,
  entityId: string,
  oldData?: object | null,
  newData?: object | null,
  ipAddress?: string
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      oldData: oldData ?? undefined,
      newData: newData ?? undefined,
      ipAddress: ipAddress ?? null,
    },
  })
}
