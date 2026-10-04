import { SignJWT, jwtVerify } from 'jose';
import { Role } from '@/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'foodqueue-dev-secret-key-must-be-at-least-32-chars-long-2026'
);

export const COOKIE_NAME = 'fq_session';
export const TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  sub: string;
  name: string;
  email: string;
  role: Role;
  sessionVersion: number;
  tenantId?: string | null;
}

export async function signSessionToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({
    name: payload.name,
    email: payload.email,
    role: payload.role,
    sessionVersion: payload.sessionVersion,
    tenantId: payload.tenantId ?? null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.sub || !payload.role) {
      return null;
    }
    return {
      sub: payload.sub,
      name: (payload.name as string) || '',
      email: (payload.email as string) || '',
      role: payload.role as Role,
      sessionVersion: typeof payload.sessionVersion === 'number' ? payload.sessionVersion : 0,
      tenantId: (payload.tenantId as string) || null,
    };
  } catch {
    return null;
  }
}
