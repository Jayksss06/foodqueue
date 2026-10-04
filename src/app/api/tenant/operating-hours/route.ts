import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { updateOperatingHoursSchema } from '@/validators';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiForbidden } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const PUT = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      if (!ctx.user.tenantId) {
        return apiForbidden('Akun Anda tidak terhubung ke tenant.');
      }

      const body = await req.json();
      const validated = updateOperatingHoursSchema.parse(body);

      await prisma.$transaction(async (tx) => {
        for (const item of validated.hours) {
          await tx.tenantOperatingHour.upsert({
            where: {
              tenantId_dayOfWeek: {
                tenantId: ctx.user.tenantId!,
                dayOfWeek: item.dayOfWeek,
              },
            },
            create: {
              tenantId: ctx.user.tenantId!,
              dayOfWeek: item.dayOfWeek,
              openTime: item.openTime,
              closeTime: item.closeTime,
              isClosed: item.isClosed,
            },
            update: {
              openTime: item.openTime,
              closeTime: item.closeTime,
              isClosed: item.isClosed,
            },
          });
        }
      });

      const updated = await prisma.tenantOperatingHour.findMany({
        where: { tenantId: ctx.user.tenantId },
        orderBy: { dayOfWeek: 'asc' },
      });

      return apiSuccess(updated);
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['TENANT'] }
);
