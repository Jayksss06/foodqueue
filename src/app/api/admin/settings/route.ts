import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { prisma } from '@/lib/prisma';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
      description: z.string().optional(),
    })
  ),
});

export const GET = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      const items = await prisma.systemSetting.findMany({
        orderBy: { key: 'asc' },
      });
      return apiSuccess(items);
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['ADMIN'] }
);

export const PUT = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      const body = await req.json();
      const validated = updateSettingsSchema.parse(body);

      await prisma.$transaction(
        validated.settings.map((s) =>
          prisma.systemSetting.upsert({
            where: { key: s.key },
            create: {
              key: s.key,
              value: s.value,
              description: s.description,
            },
            update: {
              value: s.value,
              description: s.description,
            },
          })
        )
      );

      const updated = await prisma.systemSetting.findMany({
        orderBy: { key: 'asc' },
      });

      return apiSuccess(updated);
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['ADMIN'] }
);
