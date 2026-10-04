import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { OrderService } from '@/server/services/order.service';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const POST = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      const url = new URL(req.url);
      const segments = url.pathname.split('/');
      // /api/orders/[id]/cancel -> segments: ['', 'api', 'orders', '[id]', 'cancel']
      const id = segments[segments.length - 2];

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
