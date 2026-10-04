import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { updateTenantVerificationSchema } from '@/validators';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiNotFound } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';
import { NotificationService } from '@/server/services/notification.service';

export const PATCH = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      const url = new URL(req.url);
      const segments = url.pathname.split('/');
      const id = segments[segments.length - 1];

      const body = await req.json();
      const validated = updateTenantVerificationSchema.parse(body);

      const tenant = await prisma.tenant.findUnique({ where: { id } });
      if (!tenant) {
        return apiNotFound('Tenant tidak ditemukan.');
      }

      const updateData: any = {
        status: validated.status,
      };

      if (validated.status === 'ACTIVE' && !tenant.verifiedAt) {
        updateData.verifiedAt = new Date();
      }

      const updated = await prisma.tenant.update({
        where: { id },
        data: updateData,
      });

      // Kirim notifikasi ke pemilik tenant
      if (validated.status === 'ACTIVE') {
        await NotificationService.createNotification(
          tenant.ownerId,
          'Toko Anda Telah Diverifikasi! 🎉',
          `Selamat! Toko ${tenant.name} telah disetujui oleh admin dan kini dapat menerima pesanan.`,
          'SYSTEM',
          '/tenant'
        );
      }

      return apiSuccess(updated);
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['ADMIN'] }
);
