import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { updateMenuSchema } from '@/validators';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiNotFound, apiForbidden } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const PATCH = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      if (!ctx.user.tenantId) {
        return apiForbidden('Akun Anda tidak terhubung ke tenant.');
      }

      const url = new URL(req.url);
      const segments = url.pathname.split('/');
      const id = segments[segments.length - 1];

      const menu = await prisma.menu.findUnique({ where: { id } });
      if (!menu || menu.tenantId !== ctx.user.tenantId || menu.deletedAt) {
        return apiNotFound('Menu tidak ditemukan.');
      }

      const body = await req.json();
      const validated = updateMenuSchema.parse(body);

      const updated = await prisma.menu.update({
        where: { id },
        data: {
          ...(validated.name && { name: validated.name.trim() }),
          ...(validated.description !== undefined && { description: validated.description?.trim() || null }),
          ...(validated.price !== undefined && { price: validated.price }),
          ...(validated.imageUrl !== undefined && { imageUrl: validated.imageUrl || null }),
          ...(validated.stock !== undefined && { stock: validated.stock }),
          ...(validated.preparationTime !== undefined && { preparationTime: validated.preparationTime }),
          ...(validated.status && { status: validated.status }),
          ...(validated.categoryId && { categoryId: validated.categoryId }),
        },
        include: { category: true },
      });

      return apiSuccess(updated);
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['TENANT'] }
);

export const DELETE = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      if (!ctx.user.tenantId) {
        return apiForbidden('Akun Anda tidak terhubung ke tenant.');
      }

      const url = new URL(req.url);
      const segments = url.pathname.split('/');
      const id = segments[segments.length - 1];

      const menu = await prisma.menu.findUnique({ where: { id } });
      if (!menu || menu.tenantId !== ctx.user.tenantId || menu.deletedAt) {
        return apiNotFound('Menu tidak ditemukan.');
      }

      // Soft delete agar histori pesanan terdahulu tidak rusak
      await prisma.menu.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'UNAVAILABLE' },
      });

      return apiSuccess({ message: 'Menu berhasil dihapus.' });
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['TENANT'] }
);
