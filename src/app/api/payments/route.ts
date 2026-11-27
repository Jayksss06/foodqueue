import { NextRequest } from 'next/server';
import { withOptionalAuth, OptionalAuthContext } from '@/server/http/auth-guard';
import { initiatePaymentSchema } from '@/validators';
import { PaymentService } from '@/server/services/payment.service';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';
import {
  checkRateLimit,
  createRateLimitExceededResponse,
  getClientIp,
} from '@/server/http/rate-limit';

export const POST = withOptionalAuth(async (req: NextRequest, ctx: OptionalAuthContext) => {
  try {
    const rateLimit = await checkRateLimit(ctx.user?.id || getClientIp(req), {
      namespace: 'payments:initiate',
      limit: 15,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return createRateLimitExceededResponse(
        rateLimit,
        'Terlalu banyak permintaan pembayaran. Silakan tunggu beberapa detik sebelum mencoba lagi.'
      );
    }

    const body = await req.json();
    const validated = initiatePaymentSchema.parse(body);
    const { searchParams } = new URL(req.url);
    const guestToken =
      validated.token || searchParams.get('token') || req.headers.get('x-guest-token');

    const result = await PaymentService.initiatePayment(
      { user: ctx.user, guestToken },
      validated.orderId,
      validated.method,
      {
        channelCode: validated.channelCode,
        customerPhone: validated.customerPhone || undefined,
        forceRefresh: validated.forceRefresh,
      }
    );

    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
});
