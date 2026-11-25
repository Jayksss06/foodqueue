import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { PaymentChannelCode, PaymentMethod, UserSession } from '@/types';
import {
  getDefaultChannelForMethod,
  getChannelLabel,
  isChannelValidForMethod,
} from '../providers/payment/payment-channels';
import {
  assertSimulationAllowed,
  getAppBaseUrl,
  getPaymentRuntimeConfig,
  getXenditCredentials,
} from '../providers/payment/payment-config';
import {
  getActivePaymentProvider,
  getPaymentProviderByName,
} from '../providers/payment/payment-provider.factory';
import {
  parseXenditWebhookPayload,
  renderQrCodeDataUrl,
  verifyXenditCallbackToken,
} from '../providers/payment/xendit-payment-provider';
import { OrderService } from './order.service';
import { NotificationService } from './notification.service';

interface StoredPaymentData {
  qrPayload?: string;
  vaNumber?: string;
  vaAccountName?: string;
  checkoutUrl?: string;
  deeplinkUrl?: string;
  instructions?: string[];
  expiresAt?: string;
}

export class PaymentService {
  /**
   * Menginisialisasi atau mengambil ulang instruksi pembayaran untuk pesanan PENDING_PAYMENT.
   * Mendukung Registered User & Guest Token serta reuse charge idempoten.
   */
  public static async initiatePayment(
    auth: { user?: UserSession | null; guestToken?: string | null } | UserSession,
    orderId: string,
    method: PaymentMethod,
    options?: {
      channelCode?: PaymentChannelCode;
      customerPhone?: string;
      forceRefresh?: boolean;
    }
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        tenant: { select: { id: true, name: true, ownerId: true } },
        user: { select: { phone: true } },
      },
    });

    if (!order) {
      throw new Error('NOT_FOUND: Pesanan tidak ditemukan.');
    }

    const sessionUser = 'role' in auth ? auth : auth.user;
    const guestToken = 'role' in auth ? null : auth.guestToken;

    const isAuthorized =
      (sessionUser && order.userId === sessionUser.id) ||
      (guestToken && order.isGuest && order.guestToken === guestToken);

    if (!isAuthorized) {
      throw new Error('NOT_FOUND: Pesanan tidak ditemukan.');
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw new Error(
        `ORDER_NOT_PAYABLE: Pesanan tidak dalam status menunggu pembayaran (status: ${order.status}).`
      );
    }

    const now = new Date();
    if (order.expiresAt && order.expiresAt <= now) {
      throw new Error('ORDER_EXPIRED: Batas waktu pembayaran telah habis. Silakan buat pesanan baru.');
    }

    const resolvedChannelCode = options?.channelCode || getDefaultChannelForMethod(method);
    if (!isChannelValidForMethod(method, resolvedChannelCode)) {
      throw new Error(
        `BAD_REQUEST: Channel '${resolvedChannelCode}' tidak sesuai dengan metode pembayaran '${method}'.`
      );
    }

    const provider = getActivePaymentProvider();
    const runtime = getPaymentRuntimeConfig();
    const existingPayment = order.payment;
    const storedData = (existingPayment?.paymentData || null) as StoredPaymentData | null;

    // Reuse active payment request agar refresh halaman tidak membuat charge ganda di Xendit
    const canReuseExisting =
      !options?.forceRefresh &&
      existingPayment &&
      existingPayment.status === 'PENDING' &&
      existingPayment.provider === provider.name &&
      existingPayment.method === method &&
      existingPayment.channelCode === resolvedChannelCode &&
      Boolean(existingPayment.transactionReference) &&
      Boolean(storedData) &&
      (!existingPayment.expiresAt || existingPayment.expiresAt > now) &&
      // Untuk OVO yang mengubah nomor HP, buat charge baru jika forceRefresh atau belum ada data
      (resolvedChannelCode !== 'OVO' || !options?.customerPhone);

    if (canReuseExisting && existingPayment && storedData) {
      const qrImageDataUrl = storedData.qrPayload
        ? await renderQrCodeDataUrl(storedData.qrPayload)
        : undefined;

      return {
        payment: existingPayment,
        charge: {
          transactionReference: existingPayment.transactionReference!,
          externalReference: existingPayment.externalReference || existingPayment.transactionReference!,
          provider: existingPayment.provider,
          channelCode: resolvedChannelCode,
          status: existingPayment.status,
          qrPayload: storedData.qrPayload,
          qrImageDataUrl,
          vaNumber: storedData.vaNumber,
          vaAccountName: storedData.vaAccountName,
          checkoutUrl: storedData.checkoutUrl,
          deeplinkUrl: storedData.deeplinkUrl,
          expiresAt: (existingPayment.expiresAt || order.expiresAt || now).toISOString(),
          instructions: storedData.instructions || [],
        },
        reused: true,
        runtime,
      };
    }

    // Jika sebelumnya sudah pernah dibuat charge berbeda di gateway, batalkan charge lama (best-effort)
    if (
      existingPayment &&
      existingPayment.status === 'PENDING' &&
      existingPayment.transactionReference
    ) {
      try {
        const previousProvider = getPaymentProviderByName(existingPayment.provider, false);
        await previousProvider.cancelCharge(existingPayment.transactionReference);
      } catch (cancelErr) {
        console.warn('[PaymentService] Gagal membatalkan charge lama:', cancelErr);
      }
    }

    const customerName = sessionUser?.name || order.guestName || 'Pelanggan FoodQueue';
    const customerEmail =
      sessionUser?.email ||
      (order.guestPhone ? `${order.guestPhone.replace(/\D/g, '')}@guest.foodqueue.id` : 'guest@foodqueue.id');
    const customerPhone =
      options?.customerPhone?.trim() ||
      order.guestPhone ||
      order.user?.phone ||
      sessionUser?.phone ||
      null;

    const appBaseUrl = getAppBaseUrl();
    const tokenQuery = order.isGuest && order.guestToken ? `token=${encodeURIComponent(order.guestToken)}` : '';
    const successUrl = `${appBaseUrl}/orders/${order.id}${tokenQuery ? `?${tokenQuery}&payment=success` : '?payment=success'}`;
    const failureUrl = `${appBaseUrl}/orders/${order.id}/pay${tokenQuery ? `?${tokenQuery}&payment=failed` : '?payment=failed'}`;

    const chargeExpiresAt =
      order.expiresAt || new Date(now.getTime() + OrderService.PAYMENT_TIMEOUT_MINUTES * 60 * 1000);
    const shortSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const externalReference = `${order.orderNumber}-${resolvedChannelCode}-${shortSuffix}`;

    const charge = await provider.createCharge({
      orderId: order.id,
      orderNumber: order.orderNumber,
      externalReference,
      amount: order.total,
      method,
      channelCode: resolvedChannelCode,
      customerName,
      customerEmail,
      customerPhone,
      expiresAt: chargeExpiresAt,
      returnUrls: {
        successUrl,
        failureUrl,
      },
    });

    const paymentDataToStore: StoredPaymentData = {
      qrPayload: charge.qrPayload,
      vaNumber: charge.vaNumber,
      vaAccountName: charge.vaAccountName,
      checkoutUrl: charge.checkoutUrl,
      deeplinkUrl: charge.deeplinkUrl,
      instructions: charge.instructions,
      expiresAt: charge.expiresAt,
    };

    const payment = await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        amount: order.total,
        method,
        channelCode: resolvedChannelCode,
        provider: charge.provider,
        status: 'PENDING',
        transactionReference: charge.transactionReference,
        externalReference: charge.externalReference,
        paymentData: paymentDataToStore as any,
        expiresAt: chargeExpiresAt,
      },
      update: {
        method,
        channelCode: resolvedChannelCode,
        provider: charge.provider,
        status: 'PENDING',
        transactionReference: charge.transactionReference,
        externalReference: charge.externalReference,
        paymentData: paymentDataToStore as any,
        expiresAt: chargeExpiresAt,
      },
    });

    await prisma.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        status: 'PENDING',
        method,
        channelCode: resolvedChannelCode,
        message: `Inisialisasi pembayaran ${getChannelLabel(resolvedChannelCode, method)} melalui ${charge.provider}.`,
        rawResponse: charge.rawResponse ? (charge.rawResponse as any) : undefined,
      },
    });

    return {
      payment,
      charge: {
        ...charge,
        rawResponse: undefined, // Jangan kirim raw gateway dump ke frontend
      },
      reused: false,
      runtime,
    };
  }

  /**
   * Sinkronisasi status pembayaran secara aktif ke Xendit (fallback jika webhook sempat tertunda).
   */
  public static async syncPaymentStatus(
    auth: { user?: UserSession | null; guestToken?: string | null } | UserSession,
    orderId: string
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        tenant: { select: { id: true, name: true, ownerId: true } },
      },
    });

    if (!order) {
      throw new Error('NOT_FOUND: Pesanan tidak ditemukan.');
    }

    const sessionUser = 'role' in auth ? auth : auth.user;
    const guestToken = 'role' in auth ? null : auth.guestToken;

    const isAuthorized =
      (sessionUser &&
        (order.userId === sessionUser.id ||
          sessionUser.role === 'ADMIN' ||
          (sessionUser.role === 'TENANT' && sessionUser.tenantId === order.tenantId))) ||
      (guestToken && order.isGuest && order.guestToken === guestToken);

    if (!isAuthorized) {
      throw new Error('NOT_FOUND: Pesanan tidak ditemukan.');
    }

    if (order.status !== 'PENDING_PAYMENT' || !order.payment) {
      return {
        synced: true,
        orderStatus: order.status,
        paymentStatus: order.payment?.status || null,
        paid: order.payment?.status === 'PAID',
      };
    }

    // Jika order sudah lewat expiresAt namun belum dieksekusi cron, cek dulu ke gateway bila Xendit
    if (order.payment.provider !== 'XENDIT' || !order.payment.transactionReference) {
      return {
        synced: false,
        orderStatus: order.status,
        paymentStatus: order.payment.status,
        paid: false,
      };
    }

    const provider = getPaymentProviderByName(order.payment.provider, false);
    const remote = await provider.getChargeStatus(order.payment.transactionReference);

    if (remote.status === 'PAID') {
      if (remote.paidAmount !== undefined && remote.paidAmount !== order.payment.amount) {
        throw new Error(
          `PAYMENT_AMOUNT_MISMATCH: Nominal gateway (${remote.paidAmount}) tidak cocok dengan tagihan (${order.payment.amount}).`
        );
      }

      const settled = await this.settleOrderPayment({
        paymentId: order.payment.id,
        orderId: order.id,
        gatewayPaymentId: remote.gatewayPaymentId,
        providerEventId: remote.gatewayPaymentId
          ? `sync:${remote.gatewayPaymentId}`
          : `sync:${order.payment.transactionReference}`,
        note: `Pembayaran ${getChannelLabel(order.payment.channelCode, order.payment.method)} terkonfirmasi via sinkronisasi Xendit.`,
        rawResponse: remote.rawResponse,
      });

      return {
        synced: true,
        orderStatus: settled.orderStatus,
        paymentStatus: 'PAID',
        paid: true,
      };
    }

    if (remote.status === 'EXPIRED') {
      await this.markPaymentExpired(
        order.payment.id,
        order.id,
        order.payment.transactionReference,
        `sync-expired:${order.payment.transactionReference}`,
        remote.rawResponse
      );
      return {
        synced: true,
        orderStatus: 'CANCELLED',
        paymentStatus: 'EXPIRED',
        paid: false,
      };
    }

    if (remote.status === 'FAILED') {
      await prisma.payment.updateMany({
        where: { id: order.payment.id, status: 'PENDING' },
        data: { status: 'FAILED' },
      });
      return {
        synced: true,
        orderStatus: order.status,
        paymentStatus: 'FAILED',
        paid: false,
      };
    }

    return {
      synced: true,
      orderStatus: order.status,
      paymentStatus: order.payment.status,
      paid: false,
    };
  }

  /**
   * Memproses webhook resmi dari Xendit dengan verifikasi x-callback-token,
   * validasi nominal, serta idempotency guard penuh.
   */
  public static async handleXenditWebhook(
    rawPayload: unknown,
    callbackToken: string | null | undefined
  ) {
    const creds = getXenditCredentials();
    if (!creds.webhookToken) {
      throw new Error(
        'PAYMENT_CONFIG_ERROR: XENDIT_WEBHOOK_TOKEN belum dikonfigurasi pada server.'
      );
    }

    if (!verifyXenditCallbackToken(callbackToken, creds.webhookToken)) {
      throw new Error('UNAUTHORIZED: Token verifikasi webhook Xendit tidak valid.');
    }

    const event = parseXenditWebhookPayload(rawPayload);

    if (event.action === 'IGNORED') {
      return {
        received: true,
        processed: false,
        reason: `Event '${event.eventName}' diabaikan.`,
      };
    }

    // Cari record Payment berdasarkan transactionReference (payment_request_id), externalReference, atau metadata.order_id
    const lookupConditions: any[] = [];
    if (event.paymentRequestId) {
      lookupConditions.push({ transactionReference: event.paymentRequestId });
    }
    if (event.referenceId) {
      lookupConditions.push({ externalReference: event.referenceId });
    }
    if (event.orderIdFromMetadata) {
      lookupConditions.push({ orderId: event.orderIdFromMetadata });
    }

    if (lookupConditions.length === 0) {
      return {
        received: true,
        processed: false,
        reason: 'Payload webhook tidak menyertakan referensi pembayaran yang dikenali.',
      };
    }

    const payment = await prisma.payment.findFirst({
      where: { OR: lookupConditions },
      include: {
        order: {
          include: {
            tenant: { select: { id: true, name: true, ownerId: true } },
          },
        },
      },
    });

    if (!payment) {
      console.warn('[Xendit Webhook] Payment record tidak ditemukan untuk event:', {
        eventName: event.eventName,
        paymentRequestId: event.paymentRequestId,
        referenceId: event.referenceId,
      });
      return {
        received: true,
        processed: false,
        reason: 'PAYMENT_NOT_FOUND',
      };
    }

    // Cek idempotency berdasarkan providerEventId
    const existingAttempt = await prisma.paymentAttempt.findFirst({
      where: {
        paymentId: payment.id,
        providerEventId: event.eventId,
      },
      select: { id: true },
    });

    if (existingAttempt) {
      return {
        received: true,
        processed: false,
        duplicate: true,
        paymentId: payment.id,
      };
    }

    if (event.action === 'PAID') {
      if (event.amount !== undefined && event.amount !== payment.amount) {
        await prisma.paymentAttempt.create({
          data: {
            paymentId: payment.id,
            status: 'FAILED',
            method: payment.method,
            channelCode: event.channelCode || payment.channelCode,
            providerEventId: event.eventId,
            message: `ANOMALY: Nominal webhook Rp ${event.amount} tidak sesuai tagihan Rp ${payment.amount}.`,
            rawResponse: event.rawPayload as any,
          },
        });
        throw new Error(
          `PAYMENT_AMOUNT_MISMATCH: Nominal pembayaran tidak cocok (expected ${payment.amount}, got ${event.amount}).`
        );
      }

      const settled = await this.settleOrderPayment({
        paymentId: payment.id,
        orderId: payment.orderId,
        gatewayPaymentId: event.gatewayPaymentId,
        providerEventId: event.eventId,
        channelCode: event.channelCode || payment.channelCode,
        note: `Pembayaran ${getChannelLabel(event.channelCode || payment.channelCode, payment.method)} berhasil diverifikasi via webhook Xendit.`,
        rawResponse: event.rawPayload,
      });

      return {
        received: true,
        processed: true,
        action: 'PAID',
        paymentId: payment.id,
        orderId: payment.orderId,
        orderStatus: settled.orderStatus,
        alreadyPaid: settled.alreadyPaid,
      };
    }

    if (event.action === 'FAILED') {
      await prisma.paymentAttempt.create({
        data: {
          paymentId: payment.id,
          status: 'FAILED',
          method: payment.method,
          channelCode: event.channelCode || payment.channelCode,
          providerEventId: event.eventId,
          message: `Pembayaran gagal di Xendit (${event.failureCode || event.eventName}).`,
          rawResponse: event.rawPayload as any,
        },
      });

      // Hanya ubah ke FAILED jika masih PENDING dan ini adalah payment_request aktif terbaru
      if (
        payment.status === 'PENDING' &&
        (!event.paymentRequestId || payment.transactionReference === event.paymentRequestId)
      ) {
        await prisma.payment.updateMany({
          where: { id: payment.id, status: 'PENDING' },
          data: { status: 'FAILED' },
        });
      }

      return {
        received: true,
        processed: true,
        action: 'FAILED',
        paymentId: payment.id,
      };
    }

    if (event.action === 'EXPIRED') {
      // Cegah expiry charge lama (misal user ganti dari QRIS ke VA) membatalkan charge aktif baru!
      if (event.paymentRequestId && payment.transactionReference !== event.paymentRequestId) {
        await prisma.paymentAttempt.create({
          data: {
            paymentId: payment.id,
            status: 'EXPIRED',
            method: payment.method,
            channelCode: event.channelCode || payment.channelCode,
            providerEventId: event.eventId,
            message: `Charge lama (${event.paymentRequestId}) kedaluwarsa; charge aktif (${payment.transactionReference}) tetap berlaku.`,
            rawResponse: event.rawPayload as any,
          },
        });
        return {
          received: true,
          processed: false,
          reason: 'SUPERSEDED_CHARGE_EXPIRED',
        };
      }

      await this.markPaymentExpired(
        payment.id,
        payment.orderId,
        payment.transactionReference,
        event.eventId,
        event.rawPayload
      );

      return {
        received: true,
        processed: true,
        action: 'EXPIRED',
        paymentId: payment.id,
      };
    }

    if (event.action === 'REFUND_SUCCEEDED') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
        },
      });

      await prisma.paymentAttempt.create({
        data: {
          paymentId: payment.id,
          status: 'REFUNDED',
          method: payment.method,
          channelCode: payment.channelCode,
          providerEventId: event.eventId,
          message: `Refund ${event.refundId || ''} berhasil dikonfirmasi oleh Xendit.`,
          rawResponse: event.rawPayload as any,
        },
      });

      return {
        received: true,
        processed: true,
        action: 'REFUND_SUCCEEDED',
        paymentId: payment.id,
      };
    }

    if (event.action === 'REFUND_FAILED') {
      await prisma.paymentAttempt.create({
        data: {
          paymentId: payment.id,
          status: 'FAILED',
          method: payment.method,
          channelCode: payment.channelCode,
          providerEventId: event.eventId,
          message: `Refund ${event.refundId || ''} gagal di Xendit (${event.failureCode || 'UNKNOWN'}). Perlu tindakan manual Admin.`,
          rawResponse: event.rawPayload as any,
        },
      });

      await this.notifyAdmins(
        'Refund Xendit Gagal',
        `Refund untuk pesanan #${payment.order.orderNumber} gagal (${event.failureCode || 'UNKNOWN'}). Mohon proses pengembalian dana manual.`,
        `/admin/orders`
      );

      return {
        received: true,
        processed: true,
        action: 'REFUND_FAILED',
        paymentId: payment.id,
      };
    }

    return { received: true, processed: false };
  }

  /**
   * Penyelesaian pembayaran secara idempoten (digunakan oleh Webhook Xendit & Active Sync).
   */
  private static async settleOrderPayment(params: {
    paymentId: string;
    orderId: string;
    gatewayPaymentId?: string;
    providerEventId: string;
    channelCode?: string | null;
    note: string;
    rawResponse?: unknown;
  }) {
    const now = new Date();

    // Conditional atomic update mencegah double-settlement saat webhook + sync datang bersamaan
    const claimed = await prisma.payment.updateMany({
      where: {
        id: params.paymentId,
        status: { not: 'PAID' },
      },
      data: {
        status: 'PAID',
        paidAt: now,
        ...(params.gatewayPaymentId ? { gatewayPaymentId: params.gatewayPaymentId } : {}),
        ...(params.channelCode ? { channelCode: params.channelCode } : {}),
      },
    });

    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: {
        payment: true,
        tenant: { select: { id: true, name: true, ownerId: true } },
      },
    });

    if (!order) {
      throw new Error('NOT_FOUND: Pesanan tidak ditemukan saat settlement.');
    }

    if (claimed.count === 0) {
      return {
        alreadyPaid: true,
        orderStatus: order.status,
      };
    }

    await prisma.paymentAttempt.create({
      data: {
        paymentId: params.paymentId,
        status: 'PAID',
        method: order.payment?.method,
        channelCode: params.channelCode || order.payment?.channelCode,
        providerEventId: params.providerEventId,
        message: params.note,
        rawResponse: params.rawResponse ? (params.rawResponse as any) : undefined,
      },
    });

    // Normal case: pesanan masih menunggu pembayaran
    if (order.status === 'PENDING_PAYMENT') {
      const updatedOrder = await OrderService.changeOrderStatus(
        { id: 'SYSTEM', role: 'SYSTEM' },
        order.id,
        'PAID',
        params.note
      );

      await NotificationService.createNotification(
        order.tenant.ownerId,
        'Pesanan Baru Masuk!',
        `Pesanan #${order.orderNumber} telah dibayar (Rp ${order.total.toLocaleString('id-ID')}). Harap segera konfirmasi.`,
        'ORDER',
        `/tenant/orders`
      );

      return {
        alreadyPaid: false,
        orderStatus: updatedOrder.status,
      };
    }

    // Edge-case race condition: pembayaran masuk tepat setelah pesanan kedaluwarsa/dibatalkan
    await prisma.paymentAttempt.create({
      data: {
        paymentId: params.paymentId,
        status: 'PAID',
        method: order.payment?.method,
        channelCode: params.channelCode || order.payment?.channelCode,
        message: `LATE_PAYMENT_AFTER_CANCEL: Dana diterima setelah pesanan berstatus ${order.status}. Memerlukan rekonsiliasi/refund Admin.`,
      },
    });

    await this.notifyAdmins(
      'Pembayaran Terlambat (Perlu Rekonsiliasi)',
      `Dana Rp ${order.total.toLocaleString('id-ID')} masuk untuk pesanan #${order.orderNumber} yang sudah berstatus ${order.status}. Mohon periksa untuk refund.`,
      `/admin/orders`
    );

    return {
      alreadyPaid: false,
      orderStatus: order.status,
    };
  }

  private static async markPaymentExpired(
    paymentId: string,
    orderId: string,
    transactionReference: string | null,
    providerEventId: string,
    rawResponse?: unknown
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment || payment.status === 'PAID') return;

    await prisma.payment.updateMany({
      where: { id: paymentId, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    });

    await prisma.paymentAttempt.create({
      data: {
        paymentId,
        status: 'EXPIRED',
        method: payment.method,
        channelCode: payment.channelCode,
        providerEventId,
        message: `Pembayaran ${transactionReference || ''} kedaluwarsa di gateway.`,
        rawResponse: rawResponse ? (rawResponse as any) : undefined,
      },
    });

    if (payment.order.status === 'PENDING_PAYMENT') {
      try {
        await OrderService.changeOrderStatus(
          { id: 'SYSTEM', role: 'SYSTEM' },
          orderId,
          'CANCELLED',
          'Waktu pembayaran kedaluwarsa di gateway pembayaran.'
        );
      } catch (err) {
        console.warn('[PaymentService] Order sudah berubah status saat expiry webhook:', err);
      }
    }
  }

  private static async notifyAdmins(title: string, message: string, link: string) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', status: 'ACTIVE' },
        select: { id: true },
      });
      await Promise.all(
        admins.map((admin) =>
          NotificationService.createNotification(admin.id, title, message, 'PAYMENT', link)
        )
      );
    } catch (err) {
      console.error('[PaymentService] Gagal mengirim notifikasi ke Admin:', err);
    }
  }

  /**
   * Mensimulasikan hasil pembayaran (HANYA diizinkan di local development saat PAYMENT_PROVIDER=MOCK).
   */
  public static async simulatePaymentOutcome(
    auth: { user?: UserSession | null; guestToken?: string | null } | UserSession,
    orderId: string,
    outcome: 'SUCCESS' | 'FAILURE'
  ) {
    // HARD GUARD: Dilarang di production atau saat provider Xendit aktif
    assertSimulationAllowed();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        tenant: { select: { id: true, name: true, ownerId: true } },
      },
    });

    if (!order) {
      throw new Error('NOT_FOUND: Pesanan tidak ditemukan.');
    }

    const sessionUser = 'role' in auth ? auth : auth.user;
    const guestToken = 'role' in auth ? null : auth.guestToken;

    const isAuthorized =
      (sessionUser && order.userId === sessionUser.id) ||
      (guestToken && order.isGuest && order.guestToken === guestToken);

    if (!isAuthorized) {
      throw new Error('NOT_FOUND: Pesanan tidak ditemukan.');
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw new Error(
        `ORDER_NOT_PAYABLE: Pesanan sudah berstatus ${order.status}. Tidak dapat membayar ulang.`
      );
    }

    if (order.expiresAt && order.expiresAt < new Date()) {
      throw new Error('ORDER_EXPIRED: Batas waktu pembayaran telah habis.');
    }

    if (!order.payment) {
      throw new Error('BAD_REQUEST: Record pembayaran belum diinisialisasi.');
    }

    if (order.payment.provider !== 'MOCK') {
      throw new Error(
        'FORBIDDEN: Simulasi hanya berlaku untuk transaksi dengan Mock Payment Provider.'
      );
    }

    const now = new Date();

    if (outcome === 'SUCCESS') {
      await prisma.paymentAttempt.create({
        data: {
          paymentId: order.payment.id,
          status: 'PAID',
          method: order.payment.method,
          channelCode: order.payment.channelCode,
          message: 'Simulasi pembayaran sukses (Local Dev Mock).',
        },
      });

      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          status: 'PAID',
          paidAt: now,
        },
      });

      const updatedOrder = await OrderService.changeOrderStatus(
        { id: sessionUser?.id || null, role: 'CUSTOMER' },
        order.id,
        'PAID',
        'Pembayaran simulasi berhasil diverifikasi.'
      );

      await NotificationService.createNotification(
        order.tenant.ownerId,
        'Pesanan Baru Masuk!',
        `Pesanan #${order.orderNumber} telah dibayar (Rp ${order.total.toLocaleString('id-ID')}). Harap segera konfirmasi.`,
        'ORDER',
        `/tenant/orders`
      );

      return {
        success: true,
        status: 'PAID',
        order: updatedOrder,
      };
    } else {
      await prisma.paymentAttempt.create({
        data: {
          paymentId: order.payment.id,
          status: 'FAILED',
          method: order.payment.method,
          channelCode: order.payment.channelCode,
          message: 'Simulasi pembayaran ditolak atau gagal verifikasi.',
        },
      });

      return {
        success: false,
        status: 'FAILED',
        message: 'Simulasi pembayaran gagal. Saldo tidak mencukupi atau transaksi dibatalkan.',
      };
    }
  }
}
