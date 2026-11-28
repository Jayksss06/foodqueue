import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { prisma } from '@/lib/prisma';
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
      const rateLimit = await checkRateLimit(`${ctx.user.id}:${getClientIp(req)}`, {
        namespace: 'admin:orders-export',
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
      const statusParam = searchParams.get('status');
      const tenantId = searchParams.get('tenantId');

      const where: Record<string, unknown> = {};
      if (statusParam && statusParam !== 'ALL' && ALLOWED_STATUSES.has(statusParam)) {
        where.status = statusParam;
      }
      if (tenantId) {
        where.tenantId = tenantId;
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          tenant: { select: { name: true } },
          user: { select: { name: true, email: true, phone: true } },
          pickupSlot: { select: { startAt: true, endAt: true } },
          payment: {
            select: {
              provider: true,
              method: true,
              channelCode: true,
              status: true,
            },
          },
          items: { select: { menuNameSnapshot: true, quantity: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 3000,
      });

      const csv = buildOrderSettlementCsv(orders, { includeTenantColumn: true });
      const dateStamp = getJakartaDateStamp();
      const suffix = statusParam && statusParam !== 'ALL' ? `-${statusParam.toLowerCase()}` : '';
      const filename = `foodqueue-settlement-admin${suffix}-${dateStamp}.csv`;

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
  { roles: ['ADMIN'] }
);
