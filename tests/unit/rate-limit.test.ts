import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  checkMemoryRateLimit,
  checkRateLimit,
  createRateLimitExceededResponse,
  getClientIp,
  resetMemoryRateLimitStore,
} from '@/server/http/rate-limit';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  resetMemoryRateLimitStore();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe('Hybrid Rate Limiter (P1.1)', () => {
  it('allows requests up to the configured limit and blocks overflow with retryAfterSeconds', () => {
    const startMs = 1_700_000_000_000;
    const r1 = checkMemoryRateLimit('test:login:1.2.3.4', 3, 60, startMs);
    const r2 = checkMemoryRateLimit('test:login:1.2.3.4', 3, 60, startMs + 5000);
    const r3 = checkMemoryRateLimit('test:login:1.2.3.4', 3, 60, startMs + 10000);
    const r4 = checkMemoryRateLimit('test:login:1.2.3.4', 3, 60, startMs + 15000);

    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.retryAfterSeconds).toBe(45);

    // Resets automatically after window expires
    const r5 = checkMemoryRateLimit('test:login:1.2.3.4', 3, 60, startMs + 61_000);
    expect(r5.allowed).toBe(true);
    expect(r5.remaining).toBe(2);
  });

  it('builds standard HTTP 429 response with rate-limit headers', async () => {
    const blocked = {
      allowed: false,
      limit: 5,
      remaining: 0,
      resetAtUnix: 1_800_000_060,
      retryAfterSeconds: 42,
      backend: 'memory' as const,
    };

    const res = createRateLimitExceededResponse(blocked, 'Terlalu cepat');
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('42');
    expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');

    const json = await res.json();
    expect(json.error?.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(json.error?.message).toBe('Terlalu cepat');
  });

  it('uses Upstash REST pipeline when configured and falls back safely to memory on network error', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example-redis.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => [{ result: 2 }, { result: 45_000 }],
    } as Response);

    const upstashRes = await checkRateLimit('ip-1', {
      namespace: 'auth:login',
      limit: 5,
      windowSeconds: 60,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(upstashRes.backend).toBe('upstash');
    expect(upstashRes.allowed).toBe(true);
    expect(upstashRes.remaining).toBe(3);

    // Simulate Upstash outage -> graceful fallback to memory limiter
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network timeout'));
    const fallbackRes = await checkRateLimit('ip-2', {
      namespace: 'auth:login',
      limit: 5,
      windowSeconds: 60,
    });
    expect(fallbackRes.backend).toBe('memory');
    expect(fallbackRes.allowed).toBe(true);
  });

  it('extracts first hop IP from x-forwarded-for or falls back to x-real-ip', () => {
    const req1 = new NextRequest('https://foodqueue-putd.vercel.app/api/orders', {
      headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' },
    });
    expect(getClientIp(req1)).toBe('203.0.113.10');

    const req2 = new NextRequest('https://foodqueue-putd.vercel.app/api/orders', {
      headers: { 'x-real-ip': '198.51.100.7' },
    });
    expect(getClientIp(req2)).toBe('198.51.100.7');
  });
});
