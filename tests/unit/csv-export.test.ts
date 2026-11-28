import { describe, it, expect } from 'vitest';
import { escapeCsvCell, toCsvString, buildOrderSettlementCsv } from '@/lib/csv';

describe('CSV Sales & Settlement Export Utility (P2.3)', () => {
  it('escapes commas, double quotes, and newlines according to RFC 4180', () => {
    expect(escapeCsvCell('Nasi Goreng, Spesial')).toBe('"Nasi Goreng, Spesial"');
    expect(escapeCsvCell('Bakso "Super" Pedas')).toBe('"Bakso ""Super"" Pedas"');
    expect(escapeCsvCell('Baris 1\nBaris 2')).toBe('"Baris 1\nBaris 2"');
    expect(escapeCsvCell(25000)).toBe('25000');
    expect(escapeCsvCell(null)).toBe('');
  });

  it('neutralizes CSV formula injection payloads (CWE-1236) while keeping numeric values raw', () => {
    expect(escapeCsvCell(`=CMD|' /C calc'!A0`)).toBe(`'=CMD|' /C calc'!A0`);
    expect(escapeCsvCell('=SUM(A1,B1)')).toBe(`"'=SUM(A1,B1)"`);
    expect(escapeCsvCell('+1+1')).toBe("'+1+1");
    expect(escapeCsvCell('-2+3')).toBe("'-2+3");
    expect(escapeCsvCell('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
    expect(escapeCsvCell(-1000)).toBe('-1000');
  });

  it('emits UTF-8 BOM and CRLF line endings for Excel compatibility', () => {
    const csv = toCsvString(['Kolom A', 'Kolom B'], [['Nilai 1', 15000]]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toBe('\uFEFFKolom A,Kolom B\r\nNilai 1,15000\r\n');
  });

  it('calculates net tenant payout accurately for completed vs cancelled orders', () => {
    const csv = buildOrderSettlementCsv(
      [
        {
          orderNumber: 'FQ-20261128-0001',
          pickupCode: 'AB12CD',
          createdAt: '2026-11-28T05:00:00.000Z',
          status: 'COMPLETED',
          isGuest: true,
          guestName: '=HYPERLINK("http://evil.test")',
          guestPhone: '081234567890',
          subtotal: 32000,
          fee: 1000,
          total: 33000,
          tenant: { name: 'Warung Bu Sari' },
          pickupSlot: {
            startAt: '2026-11-28T05:30:00.000Z',
            endAt: '2026-11-28T05:45:00.000Z',
          },
          payment: {
            provider: 'XENDIT',
            method: 'QRIS',
            channelCode: 'QRIS',
            status: 'PAID',
          },
          items: [{ menuNameSnapshot: 'Nasi Ayam Bakar', quantity: 2 }],
        },
        {
          orderNumber: 'FQ-20261128-0002',
          pickupCode: 'ZZ99XX',
          createdAt: '2026-11-28T05:10:00.000Z',
          status: 'CANCELLED',
          isGuest: false,
          subtotal: 20000,
          fee: 1000,
          total: 21000,
          tenant: { name: 'Warung Bu Sari' },
          user: { name: 'Budi Santoso', email: 'budi@kampus.ac.id' },
          payment: {
            provider: 'XENDIT',
            method: 'VIRTUAL_ACCOUNT',
            channelCode: 'BCA_VIRTUAL_ACCOUNT',
            status: 'EXPIRED',
          },
          items: [{ menuNameSnapshot: 'Soto Betawi', quantity: 1 }],
        },
      ],
      { includeTenantColumn: true }
    );

    const lines = csv.replace(/^\uFEFF/, '').trim().split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('Nama Stan / Tenant');
    expect(lines[0]).toContain('Estimasi Payout Tenant (IDR)');
    // Formula-injected guestName must be neutralized with leading apostrophe
    expect(lines[1]).toContain(`"'=HYPERLINK(""http://evil.test"")"`);
    // Completed paid order has payout = subtotal (32000)
    expect(lines[1]).toContain(',32000,1000,33000,32000,XENDIT,QRIS,PAID,COMPLETED');
    // Cancelled order has payout = 0
    expect(lines[2]).toContain(',20000,1000,21000,0,XENDIT,BCA_VIRTUAL_ACCOUNT,EXPIRED,CANCELLED');
  });
});
