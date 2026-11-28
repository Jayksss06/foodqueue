export interface CsvExportOrderRow {
  orderNumber: string;
  pickupCode: string;
  createdAt: Date | string;
  status: string;
  isGuest: boolean;
  guestName?: string | null;
  guestPhone?: string | null;
  subtotal: number;
  fee: number;
  total: number;
  tenant?: { name: string } | null;
  user?: { name: string; email?: string | null; phone?: string | null } | null;
  pickupSlot?: { startAt: Date | string; endAt: Date | string } | null;
  payment?: {
    provider?: string | null;
    method?: string | null;
    channelCode?: string | null;
    status?: string | null;
  } | null;
  items?: Array<{ menuNameSnapshot: string; quantity: number }>;
}

const FORMULA_INJECTION_REGEX = /^[\t\r]*[=+\-@]|^[\t\r]/;

/**
 * Escapes a single cell according to RFC 4180 and neutralizes CSV formula injection (CWE-1236)
 * so spreadsheets (Excel / Google Sheets) cannot execute formulas injected via customer names or notes.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  let raw = value instanceof Date ? value.toISOString() : String(value);

  if (FORMULA_INJECTION_REGEX.test(raw)) {
    raw = `'${raw}`;
  }

  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }

  return raw;
}

/**
 * Serializes headers and rows into an Excel-compatible UTF-8 CSV (with BOM and CRLF).
 */
export function toCsvString(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map((h) => escapeCsvCell(h)).join(',');
  const dataLines = rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(','));
  return `\uFEFF${[headerLine, ...dataLines].join('\r\n')}\r\n`;
}

const SETTLEABLE_STATUSES = new Set([
  'PAID',
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'COMPLETED',
]);

function formatJakartaTimestamp(input: Date | string): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function formatJakartaTime(input: Date | string): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Builds a structured sales & settlement CSV report for either Tenant or Admin exports.
 */
export function buildOrderSettlementCsv(
  orders: CsvExportOrderRow[],
  options: { includeTenantColumn: boolean }
): string {
  const headers = [
    'Waktu Transaksi (WIB)',
    'No. Pesanan',
    'Kode Pickup',
    ...(options.includeTenantColumn ? ['Nama Stan / Tenant'] : []),
    'Tipe Pelanggan',
    'Nama Pelanggan',
    'Kontak Pelanggan',
    'Slot Pengambilan',
    'Ringkasan Item',
    'Subtotal Menu (IDR)',
    'Biaya Layanan Platform (IDR)',
    'Total Dibayar (IDR)',
    'Estimasi Payout Tenant (IDR)',
    'Provider Pembayaran',
    'Kanal Pembayaran',
    'Status Pembayaran',
    'Status Pesanan',
  ];

  const rows = orders.map((order) => {
    const customerName = order.isGuest
      ? order.guestName || 'Pelanggan Tamu'
      : order.user?.name || 'Pelanggan';
    const customerContact = order.isGuest
      ? order.guestPhone || '-'
      : order.user?.phone || order.user?.email || '-';
    const slotRange = order.pickupSlot
      ? `${formatJakartaTime(order.pickupSlot.startAt)}-${formatJakartaTime(order.pickupSlot.endAt)}`
      : '-';
    const itemsSummary = (order.items || [])
      .map((item) => `${item.quantity}x ${item.menuNameSnapshot}`)
      .join('; ');

    const isPaidOrSettled =
      SETTLEABLE_STATUSES.has(order.status) &&
      (!order.payment?.status || order.payment.status === 'PAID');
    const netTenantPayout = isPaidOrSettled ? order.subtotal : 0;

    return [
      formatJakartaTimestamp(order.createdAt),
      order.orderNumber,
      order.pickupCode,
      ...(options.includeTenantColumn ? [order.tenant?.name || '-'] : []),
      order.isGuest ? 'Tamu' : 'Terdaftar',
      customerName,
      customerContact,
      slotRange,
      itemsSummary || '-',
      order.subtotal,
      order.fee,
      order.total,
      netTenantPayout,
      order.payment?.provider || '-',
      order.payment?.channelCode || order.payment?.method || '-',
      order.payment?.status || '-',
      order.status,
    ];
  });

  return toCsvString(headers, rows);
}

export function getJakartaDateStamp(now = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
