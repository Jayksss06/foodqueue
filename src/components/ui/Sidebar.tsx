'use client';

import React, { useState } from 'react';
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
  Menu as MenuIcon,
  X,
} from 'lucide-react';

export function Sidebar({ role }: { role: 'TENANT' | 'ADMIN' }) {
  const pathname = usePathname() || '';
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <>
      {/* Mobile Top Bar for Merchant/Admin */}
      <div className="merchant-mobile-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            style={{
              padding: '0.45rem',
              color: '#FAF8F5',
              backgroundColor: '#2E2A27',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            aria-label="Buka Menu Pengelola"
          >
            <MenuIcon size={20} />
          </button>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FAF8F5' }}>
            {role === 'TENANT' ? 'Portal Merchant' : 'Admin Platform'}
          </div>
        </div>

        <Link
          href="/home"
          style={{
            fontSize: '0.78rem',
            color: 'var(--color-primary-400)',
            fontWeight: 700,
          }}
        >
          Lihat Web
        </Link>
      </div>

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="sidebar-backdrop"
        />
      )}

      <aside className={`merchant-sidebar ${mobileOpen ? 'open' : ''}`}>
      <div>
        {/* Brand & Mobile Close Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
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

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="mobile-close-btn"
            style={{
              padding: '0.35rem',
              color: '#A8A29E',
              backgroundColor: 'transparent',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
            }}
            aria-label="Tutup Menu"
          >
            <X size={20} />
          </button>
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
                onClick={() => setMobileOpen(false)}
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

      <style jsx>{`
        .merchant-mobile-bar {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background-color: #1c1917;
          border-bottom: 1px solid #2e2a27;
          position: sticky;
          top: 0;
          z-index: 35;
        }

        .merchant-sidebar {
          width: 240px;
          background-color: #1c1917;
          color: #faf8f5;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1.25rem 0.875rem;
          min-height: 100vh;
          position: sticky;
          top: 0;
          flex-shrink: 0;
          transition: transform 0.25s ease;
          z-index: 50;
        }

        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.6);
          z-index: 45;
          backdrop-filter: blur(2px);
        }

        .mobile-close-btn {
          display: none;
        }

        @media (max-width: 768px) {
          .merchant-mobile-bar {
            display: flex;
          }

          .mobile-close-btn {
            display: flex;
          }

          .merchant-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            height: 100%;
            transform: translateX(-100%);
            box-shadow: var(--shadow-xl);
          }

          .merchant-sidebar.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </aside>
    </>
  );
}
