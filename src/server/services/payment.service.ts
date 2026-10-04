import { prisma } from '@/lib/prisma';
import { UserSession, PaymentMethod } from '@/types';
import { defaultPaymentProvider } from '../providers/payment/mock-payment-provider';
import { OrderService } from './order.service';
import { NotificationService } from './notification.service';

export class PaymentService {
  /**
   * Menginisialisasi pembayaran untuk pesanan PENDING_PAYMENT
   */
  public static async initiatePayment(
    user: UserSession,
    orderId: string,
    method: PaymentMethod
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        tenant: { select: { id: true, name: true, ownerId: true } },
      },
    });

    if (!order || order.userId !== user.id) {
      throw new Error('NOT_FOUND: Pesanan tidak ditemukan.');
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw new Error(`ORDER_NOT_PAYABLE: Pesanan tidak dalam status menunggu pembayaran (status: ${order.status}).`);
    }

    if (order.expiresAt && order.expiresAt < new Date()) {
      throw new Error('ORDER_EXPIRED: Batas waktu pembayaran telah habis. Silakan buat pesanan baru.');
    }

    // Panggil payment provider abstraction (Mock / Midtrans / Xendit)
    const charge = await defaultPaymentProvider.createCharge({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.total,
      method,
      customerName: user.name,
      customerEmail: user.email,
    });

    // Update payment record di database
    const payment = await prisma.payment.update({
      where: { orderId: order.id },
      data: {
        method,
        transactionReference: charge.transactionReference,
        provider: charge.provider,
      },
    });

    return {
      payment,
      charge,
    };
  }

  /**
   * Mensimulasikan hasil pembayaran (Khusus Mock Provider saat testing/demo)
   */
  public static async simulatePaymentOutcome(
    user: UserSession,
    orderId: string,
    outcome: 'SUCCESS' | 'FAILURE'
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        tenant: { select: { id: true, name: true, ownerId: true } },
      },
    });

    if (!order || order.userId !== user.id) {
      throw new Error('NOT_FOUND: Pesanan tidak ditemukan.');
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw new Error(`Pesanan sudah berstatus ${order.status}. Tidak dapat membayar ulang.`);
    }

    if (order.expiresAt && order.expiresAt < new Date()) {
      throw new Error('ORDER_EXPIRED: Batas waktu pembayaran telah habis.');
    }

    if (!order.payment) {
      throw new Error('Record pembayaran belum diinisialisasi.');
    }

    const now = new Date();

    if (outcome === 'SUCCESS') {
      // 1. Catat attempt sukses
      await prisma.paymentAttempt.create({
        data: {
          paymentId: order.payment.id,
          status: 'PAID',
          method: order.payment.method,
          message: 'Simulasi pembayaran sukses.',
        },
      });

      // 2. Update payment ke PAID
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          status: 'PAID',
          paidAt: now,
        },
      });

      // 3. Ubah status order ke PAID lewat OrderService
      const updatedOrder = await OrderService.changeOrderStatus(
        { id: user.id, role: 'CUSTOMER' },
        order.id,
        'PAID',
        'Pembayaran simulasi berhasil diverifikasi.'
      );

      // 4. Kirim notifikasi ke Tenant
      await NotificationService.createNotification(
        order.tenant.ownerId,
        'Pesanan Baru Masuk! 🔔',
        `Pesanan #${order.orderNumber} telah dibayar (${order.total.toLocaleString('id-ID')}). Harap segera konfirmasi.`,
        'ORDER',
        `/tenant/orders/${order.id}`
      );

      return {
        success: true,
        status: 'PAID',
        order: updatedOrder,
      };
    } else {
      // Catat attempt gagal
      await prisma.paymentAttempt.create({
        data: {
          paymentId: order.payment.id,
          status: 'FAILED',
          method: order.payment.method,
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
