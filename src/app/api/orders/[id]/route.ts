import { NextRequest } from 'next/server';
import { withAuth, AuthContext, getRouteParam } from '@/server/http/auth-guard';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiNotFound, apiForbidden } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';
import QRCode from 'qrcode';

export const GET = withAuth(
  async (req: NextRequest, ctx: AuthContext, routeContext: unknown) => {
    try {
      const id = await getRouteParam(routeContext, 'id', req);

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          tenant: {
            select: { id: true, name: true, location: true, logoUrl: true, defaultPreparationTime: true },
          },
          pickupSlot: true,
          items: true,
          payment: true,
          review: true,
          statusLogs: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!order) {
        return apiNotFound('Pesanan tidak ditemukan.');
      }

      // Customer hanya boleh melihat pesanannya sendiri, Tenant hanya tokonya, Admin bebas
      if (ctx.user.role === 'CUSTOMER' && order.userId !== ctx.user.id) {
        return apiNotFound('Pesanan tidak ditemukan.');
      }

      if (ctx.user.role === 'TENANT' && ctx.user.tenantId !== order.tenantId) {
        return apiNotFound('Pesanan tidak ditemukan.');
      }

      // Generate QR Code data URL jika status sudah READY_FOR_PICKUP
      let qrCodeDataUrl: string | null = null;
      if (order.status === 'READY_FOR_PICKUP' || order.status === 'COMPLETED') {
        qrCodeDataUrl = await QRCode.toDataURL(order.pickupCode, {
          width: 320,
          margin: 2,
          color: {
            dark: '#1C1917',
            light: '#FFFFFF',
          },
        });
      }

      return apiSuccess({
        ...order,
        qrCodeDataUrl,
      });
    } catch (error) {
      return handleRouteError(error);
    }
  }
);
