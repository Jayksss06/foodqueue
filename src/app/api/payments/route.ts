import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { initiatePaymentSchema } from '@/validators';
import { PaymentService } from '@/server/services/payment.service';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const POST = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const body = await req.json();
    const validated = initiatePaymentSchema.parse(body);

    const result = await PaymentService.initiatePayment(
      ctx.user,
      validated.orderId,
      validated.method
    );

    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
});
