import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { updateOrderStatusSchema } from '@/validators';
import { OrderService } from '@/server/services/order.service';
import { apiSuccess, apiForbidden } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const PATCH = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      if (!ctx.user.tenantId) {
        return apiForbidden('Akun Anda tidak terhubung ke tenant.');
      }

      const url = new URL(req.url);
      const segments = url.pathname.split('/');
      // /api/tenant/orders/[id]/status -> segments: ['', 'api', 'tenant', 'orders', '[id]', 'status']
      const id = segments[segments.length - 2];

      const body = await req.json();
      const validated = updateOrderStatusSchema.parse(body);

      const updated = await OrderService.changeOrderStatus(
        {
          id: ctx.user.id,
          role: 'TENANT',
          tenantId: ctx.user.tenantId,
        },
        id,
        validated.to,
        validated.note
      );

      return apiSuccess(updated);
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['TENANT'] }
);
