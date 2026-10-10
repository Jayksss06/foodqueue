import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const openNow = searchParams.get('openNow') === 'true';

    const where: any = {
      status: 'ACTIVE',
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.OR = [
        { tenantCategory: { slug: category } },
        {
          menus: {
            some: {
              category: { slug: category },
              deletedAt: null,
              status: 'AVAILABLE',
            },
          },
        },
      ];
    }

    if (openNow) {
      where.isAcceptingOrders = true;
    }

    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        operatingHours: true,
        tenantCategory: true,
        _count: {
          select: { menus: { where: { deletedAt: null, status: 'AVAILABLE' } } },
        },
      },
      orderBy: { ratingAvg: 'desc' },
    });

    return apiSuccess(tenants);
  } catch (error) {
    return handleRouteError(error);
  }
}
