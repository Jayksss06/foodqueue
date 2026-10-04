import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiNotFound } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        status: 'ACTIVE',
      },
      include: {
        venue: true,
        operatingHours: { orderBy: { dayOfWeek: 'asc' } },
        menus: {
          where: { deletedAt: null },
          include: { category: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!tenant) {
      return apiNotFound('Tenant tidak ditemukan atau sedang tidak aktif.');
    }

    return apiSuccess(tenant);
  } catch (error) {
    return handleRouteError(error);
  }
}
