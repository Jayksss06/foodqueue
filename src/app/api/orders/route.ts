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

export const GET = withOptionalAuth(async (req: NextRequest, ctx: OptionalAuthContext) => {
  try {
    // Jalankan maintenance pembersihan stale orders secara lazy
    OrderService.expireStaleOrders().catch((err) => console.error(err));

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope'); // 'active' atau 'history'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const guestOrderIds = searchParams.get('guestOrderIds');
    const guestTokens = searchParams.get('guestTokens');

    const where: any = {};

    if (ctx.user) {
      where.userId = ctx.user.id;
    } else if (guestOrderIds) {
      const idsList = guestOrderIds.split(',').map((s) => s.trim()).filter(Boolean);
      if (idsList.length === 0) {
        return apiSuccess([], { page: 1, pageSize, total: 0, totalPages: 0 });
      }
      where.id = { in: idsList };
      where.isGuest = true;
      if (guestTokens) {
        const tokenList = guestTokens.split(',').map((s) => s.trim()).filter(Boolean);
        where.guestToken = { in: tokenList };
      }
    } else {
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
