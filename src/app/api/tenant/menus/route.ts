import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { createMenuSchema } from '@/validators';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiForbidden } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const GET = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      if (!ctx.user.tenantId) {
        return apiForbidden('Akun Anda tidak terhubung ke tenant.');
      }

      const menus = await prisma.menu.findMany({
        where: {
          tenantId: ctx.user.tenantId,
          deletedAt: null,
        },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      });

      return apiSuccess(menus);
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['TENANT'] }
);

export const POST = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      if (!ctx.user.tenantId) {
        return apiForbidden('Akun Anda tidak terhubung ke tenant.');
      }

      const body = await req.json();
      const validated = createMenuSchema.parse(body);

      const menu = await prisma.menu.create({
        data: {
          tenantId: ctx.user.tenantId,
          categoryId: validated.categoryId,
          name: validated.name.trim(),
          description: validated.description?.trim() || null,
          price: validated.price,
          imageUrl: validated.imageUrl || null,
          stock: validated.stock,
          preparationTime: validated.preparationTime,
          status: validated.status,
        },
        include: { category: true },
      });

      return apiSuccess(menu, undefined, 201);
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['TENANT'] }
);
