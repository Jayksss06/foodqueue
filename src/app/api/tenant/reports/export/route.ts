import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { prisma } from '@/lib/prisma';
import { apiForbidden } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';
import {
  checkRateLimit,
  createRateLimitExceededResponse,
  getClientIp,
} from '@/server/http/rate-limit';
import { buildOrderSettlementCsv, getJakartaDateStamp } from '@/lib/csv';

const ALLOWED_STATUSES = new Set([
  'PENDING_PAYMENT',
  'PAID',
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
  'REFUNDED',
  'NO_SHOW',
]);

export const GET = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      if (!ctx.user.tenantId) {
        return apiForbidden('Akun Anda tidak terhubung ke tenant.');
      }

      const rateLimit = await checkRateLimit(`${ctx.user.tenantId}:${getClientIp(req)}`, {
        namespace: 'tenant:reports-export',
        limit: 10,
        windowSeconds: 60,
      });
      if (!rateLimit.allowed) {
        return createRateLimitExceededResponse(
          rateLimit,
          'Terlalu banyak permintaan ekspor CSV. Coba lagi dalam 1 menit.'
        );
      }

      const { searchParams } = new URL(req.url);
      const daysParam = searchParams.get('days') || '30';
      const statusParam = searchParams.get('status');

      const where: Record<string, unknown> = {
        tenantId: ctx.user.tenantId,
      };

      if (statusParam && statusParam !== 'ALL' && ALLOWED_STATUSES.has(statusParam)) {
        where.status = statusParam;
      }

      if (daysParam !== 'all') {
        const days = Math.min(Math.max(parseInt(daysParam, 10) || 30, 1), 365);
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        where.createdAt = { gte: since };
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          items: { select: { menuNameSnapshot: true, quantity: true } },
          pickupSlot: { select: { startAt: true, endAt: true } },
          payment: {
            select: {
              provider: true,
              method: true,
              channelCode: true,
              status: true,
            },
          },
          user: { select: { name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 2000,
      });

      const csv = buildOrderSettlementCsv(orders, { includeTenantColumn: false });
      const dateStamp = getJakartaDateStamp();
      const filename = `foodqueue-laporan-tenant-${dateStamp}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['TENANT'] }
);
