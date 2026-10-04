import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { updateTenantProfileSchema } from '@/validators';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiForbidden } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const GET = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      if (!ctx.user.tenantId) {
        return apiForbidden('Akun Anda tidak terhubung ke tenant.');
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: ctx.user.tenantId },
        include: {
          operatingHours: { orderBy: { dayOfWeek: 'asc' } },
        },
      });

      return apiSuccess(tenant);
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['TENANT'] }
);

export const PATCH = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      if (!ctx.user.tenantId) {
        return apiForbidden('Akun Anda tidak terhubung ke tenant.');
      }

      const body = await req.json();
      const validated = updateTenantProfileSchema.parse(body);

      const updated = await prisma.tenant.update({
        where: { id: ctx.user.tenantId },
        data: {
          ...(validated.name && { name: validated.name.trim() }),
          ...(validated.description !== undefined && { description: validated.description?.trim() || null }),
          ...(validated.location && { location: validated.location.trim() }),
          ...(validated.logoUrl !== undefined && { logoUrl: validated.logoUrl || null }),
          ...(validated.defaultPreparationTime !== undefined && { defaultPreparationTime: validated.defaultPreparationTime }),
          ...(validated.slotDurationMinutes !== undefined && { slotDurationMinutes: validated.slotDurationMinutes }),
          ...(validated.maxOrdersPerSlot !== undefined && { maxOrdersPerSlot: validated.maxOrdersPerSlot }),
          ...(validated.isAcceptingOrders !== undefined && { isAcceptingOrders: validated.isAcceptingOrders }),
        },
      });

      return apiSuccess(updated);
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['TENANT'] }
);
