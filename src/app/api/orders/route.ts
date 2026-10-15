import { NextRequest } from 'next/server';
import { withOptionalAuth, OptionalAuthContext } from '@/server/http/auth-guard';
import { checkoutSchema } from '@/validators';
import { OrderService } from '@/server/services/order.service';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';
import { prisma } from '@/lib/prisma';

export const POST = withOptionalAuth(async (req: NextRequest, ctx: OptionalAuthContext) => {
  try {
    const body = await req.json();
    const validated = checkoutSchema.parse(body);

    const order = await OrderService.createOrder(ctx.user, validated);
    return apiSuccess(order, undefined, 201);
  } catch (error) {
    return handleRouteError(error);
  }
});

let lastExpireExecution = 0;
let isExpiringStaleOrders = false;
const EXPIRE_THROTTLE_MS = 60 * 1000; // Maksimal 1 kali per 60 detik per instance server

function safeTriggerThrottledStaleCleanup() {
  const now = Date.now();
  if (isExpiringStaleOrders || now - lastExpireExecution < EXPIRE_THROTTLE_MS) {
    return;
  }
  isExpiringStaleOrders = true;
  lastExpireExecution = now;

  OrderService.expireStaleOrders()
    .catch((err) => console.error('[OrderService.expireStaleOrders]:', err))
    .finally(() => {
      isExpiringStaleOrders = false;
    });
}

export const GET = withOptionalAuth(async (req: NextRequest, ctx: OptionalAuthContext) => {
  try {
    // Jalankan pembersihan pesanan kedaluwarsa secara throttled (mencegah DB lock contention)
    safeTriggerThrottledStaleCleanup();

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope'); // 'active' atau 'history'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const guestOrderIds = searchParams.get('guestOrderIds');
    const guestTokens = searchParams.get('guestTokens');

    // Validasi otorisasi pesanan tamu secara berpasangan ketat (Mencegah IDOR)
    const rawIds = (guestOrderIds || '').split(',').map((s) => s.trim()).filter(Boolean);
    const rawTokens = (guestTokens || '').split(',').map((s) => s.trim()).filter(Boolean);

    const guestPairs: Array<{ id: string; guestToken: string; isGuest: true }> = [];
    if (rawIds.length > 0 && rawTokens.length > 0) {
      const pairCount = Math.min(rawIds.length, rawTokens.length);
      for (let i = 0; i < pairCount; i++) {
        if (rawIds[i] && rawTokens[i]) {
          guestPairs.push({
            id: rawIds[i],
            guestToken: rawTokens[i],
            isGuest: true,
          });
        }
      }
    }

    const where: any = {};

    if (ctx.user && guestPairs.length > 0) {
      where.OR = [
        { userId: ctx.user.id },
        ...guestPairs,
      ];
    } else if (guestPairs.length > 0) {
      where.OR = guestPairs;
    } else if (ctx.user) {
      where.userId = ctx.user.id;
    } else {
      // Tidak terotentikasi dan tidak memiliki pasangan token tamu valid
      return apiSuccess([], { page: 1, pageSize, total: 0, totalPages: 0 });
    }

    if (scope === 'active') {
      where.status = {
        in: ['PENDING_PAYMENT', 'PAID', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'],
      };
    } else if (scope === 'history') {
      where.status = {
        in: ['COMPLETED', 'CANCELLED', 'REJECTED', 'REFUNDED', 'NO_SHOW'],
      };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          tenant: { select: { id: true, name: true, location: true, logoUrl: true } },
          pickupSlot: true,
          items: true,
          payment: true,
          review: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return apiSuccess(orders, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return handleRouteError(error);
  }
});
