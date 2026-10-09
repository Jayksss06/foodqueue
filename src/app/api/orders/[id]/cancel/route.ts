import { NextRequest } from 'next/server';
import { withOptionalAuth, OptionalAuthContext, getRouteParam } from '@/server/http/auth-guard';
import { OrderService } from '@/server/services/order.service';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const POST = withOptionalAuth(
  async (req: NextRequest, ctx: OptionalAuthContext, routeContext: unknown) => {
    try {
      const id = await getRouteParam(routeContext, 'id', req);
      const { searchParams } = new URL(req.url);

      let reason = 'Dibatalkan oleh pengguna.';
      let guestToken = searchParams.get('token') || req.headers.get('x-guest-token');
      try {
        const body = await req.json();
        if (body.reason) reason = body.reason;
        if (body.token) guestToken = body.token;
      } catch {
        // body opsional
      }

      const order = await OrderService.cancelOrderByCustomer(
        { user: ctx.user, guestToken },
        id,
        reason
      );
      return apiSuccess(order);
    } catch (error) {
      return handleRouteError(error);
    }
  }
);
