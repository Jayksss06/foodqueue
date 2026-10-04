'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CartView } from '@/types';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartView | null;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addItem: (
    menuId: string,
    quantity: number,
    notes?: string,
    replaceCart?: boolean
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

  const refreshCart = useCallback(async () => {
    if (!user || user.role !== 'CUSTOMER') {
      setCart(null);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/cart');
      if (res.ok) {
        const json = await res.json();
        setCart(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = async (
    menuId: string,
    quantity: number,
    notes?: string,
    replaceCart = false
  ) => {
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
  };

  const updateItem = async (itemId: string, quantity: number, notes?: string) => {
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
  };

  const removeItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        const json = await res.json();
        setCart(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const clearCart = async () => {
    try {
      await fetch('/api/cart', { method: 'DELETE' });
      await refreshCart();
    } catch (err) {
      console.error(err);
    }
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
