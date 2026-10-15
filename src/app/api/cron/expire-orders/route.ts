import { NextRequest } from 'next/server';
import { OrderService } from '@/server/services/order.service';
import { apiSuccess, apiUnauthorized } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

/**
 * Dedicated endpoint untuk pembersihan pesanan kedaluwarsa secara otomatis
 * Dapat dipicu secara terjadwal melalui Vercel Cron, GitHub Actions, atau scheduled worker.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Jika CRON_SECRET dikonfigurasi di environment, verifikasi token pengaman
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const searchParams = new URL(req.url).searchParams;
      if (searchParams.get('key') !== cronSecret) {
        return apiUnauthorized('Unauthorized cron request');
      }
    }

    const expiredCount = await OrderService.expireStaleOrders();
    return apiSuccess({
      message: 'Pembersihan pesanan kedaluwarsa berhasil dieksekusi',
      expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
