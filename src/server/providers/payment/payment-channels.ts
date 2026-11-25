import { PaymentChannelCode, PaymentChannelOption, PaymentMethod } from '@/types';

export const PAYMENT_CHANNELS_BY_METHOD: Record<PaymentMethod, PaymentChannelOption[]> = {
  QRIS: [
    {
      code: 'QRIS',
      method: 'QRIS',
      label: 'QRIS (Semua Bank & E-Wallet)',
      shortLabel: 'QRIS',
      description: 'Scan lewat BCA Mobile, Livin, BRImo, GoPay, OVO, DANA, ShopeePay',
    },
  ],
  VIRTUAL_ACCOUNT: [
    {
      code: 'BCA_VIRTUAL_ACCOUNT',
      method: 'VIRTUAL_ACCOUNT',
      label: 'BCA Virtual Account',
      shortLabel: 'BCA',
      description: 'Transfer via m-BCA, myBCA, KlikBCA, atau ATM BCA',
    },
    {
      code: 'BNI_VIRTUAL_ACCOUNT',
      method: 'VIRTUAL_ACCOUNT',
      label: 'BNI Virtual Account',
      shortLabel: 'BNI',
      description: 'Transfer via wondr by BNI, BNI Mobile, atau ATM BNI',
    },
    {
      code: 'BRI_VIRTUAL_ACCOUNT',
      method: 'VIRTUAL_ACCOUNT',
      label: 'BRI Virtual Account',
      shortLabel: 'BRI',
      description: 'Transfer via BRImo, Internet Banking BRI, atau ATM BRI',
    },
    {
      code: 'MANDIRI_VIRTUAL_ACCOUNT',
      method: 'VIRTUAL_ACCOUNT',
      label: 'Mandiri Virtual Account',
      shortLabel: 'Mandiri',
      description: 'Transfer via Livin by Mandiri atau ATM Mandiri',
    },
    {
      code: 'PERMATA_VIRTUAL_ACCOUNT',
      method: 'VIRTUAL_ACCOUNT',
      label: 'Permata Virtual Account',
      shortLabel: 'Permata',
      description: 'Transfer via PermataMobile X atau jaringan ATM Bersama/Prima',
    },
    {
      code: 'BSI_VIRTUAL_ACCOUNT',
      method: 'VIRTUAL_ACCOUNT',
      label: 'BSI Virtual Account',
      shortLabel: 'BSI',
      description: 'Transfer via BYOND by BSI, BSI Mobile, atau ATM BSI',
    },
  ],
  EWALLET: [
    {
      code: 'DANA',
      method: 'EWALLET',
      label: 'DANA',
      shortLabel: 'DANA',
      description: 'Bayar instan melalui aplikasi atau halaman checkout DANA',
    },
    {
      code: 'SHOPEEPAY',
      method: 'EWALLET',
      label: 'ShopeePay',
      shortLabel: 'ShopeePay',
      description: 'Bayar langsung via aplikasi Shopee / ShopeePay',
    },
    {
      code: 'OVO',
      method: 'EWALLET',
      label: 'OVO',
      shortLabel: 'OVO',
      description: 'Konfirmasi pembayaran melalui akun OVO terdaftar',
      requiresPhone: true,
    },
  ],
};

export const ALL_PAYMENT_CHANNELS: PaymentChannelOption[] = [
  ...PAYMENT_CHANNELS_BY_METHOD.QRIS,
  ...PAYMENT_CHANNELS_BY_METHOD.VIRTUAL_ACCOUNT,
  ...PAYMENT_CHANNELS_BY_METHOD.EWALLET,
];

export function getDefaultChannelForMethod(method: PaymentMethod): PaymentChannelCode {
  return PAYMENT_CHANNELS_BY_METHOD[method][0].code;
}

export function getChannelOption(code: string | null | undefined): PaymentChannelOption | undefined {
  if (!code) return undefined;
  return ALL_PAYMENT_CHANNELS.find((c) => c.code === code);
}

export function isChannelValidForMethod(method: PaymentMethod, code: PaymentChannelCode): boolean {
  return PAYMENT_CHANNELS_BY_METHOD[method].some((c) => c.code === code);
}

export function getChannelLabel(code: string | null | undefined, fallbackMethod?: string | null): string {
  const option = getChannelOption(code);
  if (option) return option.label;
  if (fallbackMethod === 'QRIS') return 'QRIS';
  if (fallbackMethod === 'VIRTUAL_ACCOUNT') return 'Virtual Account';
  if (fallbackMethod === 'EWALLET') return 'E-Wallet';
  return 'Pembayaran Digital';
}

/**
 * Normalisasi nomor HP Indonesia ke format E.164 (+628xxxxxxxxx) yang diwajibkan Xendit.
 */
export function normalizeIndonesianPhoneToE164(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  const cleaned = phone.replace(/[\s\-().]/g, '');
  if (!cleaned) return undefined;
  if (cleaned.startsWith('+62')) return cleaned;
  if (cleaned.startsWith('62')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+62${cleaned.slice(1)}`;
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Sanitasi display name untuk Virtual Account agar tidak ditolak bank Indonesia (hanya alfanumerik & spasi).
 */
export function sanitizeVaDisplayName(name: string): string {
  const sanitized = name
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const prefixed = sanitized ? `FoodQueue ${sanitized}` : 'FoodQueue Kampus';
  return prefixed.slice(0, 50);
}

/**
 * Virtual Account pada Xendit umumnya tidak mendukung automated direct refund via API /refunds.
 */
export function isDirectRefundSupportedChannel(channelCode?: string | null): boolean {
  if (!channelCode) return true;
  return !channelCode.endsWith('_VIRTUAL_ACCOUNT');
}

export function buildPaymentInstructions(
  channelCode: PaymentChannelCode,
  details: { vaNumber?: string; amount: number; vaAccountName?: string }
): string[] {
  const formattedAmount = `Rp ${details.amount.toLocaleString('id-ID')}`;
  const channel = getChannelOption(channelCode);
  const label = channel?.label || channelCode;

  if (channelCode === 'QRIS') {
    return [
      'Buka aplikasi m-Banking atau e-Wallet yang mendukung QRIS (BCA Mobile, Livin, BRImo, GoPay, OVO, DANA, ShopeePay).',
      'Pilih menu Scan / Bayar QRIS lalu pindai kode QR di atas.',
      `Pastikan nominal pembayaran tepat sebesar ${formattedAmount}.`,
      'Selesaikan pembayaran — status pesanan akan terkonfirmasi otomatis dalam beberapa detik.',
    ];
  }

  if (channelCode.endsWith('_VIRTUAL_ACCOUNT')) {
    return [
      `Buka aplikasi mobile banking atau ATM ${channel?.shortLabel || 'Bank'} Anda.`,
      `Pilih menu Transfer ke ${label}.`,
      `Masukkan nomor Virtual Account: ${details.vaNumber || '-'} (a.n. ${details.vaAccountName || 'FoodQueue'}).`,
      `Pastikan nominal tagihan tepat sebesar ${formattedAmount}, lalu konfirmasi pembayaran.`,
    ];
  }

  if (channelCode === 'OVO') {
    return [
      'Pastikan aplikasi OVO terpasang di perangkat dengan nomor HP yang Anda masukkan.',
      'Klik tombol lanjutkan pembayaran atau buka notifikasi tagihan yang masuk di aplikasi OVO.',
      `Konfirmasi pembayaran sebesar ${formattedAmount} sebelum batas waktu berakhir.`,
    ];
  }

  return [
    `Klik tombol "Lanjutkan ke ${label}" untuk membuka halaman otorisasi pembayaran.`,
    `Login ke akun ${label} Anda dan pastikan nominal tepat ${formattedAmount}.`,
    'Setelah pembayaran berhasil, Anda akan diarahkan kembali otomatis ke halaman pelacakan pesanan.',
  ];
}
