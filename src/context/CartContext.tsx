'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CartView, CartItemView } from '@/types';
import { useAuth } from './AuthContext';
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
  const { user } = useAuth();
  const [cart, setCart] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper untuk membaca keranjang guest dari localStorage
  const loadGuestCartFromStorage = (): CartView | null => {
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

  const saveGuestCartToStorage = (cartData: CartView | null) => {
    if (typeof window === 'undefined') return;
    try {
      if (!cartData || cartData.items.length === 0) {
        localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      } else {
        localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(cartData));
      }
    } catch (err) {
      console.error('Failed to save guest cart to storage:', err);
    }
  };

  const refreshCart = useCallback(async () => {
    if (user && user.role === 'CUSTOMER') {
      try {
        setLoading(true);
        const res = await fetch('/api/cart');
        if (res.ok) {
          const json = await res.json();
          setCart(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch user cart:', err);
      } finally {
        setLoading(false);
      }
    } else {
      // Mode Tamu (Guest Checkout)
      const guestCart = loadGuestCartFromStorage();
      setCart(guestCart);
    }
  }, [user]);

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
    // 1. Jika User Login sebagai Customer, simpan ke database cart
    if (user && user.role === 'CUSTOMER') {
      try {
        const res = await fetch('/api/cart/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ menuId, quantity, notes, replaceCart }),
        });

        const json = await res.json();

        if (!res.ok) {
          if (json.error?.code === 'CART_TENANT_CONFLICT') {
            return { success: false, conflict: true, message: json.error.message };
          }
          return { success: false, message: json.error?.message || 'Gagal menambahkan item.' };
        }

        setCart(json.data);
        return { success: true };
      } catch {
        return { success: false, message: 'Koneksi bermasalah.' };
      }
    }

    // 2. Jika Belum Login (Guest Checkout Mode)
    let currentCart = cart || loadGuestCartFromStorage();

    // Deteksi konflik tenant (BR-05)
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
      // Jika disetujui replaceCart, reset item lama
      currentCart = null;
    }

    const items: CartItemView[] = currentCart ? [...currentCart.items] : [];
    const existingIndex = items.findIndex((i) => i.menuId === menuId);

    const price = menuDetails?.price ?? 0;
    const name = menuDetails?.name ?? 'Menu';
    const imageUrl = menuDetails?.imageUrl ?? null;
    const stock = menuDetails?.stock ?? 99;

    if (existingIndex >= 0) {
      const existing = items[existingIndex];
      const newQty = existing.quantity + quantity;
      items[existingIndex] = {
        ...existing,
        quantity: newQty,
        notes: notes !== undefined ? notes : existing.notes,
        subtotal: existing.price * newQty,
      };
    } else {
      items.push({
        id: `guest_item_${menuId}_${Date.now()}`,
        menuId,
        name,
        price,
        imageUrl,
        quantity,
        notes: notes || null,
        stock,
        isAvailable: true,
        priceChanged: false,
        currentPrice: price,
        subtotal: price * quantity,
      });
    }

    const pricing = Pricing.calculateTotals(
      items.map((i) => ({ price: i.price, quantity: i.quantity }))
    );

    const updatedCart: CartView = {
      id: 'guest_cart',
      tenantId: menuDetails?.tenantId ?? currentCart?.tenantId ?? null,
      tenantName: menuDetails?.tenantName ?? currentCart?.tenantName ?? null,
      items,
      subtotal: pricing.subtotal,
      fee: pricing.fee,
      total: pricing.total,
      itemCount: pricing.itemCount,
      hasUnavailableItems: false,
      hasPriceChanges: false,
    };

    saveGuestCartToStorage(updatedCart);
    setCart(updatedCart);
    return { success: true };
  };

  const updateItem = async (itemId: string, quantity: number, notes?: string) => {
    if (user && user.role === 'CUSTOMER') {
      try {
        const res = await fetch(`/api/cart/items/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity, notes }),
        });
        if (res.ok) {
          const json = await res.json();
          setCart(json.data);
        }
      } catch (err) {
        console.error(err);
      }
      return;
    }

    // Guest mode
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
      saveGuestCartToStorage(null);
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

    saveGuestCartToStorage(updatedCart);
    setCart(updatedCart);
  };

  const removeItem = async (itemId: string) => {
    if (user && user.role === 'CUSTOMER') {
      try {
        const res = await fetch(`/api/cart/items/${itemId}`, { method: 'DELETE' });
        if (res.ok) {
          const json = await res.json();
          setCart(json.data);
        }
      } catch (err) {
        console.error(err);
      }
      return;
    }

    // Guest mode
    if (!cart) return;
    const items = cart.items.filter((item) => item.id !== itemId && item.menuId !== itemId);

    if (items.length === 0) {
      saveGuestCartToStorage(null);
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

    saveGuestCartToStorage(updatedCart);
    setCart(updatedCart);
  };

  const clearCart = async () => {
    if (user && user.role === 'CUSTOMER') {
      try {
        await fetch('/api/cart', { method: 'DELETE' });
        await refreshCart();
      } catch (err) {
        console.error(err);
      }
      return;
    }

    saveGuestCartToStorage(null);
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
