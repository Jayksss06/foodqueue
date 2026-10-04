import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { verifyPickupSchema } from '@/validators';
import { OrderService } from '@/server/services/order.service';
import { apiSuccess, apiForbidden } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const POST = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      if (!ctx.user.tenantId) {
        return apiForbidden('Akun Anda tidak terhubung ke tenant.');
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
