import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.tenantCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            tenants: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    return apiSuccess(categories);
  } catch (error) {
    return handleRouteError(error);
  }
}
