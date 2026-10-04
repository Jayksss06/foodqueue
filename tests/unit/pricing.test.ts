import { describe, it, expect } from 'vitest';
import { Pricing } from '@/server/domain/pricing';

describe('Pricing Domain Unit Tests', () => {
  it('should calculate subtotal, fee, and total accurately', () => {
    const items = [
      { price: 15000, quantity: 2 }, // 30,000
      { price: 5000, quantity: 1 },  // 5,000
    ];
    const result = Pricing.calculateTotals(items, 1000);

    expect(result.subtotal).toBe(35000);
    expect(result.fee).toBe(1000);
    expect(result.total).toBe(36000);
    expect(result.itemCount).toBe(3);
  });

  it('should reject invalid item prices or quantities', () => {
    expect(() =>
      Pricing.calculateTotals([{ price: -5000, quantity: 1 }])
    ).toThrow();

    expect(() =>
      Pricing.calculateTotals([{ price: 10000, quantity: 0 }])
    ).toThrow();

    expect(() =>
      Pricing.calculateTotals([{ price: 10000, quantity: -2 }])
    ).toThrow();
  });

  it('should detect when menu prices have changed since being added to cart', () => {
    const cartItems = [
      { menuId: 'm1', name: 'Nasi Goreng', priceSnapshot: 15000 },
      { menuId: 'm2', name: 'Es Teh Manis', priceSnapshot: 5000 },
    ];

    const liveMenus = [
      { id: 'm1', price: 18000 }, // price increased!
      { id: 'm2', price: 5000 },
    ];

    const check = Pricing.comparePrices(cartItems, liveMenus);
    expect(check.hasPriceChanges).toBe(true);
    expect(check.items[0].hasChanged).toBe(true);
    expect(check.items[0].cartPrice).toBe(15000);
    expect(check.items[0].currentPrice).toBe(18000);
    expect(check.items[1].hasChanged).toBe(false);
  });

  it('should format Rupiah currency string cleanly', () => {
    const formatted = Pricing.formatRupiah(47000);
    // Should contain "47.000" and "Rp"
    expect(formatted).toMatch(/Rp.*47\.000/);
  });
});
