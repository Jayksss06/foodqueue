import { describe, it, expect } from 'vitest';
import { checkoutSchema, initiatePaymentSchema, simulatePaymentSchema } from '@/validators';
import { generateUUID } from '@/lib/utils';

describe('Guest Checkout Validation Suite', () => {
  it('harus memvalidasi payload guest checkout dengan format lengkap dan benar', () => {
    const validGuestPayload = {
      pickupSlotId: 'slot_12345',
      notes: 'Tolong sambal dipisah',
      idempotencyKey: generateUUID(),
      isGuest: true,
      guestName: 'Budi Santoso',
      guestPhone: '081234567890',
      guestItems: [
        { menuId: 'menu_01', quantity: 2, notes: 'Pedas sedang' },
        { menuId: 'menu_02', quantity: 1 },
      ],
    };

    const parsed = checkoutSchema.safeParse(validGuestPayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.isGuest).toBe(true);
      expect(parsed.data.guestName).toBe('Budi Santoso');
      expect(parsed.data.guestPhone).toBe('081234567890');
      expect(parsed.data.guestItems?.length).toBe(2);
    }
  });

  it('harus menolak nomor WhatsApp yang bukan format seluler Indonesia', () => {
    const invalidPhonePayload = {
      pickupSlotId: 'slot_12345',
      idempotencyKey: generateUUID(),
      isGuest: true,
      guestName: 'Budi',
      guestPhone: '12345', // Nomor tidak valid
    };

    const parsed = checkoutSchema.safeParse(invalidPhonePayload);
    expect(parsed.success).toBe(false);
  });

  it('harus menolak nama pemesan yang terlalu pendek (< 2 karakter)', () => {
    const shortNamePayload = {
      pickupSlotId: 'slot_12345',
      idempotencyKey: generateUUID(),
      isGuest: true,
      guestName: 'B',
      guestPhone: '081234567890',
    };

    const parsed = checkoutSchema.safeParse(shortNamePayload);
    expect(parsed.success).toBe(false);
  });

  it('harus memvalidasi initiatePayment dan simulatePayment dengan token tamu', () => {
    const guestPayment = {
      orderId: 'order_test_123',
      method: 'QRIS' as const,
      token: generateUUID(),
    };

    const initParsed = initiatePaymentSchema.safeParse(guestPayment);
    expect(initParsed.success).toBe(true);

    const simPayload = {
      outcome: 'SUCCESS' as const,
      token: guestPayment.token,
    };

    const simParsed = simulatePaymentSchema.safeParse(simPayload);
    expect(simParsed.success).toBe(true);
  });
});
