import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { menus: { where: { deletedAt: null } } },
        },
      },
    });

    return apiSuccess(categories);
  } catch (error) {
    return handleRouteError(error);
  }
}
