import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { InvalidOrderTransitionError } from '@/server/domain/order-state-machine';
import { apiError } from './response';

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

  // Standard Error
  if (error instanceof Error) {
    return apiError('INTERNAL_ERROR', error.message || 'Terjadi kesalahan pada sistem.', 500);
  }

  return apiError('INTERNAL_ERROR', 'Terjadi kesalahan tak terduga.', 500);
}
