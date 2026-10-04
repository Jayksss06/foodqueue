'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Clock,
  Star,
  FileBarChart,
  Settings,
  Users,
  Store,
  ShieldCheck,
  Globe2,
  LogOut,
  QrCode,
} from 'lucide-react';

export function Sidebar({ role }: { role: 'TENANT' | 'ADMIN' }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const tenantNav = [
    { label: 'Dashboard', href: '/tenant', icon: LayoutDashboard },
    { label: 'Pesanan Masuk', href: '/tenant/orders', icon: ClipboardList },
    { label: 'Kelola Menu', href: '/tenant/menus', icon: UtensilsCrossed },
    { label: 'Slot Pickup', href: '/tenant/slots', icon: Clock },
    { label: 'Scan Pickup', href: '/tenant/scan', icon: QrCode },
    { label: 'Review & Ulasan', href: '/tenant/reviews', icon: Star },
    { label: 'Laporan Penjualan', href: '/tenant/reports', icon: FileBarChart },
    { label: 'Pengaturan Toko', href: '/tenant/settings', icon: Settings },
  ];

  const adminNav = [
    { label: 'Dashboard Utama', href: '/admin', icon: LayoutDashboard },
    { label: 'SDG Impact', href: '/admin/impact', icon: Globe2 },
    { label: 'Kelola Pengguna', href: '/admin/users', icon: Users },
    { label: 'Kelola Tenant', href: '/admin/tenants', icon: Store },
    { label: 'Pantau Pesanan', href: '/admin/orders', icon: ClipboardList },
    { label: 'Pengaturan Sistem', href: '/admin/settings', icon: Settings },
  ];

  const items = role === 'TENANT' ? tenantNav : adminNav;

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: '#1C1917',
        color: '#FAF8F5',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem 0.875rem',
        minHeight: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
      }}
    >
      <div>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            {role === 'TENANT' ? <UtensilsCrossed size={18} /> : <ShieldCheck size={18} />}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.1 }}>
              Food<span style={{ color: 'var(--color-primary-500)' }}>Queue</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#A8A29E', fontWeight: 600 }}>
              {role === 'TENANT' ? 'Portal Merchant' : 'Admin Platform'}
            </div>
          </div>
        </div>

        {/* Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/tenant' || item.href === '/admin'
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? '#FFFFFF' : '#A8A29E',
                  backgroundColor: isActive ? 'rgba(240, 89, 42, 0.15)' : 'transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  transition: 'all var(--transition-fast)',
                  borderLeft: isActive ? '3px solid var(--color-primary-500)' : '3px solid transparent',
                }}
              >
                <Icon size={18} color={isActive ? 'var(--color-primary-500)' : 'inherit'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User info & Logout */}
      <div style={{ borderTop: '1px solid #2E2A27', paddingTop: '1rem' }}>
        <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FAF8F5' }}>{user?.name}</div>
          <div style={{ fontSize: '0.75rem', color: '#78716C' }}>{user?.email}</div>
        </div>

        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            width: '100%',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            color: '#F87171',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <LogOut size={16} /> Keluar
        </button>
      </div>
    </aside>
  );
}
