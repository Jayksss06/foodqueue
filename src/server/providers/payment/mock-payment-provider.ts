import {
  CancelChargeResponse,
  ChargeStatusResponse,
  CreateChargeRequest,
  CreateChargeResponse,
  PaymentProvider,
  RefundRequest,
  RefundResponse,
} from './payment-provider.interface';
import {
  buildPaymentInstructions,
  sanitizeVaDisplayName,
} from './payment-channels';
import { renderQrCodeDataUrl } from './xendit-payment-provider';

const MOCK_VA_PREFIX: Record<string, string> = {
  BCA_VIRTUAL_ACCOUNT: '3901',
  BNI_VIRTUAL_ACCOUNT: '8808',
  BRI_VIRTUAL_ACCOUNT: '2621',
  MANDIRI_VIRTUAL_ACCOUNT: '8902',
  PERMATA_VIRTUAL_ACCOUNT: '8560',
  BSI_VIRTUAL_ACCOUNT: '9001',
};

export class MockPaymentProvider implements PaymentProvider {
  public readonly name = 'MOCK' as const;

  public async createCharge(req: CreateChargeRequest): Promise<CreateChargeResponse> {
    const reference = `MOCK-PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const expiresAtIso = req.expiresAt.toISOString();
    const vaAccountName = sanitizeVaDisplayName(req.customerName);

    let qrPayload: string | undefined;
    let qrImageDataUrl: string | undefined;
    let vaNumber: string | undefined;
    let checkoutUrl: string | undefined;

    if (req.method === 'QRIS') {
      qrPayload = `00020101021226680016ID.FOODQUEUE.MOCK0118FQ${req.orderNumber}520458125303360540${req.amount}5802ID5913FOODQUEUE KAMPUS6007JAKARTA6304`;
      qrImageDataUrl = await renderQrCodeDataUrl(qrPayload);
    } else if (req.method === 'VIRTUAL_ACCOUNT') {
      const prefix = MOCK_VA_PREFIX[req.channelCode] || '8808';
      vaNumber = `${prefix}${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    } else if (req.method === 'EWALLET') {
      checkoutUrl = req.returnUrls.successUrl;
    }

    const instructions = buildPaymentInstructions(req.channelCode, {
      vaNumber,
      amount: req.amount,
      vaAccountName,
    });

    return {
      transactionReference: reference,
      externalReference: req.externalReference,
      provider: this.name,
      channelCode: req.channelCode,
      status: 'PENDING',
      qrPayload,
      qrImageDataUrl,
      vaNumber,
      vaAccountName: req.method === 'VIRTUAL_ACCOUNT' ? vaAccountName : undefined,
      checkoutUrl,
      expiresAt: expiresAtIso,
      instructions,
    };
  }

  public async getChargeStatus(transactionReference: string): Promise<ChargeStatusResponse> {
    return {
      transactionReference,
      status: 'PENDING',
    };
  }

  public async cancelCharge(transactionReference: string): Promise<CancelChargeResponse> {
    return {
      cancelled: true,
      message: `Simulasi pembatalan transaksi ${transactionReference} berhasil.`,
    };
  }

  public async refund(req: RefundRequest): Promise<RefundResponse> {
    return {
      refundId: `MOCK-REFUND-${Date.now()}`,
      status: 'SUCCESS',
      message: `Simulasi pengembalian dana Rp ${req.amount.toLocaleString('id-ID')} untuk transaksi ${req.transactionReference} berhasil.`,
    };
  }
}

export const defaultPaymentProvider = new MockPaymentProvider();
