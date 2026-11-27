import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { InvalidOrderTransitionError } from '@/server/domain/order-state-machine';
import { apiError } from './response';

const ERROR_PREFIX_STATUS_MAP: Array<{ prefix: string; status: number }> = [
  { prefix: 'UNAUTHORIZED:', status: 401 },
  { prefix: 'UNAUTHENTICATED:', status: 401 },
  { prefix: 'FORBIDDEN:', status: 403 },
  { prefix: 'NOT_FOUND:', status: 404 },
  { prefix: 'BAD_REQUEST:', status: 400 },
  { prefix: 'VALIDATION_ERROR:', status: 400 },
  { prefix: 'CART_EMPTY:', status: 400 },
  { prefix: 'GUEST_NAME_REQUIRED:', status: 400 },
  { prefix: 'GUEST_PHONE_REQUIRED:', status: 400 },
  { prefix: 'MENU_NOT_FOUND:', status: 404 },
  { prefix: 'ORDER_EXPIRED:', status: 400 },
  { prefix: 'ORDER_NOT_PAYABLE:', status: 409 },
  { prefix: 'ORDER_NOT_CANCELLABLE:', status: 409 },
  { prefix: 'ORDER_ALREADY_PICKED_UP:', status: 409 },
  { prefix: 'ORDER_NOT_READY:', status: 409 },
  { prefix: 'PICKUP_CODE_INVALID:', status: 404 },
  { prefix: 'CART_TENANT_CONFLICT:', status: 409 },
  { prefix: 'TENANT_CLOSED:', status: 409 },
  { prefix: 'SLOT_UNAVAILABLE:', status: 409 },
  { prefix: 'SLOT_FULL:', status: 409 },
  { prefix: 'MENU_OUT_OF_STOCK:', status: 409 },
  { prefix: 'PRICE_CHANGED:', status: 409 },
  { prefix: 'PAYMENT_AMOUNT_MISMATCH:', status: 400 },
  { prefix: 'AUTH_CONFIG_ERROR:', status: 503 },
  { prefix: 'MAINTENANCE_MODE:', status: 503 },
  { prefix: 'PAYMENT_CONFIG_ERROR:', status: 503 },
  { prefix: 'PAYMENT_GATEWAY_ERROR:', status: 502 },
];

export function handleRouteError(error: unknown): NextResponse {
  console.error('[API Error]:', error);

  // Zod Validation Error
  if (error instanceof ZodError) {
    const formattedIssues = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    return apiError(
      'VALIDATION_ERROR',
      formattedIssues[0]?.message || 'Data yang dikirim tidak valid.',
      422,
      formattedIssues
    );
  }

  // Domain Order State Machine Error
  if (error instanceof InvalidOrderTransitionError) {
    return apiError('INVALID_STATUS_TRANSITION', error.message, 409, {
      from: error.from,
      to: error.to,
      actor: error.actor,
    });
  }

  // Standard Error dengan prefix domain
  if (error instanceof Error) {
    const msg = error.message || 'Terjadi kesalahan pada sistem.';
    for (const mapping of ERROR_PREFIX_STATUS_MAP) {
      if (msg.startsWith(mapping.prefix)) {
        const code = mapping.prefix.replace(/:$/, '');
        const cleanMessage = msg.slice(mapping.prefix.length).trim() || msg;
        return apiError(code, cleanMessage, mapping.status);
      }
    }

    return apiError('INTERNAL_ERROR', msg, 500);
  }

  return apiError('INTERNAL_ERROR', 'Terjadi kesalahan tak terduga.', 500);
}
