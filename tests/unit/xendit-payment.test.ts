import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  XenditPaymentProvider,
  verifyXenditCallbackToken,
  parseXenditWebhookPayload,
} from '@/server/providers/payment/xendit-payment-provider';
import {
  getXenditMode,
  isSimulationAllowed,
  assertSimulationAllowed,
} from '@/server/providers/payment/payment-config';
import { getActivePaymentProvider } from '@/server/providers/payment/payment-provider.factory';
import {
  normalizeIndonesianPhoneToE164,
  sanitizeVaDisplayName,
} from '@/server/providers/payment/payment-channels';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe('Xendit Callback Token Verification', () => {
  it('accepts exact matching token in constant time', () => {
    expect(verifyXenditCallbackToken('xnd-webhook-secret-123', 'xnd-webhook-secret-123')).toBe(true);
  });

  it('rejects mismatched, empty, or missing tokens', () => {
    expect(verifyXenditCallbackToken('wrong-token', 'xnd-webhook-secret-123')).toBe(false);
    expect(verifyXenditCallbackToken('', 'xnd-webhook-secret-123')).toBe(false);
    expect(verifyXenditCallbackToken(null, 'xnd-webhook-secret-123')).toBe(false);
    expect(verifyXenditCallbackToken('xnd-webhook-secret-123', '')).toBe(false);
  });
});

describe('Xendit Webhook Payload Parser', () => {
  it('parses v3 payment.capture event into PAID action', () => {
    const parsed = parseXenditWebhookPayload({
      event: 'payment.capture',
      business_id: 'biz-123',
      created: '2026-11-24T10:00:00Z',
      data: {
        payment_id: 'py-abc-123',
        payment_request_id: 'pr-xyz-789',
        reference_id: 'FQ-2026-00001-QRIS-AB12CD',
        request_amount: 39000,
        channel_code: 'QRIS',
        status: 'SUCCEEDED',
        captures: [{ capture_id: 'cptr-001', capture_amount: 39000 }],
        metadata: { order_id: 'ord_123' },
      },
    });

    expect(parsed.action).toBe('PAID');
    expect(parsed.paymentRequestId).toBe('pr-xyz-789');
    expect(parsed.gatewayPaymentId).toBe('py-abc-123');
    expect(parsed.referenceId).toBe('FQ-2026-00001-QRIS-AB12CD');
    expect(parsed.orderIdFromMetadata).toBe('ord_123');
    expect(parsed.amount).toBe(39000);
    expect(parsed.eventId).toBe('cptr-001');
  });

  it('parses v2 payment.succeeded event into PAID action', () => {
    const parsed = parseXenditWebhookPayload({
      event: 'payment.succeeded',
      data: {
        id: 'py-v2-001',
        payment_request_id: 'pr-v2-999',
        reference_id: 'FQ-2026-00002',
        amount: 25000,
        status: 'SUCCEEDED',
      },
    });

    expect(parsed.action).toBe('PAID');
    expect(parsed.paymentRequestId).toBe('pr-v2-999');
    expect(parsed.amount).toBe(25000);
  });

  it('parses payment.failure and payment_request.expiry events', () => {
    const failed = parseXenditWebhookPayload({
      event: 'payment.failure',
      data: {
        payment_id: 'py-fail-1',
        payment_request_id: 'pr-fail-1',
        failure_code: 'INSUFFICIENT_BALANCE',
        status: 'FAILED',
      },
    });
    expect(failed.action).toBe('FAILED');
    expect(failed.failureCode).toBe('INSUFFICIENT_BALANCE');

    const expired = parseXenditWebhookPayload({
      event: 'payment_request.expiry',
      data: {
        payment_request_id: 'pr-exp-1',
        reference_id: 'FQ-2026-00003',
        status: 'EXPIRED',
      },
    });
    expect(expired.action).toBe('EXPIRED');
    expect(expired.paymentRequestId).toBe('pr-exp-1');
  });

  it('parses refund.succeeded and refund.failed events', () => {
    const refunded = parseXenditWebhookPayload({
      event: 'refund.succeeded',
      data: {
        id: 'rfd-123',
        payment_request_id: 'pr-123',
        amount: 39000,
        status: 'SUCCEEDED',
      },
    });
    expect(refunded.action).toBe('REFUND_SUCCEEDED');
    expect(refunded.refundId).toBe('rfd-123');
  });
});

describe('XenditPaymentProvider Core API v3', () => {
  const testCreds = {
    secretKey: 'xnd_development_test_secret_key',
    webhookToken: 'test-webhook-token',
    apiBaseUrl: 'https://api.xendit.co',
    apiVersion: '2024-11-11',
    mode: 'SANDBOX' as const,
  };

  it('creates QRIS charge with v3 headers and generates local QR data URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          payment_request_id: 'pr-qris-001',
          reference_id: 'FQ-2026-00010-QRIS-123456',
          status: 'REQUIRES_ACTION',
          actions: [
            {
              type: 'PRESENT_TO_CUSTOMER',
              descriptor: 'QR_STRING',
              value: '00020101021226680016ID.CO.QRIS.WWW0118936009143000000000303UMI',
            },
          ],
        }),
    });

    const provider = new XenditPaymentProvider(testCreds, mockFetch as unknown as typeof fetch);
    const charge = await provider.createCharge({
      orderId: 'ord_1',
      orderNumber: 'FQ-2026-00010',
      externalReference: 'FQ-2026-00010-QRIS-123456',
      amount: 39000,
      method: 'QRIS',
      channelCode: 'QRIS',
      customerName: 'Rina Kartika',
      customerEmail: 'rina@mahasiswa.ac.id',
      expiresAt: new Date('2026-11-24T12:00:00Z'),
      returnUrls: {
        successUrl: 'https://foodqueue.id/orders/ord_1?payment=success',
        failureUrl: 'https://foodqueue.id/orders/ord_1/pay?payment=failed',
      },
      subAccountId: 'sub_acc_tenant_01',
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.xendit.co/v3/payment_requests');
    expect(init.method).toBe('POST');
    expect(init.headers['api-version']).toBe('2024-11-11');
    expect(init.headers['for-user-id']).toBe('sub_acc_tenant_01');
    expect(init.headers.Authorization).toMatch(/^Basic /);

    const body = JSON.parse(init.body);
    expect(body.channel_code).toBe('QRIS');
    expect(body.request_amount).toBe(39000);
    expect(body.currency).toBe('IDR');
    expect(body.country).toBe('ID');

    expect(charge.transactionReference).toBe('pr-qris-001');
    expect(charge.qrPayload).toContain('ID.CO.QRIS');
    expect(charge.qrImageDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('creates Virtual Account charge with sanitized display name and extracts VA number', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          payment_request_id: 'pr-va-001',
          reference_id: 'FQ-2026-00011-BCA_VIRTUAL_ACCOUNT-ABCDEF',
          status: 'REQUIRES_ACTION',
          actions: [
            {
              type: 'PRESENT_TO_CUSTOMER',
              descriptor: 'VIRTUAL_ACCOUNT_NUMBER',
              value: '3901081234567890',
            },
          ],
        }),
    });

    const provider = new XenditPaymentProvider(testCreds, mockFetch as unknown as typeof fetch);
    const charge = await provider.createCharge({
      orderId: 'ord_2',
      orderNumber: 'FQ-2026-00011',
      externalReference: 'FQ-2026-00011-BCA_VIRTUAL_ACCOUNT-ABCDEF',
      amount: 55000,
      method: 'VIRTUAL_ACCOUNT',
      channelCode: 'BCA_VIRTUAL_ACCOUNT',
      customerName: 'Dr. Eko Prasetyo, M.T.',
      customerEmail: 'eko@kampus.ac.id',
      expiresAt: new Date('2026-11-24T12:00:00Z'),
      returnUrls: {
        successUrl: 'https://foodqueue.id/orders/ord_2',
        failureUrl: 'https://foodqueue.id/orders/ord_2/pay',
      },
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.channel_code).toBe('BCA_VIRTUAL_ACCOUNT');
    expect(body.channel_properties.display_name).toBe('FoodQueue Dr Eko Prasetyo M T');
    expect(charge.vaNumber).toBe('3901081234567890');
  });

  it('creates E-Wallet charge with normalized E.164 phone for OVO and extracts redirect URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          payment_request_id: 'pr-ew-001',
          reference_id: 'FQ-2026-00012-OVO-112233',
          status: 'REQUIRES_ACTION',
          actions: [
            {
              type: 'REDIRECT_CUSTOMER',
              descriptor: 'WEB_URL',
              value: 'https://checkout.xendit.co/web/ovo-demo',
            },
          ],
        }),
    });

    const provider = new XenditPaymentProvider(testCreds, mockFetch as unknown as typeof fetch);
    const charge = await provider.createCharge({
      orderId: 'ord_3',
      orderNumber: 'FQ-2026-00012',
      externalReference: 'FQ-2026-00012-OVO-112233',
      amount: 21000,
      method: 'EWALLET',
      channelCode: 'OVO',
      customerName: 'Budi Prakoso',
      customerEmail: 'budi@mahasiswa.ac.id',
      customerPhone: '081377770002',
      expiresAt: new Date('2026-11-24T12:00:00Z'),
      returnUrls: {
        successUrl: 'https://foodqueue.id/orders/ord_3?payment=success',
        failureUrl: 'https://foodqueue.id/orders/ord_3/pay?payment=failed',
      },
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.channel_code).toBe('OVO');
    expect(body.customer.mobile_number).toBe('+6281377770002');
    expect(charge.checkoutUrl).toBe('https://checkout.xendit.co/web/ovo-demo');
  });

  it('requires phone number for OVO e-wallet', async () => {
    const provider = new XenditPaymentProvider(testCreds, vi.fn() as unknown as typeof fetch);
    await expect(
      provider.createCharge({
        orderId: 'ord_4',
        orderNumber: 'FQ-2026-00013',
        externalReference: 'FQ-2026-00013-OVO-445566',
        amount: 21000,
        method: 'EWALLET',
        channelCode: 'OVO',
        customerName: 'Tanpa Nomor',
        customerEmail: 'guest@foodqueue.id',
        customerPhone: null,
        expiresAt: new Date('2026-11-24T12:00:00Z'),
        returnUrls: {
          successUrl: 'https://foodqueue.id/orders/ord_4',
          failureUrl: 'https://foodqueue.id/orders/ord_4/pay',
        },
      })
    ).rejects.toThrow(/Nomor HP akun OVO wajib diisi/);
  });

  it('returns MANUAL_REQUIRED for Virtual Account refund and calls /refunds for QRIS', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id: 'rfd-qris-999',
          status: 'SUCCEEDED',
        }),
    });

    const provider = new XenditPaymentProvider(testCreds, mockFetch as unknown as typeof fetch);

    const vaRefund = await provider.refund({
      referenceId: 'RFD-VA-1',
      transactionReference: 'pr-va-001',
      amount: 55000,
      channelCode: 'BCA_VIRTUAL_ACCOUNT',
    });
    expect(vaRefund.status).toBe('MANUAL_REQUIRED');
    expect(mockFetch).not.toHaveBeenCalled();

    const qrisRefund = await provider.refund({
      referenceId: 'RFD-QRIS-1',
      transactionReference: 'pr-qris-001',
      amount: 39000,
      channelCode: 'QRIS',
    });
    expect(qrisRefund.status).toBe('SUCCESS');
    expect(qrisRefund.refundId).toBe('rfd-qris-999');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.xendit.co/refunds',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('Production Guard & Payment Environment Config', () => {
  it('detects Sandbox vs Production Xendit API key modes', () => {
    expect(getXenditMode('xnd_production_abc123')).toBe('PRODUCTION');
    expect(getXenditMode('xnd_development_abc123')).toBe('SANDBOX');
    expect(getXenditMode('')).toBe('UNCONFIGURED');
  });

  it('automatically disables simulation in production and in Xendit mode', () => {
    (process.env as any).NODE_ENV = 'development';
    process.env.PAYMENT_PROVIDER = 'MOCK';
    process.env.ENABLE_PAYMENT_SIMULATION = 'true';
    expect(isSimulationAllowed()).toBe(true);

    // Switching to XENDIT disables simulation even in local development
    process.env.PAYMENT_PROVIDER = 'XENDIT';
    expect(isSimulationAllowed()).toBe(false);
    expect(() => assertSimulationAllowed()).toThrow(/FORBIDDEN/);

    // NODE_ENV=production ALWAYS disables simulation and blocks MOCK provider
    (process.env as any).NODE_ENV = 'production';
    process.env.PAYMENT_PROVIDER = 'MOCK';
    process.env.ENABLE_PAYMENT_SIMULATION = 'true';
    expect(isSimulationAllowed()).toBe(false);
    expect(() => getActivePaymentProvider()).toThrow(/PAYMENT_CONFIG_ERROR/);
  });

  it('normalizes Indonesian phones and VA display names properly', () => {
    expect(normalizeIndonesianPhoneToE164('0812-3456-7890')).toBe('+6281234567890');
    expect(normalizeIndonesianPhoneToE164('6281234567890')).toBe('+6281234567890');
    expect(normalizeIndonesianPhoneToE164('+6281234567890')).toBe('+6281234567890');
    expect(sanitizeVaDisplayName('Ibu Hj. Siti Sari!')).toBe('FoodQueue Ibu Hj Siti Sari');
  });
});
