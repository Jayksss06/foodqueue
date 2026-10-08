import { NextRequest } from 'next/server';
import { withAuth, AuthContext, getRouteParam } from '@/server/http/auth-guard';
import { updateOrderStatusSchema } from '@/validators';
import { OrderService } from '@/server/services/order.service';
import { apiSuccess, apiForbidden } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const PATCH = withAuth(
  async (req: NextRequest, ctx: AuthContext, routeContext: unknown) => {
    try {
      if (!ctx.user.tenantId) {
        return apiForbidden('Akun Anda tidak terhubung ke tenant.');
      }

      const id = await getRouteParam(routeContext, 'id', req);

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
