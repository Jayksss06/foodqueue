import { NextRequest } from 'next/server';
import { registerCustomerSchema } from '@/validators';
import { AuthService } from '@/server/services/auth.service';
import { handleRouteError } from '@/server/http/error-handler';
import { apiSuccess } from '@/server/http/response';
import {
  checkRateLimit,
  createRateLimitExceededResponse,
  getClientIp,
} from '@/server/http/rate-limit';
import { COOKIE_NAME } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(getClientIp(req), {
      namespace: 'auth:register',
      limit: 5,
      windowSeconds: 300,
    });
    if (!rateLimit.allowed) {
      return createRateLimitExceededResponse(
        rateLimit,
        'Terlalu banyak pendaftaran akun dari jaringan Anda. Coba lagi beberapa menit lagi.'
      );
    }

    const body = await req.json();
    const validated = registerCustomerSchema.parse(body);

    const { user, token } = await AuthService.registerCustomer(validated);

    const response = apiSuccess(user, undefined, 201);
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
