import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

export interface RateLimitConfig {
  /** Nama bucket unik (misal 'auth:login', 'orders:create') */
  namespace: string;
  /** Maksimal request dalam satu jendela waktu */
  limit: number;
  /** Durasi jendela waktu dalam detik */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtUnix: number;
  retryAfterSeconds: number;
  backend: 'upstash' | 'memory';
}

interface MemoryBucket {
  count: number;
  resetAtMs: number;
}

const MAX_MEMORY_BUCKETS = 10_000;
const memoryStore = new Map<string, MemoryBucket>();

/**
 * Ekstrak alamat IP klien secara aman pada deployment Vercel / Reverse Proxy.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return 'unknown-ip';
}

function pruneExpiredBuckets(nowMs: number) {
  if (memoryStore.size < MAX_MEMORY_BUCKETS) return;
  for (const [key, bucket] of memoryStore.entries()) {
    if (bucket.resetAtMs <= nowMs) {
      memoryStore.delete(key);
    }
  }
  // Jika masih penuh karena serangan flood, buang 20% entri terlama
  if (memoryStore.size >= MAX_MEMORY_BUCKETS) {
    const deleteCount = Math.floor(MAX_MEMORY_BUCKETS * 0.2);
    let removed = 0;
    for (const key of memoryStore.keys()) {
      memoryStore.delete(key);
      removed++;
      if (removed >= deleteCount) break;
    }
  }
}

export function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  nowMs = Date.now()
): RateLimitResult {
  pruneExpiredBuckets(nowMs);

  const windowMs = windowSeconds * 1000;
  const existing = memoryStore.get(key);

  if (!existing || existing.resetAtMs <= nowMs) {
    const resetAtMs = nowMs + windowMs;
    memoryStore.set(key, { count: 1, resetAtMs });
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAtUnix: Math.ceil(resetAtMs / 1000),
      retryAfterSeconds: 0,
      backend: 'memory',
    };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  const remaining = Math.max(0, limit - existing.count);
  const retryAfterSeconds = allowed
    ? 0
    : Math.max(1, Math.ceil((existing.resetAtMs - nowMs) / 1000));

  return {
    allowed,
    limit,
    remaining,
    resetAtUnix: Math.ceil(existing.resetAtMs / 1000),
    retryAfterSeconds,
    backend: 'memory',
  };
}

async function checkUpstashRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  try {
    const windowMs = windowSeconds * 1000;
    const res = await fetch(`${url.replace(/\/+$/, '')}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['PTTL', key],
      ]),
      signal: AbortSignal.timeout(2500),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ result?: number }>;
    const count = Number(data?.[0]?.result ?? 1);
    let ttlMs = Number(data?.[1]?.result ?? -1);

    if (count === 1 || ttlMs < 0) {
      ttlMs = windowMs;
      await fetch(`${url.replace(/\/+$/, '')}/pexpire/${encodeURIComponent(key)}/${windowMs}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(2000),
      }).catch(() => {});
    }

    const nowMs = Date.now();
    const resetAtMs = nowMs + Math.max(1000, ttlMs);
    const allowed = count <= limit;
    return {
      allowed,
      limit,
      remaining: Math.max(0, limit - count),
      resetAtUnix: Math.ceil(resetAtMs / 1000),
      retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil(ttlMs / 1000)),
      backend: 'upstash',
    };
  } catch (err) {
    console.warn('[RateLimit] Upstash unavailable, falling back to in-memory limiter:', err);
    return null;
  }
}

/**
 * Mengevaluasi rate limit secara hibrida:
 * - Memakai Upstash Redis REST bila UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN terisi.
 * - Otomatis fallback ke bounded in-memory limiter bila belum menggunakan Redis eksternal.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const fullKey = `fq:rl:${config.namespace}:${identifier}`;
  const upstashResult = await checkUpstashRateLimit(fullKey, config.limit, config.windowSeconds);
  if (upstashResult) {
    return upstashResult;
  }
  return checkMemoryRateLimit(fullKey, config.limit, config.windowSeconds);
}

export function createRateLimitExceededResponse(
  result: RateLimitResult,
  message = 'Terlalu banyak permintaan. Silakan tunggu beberapa saat sebelum mencoba lagi.'
): NextResponse<ApiResponse> {
  return NextResponse.json<ApiResponse>(
    {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        details: {
          retryAfterSeconds: result.retryAfterSeconds,
          limit: result.limit,
        },
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetAtUnix),
      },
    }
  );
}

/**
 * Helper khusus pengujian unit untuk mereset memory store.
 */
export function resetMemoryRateLimitStore(): void {
  memoryStore.clear();
}
