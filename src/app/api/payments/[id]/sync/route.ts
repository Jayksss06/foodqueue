import { NextRequest } from 'next/server';
import { withOptionalAuth, OptionalAuthContext, getRouteParam } from '@/server/http/auth-guard';
import { syncPaymentSchema } from '@/validators';
import { PaymentService } from '@/server/services/payment.service';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const POST = withOptionalAuth(
  async (req: NextRequest, ctx: OptionalAuthContext, routeContext: unknown) => {
    try {
      const orderId = await getRouteParam(routeContext, 'id', req);
      const { searchParams } = new URL(req.url);

      let parsedBody: { token?: string } = {};
      try {
        const body = await req.json();
        parsedBody = syncPaymentSchema.parse(body);
      } catch {
        parsedBody = {};
      }

      const guestToken =
        parsedBody.token || searchParams.get('token') || req.headers.get('x-guest-token');

      const result = await PaymentService.syncPaymentStatus(
        { user: ctx.user, guestToken },
        orderId
      );

      return apiSuccess(result);
    } catch (error) {
      return handleRouteError(error);
    }
  }
);
