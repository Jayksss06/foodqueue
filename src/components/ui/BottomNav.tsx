'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Home, Search, ClipboardList, ShoppingBag } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname() || '';
  const { cart } = useCart();
  const cartItemCount = cart?.itemCount || 0;

  // Jangan tampilkan di halaman tenant dashboard atau admin panel
  if (pathname.startsWith('/tenant') || pathname.startsWith('/admin')) {
    return null;
  }

  const items = [
    { label: 'Beranda', href: '/home', icon: Home, badge: 0 },
    { label: 'Cari Stan', href: '/tenants', icon: Search, badge: 0 },
    { label: 'Keranjang', href: '/checkout', icon: ShoppingBag, badge: cartItemCount },
    { label: 'Pesanan', href: '/orders', icon: ClipboardList, badge: 0 },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Seluler"
      className="mobile-bottom-nav glass-nav"
      style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)',
        left: '0.85rem',
        right: '0.85rem',
        maxWidth: '480px',
        margin: '0 auto',
        height: '62px',
        borderRadius: 'var(--radius-full)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 0.5rem',
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === '/home'
            ? pathname === '/home' || pathname === '/'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? 'var(--color-primary-500)' : 'var(--color-ink-500)',
              fontSize: '0.72rem',
              fontWeight: isActive ? 700 : 500,
              gap: '2px',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {item.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-7px',
                    backgroundColor: 'var(--color-primary-500)',
                    color: '#FFFFFF',
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid #FFFFFF',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <span>{item.label}</span>
          </Link>
        );
      })}

      <style jsx>{`
        @media (min-width: 768px) {
          .mobile-bottom-nav {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}
