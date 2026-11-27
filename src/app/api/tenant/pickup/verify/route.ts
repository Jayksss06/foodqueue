import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { verifyPickupSchema } from '@/validators';
import { OrderService } from '@/server/services/order.service';
import { apiSuccess, apiForbidden } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';
import {
  checkRateLimit,
  createRateLimitExceededResponse,
  getClientIp,
} from '@/server/http/rate-limit';

export const POST = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      if (!ctx.user.tenantId) {
        return apiForbidden('Akun Anda tidak terhubung ke tenant.');
      }

      const rateLimit = await checkRateLimit(`${ctx.user.tenantId}:${getClientIp(req)}`, {
        namespace: 'tenant:pickup-verify',
        limit: 25,
        windowSeconds: 60,
      });
      if (!rateLimit.allowed) {
        return createRateLimitExceededResponse(
          rateLimit,
          'Terlalu banyak percobaan verifikasi kode pickup. Tunggu sebentar.'
        );
      }

      const body = await req.json();
      const validated = verifyPickupSchema.parse(body);

      const order = await OrderService.verifyPickup(ctx.user.tenantId, validated.code);

      return apiSuccess({
        message: 'Pengambilan makanan berhasil diverifikasi!',
        order,
      });
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['TENANT'] }
);
