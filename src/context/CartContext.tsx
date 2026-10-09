'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CartView, CartItemView } from '@/types';
import { Pricing } from '@/server/domain/pricing';

const GUEST_CART_STORAGE_KEY = 'foodqueue_guest_cart';

export interface AddItemMenuDetails {
  name: string;
  price: number;
  imageUrl?: string | null;
  tenantId: string;
  tenantName: string;
  stock?: number;
}

interface CartContextType {
  cart: CartView | null;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addItem: (
    menuId: string,
    quantity: number,
    notes?: string,
    replaceCart?: boolean,
    menuDetails?: AddItemMenuDetails
  ) => Promise<{ success: boolean; conflict?: boolean; message?: string }>;
  updateItem: (itemId: string, quantity: number, notes?: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  cart: null,
  loading: false,
  refreshCart: async () => {},
  addItem: async () => ({ success: false }),
  updateItem: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper untuk membaca keranjang dari localStorage
  const loadCartFromStorage = (): CartView | null => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(GUEST_CART_STORAGE_KEY);
      if (!saved) return null;
      const parsed: CartView = JSON.parse(saved);
      if (!parsed.items || parsed.items.length === 0) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const saveCartToStorage = (cartData: CartView | null) => {
    if (typeof window === 'undefined') return;
    try {
      if (!cartData || cartData.items.length === 0) {
        localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      } else {
        localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(cartData));
      }
    } catch (err) {
      console.error('Failed to save cart to storage:', err);
    }
  };

  const refreshCart = useCallback(async () => {
    const loaded = loadCartFromStorage();
    setCart(loaded);
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = async (
    menuId: string,
    quantity: number,
    notes?: string,
    replaceCart = false,
    menuDetails?: AddItemMenuDetails
  ) => {
    let currentCart = cart || loadCartFromStorage();

    // Deteksi konflik tenant (BR-05: 1 pesanan hanya boleh 1 tenant)
    if (
      currentCart &&
      currentCart.tenantId &&
      menuDetails &&
      currentCart.tenantId !== menuDetails.tenantId
    ) {
      if (!replaceCart) {
        return {
          success: false,
          conflict: true,
          message: `Keranjang Anda berisi menu dari ${currentCart.tenantName || 'stan lain'}. Ingin mengganti keranjang dengan stan ini?`,
        };
      }
      currentCart = null;
    }

    const tenantId = menuDetails?.tenantId || currentCart?.tenantId || '';
    const tenantName = menuDetails?.tenantName || currentCart?.tenantName || 'Stan Makanan';
    let items: CartItemView[] = currentCart ? [...currentCart.items] : [];

    const existingIdx = items.findIndex((i) => i.menuId === menuId);
    if (existingIdx >= 0 && items[existingIdx]) {
      const ex = items[existingIdx];
      const newQty = ex.quantity + quantity;
      items[existingIdx] = {
        ...ex,
        quantity: newQty,
        notes: notes || ex.notes,
        subtotal: ex.price * newQty,
      };
    } else {
      const newItemPrice = menuDetails?.price || 0;
      const newItemName = menuDetails?.name || 'Menu';
      items.push({
        id: `guest_item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        menuId,
        name: newItemName,
        price: newItemPrice,
        quantity,
        subtotal: newItemPrice * quantity,
        notes: notes || null,
        imageUrl: menuDetails?.imageUrl || null,
        stock: menuDetails?.stock ?? 99,
        isAvailable: true,
        priceChanged: false,
        currentPrice: newItemPrice,
      });
    }

    const pricing = Pricing.calculateTotals(
      items.map((i) => ({ price: i.price, quantity: i.quantity }))
    );

    const updatedCart: CartView = {
      id: currentCart?.id || 'guest_cart',
      tenantId,
      tenantName,
      items,
      subtotal: pricing.subtotal,
      fee: pricing.fee,
      total: pricing.total,
      itemCount: pricing.itemCount,
      hasUnavailableItems: false,
      hasPriceChanges: false,
    };

    saveCartToStorage(updatedCart);
    setCart(updatedCart);
    return { success: true };
  };

  const updateItem = async (itemId: string, quantity: number, notes?: string) => {
    if (!cart) return;
    const items = cart.items
      .map((item) => {
        if (item.id === itemId || item.menuId === itemId) {
          return {
            ...item,
            quantity,
            notes: notes !== undefined ? notes : item.notes,
            subtotal: item.price * quantity,
          };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      saveCartToStorage(null);
      setCart(null);
      return;
    }

    const pricing = Pricing.calculateTotals(
      items.map((i) => ({ price: i.price, quantity: i.quantity }))
    );

    const updatedCart: CartView = {
      ...cart,
      items,
      subtotal: pricing.subtotal,
      fee: pricing.fee,
      total: pricing.total,
      itemCount: pricing.itemCount,
    };

    saveCartToStorage(updatedCart);
    setCart(updatedCart);
  };

  const removeItem = async (itemId: string) => {
    if (!cart) return;
    const items = cart.items.filter((item) => item.id !== itemId && item.menuId !== itemId);

    if (items.length === 0) {
      saveCartToStorage(null);
      setCart(null);
      return;
    }

    const pricing = Pricing.calculateTotals(
      items.map((i) => ({ price: i.price, quantity: i.quantity }))
    );

    const updatedCart: CartView = {
      ...cart,
      items,
      subtotal: pricing.subtotal,
      fee: pricing.fee,
      total: pricing.total,
      itemCount: pricing.itemCount,
    };

    saveCartToStorage(updatedCart);
    setCart(updatedCart);
  };

  const clearCart = async () => {
    saveCartToStorage(null);
    setCart(null);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        refreshCart,
        addItem,
        updateItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
