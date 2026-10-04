export interface PricingItemInput {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PricingTotals {
  subtotal: number;
  fee: number;
  total: number;
  itemCount: number;
}

export interface PriceCheckResult {
  hasPriceChanges: boolean;
  items: {
    menuId: string;
    name: string;
    cartPrice: number;
    currentPrice: number;
    hasChanged: boolean;
  }[];
}

export class Pricing {
  public static readonly DEFAULT_SERVICE_FEE = 1000;

  /**
   * Menghitung subtotal, fee, dan total dalam mata uang Rupiah integer.
   */
  public static calculateTotals(
    items: { price: number; quantity: number }[],
    serviceFee: number = Pricing.DEFAULT_SERVICE_FEE
  ): PricingTotals {
    let subtotal = 0;
    let itemCount = 0;

    for (const item of items) {
      if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        throw new Error(`Quantity item harus berupa bilangan bulat positif.`);
      }
      if (item.price < 0 || !Number.isInteger(item.price)) {
        throw new Error(`Harga item harus berupa bilangan bulat non-negatif.`);
      }
      subtotal += item.price * item.quantity;
      itemCount += item.quantity;
    }

    const fee = Math.max(0, Math.floor(serviceFee));
    const total = subtotal + fee;

    return {
      subtotal,
      fee,
      total,
      itemCount,
    };
  }

  /**
   * Memeriksa apakah ada perubahan harga antara snapshot keranjang dan harga menu saat ini di database.
   */
  public static comparePrices(
    cartItems: { menuId: string; name: string; priceSnapshot: number }[],
    liveMenus: { id: string; price: number }[]
  ): PriceCheckResult {
    const liveMap = new Map(liveMenus.map((m) => [m.id, m.price]));
    let hasPriceChanges = false;

    const checkedItems = cartItems.map((cartItem) => {
      const currentPrice = liveMap.get(cartItem.menuId) ?? cartItem.priceSnapshot;
      const hasChanged = currentPrice !== cartItem.priceSnapshot;
      if (hasChanged) {
        hasPriceChanges = true;
      }

      return {
        menuId: cartItem.menuId,
        name: cartItem.name,
        cartPrice: cartItem.priceSnapshot,
        currentPrice,
        hasChanged,
      };
    });

    return {
      hasPriceChanges,
      items: checkedItems,
    };
  }

  /**
   * Format angka integer rupiah menjadi format tampilan standar Indonesia, contoh: "Rp 25.000"
   */
  public static formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
