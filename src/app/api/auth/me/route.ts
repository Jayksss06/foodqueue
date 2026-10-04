import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';
import { prisma } from '@/lib/prisma';
import { updateProfileSchema } from '@/validators';

export const GET = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  return apiSuccess(ctx.user);
});

export const PATCH = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const body = await req.json();
    const validated = updateProfileSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: ctx.user.id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.phone !== undefined && { phone: validated.phone || null }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        status: true,
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleRouteError(error);
  }
});
