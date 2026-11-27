import { describe, it, expect, afterEach } from 'vitest';
import {
  getJwtSecurityStatus,
  signSessionToken,
  verifySessionToken,
} from '@/lib/jwt';
import {
  parseSystemSettingsMap,
  DEFAULT_PLATFORM_SETTINGS,
} from '@/server/services/system-setting.service';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('JWT Secret Fail-Closed Security Guard (P0.2)', () => {
  it('classifies strong, weak-default, and misconfigured JWT secrets accurately', () => {
    expect(getJwtSecurityStatus('').status).toBe('MISCONFIGURED');
    expect(getJwtSecurityStatus('too-short-secret').status).toBe('MISCONFIGURED');
    expect(
      getJwtSecurityStatus('foodqueue-super-secret-key-2026-production-ready-min-32-chars').status
    ).toBe('WEAK_DEFAULT');
    expect(
      getJwtSecurityStatus('a'.repeat(64)).status
    ).toBe('STRONG');
  });

  it('rejects missing or short JWT_SECRET in production (fail-closed)', async () => {
    (process.env as any).NODE_ENV = 'production';
    process.env.JWT_SECRET = '';

    await expect(
      signSessionToken({
        sub: 'usr_1',
        name: 'Admin',
        email: 'admin@foodqueue.id',
        role: 'ADMIN',
        sessionVersion: 1,
      })
    ).rejects.toThrow(/AUTH_CONFIG_ERROR/);

    process.env.JWT_SECRET = 'short-key-under-32-chars';
    await expect(
      signSessionToken({
        sub: 'usr_1',
        name: 'Admin',
        email: 'admin@foodqueue.id',
        role: 'ADMIN',
        sessionVersion: 1,
      })
    ).rejects.toThrow(/AUTH_CONFIG_ERROR/);
  });

  it('signs and verifies session token cleanly with a strong secret in production', async () => {
    (process.env as any).NODE_ENV = 'production';
    process.env.JWT_SECRET =
      '9f8e7d6c5b4a39281726354453627180abcdef0123456789abcdef0123456789';

    const token = await signSessionToken({
      sub: 'usr_admin_1',
      name: 'Budi Santoso',
      email: 'admin@foodqueue.id',
      role: 'ADMIN',
      sessionVersion: 3,
      tenantId: null,
    });

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe('usr_admin_1');
    expect(verified?.role).toBe('ADMIN');
    expect(verified?.sessionVersion).toBe(3);
  });
});

describe('SystemSettingService Parser & Operational Defaults (P0.3)', () => {
  it('returns safe default values when table is empty', () => {
    expect(parseSystemSettingsMap([])).toEqual(DEFAULT_PLATFORM_SETTINGS);
  });

  it('reads canonical Admin Settings keys correctly', () => {
    const parsed = parseSystemSettingsMap([
      { key: 'PLATFORM_FEE', value: '2500' },
      { key: 'PAYMENT_EXPIRY_MINUTES', value: '20' },
      { key: 'SLOT_DURATION_MINUTES', value: '30' },
      { key: 'MAINTENANCE_MODE', value: 'true' },
    ]);

    expect(parsed).toEqual({
      platformFee: 2500,
      paymentExpiryMinutes: 20,
      slotDurationMinutes: 30,
      maintenanceMode: true,
    });
  });

  it('falls back to legacy seed aliases when canonical keys are absent, and prioritizes canonical keys', () => {
    const legacyOnly = parseSystemSettingsMap([
      { key: 'service_fee', value: '1500' },
      { key: 'payment_timeout_minutes', value: '25' },
    ]);
    expect(legacyOnly.platformFee).toBe(1500);
    expect(legacyOnly.paymentExpiryMinutes).toBe(25);

    const mixed = parseSystemSettingsMap([
      { key: 'service_fee', value: '1500' },
      { key: 'PLATFORM_FEE', value: '2000' },
      { key: 'payment_timeout_minutes', value: '25' },
      { key: 'PAYMENT_EXPIRY_MINUTES', value: '10' },
    ]);
    expect(mixed.platformFee).toBe(2000);
    expect(mixed.paymentExpiryMinutes).toBe(10);
  });

  it('clamps out-of-range numeric values safely', () => {
    const parsed = parseSystemSettingsMap([
      { key: 'PLATFORM_FEE', value: '-500' },
      { key: 'PAYMENT_EXPIRY_MINUTES', value: '2' },
      { key: 'SLOT_DURATION_MINUTES', value: '180' },
      { key: 'MAINTENANCE_MODE', value: 'FALSE' },
    ]);

    expect(parsed.platformFee).toBe(0);
    expect(parsed.paymentExpiryMinutes).toBe(5);
    expect(parsed.slotDurationMinutes).toBe(60);
    expect(parsed.maintenanceMode).toBe(false);
  });
});
