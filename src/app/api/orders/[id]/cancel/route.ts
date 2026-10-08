import { NextRequest } from 'next/server';
import { withAuth, AuthContext, getRouteParam } from '@/server/http/auth-guard';
import { OrderService } from '@/server/services/order.service';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const POST = withAuth(
  async (req: NextRequest, ctx: AuthContext, routeContext: unknown) => {
    try {
      const id = await getRouteParam(routeContext, 'id', req);

      let reason = 'Dibatalkan oleh pengguna.';
      try {
        const body = await req.json();
        if (body.reason) reason = body.reason;
      } catch {
        // body opsional
      }

      const order = await OrderService.cancelOrderByCustomer(ctx.user, id, reason);
      return apiSuccess(order);
    } catch (error) {
      return handleRouteError(error);
    }
  }
);
