export type UserRole = 'admin' | 'manager' | 'staff'
export type UserStatus = 'active' | 'inactive'
export type ShipmentStatus =
  | 'received'
  | 'in_transit'
  | 'arrived'
  | 'delivered'
  | 'failed_delivery'
  | 'returned'
  | 'cancelled'
export type CodStatus = 'pending' | 'collected' | 'pending_transfer' | 'transferred' | 'cancelled'
export type Country = 'TH' | 'LA'
export type Currency = 'THB' | 'LAK'
export type PriceType = 'calculated' | 'manual'
export type ShippingPartner = 'internal' | 'thailand_post' | 'lao_post' | 'flash' | 'jnt' | 'kerry' | 'other'

// ── Auth ──────────────────────────────────────────────────────────────────
export interface SessionUser {
  id: string
  email: string
  firstname: string
  lastname: string
  role: UserRole
  branchId: string | null
  branchName: string | null
  iat?: number
  exp?: number
}

// ── API Response Wrapper ──────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: Pagination
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// ── Domain Types ──────────────────────────────────────────────────────────
export interface BranchDto {
  id: string
  branchName: string
  country: Country
  currency: Currency
  location: string | null
  tel: string | null
  isActive: boolean
}

export interface UserDto {
  id: string
  firstname: string
  lastname: string
  email: string
  role: UserRole
  status: UserStatus
  branchId: string | null
  branch: { branchName: string } | null
  createdAt: string
}

export interface ShipmentListItem {
  id: string
  trackingNo: string
  status: ShipmentStatus
  sender: { firstname: string; lastname: string; phone: string }
  receiver: { firstname: string; lastname: string; phone: string }
  originBranch: { branchName: string; country: Country }
  destinationBranch: { branchName: string; country: Country }
  weightKg: number
  price: number
  currency: Currency
  codAmount: number
  createdAt: string
}

export interface ShipmentDetail extends ShipmentListItem {
  itemDescription: string | null
  dimensions: string | null
  photoPath: string | null
  priceType: PriceType
  manualPriceNote: string | null
  externalTrackingNo: string | null
  shippingPartner: string | null
  deliveryAttempts: number
  events: ShipmentEventDto[]
  cod: CodTransactionDto | null
}

export interface ShipmentEventDto {
  id: string
  eventType: string
  status: ShipmentStatus | null
  location: string | null
  note: string | null
  createdAt: string
  performedBy: { firstname: string; lastname: string }
}

export interface CodTransactionDto {
  id: string
  status: CodStatus
  currency: Currency
  expectedAmount: number
  collectedAmount: number | null
  discrepancyNote: string | null
  collectedAt: string | null
  transferredAt: string | null
}

// ── Forms ─────────────────────────────────────────────────────────────────
export interface ShipmentCreateInput {
  senderId?: string
  senderFirstname: string
  senderLastname: string
  senderPhone: string
  senderAddress?: string
  receiverId?: string
  receiverFirstname: string
  receiverLastname: string
  receiverPhone: string
  receiverAddress?: string
  originBranchId: string
  destinationBranchId: string
  weightKg: number
  itemDescription?: string
  codAmount?: number
  priceType: 'calculated' | 'manual'
  manualPrice?: number
  manualPriceNote?: string
  externalTrackingNo?: string
  shippingPartner?: ShippingPartner
}
