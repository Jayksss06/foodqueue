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
      const q = searchParams.get('q')?.trim() || '';
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);

      const where: any = {};
      if (status) where.status = status;
      if (q) {
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
        ];
      }

      const [tenants, total] = await Promise.all([
        prisma.tenant.findMany({
          where,
          include: {
            owner: { select: { id: true, name: true, email: true, phone: true } },
            _count: { select: { menus: true, orders: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.tenant.count({ where }),
      ]);

      return apiSuccess(tenants, {
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
