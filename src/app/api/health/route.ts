import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentRuntimeConfig } from '@/server/providers/payment/payment-config';
import { SystemSettingService } from '@/server/services/system-setting.service';

export const dynamic = 'force-dynamic';

/**
 * Production Liveness & Readiness Health Endpoint
 * Cocok untuk uptime monitoring (UptimeRobot, BetterStack, Vercel Checks).
 */
export async function GET() {
  const startedAt = Date.now();
  let dbConnected = false;
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
    dbLatencyMs = Date.now() - startedAt;
  } catch (err: any) {
    dbConnected = false;
    dbLatencyMs = Date.now() - startedAt;
    dbError = err?.code || 'DB_CONNECTION_ERROR';
  }

  const paymentConfig = getPaymentRuntimeConfig();
  const settings = dbConnected
    ? await SystemSettingService.getSettings().catch(() => null)
    : null;

  const isHealthy = dbConnected;
  const payload = {
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: dbConnected ? 'connected' : 'disconnected',
        latencyMs: dbLatencyMs,
        ...(dbError ? { errorCode: dbError } : {}),
      },
      paymentGateway: {
        provider: paymentConfig.provider,
        mode: paymentConfig.mode,
        webhookConfigured: paymentConfig.webhookConfigured,
        simulationLocked: !paymentConfig.simulationEnabled,
      },
      operations: {
        maintenanceMode: settings?.maintenanceMode ?? false,
      },
    },
  };

  return NextResponse.json(payload, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
