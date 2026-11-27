import { prisma } from '@/lib/prisma';
import { Pricing } from '../domain/pricing';

export interface PlatformOperationalSettings {
  platformFee: number;
  paymentExpiryMinutes: number;
  slotDurationMinutes: number;
  maintenanceMode: boolean;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformOperationalSettings = {
  platformFee: Pricing.DEFAULT_SERVICE_FEE,
  paymentExpiryMinutes: 15,
  slotDurationMinutes: 15,
  maintenanceMode: false,
};

const CACHE_TTL_MS = 30_000;

let cachedSettings: PlatformOperationalSettings | null = null;
let cacheExpiresAt = 0;

function parseBoundedInt(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  if (raw === undefined || raw === null || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

/**
 * Pure parser untuk mengonversi baris tabel system_settings menjadi objek pengaturan operasional.
 * Mendukung key kanonik (PLATFORM_FEE, PAYMENT_EXPIRY_MINUTES, SLOT_DURATION_MINUTES, MAINTENANCE_MODE)
 * serta fallback kompatibilitas key lama (service_fee, payment_timeout_minutes).
 */
export function parseSystemSettingsMap(
  records: Array<{ key: string; value: string }>
): PlatformOperationalSettings {
  const map = new Map<string, string>();
  for (const row of records) {
    map.set(row.key, row.value);
  }

  const rawFee = map.get('PLATFORM_FEE') ?? map.get('service_fee');
  const rawExpiry = map.get('PAYMENT_EXPIRY_MINUTES') ?? map.get('payment_timeout_minutes');
  const rawSlotDuration = map.get('SLOT_DURATION_MINUTES');
  const rawMaintenance = map.get('MAINTENANCE_MODE');

  return {
    platformFee: parseBoundedInt(rawFee, DEFAULT_PLATFORM_SETTINGS.platformFee, 0, 100_000),
    paymentExpiryMinutes: parseBoundedInt(
      rawExpiry,
      DEFAULT_PLATFORM_SETTINGS.paymentExpiryMinutes,
      5,
      60
    ),
    slotDurationMinutes: parseBoundedInt(
      rawSlotDuration,
      DEFAULT_PLATFORM_SETTINGS.slotDurationMinutes,
      5,
      60
    ),
    maintenanceMode: (rawMaintenance || '').trim().toLowerCase() === 'true',
  };
}

export class SystemSettingService {
  /**
   * Mengambil konfigurasi operasional platform dari database dengan caching 30 detik.
   */
  public static async getSettings(forceRefresh = false): Promise<PlatformOperationalSettings> {
    const now = Date.now();
    if (!forceRefresh && cachedSettings && now < cacheExpiresAt) {
      return cachedSettings;
    }

    try {
      const rows = await prisma.systemSetting.findMany({
        where: {
          key: {
            in: [
              'PLATFORM_FEE',
              'service_fee',
              'PAYMENT_EXPIRY_MINUTES',
              'payment_timeout_minutes',
              'SLOT_DURATION_MINUTES',
              'MAINTENANCE_MODE',
            ],
          },
        },
        select: { key: true, value: true },
      });

      const resolved = parseSystemSettingsMap(rows);
      cachedSettings = resolved;
      cacheExpiresAt = now + CACHE_TTL_MS;
      return resolved;
    } catch (error) {
      console.error('[SystemSettingService] Gagal membaca system_settings, menggunakan nilai default:', error);
      return cachedSettings || DEFAULT_PLATFORM_SETTINGS;
    }
  }

  /**
   * Menghapus cache agar perubahan pengaturan oleh Admin langsung berlaku pada request berikutnya.
   */
  public static invalidateCache(): void {
    cachedSettings = null;
    cacheExpiresAt = 0;
  }
}
