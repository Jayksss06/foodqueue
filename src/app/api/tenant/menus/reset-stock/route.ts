import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { resetMenuStockSchema } from '@/validators';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiForbidden } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';
import {
  checkRateLimit,
  createRateLimitExceededResponse,
  getClientIp,
} from '@/server/http/rate-limit';

export const POST = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      if (!ctx.user.tenantId) {
        return apiForbidden('Akun Anda tidak terhubung ke tenant.');
      }

      const rateLimit = await checkRateLimit(`${ctx.user.tenantId}:${getClientIp(req)}`, {
        namespace: 'tenant:menus-reset-stock',
        limit: 10,
        windowSeconds: 60,
      });
      if (!rateLimit.allowed) {
        return createRateLimitExceededResponse(
          rateLimit,
          'Terlalu banyak permintaan reset stok dalam waktu singkat. Coba lagi sebentar.'
        );
      }

      const rawBody = await req.json().catch(() => ({}));
      const validated = resetMenuStockSchema.parse(rawBody);

      const where: Record<string, unknown> = {
        tenantId: ctx.user.tenantId,
        deletedAt: null,
      };

      if (!validated.includeUnavailable) {
        where.status = { in: ['AVAILABLE', 'OUT_OF_STOCK'] };
      }

      if (validated.onlyLowStockBelow !== undefined) {
        where.stock = { lt: validated.onlyLowStockBelow };
      }

      const result = await prisma.menu.updateMany({
        where,
        data: {
          stock: validated.defaultStock,
          status: 'AVAILABLE',
        },
      });

      return apiSuccess({
        updatedCount: result.count,
        defaultStock: validated.defaultStock,
        message:
          result.count > 0
            ? `Berhasil mereset stok ${result.count} menu menjadi ${validated.defaultStock} porsi.`
            : 'Tidak ada menu yang memenuhi kriteria untuk direset.',
      });
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['TENANT'] }
);
