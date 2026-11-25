import { PaymentProviderName } from '@/types';
import { PaymentProvider } from './payment-provider.interface';
import { MockPaymentProvider } from './mock-payment-provider';
import { XenditPaymentProvider } from './xendit-payment-provider';
import {
  getConfiguredProviderName,
  getXenditCredentials,
  isProductionEnvironment,
} from './payment-config';

/**
 * Factory untuk mendapatkan payment provider aktif berdasarkan konfigurasi environment.
 * Di NODE_ENV=production, provider MOCK otomatis ditolak (fail-closed).
 */
export function getActivePaymentProvider(): PaymentProvider {
  const providerName = getConfiguredProviderName();
  return getPaymentProviderByName(providerName, true);
}

/**
 * Mengambil instance provider berdasarkan nama (berguna saat refund / cek status order historis).
 */
export function getPaymentProviderByName(
  providerName: string,
  strictProductionGuard = false
): PaymentProvider {
  const normalized = (providerName || '').toUpperCase() as PaymentProviderName;

  if (normalized === 'XENDIT') {
    const creds = getXenditCredentials();
    if (!creds.secretKey) {
      throw new Error(
        'PAYMENT_CONFIG_ERROR: XENDIT_SECRET_KEY belum diatur. Lengkapi kredensial Xendit di environment variables.'
      );
    }
    return new XenditPaymentProvider(creds);
  }

  if (normalized === 'MOCK') {
    if (strictProductionGuard && isProductionEnvironment()) {
      throw new Error(
        'PAYMENT_CONFIG_ERROR: Mock Payment Provider tidak diperbolehkan pada mode production. Set PAYMENT_PROVIDER=XENDIT beserta kredensial Xendit Anda.'
      );
    }
    return new MockPaymentProvider();
  }

  throw new Error(`PAYMENT_CONFIG_ERROR: Provider pembayaran '${providerName}' tidak dikenali.`);
}
