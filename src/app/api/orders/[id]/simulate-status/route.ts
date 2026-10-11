import { NextRequest } from 'next/server';
import { withOptionalAuth, OptionalAuthContext, getRouteParam } from '@/server/http/auth-guard';
import { prisma } from '@/lib/prisma';
import { OrderService } from '@/server/services/order.service';
import { apiSuccess, apiNotFound, apiBadRequest } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';
import { OrderStatus } from '@/types';

const STATUS_SEQUENCE: OrderStatus[] = [
  'PENDING_PAYMENT',
  'PAID',
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'COMPLETED',
];

export const POST = withOptionalAuth(
  async (req: NextRequest, ctx: OptionalAuthContext, routeContext: unknown) => {
    try {
      const id = await getRouteParam(routeContext, 'id', req);
      const { searchParams } = new URL(req.url);

      let body: any = {};
      try {
        body = await req.json();
      } catch {
        body = {};
      }

      const token = body.token || searchParams.get('token') || req.headers.get('x-guest-token');
      const targetState = body.to as OrderStatus | undefined;

      const order = await prisma.order.findUnique({
        where: { id },
        include: { payment: true },
      });

      if (!order) {
        return apiNotFound('Pesanan tidak ditemukan.');
      }

      // Validasi hak akses pengujian
      const isGuestAuthorized = order.isGuest && !!token && order.guestToken === token;
      const isCustomerAuthorized = ctx.user?.role === 'CUSTOMER' && order.userId === ctx.user.id;
      const isTenantAuthorized = ctx.user?.role === 'TENANT' && ctx.user.tenantId === order.tenantId;
      const isAdminAuthorized = ctx.user?.role === 'ADMIN';

      if (!isGuestAuthorized && !isCustomerAuthorized && !isTenantAuthorized && !isAdminAuthorized && !token) {
        return apiNotFound('Pesanan tidak ditemukan atau token tidak valid.');
      }

      let currentStatus = order.status as OrderStatus;

      // Jika order belum dibayar, bayar terlebih dahulu
      if (currentStatus === 'PENDING_PAYMENT') {
        const now = new Date();
        if (order.payment) {
          await prisma.payment.update({
            where: { id: order.payment.id },
            data: { status: 'PAID', paidAt: now },
          });
        }
        await OrderService.changeOrderStatus(
          { id: 'SYSTEM', role: 'SYSTEM' },
          order.id,
          'PAID',
          'Simulasi pembayaran berhasil diverifikasi.'
        );
        currentStatus = 'PAID';
      }

      // Tentukan target status akhir
      let destination = targetState;
      if (!destination) {
        const curIdx = STATUS_SEQUENCE.indexOf(currentStatus);
        if (curIdx >= 0 && curIdx < STATUS_SEQUENCE.length - 1) {
          destination = STATUS_SEQUENCE[curIdx + 1];
        } else {
          return apiBadRequest('Pesanan sudah mencapai status akhir atau tidak dapat disimulasikan lebih lanjut.');
        }
      }

      const startIndex = STATUS_SEQUENCE.indexOf(currentStatus);
      const targetIndex = STATUS_SEQUENCE.indexOf(destination);

      if (startIndex < 0 || targetIndex < 0 || targetIndex <= startIndex) {
        return apiBadRequest(`Perpindahan status dari ${currentStatus} ke ${destination} tidak valid.`);
      }

      // Jalankan transisi bertahap sesuai state machine
      let updatedOrder = null;
      for (let i = startIndex + 1; i <= targetIndex; i++) {
        const nextStatus = STATUS_SEQUENCE[i];
        let note = 'Simulasi pengujian alur pesanan.';
        if (nextStatus === 'ACCEPTED') note = 'Tenant menerima pesanan (Simulasi)';
        if (nextStatus === 'PREPARING') note = 'Tenant mulai memasak pesanan (Simulasi)';
        if (nextStatus === 'READY_FOR_PICKUP') note = 'Makanan selesai dan siap diambil di stan (Simulasi)';
        if (nextStatus === 'COMPLETED') note = 'Pesanan berhasil diambil oleh pembeli (Simulasi)';

        updatedOrder = await OrderService.changeOrderStatus(
          { id: 'SYSTEM', role: 'SYSTEM' },
          order.id,
          nextStatus,
          note
        );
      }

      return apiSuccess({
        success: true,
        order: updatedOrder,
        currentStatus: updatedOrder?.status,
      });
    } catch (error) {
      return handleRouteError(error);
    }
  }
);
