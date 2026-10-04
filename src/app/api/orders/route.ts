import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { checkoutSchema } from '@/validators';
import { OrderService } from '@/server/services/order.service';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';
import { prisma } from '@/lib/prisma';

export const POST = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const body = await req.json();
    const validated = checkoutSchema.parse(body);

    const order = await OrderService.createOrder(ctx.user, validated);
    return apiSuccess(order, undefined, 201);
  } catch (error) {
    return handleRouteError(error);
  }
});

export const GET = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    // Jalankan maintenance pembersihan stale orders secara lazy
    OrderService.expireStaleOrders().catch((err) => console.error(err));

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope'); // 'active' atau 'history'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const where: any = { userId: ctx.user.id };

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
