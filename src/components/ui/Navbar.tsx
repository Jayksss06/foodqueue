'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Bell, UtensilsCrossed, ShieldCheck, LogIn, User as UserIcon } from 'lucide-react';

export function Navbar() {
  const { user } = useAuth();
  const { cart } = useCart();

  return (
    <header className="glass-header" style={{ position: 'sticky', top: 0, zIndex: 40, width: '100%' }}>
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}
      >
        {/* Brand Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 10px rgba(240, 89, 42, 0.3)',
            }}
          >
            <UtensilsCrossed size={20} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ink-900)' }}>
            Food<span style={{ color: 'var(--color-primary-500)' }}>Queue</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '1.5rem',
            fontSize: '0.925rem',
            fontWeight: 600,
          }}
          className="desktop-links"
        >
          <Link href="/home" style={{ color: 'var(--color-ink-700)', transition: 'color var(--transition-fast)' }}>
            Home
          </Link>
          <Link href="/tenants" style={{ color: 'var(--color-ink-700)', transition: 'color var(--transition-fast)' }}>
            Daftar Tenant
          </Link>
          <Link href="/orders" style={{ color: 'var(--color-ink-700)', transition: 'color var(--transition-fast)' }}>
            Pesanan Saya
          </Link>
          {user?.role === 'TENANT' && (
            <Link
              href="/tenant"
              style={{
                color: 'var(--color-primary-600)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <UtensilsCrossed size={16} /> Portal Tenant
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              style={{
                color: '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <ShieldCheck size={16} /> Panel Admin
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Cart Icon */}
          <Link
            href="/cart"
            style={{
              position: 'relative',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-ink-700)',
              display: 'flex',
            }}
          >
            <ShoppingBag size={22} />
            {cart && cart.itemCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  backgroundColor: 'var(--color-primary-500)',
                  color: '#FFFFFF',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {cart.itemCount}
              </span>
            )}
          </Link>

          {/* Notifications */}
          {user && (
            <Link
              href="/notifications"
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-ink-700)',
                display: 'flex',
              }}
            >
              <Bell size={22} />
            </Link>
          )}

          {/* User Account / Login */}
          {user ? (
            <Link
              href="/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-100)',
                  color: 'var(--color-primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="user-name-label">{user.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-500)',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              <LogIn size={16} /> Masuk
            </Link>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .desktop-links {
            display: flex !important;
          }
        }
        @media (max-width: 480px) {
          .user-name-label {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
