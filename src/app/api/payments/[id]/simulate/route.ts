import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { simulatePaymentSchema } from '@/validators';
import { PaymentService } from '@/server/services/payment.service';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const POST = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      const url = new URL(req.url);
      const segments = url.pathname.split('/');
      // /api/payments/[id]/simulate -> id is segments[length - 2]
      const orderId = segments[segments.length - 2];

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
