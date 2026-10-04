import { NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

export function apiSuccess<T>(data: T, meta?: ApiResponse['meta'], status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    {
      data,
      meta,
    },
    { status }
  );
}

export function apiError(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json<ApiResponse>(
    {
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

export function apiUnauthorized(message = 'Sesi Anda telah berakhir. Silakan login kembali.') {
  return apiError('UNAUTHENTICATED', message, 401);
}

export function apiForbidden(message = 'Anda tidak memiliki akses ke resource ini.') {
  return apiError('FORBIDDEN', message, 403);
}

export function apiNotFound(message = 'Data yang diminta tidak ditemukan.') {
  return apiError('NOT_FOUND', message, 404);
}

export function apiBadRequest(message: string, code = 'BAD_REQUEST', details?: unknown) {
  return apiError(code, message, 400, details);
}

export function apiConflict(code: string, message: string, details?: unknown) {
  return apiError(code, message, 409, details);
}
