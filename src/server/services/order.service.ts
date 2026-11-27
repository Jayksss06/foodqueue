import { prisma } from '@/lib/prisma';
import { UserSession, OrderStatus } from '@/types';
import { OrderStateMachine, ActorRole } from '../domain/order-state-machine';
import { Pricing } from '../domain/pricing';
import { PickupSlotService } from './pickup-slot.service';
import { generatePickupCode, generateUUID } from '@/lib/utils';
import { NotificationService } from './notification.service';
import { SystemSettingService } from './system-setting.service';
import { getConfiguredProviderName } from '../providers/payment/payment-config';
import { getPaymentProviderByName } from '../providers/payment/payment-provider.factory';

export class OrderService {
  public static readonly PAYMENT_TIMEOUT_MINUTES = 15;
  public static readonly MAX_ACTIVE_UNPAID_ORDERS = 3;

  /**
   * Membuat nomor pesanan unik berurutan per tahun: FQ-2026-00001
   */
  private static async getNextOrderNumber(tx: any): Promise<string> {
    const currentYear = new Date().getFullYear();

    const counter = await tx.orderCounter.upsert({
      where: { year: currentYear },
      create: { year: currentYear, lastValue: 1 },
      update: { lastValue: { increment: 1 } },
    });

    const paddedNumber = counter.lastValue.toString().padStart(5, '0');
    return `FQ-${currentYear}-${paddedNumber}`;
  }

  /**
   * Transaksi atomik pembuatan pesanan (Mendukung Registered User & Guest Checkout)
   */
  public static async createOrder(
    user: UserSession | null,
    input: {
      pickupSlotId: string;
      notes?: string;
      idempotencyKey: string;
      isGuest?: boolean;
      guestName?: string;
      guestPhone?: string;
      guestItems?: Array<{ menuId: string; quantity: number; notes?: string }>;
    }
  ) {
    // 1. Cek idempotency: jika request yang sama sudah pernah berhasil dibuat, kembalikan order tersebut
    const existingOrder = await prisma.order.findUnique({
      where: {
        idempotencyKey: input.idempotencyKey,
      },
      include: {
        items: true,
        payment: true,
        pickupSlot: true,
        tenant: { select: { id: true, name: true, location: true } },
      },
    });

    if (existingOrder) {
      return existingOrder;
    }

    // 1b. Baca pengaturan operasional platform (MAINTENANCE_MODE, PLATFORM_FEE, PAYMENT_EXPIRY_MINUTES)
    const platformSettings = await SystemSettingService.getSettings();
    if (platformSettings.maintenanceMode) {
      throw new Error(
        'MAINTENANCE_MODE: Sistem sedang dalam mode pemeliharaan sementara. Pemesanan baru dinonaktifkan untuk sementara waktu.'
      );
    }

    const isGuestOrder = !user || !!input.isGuest;
    if (isGuestOrder) {
      if (!input.guestName || input.guestName.trim().length < 2) {
        throw new Error('GUEST_NAME_REQUIRED: Nama lengkap pemesan minimal 2 karakter.');
      }
      if (!input.guestPhone || !/^(\+62|62|0)8[1-9][0-9]{6,10}$/.test(input.guestPhone.trim())) {
        throw new Error('GUEST_PHONE_REQUIRED: Nomor WhatsApp / HP tidak valid.');
      }
    }

    // 1c. Database-backed Anti-Spam Guard: batasi pesanan PENDING_PAYMENT aktif per user/nomor WA
    const activeUnpaidWhere = user && !isGuestOrder
      ? { userId: user.id, status: 'PENDING_PAYMENT' as const, expiresAt: { gt: new Date() } }
      : {
          isGuest: true,
          guestPhone: input.guestPhone!.trim(),
          status: 'PENDING_PAYMENT' as const,
          expiresAt: { gt: new Date() },
        };
    const activeUnpaidCount = await prisma.order.count({ where: activeUnpaidWhere });
    if (activeUnpaidCount >= this.MAX_ACTIVE_UNPAID_ORDERS) {
      throw new Error(
        `TOO_MANY_PENDING_ORDERS: Anda masih memiliki ${activeUnpaidCount} pesanan yang menunggu pembayaran. Selesaikan atau batalkan pesanan sebelumnya terlebih dahulu.`
      );
    }

    // 2. Jalankan transaksi atomik untuk reservasi stok, kapasitas slot, dan pembuatan order
    return await prisma.$transaction(
      async (tx) => {
        let tenantId: string;
        const itemsToOrder: Array<{
          menuId: string;
          name: string;
          priceSnapshot: number;
          quantity: number;
          preparationTime: number;
          notes?: string | null;
        }> = [];

        let cartIdToClean: string | null = null;

        if (user && !input.isGuest && (!input.guestItems || input.guestItems.length === 0)) {
          // Ambil cart customer dari database
          const cart = await tx.cart.findUnique({
            where: { userId: user.id },
            include: {
              tenant: true,
              items: {
                include: {
                  menu: true,
                },
              },
            },
          });

          if (!cart || cart.items.length === 0) {
            throw new Error('CART_EMPTY: Keranjang belanja Anda masih kosong.');
          }

          if (!cart.tenant || cart.tenant.status !== 'ACTIVE' || !cart.tenant.isAcceptingOrders) {
            throw new Error('TENANT_CLOSED: Tenant sedang tutup atau tidak menerima pesanan baru.');
          }

          tenantId = cart.tenantId!;
          cartIdToClean = cart.id;

          for (const item of cart.items) {
            if (item.priceSnapshot !== item.menu.price) {
              await tx.cartItem.update({
                where: { id: item.id },
                data: { priceSnapshot: item.menu.price },
              });
              throw new Error(
                `PRICE_CHANGED: Harga menu ${item.menu.name} telah berubah. Silakan tinjau kembali keranjang Anda.`
              );
            }

            itemsToOrder.push({
              menuId: item.menuId,
              name: item.menu.name,
              priceSnapshot: item.priceSnapshot,
              quantity: item.quantity,
              preparationTime: item.menu.preparationTime,
              notes: item.notes,
            });
          }
        } else {
          // Guest order atau order dengan item eksplisit dari keranjang lokal
          const rawItems = input.guestItems;
          if (!rawItems || rawItems.length === 0) {
            throw new Error('CART_EMPTY: Keranjang belanja masih kosong.');
          }

          const menuIds = rawItems.map((i) => i.menuId);
          const menus = await tx.menu.findMany({
            where: { id: { in: menuIds }, deletedAt: null },
            include: { tenant: true },
          });

          if (menus.length !== menuIds.length) {
            throw new Error('MENU_NOT_FOUND: Salah satu menu tidak ditemukan atau sudah dihapus.');
          }

          // Pastikan semua menu berasal dari 1 tenant yang sama
          const firstTenantId = menus[0].tenantId;
          const allSameTenant = menus.every((m) => m.tenantId === firstTenantId);
          if (!allSameTenant) {
            throw new Error('CART_TENANT_CONFLICT: Menu harus berasal dari satu tenant yang sama.');
          }

          const tenant = menus[0].tenant;
          if (tenant.status !== 'ACTIVE' || !tenant.isAcceptingOrders) {
            throw new Error('TENANT_CLOSED: Tenant sedang tutup atau tidak menerima pesanan baru.');
          }

          tenantId = tenant.id;

          for (const raw of rawItems) {
            const m = menus.find((menu) => menu.id === raw.menuId)!;
            itemsToOrder.push({
              menuId: m.id,
              name: m.name,
              priceSnapshot: m.price,
              quantity: raw.quantity,
              preparationTime: m.preparationTime,
              notes: raw.notes?.trim() || null,
            });
          }
        }

        // Validasi slot pickup
        const slot = await tx.pickupSlot.findUnique({
          where: { id: input.pickupSlotId },
        });

        if (!slot || slot.tenantId !== tenantId || slot.status !== 'OPEN') {
          throw new Error('SLOT_UNAVAILABLE: Waktu pengambilan ini tidak tersedia.');
        }

        // Cek lead time persiapan minimum
        const maxPrepTime = Math.max(...itemsToOrder.map((i) => i.preparationTime), 10);
        const earliestTime = new Date(Date.now() + maxPrepTime * 60 * 1000);
        if (slot.startAt < earliestTime) {
          throw new Error(
            `SLOT_UNAVAILABLE: Waktu pengambilan terlalu dekat dengan estimasi memasak (${maxPrepTime} menit).`
          );
        }

        // A. RESERVASI STOK ATOMIK (BR-03)
        for (const item of itemsToOrder) {
          const updatedRows = await tx.$executeRaw`
            UPDATE "menus"
            SET "stock" = "stock" - ${item.quantity}
            WHERE "id" = ${item.menuId}
              AND "status" = 'AVAILABLE'
              AND "stock" >= ${item.quantity}
          `;

          if (updatedRows === 0) {
            throw new Error(
              `MENU_OUT_OF_STOCK: Stok ${item.name} tidak mencukupi untuk jumlah yang dipesan.`
            );
          }
        }

        // B. RESERVASI KAPASITAS SLOT ATOMIK (BR-04)
        await PickupSlotService.reserveSlot(tx, slot.id);

        // Hitung total biaya berdasarkan PLATFORM_FEE terkini di system_settings
        const pricing = Pricing.calculateTotals(
          itemsToOrder.map((i) => ({ price: i.priceSnapshot, quantity: i.quantity })),
          platformSettings.platformFee
        );

        // Generate nomor order dan pickup code unik
        const orderNumber = await this.getNextOrderNumber(tx);
        let pickupCode = generatePickupCode();
        while (await tx.order.findUnique({ where: { pickupCode } })) {
          pickupCode = generatePickupCode();
        }

        const now = new Date();
        const expiresAt = new Date(
          now.getTime() + platformSettings.paymentExpiryMinutes * 60 * 1000
        );
        const guestToken = isGuestOrder ? generateUUID() : null;

        // C. BUAT ORDER RECORD
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId: user ? user.id : null,
            isGuest: isGuestOrder,
            guestName: isGuestOrder ? (input.guestName?.trim() || 'Pelanggan Tamu') : null,
            guestPhone: isGuestOrder ? (input.guestPhone?.trim() || null) : null,
            guestToken,
            tenantId,
            pickupSlotId: slot.id,
            subtotal: pricing.subtotal,
            fee: pricing.fee,
            total: pricing.total,
            status: 'PENDING_PAYMENT',
            notes: input.notes?.trim() || null,
            pickupCode,
            idempotencyKey: input.idempotencyKey,
            expiresAt,
          },
        });

        // D. BUAT ORDER ITEMS DENGAN SNAPSHOT NAMA & HARGA
        await tx.orderItem.createMany({
          data: itemsToOrder.map((item) => ({
            orderId: order.id,
            menuId: item.menuId,
            menuNameSnapshot: item.name,
            priceSnapshot: item.priceSnapshot,
            quantity: item.quantity,
            subtotal: item.priceSnapshot * item.quantity,
            notes: item.notes || null,
          })),
        });

        // E. BUAT RECORD PAYMENT AWAL (PENDING)
        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: pricing.total,
            provider: getConfiguredProviderName(),
            status: 'PENDING',
            expiresAt,
          },
        });

        // F. CATAT STATUS LOG
        await tx.orderStatusLog.create({
          data: {
            orderId: order.id,
            fromStatus: null,
            toStatus: 'PENDING_PAYMENT',
            actorId: user ? user.id : null,
            actorRole: 'CUSTOMER',
            note: isGuestOrder
              ? `Pesanan tamu dibuat oleh ${input.guestName?.trim() || 'Pelanggan'}.`
              : 'Pesanan dibuat, menunggu pembayaran.',
          },
        });

        // G. KOSONGKAN KERANJANG DI DATABASE JIKA DARI CART REGISTERED USER
        if (cartIdToClean) {
          await tx.cartItem.deleteMany({ where: { cartId: cartIdToClean } });
          await tx.cart.update({
            where: { id: cartIdToClean },
            data: { tenantId: null },
          });
        }

        return order;
      },
      {
        timeout: 10000,
      }
    );
  }

  /**
   * Mengubah status pesanan sesuai OrderStateMachine dan menangani rollback stok/slot atau refund
   */
  public static async changeOrderStatus(
    actor: { id?: string | null; role: ActorRole; tenantId?: string | null },
    orderId: string,
    targetStatus: OrderStatus,
    note?: string
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
        tenant: true,
        pickupSlot: true,
      },
    });

    if (!order) {
      throw new Error('NOT_FOUND: Pesanan tidak ditemukan.');
    }

    // Cek kepemilikan tenant
    if (actor.role === 'TENANT' && actor.tenantId !== order.tenantId) {
      throw new Error('FORBIDDEN: Anda tidak memiliki akses ke pesanan toko lain.');
    }

    // Validasi aturan perpindahan state machine
    OrderStateMachine.assertTransition(order.status as OrderStatus, targetStatus, actor.role);

    const shouldRefundAfterTx =
      order.status === 'PAID' &&
      OrderStateMachine.requiresRefund('PAID', targetStatus) &&
      Boolean(order.payment && order.payment.status === 'PAID' && order.payment.transactionReference);

    const shouldCancelUnpaidCharge =
      order.status === 'PENDING_PAYMENT' &&
      targetStatus === 'CANCELLED' &&
      Boolean(order.payment && order.payment.status === 'PENDING');

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: targetStatus,
      };

      const now = new Date();
      if (targetStatus === 'PAID') updateData.paidAt = now;
      if (targetStatus === 'ACCEPTED') updateData.acceptedAt = now;
      if (targetStatus === 'READY_FOR_PICKUP') updateData.readyAt = now;
      if (targetStatus === 'COMPLETED') updateData.completedAt = now;
      if (targetStatus === 'CANCELLED' || targetStatus === 'REJECTED') {
        updateData.cancelledAt = now;
        if (note) updateData.cancelReason = note;
      }

      const nextOrder = await tx.order.update({
        where: { id: order.id },
        data: updateData,
      });

      // Tandai payment unpaid sebagai EXPIRED / FAILED saat order dibatalkan sebelum dibayar
      if (shouldCancelUnpaidCharge && order.payment) {
        const isExpiredReason = Boolean(note && /kedaluwarsa|expired/i.test(note));
        await tx.payment.updateMany({
          where: { id: order.payment.id, status: 'PENDING' },
          data: { status: isExpiredReason ? 'EXPIRED' : 'FAILED' },
        });
      }

      // Lepaskan stok dan kapasitas slot jika order dibatalkan atau ditolak (BR-11)
      if (OrderStateMachine.releasesReservation(order.status as OrderStatus, targetStatus)) {
        for (const item of order.items) {
          await tx.$executeRaw`
            UPDATE "menus"
            SET "stock" = "stock" + ${item.quantity}
            WHERE "id" = ${item.menuId}
          `;
        }

        await PickupSlotService.releaseSlot(tx, order.pickupSlotId);
      }

      // Pastikan actorId hanya diisi jika benar-benar ID user valid di tabel users (mencegah Foreign Key Violation)
      let validActorId: string | null = null;
      if (actor.id && actor.id !== 'SYSTEM' && actor.id !== 'GUEST') {
        if (actor.role === 'TENANT' && actor.tenantId && actor.id === actor.tenantId) {
          validActorId = order.tenant.ownerId;
        } else {
          const userRecord = await tx.user.findUnique({
            where: { id: actor.id },
            select: { id: true },
          });
          validActorId = userRecord ? userRecord.id : null;
        }
      }

      // Catat log riwayat status
      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: targetStatus,
          actorId: validActorId,
          actorRole: actor.role === 'SYSTEM' ? null : (actor.role as any),
          note: note || null,
        },
      });

      // Kirim notifikasi in-app ke customer
      let notificationTitle = 'Update Status Pesanan';
      let notificationMsg = `Pesanan #${order.orderNumber} Anda diperbarui menjadi ${targetStatus}.`;

      if (targetStatus === 'ACCEPTED') {
        notificationTitle = 'Pesanan Diterima!';
        notificationMsg = `Tenant ${order.tenant.name} telah menerima pesanan Anda dan segera memprosesnya.`;
      } else if (targetStatus === 'PREPARING') {
        notificationTitle = 'Makanan Sedang Disiapkan';
        notificationMsg = `Pesanan #${order.orderNumber} sedang dimasak oleh tenant.`;
      } else if (targetStatus === 'READY_FOR_PICKUP') {
        notificationTitle = 'Makanan Siap Diambil!';
        notificationMsg = `Pesanan Anda di ${order.tenant.name} sudah siap! Tunjukkan QR Code pada jam pengambilan.`;
      } else if (targetStatus === 'COMPLETED') {
        notificationTitle = 'Pesanan Selesai';
        notificationMsg = `Terima kasih! Jangan lupa beri ulasan untuk pesanan #${order.orderNumber}.`;
      } else if (targetStatus === 'REJECTED') {
        notificationTitle = 'Pesanan Ditolak';
        notificationMsg = `Pesanan #${order.orderNumber} tidak dapat diproses: ${note || 'Dapur sedang penuh'}. Proses pengembalian dana Anda sedang dijalankan.`;
      }

      if (order.userId) {
        await NotificationService.createNotification(
          order.userId,
          notificationTitle,
          notificationMsg,
          'ORDER',
          `/orders/${order.id}`
        );
      }

      return nextOrder;
    });

    // Side-effect gateway dijalankan DI LUAR transaksi database agar tidak menahan DB lock saat HTTP call
    if (shouldCancelUnpaidCharge && order.payment?.transactionReference) {
      try {
        const provider = getPaymentProviderByName(order.payment.provider, false);
        await provider.cancelCharge(order.payment.transactionReference);
      } catch (err) {
        console.warn('[OrderService] Gagal membatalkan charge gateway:', err);
      }
    }

    if (shouldRefundAfterTx && order.payment?.transactionReference) {
      try {
        const provider = getPaymentProviderByName(order.payment.provider, false);
        const refundResult = await provider.refund({
          referenceId: `RFD-${order.orderNumber}-${Date.now().toString(36).toUpperCase()}`,
          transactionReference: order.payment.transactionReference,
          amount: order.payment.amount,
          channelCode: order.payment.channelCode,
          reason: note || `Order ${targetStatus.toLowerCase()}`,
        });

        await prisma.paymentAttempt.create({
          data: {
            paymentId: order.payment.id,
            status: refundResult.status === 'SUCCESS' ? 'REFUNDED' : 'PENDING',
            method: order.payment.method,
            channelCode: order.payment.channelCode,
            providerEventId: `refund:${refundResult.refundId}`,
            message: refundResult.message,
            rawResponse: refundResult.rawResponse ? (refundResult.rawResponse as any) : undefined,
          },
        });

        if (refundResult.status === 'SUCCESS') {
          await prisma.payment.update({
            where: { id: order.payment.id },
            data: {
              status: 'REFUNDED',
              refundedAt: new Date(),
            },
          });
        } else if (refundResult.status === 'MANUAL_REQUIRED' || refundResult.status === 'FAILED') {
          const admins = await prisma.user.findMany({
            where: { role: 'ADMIN', status: 'ACTIVE' },
            select: { id: true },
          });
          await Promise.all(
            admins.map((admin) =>
              NotificationService.createNotification(
                admin.id,
                'Tindak Lanjut Refund Manual',
                `Pesanan #${order.orderNumber} (Rp ${order.payment!.amount.toLocaleString('id-ID')}) memerlukan refund manual: ${refundResult.message}`,
                'PAYMENT',
                '/admin/orders'
              )
            )
          );
        }
      } catch (refundErr) {
        console.error('[OrderService] Gagal memproses refund gateway:', refundErr);
      }
    }

    return updatedOrder;
  }

  /**
   * Verifikasi kode pickup oleh Tenant (UC-15 & BR-12)
   */
  public static async verifyPickup(tenantId: string, pickupCode: string) {
    const cleanCode = pickupCode.trim().toUpperCase();

    const order = await prisma.order.findFirst({
      where: {
        tenantId,
        pickupCode: cleanCode,
      },
    });

    if (!order) {
      throw new Error('PICKUP_CODE_INVALID: Kode pengambilan tidak ditemukan.');
    }

    if (order.status === 'COMPLETED') {
      throw new Error('ORDER_ALREADY_PICKED_UP: Pesanan ini sudah pernah diambil.');
    }

    if (order.status !== 'READY_FOR_PICKUP') {
      throw new Error(
        `ORDER_NOT_READY: Makanan belum berstatus 'Siap Diambil' (status saat ini: ${order.status}).`
      );
    }

    const tenantOwner = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { ownerId: true },
    });

    return await this.changeOrderStatus(
      { id: tenantOwner?.ownerId || null, role: 'TENANT', tenantId },
      order.id,
      'COMPLETED',
      'Kode pickup diverifikasi oleh tenant di kasir/counter.'
    );
  }

  /**
   * Customer membatalkan pesanan (Mendukung Registered User & Guest) (BR-10: hanya sebelum ACCEPTED)
   */
  public static async cancelOrderByCustomer(
    auth: { user?: UserSession | null; guestToken?: string | null } | UserSession,
    orderId: string,
    reason?: string
  ) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
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

    if (!OrderStateMachine.isCancellableByCustomer(order.status as OrderStatus)) {
      throw new Error(
        'ORDER_NOT_CANCELLABLE: Pesanan tidak dapat dibatalkan karena sudah diterima dan sedang diproses oleh tenant.'
      );
    }

    return await this.changeOrderStatus(
      { id: sessionUser?.id || null, role: 'CUSTOMER' },
      order.id,
      'CANCELLED',
      reason || 'Dibatalkan oleh pelanggan.'
    );
  }

  /**
   * Pembersihan otomatis pesanan yang waktu pembayarannya kedaluwarsa (BR-08)
   */
  public static async expireStaleOrders(): Promise<number> {
    const now = new Date();
    const staleOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING_PAYMENT',
        expiresAt: { lt: now },
      },
      select: { id: true },
    });

    let count = 0;
    for (const stale of staleOrders) {
      try {
        await this.changeOrderStatus(
          { id: 'SYSTEM', role: 'SYSTEM' },
          stale.id,
          'CANCELLED',
          'Waktu pembayaran kedaluwarsa (15 menit).'
        );
        count++;
      } catch (err) {
        console.error(`Gagal meng-expire order ${stale.id}:`, err);
      }
    }

    return count;
  }
}
