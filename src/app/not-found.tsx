import React from 'react';
import Link from 'next/link';
import { UtensilsCrossed, ArrowLeft, SearchX } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
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
      <Card padding="lg" style={{ maxWidth: '460px', width: '100%', textAlign: 'center' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-50)',
            color: 'var(--color-primary-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}
        >
          <SearchX size={30} />
        </div>

        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: 'var(--color-primary-600)',
            textTransform: 'uppercase',
            marginBottom: '0.35rem',
          }}
        >
          404 • Halaman Tidak Ditemukan
        </div>

        <h1 style={{ fontSize: '1.35rem', fontWeight: 850, color: 'var(--color-ink-900)', marginBottom: '0.5rem' }}>
          Menu atau Halaman Tidak Tersedia
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-ink-500)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          Tautan yang Anda buka mungkin sudah berubah, kedaluwarsa, atau salah ketik. Kembali ke daftar stan untuk memesan makanan.
        </p>

        <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/tenants">
            <Button variant="primary" icon={<UtensilsCrossed size={16} />}>
              Jelajahi Stan Kantin
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline" icon={<ArrowLeft size={16} />}>
              Pesanan Saya
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
