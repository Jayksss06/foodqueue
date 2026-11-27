import { NextRequest } from 'next/server';
import { loginSchema } from '@/validators';
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
    const clientIp = getClientIp(req);
    const ipLimit = await checkRateLimit(clientIp, {
      namespace: 'auth:login:ip',
      limit: 10,
      windowSeconds: 60,
    });
    if (!ipLimit.allowed) {
      return createRateLimitExceededResponse(
        ipLimit,
        'Terlalu banyak percobaan login. Silakan coba lagi dalam beberapa saat.'
      );
    }

    const body = await req.json();
    const validated = loginSchema.parse(body);

    const accountLimit = await checkRateLimit(
      `${clientIp}:${validated.email.toLowerCase()}`,
      {
        namespace: 'auth:login:account',
        limit: 5,
        windowSeconds: 60,
      }
    );
    if (!accountLimit.allowed) {
      return createRateLimitExceededResponse(
        accountLimit,
        'Terlalu banyak percobaan login untuk akun ini. Silakan tunggu 1 menit.'
      );
    }

    const { user, token } = await AuthService.login(validated.email, validated.password);

    const response = apiSuccess(user, undefined, 200);
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
