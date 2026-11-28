import { describe, it, expect } from 'vitest';
import { resetMenuStockSchema } from '@/validators';

describe('Daily Menu Stock Reset Validator (P2.4)', () => {
  it('applies default stock of 30 and excludes unavailable menus by default', () => {
    const parsed = resetMenuStockSchema.parse({});
    expect(parsed.defaultStock).toBe(30);
    expect(parsed.includeUnavailable).toBe(false);
    expect(parsed.onlyLowStockBelow).toBeUndefined();
  });

  it('accepts custom valid stock values and optional filters', () => {
    const parsed = resetMenuStockSchema.parse({
      defaultStock: 50,
      includeUnavailable: true,
      onlyLowStockBelow: 10,
    });
    expect(parsed).toEqual({
      defaultStock: 50,
      includeUnavailable: true,
      onlyLowStockBelow: 10,
    });
  });

  it('rejects non-positive, fractional, or excessively large stock values', () => {
    expect(resetMenuStockSchema.safeParse({ defaultStock: 0 }).success).toBe(false);
    expect(resetMenuStockSchema.safeParse({ defaultStock: -5 }).success).toBe(false);
    expect(resetMenuStockSchema.safeParse({ defaultStock: 12.5 }).success).toBe(false);
    expect(resetMenuStockSchema.safeParse({ defaultStock: 501 }).success).toBe(false);
    expect(resetMenuStockSchema.safeParse({ defaultStock: 20, onlyLowStockBelow: 0 }).success).toBe(false);
  });
});
