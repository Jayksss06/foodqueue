import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { prisma } from '@/lib/prisma';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const GET = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status');
      const tenantId = searchParams.get('tenantId');
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);

      const where: any = {};
      if (status) where.status = status;
      if (tenantId) where.tenantId = tenantId;

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            tenant: { select: { id: true, name: true } },
            user: { select: { id: true, name: true, email: true } },
            pickupSlot: true,
            payment: true,
            items: true,
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
  { roles: ['ADMIN'] }
);
