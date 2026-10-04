import { describe, it, expect } from 'vitest';
import { SlotPolicy } from '@/server/domain/slot-policy';

describe('SlotPolicy Domain Unit Tests', () => {
  it('should generate correct slot intervals given open hours and 15 min duration', () => {
    const slots = SlotPolicy.generateSlotsForDate('2026-10-05', '11:00', '12:00', 15);
    expect(slots.length).toBe(4);
    expect(slots[0].startTimeLabel).toBe('11:00');
    expect(slots[0].endTimeLabel).toBe('11:15');
    expect(slots[3].startTimeLabel).toBe('11:45');
    expect(slots[3].endTimeLabel).toBe('12:00');
  });

  it('should mark slot as full when currentOrders reaches capacity', () => {
    const now = new Date('2026-10-05T10:00:00Z');
    const result = SlotPolicy.evaluateAvailability({
      slot: {
        id: 'slot-1',
        date: '2026-10-05',
        startAt: new Date('2026-10-05T12:00:00Z'),
        endAt: new Date('2026-10-05T12:15:00Z'),
        capacity: 10,
        currentOrders: 10, // Full!
        status: 'OPEN',
      },
      now,
      preparationMinutes: 10,
    });

    expect(result.isAvailable).toBe(false);
    expect(result.remainingCapacity).toBe(0);
    expect(result.reason).toContain('Slot penuh');
  });

  it('should mark slot as unavailable when too close to preparation time', () => {
    // Current time is 11:25
    const now = new Date('2026-10-05T11:25:00.000Z');
    // Slot starts at 11:30 (only 5 mins ahead)
    const slotStart = new Date('2026-10-05T11:30:00.000Z');
    // But menu preparation time takes 15 minutes!
    const prepMinutes = 15;

    const result = SlotPolicy.evaluateAvailability({
      slot: {
        id: 'slot-2',
        date: '2026-10-05',
        startAt: slotStart,
        endAt: new Date('2026-10-05T11:45:00.000Z'),
        capacity: 10,
        currentOrders: 2,
        status: 'OPEN',
      },
      now,
      preparationMinutes: prepMinutes,
    });

    expect(result.isAvailable).toBe(false);
    expect(result.reason).toContain('Terlalu dekat dengan waktu persiapan');
  });

  it('should mark slot as unavailable when tenant is not accepting orders', () => {
    const now = new Date('2026-10-05T09:00:00.000Z');
    const result = SlotPolicy.evaluateAvailability({
      slot: {
        id: 'slot-3',
        date: '2026-10-05',
        startAt: new Date('2026-10-05T12:00:00.000Z'),
        endAt: new Date('2026-10-05T12:15:00.000Z'),
        capacity: 10,
        currentOrders: 1,
        status: 'OPEN',
      },
      now,
      preparationMinutes: 10,
      isTenantAcceptingOrders: false,
    });

    expect(result.isAvailable).toBe(false);
    expect(result.reason).toContain('tidak menerima pesanan');
  });

  it('should mark slot as available when all criteria are satisfied', () => {
    const now = new Date('2026-10-05T09:00:00.000Z');
    const result = SlotPolicy.evaluateAvailability({
      slot: {
        id: 'slot-4',
        date: '2026-10-05',
        startAt: new Date('2026-10-05T12:00:00.000Z'),
        endAt: new Date('2026-10-05T12:15:00.000Z'),
        capacity: 10,
        currentOrders: 4,
        status: 'OPEN',
      },
      now,
      preparationMinutes: 15,
      isTenantAcceptingOrders: true,
      isTenantActive: true,
    });

    expect(result.isAvailable).toBe(true);
    expect(result.remainingCapacity).toBe(6);
  });
});
