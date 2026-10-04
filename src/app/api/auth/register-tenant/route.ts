import { NextRequest } from 'next/server';
import { registerTenantSchema } from '@/validators';
import { AuthService } from '@/server/services/auth.service';
import { handleRouteError } from '@/server/http/error-handler';
import { apiSuccess } from '@/server/http/response';
import { COOKIE_NAME } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerTenantSchema.parse(body);

    const { user, token, tenantId } = await AuthService.registerTenant(validated);

    const response = apiSuccess({ user, tenantId }, undefined, 201);
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
