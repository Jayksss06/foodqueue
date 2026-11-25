import {
  PaymentChannelCode,
  PaymentMethod,
  PaymentProviderName,
  PaymentStatus,
} from '@/types';

export interface CreateChargeRequest {
  orderId: string;
  orderNumber: string;
  externalReference: string;
  amount: number;
  method: PaymentMethod;
  channelCode: PaymentChannelCode;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  expiresAt: Date;
  returnUrls: {
    successUrl: string;
    failureUrl: string;
  };
  /** Opsional untuk ekspansi xenPlatform split payment per tenant di masa depan */
  subAccountId?: string | null;
}

export interface CreateChargeResponse {
  transactionReference: string;
  externalReference: string;
  provider: PaymentProviderName;
  channelCode: PaymentChannelCode;
  status: Extract<PaymentStatus, 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'>;
  qrPayload?: string;
  qrImageDataUrl?: string;
  vaNumber?: string;
  vaAccountName?: string;
  checkoutUrl?: string;
  deeplinkUrl?: string;
  expiresAt: string;
  instructions: string[];
  rawResponse?: unknown;
}

export interface ChargeStatusResponse {
  transactionReference: string;
  gatewayPaymentId?: string;
  status: Extract<PaymentStatus, 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'>;
  paidAmount?: number;
  rawResponse?: unknown;
}

export interface CancelChargeResponse {
  cancelled: boolean;
  message: string;
}

export interface RefundRequest {
  referenceId: string;
  transactionReference: string;
  amount: number;
  channelCode?: string | null;
  reason?: string;
}

export interface RefundResponse {
  refundId: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'MANUAL_REQUIRED';
  message: string;
  rawResponse?: unknown;
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createCharge(req: CreateChargeRequest): Promise<CreateChargeResponse>;
  getChargeStatus(transactionReference: string): Promise<ChargeStatusResponse>;
  cancelCharge(transactionReference: string): Promise<CancelChargeResponse>;
  refund(req: RefundRequest): Promise<RefundResponse>;
}
