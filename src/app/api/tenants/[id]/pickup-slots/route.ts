import { NextRequest } from 'next/server';
import { PickupSlotService } from '@/server/services/pickup-slot.service';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    const now = new Date();
    const defaultDateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const dateStr = searchParams.get('date') || defaultDateStr;
    const prepMinutes = parseInt(searchParams.get('prep') || '10', 10);

    const slots = await PickupSlotService.getAvailableSlots(id, dateStr, prepMinutes);
    return apiSuccess(slots);
  } catch (error) {
    return handleRouteError(error);
  }
}
