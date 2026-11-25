import crypto from 'crypto';
import QRCode from 'qrcode';
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
  isDirectRefundSupportedChannel,
  normalizeIndonesianPhoneToE164,
  sanitizeVaDisplayName,
} from './payment-channels';
import { getXenditCredentials, XenditCredentials } from './payment-config';

interface XenditAction {
  type?: string;
  action?: string;
  descriptor?: string;
  value?: string;
  url?: string;
}

interface XenditPaymentRequestResponse {
  payment_request_id?: string;
  id?: string;
  reference_id?: string;
  status?: string;
  request_amount?: number;
  amount?: number;
  channel_code?: string;
  actions?: XenditAction[];
  failure_code?: string;
  latest_payment_id?: string;
}

export type NormalizedWebhookAction =
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUND_SUCCEEDED'
  | 'REFUND_FAILED'
  | 'IGNORED';

export interface ParsedXenditWebhookEvent {
  action: NormalizedWebhookAction;
  eventName: string;
  eventId: string;
  paymentRequestId?: string;
  referenceId?: string;
  gatewayPaymentId?: string;
  orderIdFromMetadata?: string;
  amount?: number;
  channelCode?: string;
  failureCode?: string;
  refundId?: string;
  rawPayload: unknown;
}

/**
 * Verifikasi header x-callback-token Xendit secara constant-time untuk mencegah timing attack.
 */
export function verifyXenditCallbackToken(
  receivedToken: string | null | undefined,
  expectedToken: string | null | undefined
): boolean {
  if (!receivedToken || !expectedToken) {
    return false;
  }

  const receivedDigest = crypto.createHash('sha256').update(receivedToken.trim()).digest();
  const expectedDigest = crypto.createHash('sha256').update(expectedToken.trim()).digest();

  return crypto.timingSafeEqual(receivedDigest, expectedDigest);
}

/**
 * Normalisasi payload webhook Xendit (mendukung Payments API v3 dan kompatibilitas v2).
 */
export function parseXenditWebhookPayload(rawPayload: unknown): ParsedXenditWebhookEvent {
  if (!rawPayload || typeof rawPayload !== 'object') {
    throw new Error('BAD_REQUEST: Payload webhook Xendit tidak valid.');
  }

  const envelope = rawPayload as Record<string, any>;
  const eventName = String(envelope.event || '').trim();
  const data = (envelope.data && typeof envelope.data === 'object' ? envelope.data : envelope) as Record<string, any>;

  const paymentRequestId =
    typeof data.payment_request_id === 'string' && data.payment_request_id
      ? data.payment_request_id
      : undefined;

  const gatewayPaymentId =
    typeof data.payment_id === 'string' && data.payment_id
      ? data.payment_id
      : typeof data.id === 'string' && data.id.startsWith('py-')
        ? data.id
        : undefined;

  const referenceId =
    typeof data.reference_id === 'string' && data.reference_id ? data.reference_id : undefined;

  const refundId =
    typeof data.refund_id === 'string' && data.refund_id
      ? data.refund_id
      : typeof data.id === 'string' && data.id.startsWith('rfd-')
        ? data.id
        : undefined;

  const metadata =
    data.metadata && typeof data.metadata === 'object'
      ? (data.metadata as Record<string, any>)
      : undefined;
  const orderIdFromMetadata =
    typeof metadata?.order_id === 'string' && metadata.order_id ? metadata.order_id : undefined;

  const firstCapture = Array.isArray(data.captures) ? data.captures[0] : undefined;
  const rawAmount =
    firstCapture?.capture_amount ?? data.request_amount ?? data.amount ?? undefined;
  const amount = typeof rawAmount === 'number' && Number.isFinite(rawAmount) ? Math.round(rawAmount) : undefined;

  const channelCode =
    typeof data.channel_code === 'string' && data.channel_code ? data.channel_code : undefined;
  const failureCode =
    typeof data.failure_code === 'string' && data.failure_code ? data.failure_code : undefined;

  const captureId = typeof firstCapture?.capture_id === 'string' ? firstCapture.capture_id : undefined;
  const statusUpper = String(data.status || '').toUpperCase();

  let action: NormalizedWebhookAction = 'IGNORED';
  const normalizedEvent = eventName.toLowerCase();

  if (
    normalizedEvent === 'payment.capture' ||
    normalizedEvent === 'payment.succeeded' ||
    (normalizedEvent === '' && statusUpper === 'SUCCEEDED')
  ) {
    action = 'PAID';
  } else if (
    normalizedEvent === 'payment.failure' ||
    normalizedEvent === 'payment.failed' ||
    (normalizedEvent === '' && statusUpper === 'FAILED')
  ) {
    action = 'FAILED';
  } else if (
    normalizedEvent === 'payment_request.expiry' ||
    normalizedEvent === 'payment.expiry' ||
    (normalizedEvent === '' && statusUpper === 'EXPIRED')
  ) {
    action = 'EXPIRED';
  } else if (normalizedEvent === 'refund.succeeded') {
    action = 'REFUND_SUCCEEDED';
  } else if (normalizedEvent === 'refund.failed') {
    action = 'REFUND_FAILED';
  }

  const eventId =
    captureId ||
    (gatewayPaymentId ? `${normalizedEvent || statusUpper}:${gatewayPaymentId}` : undefined) ||
    (refundId ? `${normalizedEvent || statusUpper}:${refundId}` : undefined) ||
    `${normalizedEvent || 'event'}:${paymentRequestId || referenceId || 'unknown'}:${envelope.created || ''}`;

  return {
    action,
    eventName: eventName || statusUpper || 'UNKNOWN',
    eventId,
    paymentRequestId,
    referenceId,
    gatewayPaymentId,
    orderIdFromMetadata,
    amount,
    channelCode,
    failureCode,
    refundId,
    rawPayload,
  };
}

function mapXenditStatus(status?: string): 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' {
  switch ((status || '').toUpperCase()) {
    case 'SUCCEEDED':
      return 'PAID';
    case 'EXPIRED':
      return 'EXPIRED';
    case 'FAILED':
    case 'CANCELED':
    case 'CANCELLED':
      return 'FAILED';
    default:
      return 'PENDING';
  }
}

function mapXenditErrorMessage(status: number, body: any): string {
  const errorCode = String(body?.error_code || '').toUpperCase();
  const rawMessage = typeof body?.message === 'string' ? body.message : '';

  if (status === 401 || errorCode === 'INVALID_API_KEY') {
    return 'PAYMENT_CONFIG_ERROR: XENDIT_SECRET_KEY tidak valid atau tidak memiliki izin Payments API.';
  }
  if (errorCode === 'CHANNEL_NOT_ACTIVATED' || errorCode === 'CHANNEL_UNAVAILABLE') {
    return 'PAYMENT_GATEWAY_ERROR: Metode pembayaran ini belum diaktifkan di akun Xendit atau sedang gangguan. Silakan pilih metode lain.';
  }
  if (errorCode === 'API_VALIDATION_ERROR') {
    return `PAYMENT_GATEWAY_ERROR: Validasi Xendit gagal (${rawMessage || 'periksa data pembayaran'}).`;
  }
  if (errorCode === 'DUPLICATE_ERROR') {
    return 'PAYMENT_GATEWAY_ERROR: Referensi pembayaran duplikat terdeteksi. Silakan muat ulang halaman pembayaran.';
  }
  return `PAYMENT_GATEWAY_ERROR: Gagal menghubungi Xendit (${errorCode || status}): ${rawMessage || 'Terjadi kesalahan pada gateway pembayaran.'}`;
}

export async function renderQrCodeDataUrl(qrPayload: string): Promise<string> {
  return QRCode.toDataURL(qrPayload, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#1C1917',
      light: '#FFFFFF',
    },
  });
}

export class XenditPaymentProvider implements PaymentProvider {
  public readonly name = 'XENDIT' as const;
  private readonly credentials: XenditCredentials;
  private readonly fetchFn: typeof fetch;

  constructor(credentials?: XenditCredentials, fetchFn: typeof fetch = fetch) {
    this.credentials = credentials || getXenditCredentials();
    this.fetchFn = fetchFn;
  }

  private getAuthHeader(): string {
    if (!this.credentials.secretKey) {
      throw new Error(
        'PAYMENT_CONFIG_ERROR: XENDIT_SECRET_KEY belum dikonfigurasi pada environment variables.'
      );
    }
    const encoded = Buffer.from(`${this.credentials.secretKey}:`).toString('base64');
    return `Basic ${encoded}`;
  }

  private async request<T>(
    path: string,
    options: {
      method: 'GET' | 'POST';
      body?: Record<string, unknown>;
      subAccountId?: string | null;
      includeApiVersion?: boolean;
    }
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: this.getAuthHeader(),
      'Content-Type': 'application/json',
    };

    if (options.includeApiVersion !== false) {
      headers['api-version'] = this.credentials.apiVersion;
    }

    if (options.subAccountId) {
      headers['for-user-id'] = options.subAccountId;
    }

    const res = await this.fetchFn(`${this.credentials.apiBaseUrl}${path}`, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(15000),
    });

    const text = await res.text();
    let parsed: any = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = { message: text };
    }

    if (!res.ok) {
      throw new Error(mapXenditErrorMessage(res.status, parsed));
    }

    return parsed as T;
  }

  public async createCharge(req: CreateChargeRequest): Promise<CreateChargeResponse> {
    const expiresAtIso = req.expiresAt.toISOString();
    const vaAccountName = sanitizeVaDisplayName(req.customerName);
    const normalizedPhone = normalizeIndonesianPhoneToE164(req.customerPhone);

    const payload: Record<string, unknown> = {
      reference_id: req.externalReference,
      type: 'PAY',
      country: 'ID',
      currency: 'IDR',
      request_amount: req.amount,
      capture_method: 'AUTOMATIC',
      channel_code: req.channelCode,
      description: `Pembayaran FoodQueue #${req.orderNumber}`,
      metadata: {
        order_id: req.orderId,
        order_number: req.orderNumber,
        payment_method: req.method,
      },
    };

    if (req.method === 'QRIS') {
      payload.channel_properties = {
        expires_at: expiresAtIso,
      };
    } else if (req.method === 'VIRTUAL_ACCOUNT') {
      payload.channel_properties = {
        display_name: vaAccountName,
        expires_at: expiresAtIso,
      };
    } else if (req.method === 'EWALLET') {
      if (req.channelCode === 'OVO' && !normalizedPhone) {
        throw new Error(
          'BAD_REQUEST: Nomor HP akun OVO wajib diisi (contoh: 081234567890).'
        );
      }

      payload.channel_properties = {
        success_return_url: req.returnUrls.successUrl,
        failure_return_url: req.returnUrls.failureUrl,
      };

      const nameParts = req.customerName.trim().split(/\s+/);
      const givenNames = nameParts[0] || 'Pelanggan';
      const surname = nameParts.slice(1).join(' ') || undefined;

      payload.customer = {
        reference_id: `cust-${req.orderId}`,
        type: 'INDIVIDUAL',
        individual_detail: {
          given_names: givenNames,
          ...(surname ? { surname } : {}),
        },
        email: req.customerEmail,
        ...(normalizedPhone ? { mobile_number: normalizedPhone } : {}),
      };
    }

    const data = await this.request<XenditPaymentRequestResponse>('/v3/payment_requests', {
      method: 'POST',
      body: payload,
      subAccountId: req.subAccountId,
      includeApiVersion: true,
    });

    const transactionReference = data.payment_request_id || data.id;
    if (!transactionReference) {
      throw new Error(
        'PAYMENT_GATEWAY_ERROR: Respons Xendit tidak menyertakan payment_request_id.'
      );
    }

    const actions = Array.isArray(data.actions) ? data.actions : [];
    let qrPayload: string | undefined;
    let vaNumber: string | undefined;
    let checkoutUrl: string | undefined;
    let deeplinkUrl: string | undefined;

    for (const action of actions) {
      const descriptor = String(action.descriptor || action.action || '').toUpperCase();
      const actionType = String(action.type || '').toUpperCase();
      const value = action.value || action.url;
      if (!value) continue;

      if (descriptor === 'QR_STRING') {
        qrPayload = value;
      } else if (descriptor === 'VIRTUAL_ACCOUNT_NUMBER' || descriptor === 'PAYMENT_CODE') {
        vaNumber = value;
      } else if (descriptor === 'DEEPLINK_URL' || descriptor === 'DEEP_LINK_CHECKOUT') {
        deeplinkUrl = value;
      } else if (
        descriptor === 'WEB_URL' ||
        descriptor === 'MOBILE_WEB_URL' ||
        descriptor === 'DESKTOP_WEB_URL' ||
        descriptor === 'WEB_CHECKOUT' ||
        actionType === 'REDIRECT_CUSTOMER'
      ) {
        if (!checkoutUrl) {
          checkoutUrl = value;
        }
      } else if (actionType === 'PRESENT_TO_CUSTOMER') {
        if (req.method === 'QRIS' && !qrPayload) {
          qrPayload = value;
        } else if (req.method === 'VIRTUAL_ACCOUNT' && !vaNumber) {
          vaNumber = value;
        }
      }
    }

    let qrImageDataUrl: string | undefined;
    if (qrPayload) {
      qrImageDataUrl = await renderQrCodeDataUrl(qrPayload);
    }

    const instructions = buildPaymentInstructions(req.channelCode, {
      vaNumber,
      amount: req.amount,
      vaAccountName,
    });

    return {
      transactionReference,
      externalReference: data.reference_id || req.externalReference,
      provider: this.name,
      channelCode: req.channelCode,
      status: mapXenditStatus(data.status),
      qrPayload,
      qrImageDataUrl,
      vaNumber,
      vaAccountName: req.method === 'VIRTUAL_ACCOUNT' ? vaAccountName : undefined,
      checkoutUrl,
      deeplinkUrl,
      expiresAt: expiresAtIso,
      instructions,
      rawResponse: data,
    };
  }

  public async getChargeStatus(transactionReference: string): Promise<ChargeStatusResponse> {
    const data = await this.request<XenditPaymentRequestResponse>(
      `/v3/payment_requests/${encodeURIComponent(transactionReference)}`,
      {
        method: 'GET',
        includeApiVersion: true,
      }
    );

    return {
      transactionReference: data.payment_request_id || data.id || transactionReference,
      gatewayPaymentId: data.latest_payment_id,
      status: mapXenditStatus(data.status),
      paidAmount:
        typeof data.request_amount === 'number'
          ? Math.round(data.request_amount)
          : typeof data.amount === 'number'
            ? Math.round(data.amount)
            : undefined,
      rawResponse: data,
    };
  }

  public async cancelCharge(transactionReference: string): Promise<CancelChargeResponse> {
    try {
      await this.request<Record<string, unknown>>(
        `/v3/payment_requests/${encodeURIComponent(transactionReference)}/cancel`,
        {
          method: 'POST',
          includeApiVersion: true,
        }
      );

      return {
        cancelled: true,
        message: `Payment request ${transactionReference} berhasil dibatalkan di Xendit.`,
      };
    } catch (err: any) {
      return {
        cancelled: false,
        message: err?.message || 'Payment request tidak perlu atau gagal dibatalkan di Xendit.',
      };
    }
  }

  public async refund(req: RefundRequest): Promise<RefundResponse> {
    // Virtual Account tidak mendukung direct refund API di Xendit
    if (!isDirectRefundSupportedChannel(req.channelCode)) {
      return {
        refundId: `MANUAL-REFUND-${req.referenceId}`,
        status: 'MANUAL_REQUIRED',
        message:
          'Channel Virtual Account tidak mendukung refund otomatis via API Xendit. Refund dicatat untuk diproses manual/disbursement oleh Admin.',
      };
    }

    try {
      const data = await this.request<Record<string, any>>('/refunds', {
        method: 'POST',
        includeApiVersion: false,
        body: {
          reference_id: req.referenceId,
          payment_request_id: req.transactionReference,
          currency: 'IDR',
          amount: req.amount,
          reason: 'CANCELLATION',
          metadata: {
            note: req.reason || 'FoodQueue order refund',
          },
        },
      });

      const statusUpper = String(data?.status || '').toUpperCase();
      const mappedStatus: RefundResponse['status'] =
        statusUpper === 'SUCCEEDED'
          ? 'SUCCESS'
          : statusUpper === 'PENDING'
            ? 'PENDING'
            : 'FAILED';

      return {
        refundId: String(data?.id || req.referenceId),
        status: mappedStatus,
        message:
          mappedStatus === 'SUCCESS'
            ? `Pengembalian dana Rp ${req.amount.toLocaleString('id-ID')} via Xendit berhasil.`
            : mappedStatus === 'PENDING'
              ? `Pengembalian dana Rp ${req.amount.toLocaleString('id-ID')} sedang diproses oleh Xendit.`
              : `Pengembalian dana via Xendit gagal (${data?.failure_code || 'UNKNOWN'}).`,
        rawResponse: data,
      };
    } catch (err: any) {
      return {
        refundId: `MANUAL-REFUND-${req.referenceId}`,
        status: 'MANUAL_REQUIRED',
        message: `Refund otomatis Xendit gagal (${err?.message || 'error'}). Memerlukan tindak lanjut manual Admin.`,
      };
    }
  }
}
