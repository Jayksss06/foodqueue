export type Role = 'CUSTOMER' | 'TENANT' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type TenantStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
export type MenuStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'OUT_OF_STOCK';
export type SlotStatus = 'OPEN' | 'CLOSED';
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'REFUNDED'
  | 'NO_SHOW';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED';
export type PaymentMethod = 'QRIS' | 'EWALLET' | 'VIRTUAL_ACCOUNT';
export type NotificationType = 'ORDER' | 'PAYMENT' | 'REVIEW' | 'SYSTEM';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  sessionVersion: number;
  tenantId?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
}

export interface CartItemView {
  id: string;
  menuId: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
  notes?: string | null;
  stock: number;
  isAvailable: boolean;
  priceChanged: boolean;
  currentPrice: number;
  subtotal: number;
}

export interface CartView {
  id: string;
  tenantId: string | null;
  tenantName: string | null;
  items: CartItemView[];
  subtotal: number;
  fee: number;
  total: number;
  itemCount: number;
  hasUnavailableItems: boolean;
  hasPriceChanges: boolean;
}

export interface SlotAvailability {
  slotId?: string;
  date: string; // YYYY-MM-DD
  startAt: string; // ISO
  endAt: string; // ISO
  startTimeLabel: string; // "11:30"
  endTimeLabel: string; // "11:45"
  capacity: number;
  currentOrders: number;
  remainingCapacity: number;
  isAvailable: boolean;
  reason?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
