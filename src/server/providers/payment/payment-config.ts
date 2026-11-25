import {
  PaymentEnvironmentMode,
  PaymentProviderName,
  PaymentRuntimeConfig,
} from '@/types';
import { PAYMENT_CHANNELS_BY_METHOD } from './payment-channels';

export interface XenditCredentials {
  secretKey: string;
  webhookToken: string;
  apiBaseUrl: string;
  apiVersion: string;
  mode: PaymentEnvironmentMode;
}

export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getConfiguredProviderName(): PaymentProviderName {
  const raw = process.env.PAYMENT_PROVIDER?.trim().toUpperCase();
  if (raw === 'XENDIT') return 'XENDIT';
  if (raw === 'MOCK') return 'MOCK';

  // Di production atau jika XENDIT_SECRET_KEY sudah terisi, default ke XENDIT
  if (isProductionEnvironment() || Boolean(process.env.XENDIT_SECRET_KEY?.trim())) {
    return 'XENDIT';
  }

  return 'MOCK';
}

export function getXenditMode(secretKey = process.env.XENDIT_SECRET_KEY): PaymentEnvironmentMode {
  const key = secretKey?.trim() || '';
  if (!key) return 'UNCONFIGURED';
  if (key.startsWith('xnd_production_')) return 'PRODUCTION';
  if (key.startsWith('xnd_development_')) return 'SANDBOX';
  return 'SANDBOX';
}

/**
 * Aturan proteksi produksi:
 * Simulasi pembayaran & simulasi status HANYA diizinkan jika:
 * 1. NODE_ENV bukan 'production'
 * 2. Provider aktif adalah 'MOCK'
 * 3. ENABLE_PAYMENT_SIMULATION tidak diset 'false'
 */
export function isSimulationAllowed(): boolean {
  if (isProductionEnvironment()) return false;
  if (getConfiguredProviderName() !== 'MOCK') return false;
  if (process.env.ENABLE_PAYMENT_SIMULATION?.trim().toLowerCase() === 'false') {
    return false;
  }
  return true;
}

export function assertSimulationAllowed(): void {
  if (!isSimulationAllowed()) {
    throw new Error(
      'FORBIDDEN: Fitur simulasi dinonaktifkan pada mode produksi atau saat gateway Xendit aktif.'
    );
  }
}

export function getAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000';
  return raw.replace(/\/+$/, '');
}

export function getXenditCredentials(): XenditCredentials {
  const secretKey = process.env.XENDIT_SECRET_KEY?.trim() || '';
  const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN?.trim() || '';
  const apiBaseUrl = (process.env.XENDIT_API_BASE_URL?.trim() || 'https://api.xendit.co').replace(/\/+$/, '');
  const apiVersion = process.env.XENDIT_API_VERSION?.trim() || '2024-11-11';
  const mode = getXenditMode(secretKey);

  return {
    secretKey,
    webhookToken,
    apiBaseUrl,
    apiVersion,
    mode,
  };
}

export function getPaymentRuntimeConfig(): PaymentRuntimeConfig {
  const provider = getConfiguredProviderName();
  const xendit = getXenditCredentials();

  let mode: PaymentEnvironmentMode = 'MOCK';
  if (provider === 'XENDIT') {
    mode = xendit.mode;
  } else if (isProductionEnvironment()) {
    // MOCK di production dianggap belum terkonfigurasi dengan benar
    mode = 'UNCONFIGURED';
  }

  return {
    provider,
    mode,
    simulationEnabled: isSimulationAllowed(),
    webhookConfigured: Boolean(xendit.webhookToken),
    channels: PAYMENT_CHANNELS_BY_METHOD,
  };
}
