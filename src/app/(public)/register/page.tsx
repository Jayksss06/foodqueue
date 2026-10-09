'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UtensilsCrossed, Sparkles, Store, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RegisterInfoPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(240, 89, 42, 0.3)',
              }}
            >
              <UtensilsCrossed size={22} />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-ink-900)' }}>
              Food<span style={{ color: 'var(--color-primary-500)' }}>Queue</span>
            </span>
          </Link>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.75rem', color: 'var(--color-ink-900)' }}>
            Pesan Makanan 100% Bebas Registrasi!
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-500)', marginTop: '0.25rem' }}>
            Sistem FoodQueue kini dirancang tanpa perlu membuat akun atau login bagi pembeli
          </p>
        </div>

        <Card padding="lg">
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-50)',
              border: '1px solid var(--color-primary-200)',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 750, color: 'var(--color-primary-700)', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
              <Sparkles size={16} /> Kenapa Tanpa Login?
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-ink-700)', lineHeight: 1.5 }}>
              Agar mahasiswa dan pengunjung kantin tidak membuang waktu registrasi atau mengingat password saat jam istirahat yang singkat. Cukup pilih makanan, pilih jam ambil, lalu isi nama & nomor WhatsApp saat checkout.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <Link href="/home" style={{ textDecoration: 'none' }}>
              <Button size="lg" style={{ width: '100%' }} icon={<ArrowRight size={18} />}>
                Mulai Pesan Makanan Sekarang
              </Button>
            </Link>

            <Link href="/register/tenant" style={{ textDecoration: 'none' }}>
              <Button variant="outline" size="lg" style={{ width: '100%' }} icon={<Store size={18} />}>
                Daftarkan Stan / Tenant Kantin
              </Button>
            </Link>
          </div>

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--color-border)',
              textAlign: 'center',
              fontSize: '0.85rem',
              color: 'var(--color-ink-500)',
            }}
          >
            Pengelola stan atau administrator kantin?{' '}
            <Link href="/login" style={{ color: 'var(--color-primary-600)', fontWeight: 700 }}>
              Masuk ke Portal Pengelola
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
