import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, COOKIE_NAME } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { Role, UserSession } from '@/types';
import { apiForbidden, apiUnauthorized } from './response';

export interface AuthContext {
  user: UserSession;
}

export interface AuthOptions {
  roles?: Role[];
}

/**
 * Extract authenticated user session from HTTP cookies and verify against database.
 */
export async function getAuthenticatedUser(req?: NextRequest): Promise<UserSession | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(COOKIE_NAME)?.value;
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get(COOKIE_NAME)?.value;
  }

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return null;
  }

  try {
    // Verify user still exists, is ACTIVE, and session version matches (handles remote logout / password reset)
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { tenant: { select: { id: true, status: true } } },
    });

    if (!dbUser || dbUser.status !== 'ACTIVE' || dbUser.sessionVersion !== payload.sessionVersion) {
      return null;
    }

    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role as Role,
      status: dbUser.status as UserSession['status'],
      sessionVersion: dbUser.sessionVersion,
      tenantId: dbUser.tenant?.id ?? null,
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

/**
 * Higher-order wrapper for Route Handlers enforcing authentication and role permissions.
 * Passes routeContext (with params) as 3rd parameter to handler.
 */
export function withAuth<T = unknown>(
  handler: (req: NextRequest, ctx: AuthContext, routeContext?: T) => Promise<Response>,
  options?: AuthOptions
) {
  return async (req: NextRequest, routeContext?: T): Promise<Response> => {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return apiUnauthorized();
    }

    if (options?.roles && !options.roles.includes(user.role)) {
      return apiForbidden('Anda tidak memiliki izin untuk mengakses resource ini.');
    }

    return handler(req, { user }, routeContext);
  };
}

export interface OptionalAuthContext {
  user: UserSession | null;
}

/**
 * Higher-order wrapper for Route Handlers allowing both guest and authenticated requests.
 */
export function withOptionalAuth<T = unknown>(
  handler: (req: NextRequest, ctx: OptionalAuthContext, routeContext?: T) => Promise<Response>
) {
  return async (req: NextRequest, routeContext?: T): Promise<Response> => {
    const user = await getAuthenticatedUser(req);
    return handler(req, { user }, routeContext);
  };
}

/**
 * Helper to safely extract dynamic route parameters regardless of Next.js sync/async params
 */
export async function getRouteParam(
  routeContext: unknown,
  paramName: string,
  req?: NextRequest
): Promise<string> {
  const ctx = routeContext as { params?: Record<string, string> | Promise<Record<string, string>> } | undefined;
  if (ctx?.params) {
    const resolved = await Promise.resolve(ctx.params);
    if (resolved && resolved[paramName]) {
      return String(resolved[paramName]);
    }
  }
  if (req) {
    const cleanPath = (req.nextUrl?.pathname || new URL(req.url).pathname).replace(/\/+$/, '');
    const parts = cleanPath.split('/').filter(Boolean);
    const resourceIdx = parts.findIndex((p) =>
      ['orders', 'tenants', 'menus', 'users', 'payments', 'items', 'notifications'].includes(p)
    );
    if (resourceIdx !== -1 && parts[resourceIdx + 1]) {
      return parts[resourceIdx + 1];
    }
    return parts[parts.length - 1] || '';
  }
  return '';
}
