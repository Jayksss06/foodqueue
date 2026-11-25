import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';
import { getPaymentRuntimeConfig } from '@/server/providers/payment/payment-config';

export const dynamic = 'force-dynamic';

/**
 * Mengembalikan konfigurasi pembayaran non-rahasia untuk frontend & dashboard admin.
 * Tidak pernah mengekspos API key atau webhook token.
 */
export async function GET() {
  try {
    const config = getPaymentRuntimeConfig();
    return apiSuccess(config);
  } catch (error) {
    return handleRouteError(error);
  }
}
