import { NextResponse } from 'next/server';
import { apiSuccess } from '@/server/http/response';
import { COOKIE_NAME } from '@/lib/jwt';

export async function POST() {
  const response = apiSuccess({ message: 'Logout berhasil.' });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
