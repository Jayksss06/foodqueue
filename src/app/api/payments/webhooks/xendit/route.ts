import { NextRequest } from 'next/server';
import { PaymentService } from '@/server/services/payment.service';
import { apiBadRequest, apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const dynamic = 'force-dynamic';

/**
 * Webhook Endpoint Resmi Xendit (Payments API v3 & v2)
 * URL di Dashboard Xendit: https://<domain-anda>/api/payments/webhooks/xendit
 * Keamanan: Diverifikasi secara ketat menggunakan header `x-callback-token` (constant-time).
 */
export async function POST(req: NextRequest) {
  try {
    const callbackToken = req.headers.get('x-callback-token');

    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return apiBadRequest('Payload JSON webhook tidak valid.', 'INVALID_WEBHOOK_JSON');
    }

    const result = await PaymentService.handleXenditWebhook(payload, callbackToken);
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
