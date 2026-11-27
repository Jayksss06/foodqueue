import { SignJWT, jwtVerify } from 'jose';
import { Role } from '@/types';

const DEV_FALLBACK_SECRET = 'foodqueue-dev-secret-key-must-be-at-least-32-chars-long-2026';
const KNOWN_LEAKED_EXAMPLE_SECRETS = new Set([
  DEV_FALLBACK_SECRET,
  'foodqueue-super-secret-key-2026-production-ready-min-32-chars',
]);

let warnedWeakJwtSecret = false;

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

export interface JwtSecurityStatus {
  configured: boolean;
  meetsMinLength: boolean;
  isWeakDefault: boolean;
  status: 'STRONG' | 'WEAK_DEFAULT' | 'MISCONFIGURED';
}

export function getJwtSecurityStatus(rawSecret = process.env.JWT_SECRET): JwtSecurityStatus {
  const trimmed = rawSecret?.trim() || '';
  const configured = trimmed.length > 0;
  const meetsMinLength = trimmed.length >= 32;
  const isWeakDefault = configured && KNOWN_LEAKED_EXAMPLE_SECRETS.has(trimmed);

  if (!configured || !meetsMinLength) {
    return { configured, meetsMinLength, isWeakDefault, status: 'MISCONFIGURED' };
  }
  if (isWeakDefault) {
    return { configured, meetsMinLength, isWeakDefault, status: 'WEAK_DEFAULT' };
  }
  return { configured, meetsMinLength, isWeakDefault, status: 'STRONG' };
}

function getJwtSecretBytes(): Uint8Array {
  const raw = process.env.JWT_SECRET?.trim() || '';
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    if (!raw || raw.length < 32) {
      throw new Error(
        'AUTH_CONFIG_ERROR: JWT_SECRET wajib dikonfigurasi dengan minimal 32 karakter pada mode production.'
      );
    }
    if (raw === DEV_FALLBACK_SECRET) {
      throw new Error(
        'AUTH_CONFIG_ERROR: JWT_SECRET tidak boleh menggunakan nilai fallback development pada mode production.'
      );
    }
    if (KNOWN_LEAKED_EXAMPLE_SECRETS.has(raw) && !warnedWeakJwtSecret) {
      warnedWeakJwtSecret = true;
      console.error(
        '[SECURITY WARNING] JWT_SECRET pada environment production masih menggunakan nilai default lama yang terekspos di .env.example! Segera rotasi dengan secret acak 64-byte.'
      );
    }
    return new TextEncoder().encode(raw);
  }

  return new TextEncoder().encode(raw || DEV_FALLBACK_SECRET);
}

export async function signSessionToken(payload: TokenPayload): Promise<string> {
  const secret = getJwtSecretBytes();
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
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = getJwtSecretBytes();
    const { payload } = await jwtVerify(token, secret);
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
