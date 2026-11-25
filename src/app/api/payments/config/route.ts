import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';
import { getPaymentRuntimeConfig } from '@/server/providers/payment/payment-config';

export const dynamic = 'force-dynamic';

/**
 * Mengembalikan konfigurasi pembayaran non-rahasia untuk frontend & dashboard admin.
 * Tidak pernah mengekspos nilai API key atau webhook token.
 */
export async function GET() {
  try {
    const config = getPaymentRuntimeConfig();
    const inspectKey = (name: string) => {
      const val = process.env[name];
      if (val === undefined) return 'UNDEFINED';
      if (val.trim().length === 0) return 'EMPTY';
      return `SET(len=${val.trim().length})`;
    };

    return apiSuccess({
      ...config,
      diagnostics: {
        vercelEnv: process.env.VERCEL_ENV || null,
        commitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
        nodeEnv: process.env.NODE_ENV || null,
        envKeyStatus: {
          PAYMENT_PROVIDER: inspectKey('PAYMENT_PROVIDER'),
          XENDIT_SECRET_KEY: inspectKey('XENDIT_SECRET_KEY'),
          XENDIT_WEBHOOK_TOKEN: inspectKey('XENDIT_WEBHOOK_TOKEN'),
          CRON_SECRET: inspectKey('CRON_SECRET'),
          NEXT_PUBLIC_APP_URL: inspectKey('NEXT_PUBLIC_APP_URL'),
        },
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
