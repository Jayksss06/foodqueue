import { NextRequest } from 'next/server';
import { withAuth, AuthContext, getRouteParam } from '@/server/http/auth-guard';
import { simulatePaymentSchema } from '@/validators';
import { PaymentService } from '@/server/services/payment.service';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const POST = withAuth(
  async (req: NextRequest, ctx: AuthContext, routeContext: unknown) => {
    try {
      const orderId = await getRouteParam(routeContext, 'id', req);

      const body = await req.json();
      const validated = simulatePaymentSchema.parse(body);

      const result = await PaymentService.simulatePaymentOutcome(
        ctx.user,
        orderId,
        validated.outcome
      );

      return apiSuccess(result);
    } catch (error) {
      return handleRouteError(error);
    }
  }
);
