// Enums
export enum UserRole {
  STAFF = 'STAFF',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export enum ShipmentDirection {
  TH_TO_LA = 'TH_TO_LA',
  LA_TO_TH = 'LA_TO_TH',
}

export enum ShipmentStatus {
  CREATED = 'CREATED',
  RECEIVED_AT_ORIGIN = 'RECEIVED_AT_ORIGIN',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED_AT_HUB = 'ARRIVED_AT_HUB',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETURNED = 'RETURNED',
}

export enum ParcelType {
  DOCUMENT = 'DOCUMENT',
  PARCEL = 'PARCEL',
  PACKAGE = 'PACKAGE',
}

export enum CodStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  COLLECTED = 'COLLECTED',
  REMITTED = 'REMITTED',
}

export enum LastMileMethod {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

// User
export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}


// Customer
export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  lineId?: string | null;
  defaultAddress?: string | null;
  points: number;
  createdAt: string;
  updatedAt: string;
}

// Shipment Event
export interface ShipmentEvent {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  location?: string;
  notes?: string;
  createdBy?: User;
  createdById: string;
  createdAt: string;
}

// Shipment Photo
export interface ShipmentPhoto {
  id: string;
  shipmentId: string;
  url: string;
  type?: string;
  notes?: string;
  createdAt: string;
}

// Shipment
export interface Shipment {
  id: string;
  companyTracking: string;
  thaiTracking?: string;
  direction: ShipmentDirection;
  currentStatus: ShipmentStatus;
  parcelType: ParcelType;
  weight: number;
  note?: string;

  // Receiver info (for TH→LA)
  receiverName: string;
  receiverPhone: string;
  receiverAddress?: string;

  // Sender info (for LA→TH)
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;

  // Fees (in LAK)
  crossBorderFee: number;
  domesticFee?: number;
  codAmount?: number;
  codStatus: CodStatus;

  // Last-mile
  lastMileMethod?: LastMileMethod;

  // Relationships
  createdBy?: User;
  createdById: string;
  customer?: Customer;
  customerId?: string | null;
  events?: ShipmentEvent[];
  photos?: ShipmentPhoto[];

  createdAt: string;
  updatedAt: string;
}

// Dashboard Stats
export interface DashboardStats {
  todayShipments: number;
  pendingCOD: number;
  atLaosHub: number;
  inTransit: number;
  delivered: number;
}

// Manager Financial Stats
export interface FinancialStats {
  monthlyShipments: number;
  monthlyDelivered: number;
  pendingCODCount: number;
  totalCODCollected: number;
  totalCODRemitted: number;
  outstandingCOD: number;
}

// Create Shipment DTO
export interface CreateShipmentDTO {
  thaiTracking?: string;
  direction: ShipmentDirection;
  parcelType: ParcelType;
  weight: number;
  note?: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress?: string;
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  crossBorderFee: number;
  domesticFee?: number;
  codAmount?: number;
  customerId?: string;
  photos?: string[];
}

// Update Status DTO
export interface UpdateStatusDTO {
  status: ShipmentStatus;
  location?: string;
  notes?: string;
}

// Update Last-Mile DTO
export interface UpdateLastMileDTO {
  method: LastMileMethod;
}

// Update COD Status DTO
export interface UpdateCodStatusDTO {
  status: CodStatus;
}

// Auth
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Tracking Response (for public)
export interface TrackingResponse {
  companyTracking: string;
  thaiTracking?: string;
  direction: ShipmentDirection;
  currentStatus: ShipmentStatus;
  receiverName: string;
  crossBorderFee: number;
  codAmount?: number;
  total: number;
  events: {
    status: ShipmentStatus;
    location?: string;
    createdAt: string;
    staffName?: string;
  }[];
  photos?: string[];
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Filter/Query
export interface ShipmentFilters {
  status?: ShipmentStatus;
  direction?: ShipmentDirection;
  codStatus?: CodStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  customerId?: string;
}
