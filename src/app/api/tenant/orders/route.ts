import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiForbidden } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const GET = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      if (!ctx.user.tenantId) {
        return apiForbidden('Akun Anda tidak terhubung ke tenant.');
      }

      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status');
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);

      const where: any = { tenantId: ctx.user.tenantId };
      if (status) {
        where.status = status;
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            items: true,
            pickupSlot: true,
            payment: true,
            user: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.order.count({ where }),
      ]);

      return apiSuccess(orders, {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['TENANT'] }
);
