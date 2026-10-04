'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ClipboardList, User } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  // Jangan tampilkan di halaman tenant dashboard atau admin panel
  if (pathname.startsWith('/tenant') || pathname.startsWith('/admin')) {
    return null;
  }

  const items = [
    { label: 'Home', href: '/home', icon: Home },
    { label: 'Cari', href: '/tenants', icon: Search },
    { label: 'Pesanan', href: '/orders', icon: ClipboardList },
    { label: 'Profil', href: '/profile', icon: User },
  ];

  return (
    <div
      className="mobile-bottom-nav glass-nav"
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '1rem',
        right: '1rem',
        maxWidth: '480px',
        margin: '0 auto',
        height: '60px',
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
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? 'var(--color-primary-500)' : 'var(--color-ink-500)',
              fontSize: '0.72rem',
              fontWeight: isActive ? 700 : 500,
              gap: '2px',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
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
    </div>
  );
}
