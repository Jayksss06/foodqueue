import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiForbidden, apiNotFound } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';
import { PickupSlotService } from '@/server/services/pickup-slot.service';
import { z } from 'zod';

const updateSlotSchema = z.object({
  slotId: z.string(),
  capacity: z.number().int().min(0).max(100).optional(),
  status: z.enum(['OPEN', 'CLOSED']).optional(),
});

export const GET = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      if (!ctx.user.tenantId) {
        return apiForbidden('Akun Anda tidak terhubung ke tenant.');
      }

      const { searchParams } = new URL(req.url);
      const now = new Date();
      const defaultDateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      const dateStr = searchParams.get('date') || defaultDateStr;

      // Ensure slots exist for date
      await PickupSlotService.ensureDailySlots(ctx.user.tenantId, dateStr);

      const [year, month, day] = dateStr.split('-').map((n) => parseInt(n, 10));
      const targetDate = new Date(year, month - 1, day);

      const slots = await prisma.pickupSlot.findMany({
        where: {
          tenantId: ctx.user.tenantId,
          date: targetDate,
        },
        orderBy: { startAt: 'asc' },
      });

      return apiSuccess(slots);
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['TENANT'] }
);

export const PATCH = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      if (!ctx.user.tenantId) {
        return apiForbidden('Akun Anda tidak terhubung ke tenant.');
      }

      const body = await req.json();
      const validated = updateSlotSchema.parse(body);

      const slot = await prisma.pickupSlot.findUnique({
        where: { id: validated.slotId },
      });

      if (!slot || slot.tenantId !== ctx.user.tenantId) {
        return apiNotFound('Slot tidak ditemukan.');
      }

      const updated = await prisma.pickupSlot.update({
        where: { id: validated.slotId },
        data: {
          ...(validated.capacity !== undefined && { capacity: validated.capacity }),
          ...(validated.status && { status: validated.status }),
        },
      });

      return apiSuccess(updated);
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['TENANT'] }
);
