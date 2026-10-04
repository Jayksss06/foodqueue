import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { updateUserStatusSchema } from '@/validators';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiBadRequest, apiNotFound } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const PATCH = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      const url = new URL(req.url);
      const segments = url.pathname.split('/');
      const id = segments[segments.length - 1];

      if (id === ctx.user.id) {
        return apiBadRequest('Admin tidak dapat menonaktifkan akun sendiri.');
      }

      const body = await req.json();
      const validated = updateUserStatusSchema.parse(body);

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return apiNotFound('User tidak ditemukan.');
      }

      const updated = await prisma.user.update({
        where: { id },
        data: {
          status: validated.status,
          // Increment sessionVersion agar sesi yang sedang aktif langsung ter-revoke
          sessionVersion: { increment: 1 },
        },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          sessionVersion: true,
        },
      });

      return apiSuccess(updated);
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['ADMIN'] }
);
