import { PaymentMethod } from '@/types';

export interface CreateChargeRequest {
  orderId: string;
  orderNumber: string;
  amount: number;
  method: PaymentMethod;
  customerName: string;
  customerEmail: string;
}

export interface CreateChargeResponse {
  transactionReference: string;
  provider: string;
  qrPayload?: string; // Untuk QRIS
  vaNumber?: string; // Untuk Virtual Account
  instructions: string[];
}

export interface RefundRequest {
  transactionReference: string;
  amount: number;
  reason?: string;
}

export interface RefundResponse {
  refundId: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  message: string;
}

export interface PaymentProvider {
  createCharge(req: CreateChargeRequest): Promise<CreateChargeResponse>;
  refund(req: RefundRequest): Promise<RefundResponse>;
}
