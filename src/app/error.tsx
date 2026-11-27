'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[FoodQueue Route Error]:', error);
  }, [error]);

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
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#FEF2F2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}
        >
          <AlertTriangle size={28} />
        </div>

        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-ink-900)', marginBottom: '0.45rem' }}>
          Terjadi Kendala Sementara
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-ink-500)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
          Maaf, halaman mengalami gangguan saat dimuat. Silakan coba muat ulang atau kembali ke halaman utama FoodQueue.
        </p>

        {error?.digest && (
          <div
            style={{
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              color: 'var(--color-ink-400)',
              backgroundColor: 'var(--color-bg)',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-block',
              marginBottom: '1.25rem',
            }}
          >
            Kode Referensi: {error.digest}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => reset()} icon={<RefreshCw size={16} />}>
            Coba Lagi
          </Button>
          <Link href="/tenants">
            <Button variant="outline" icon={<Home size={16} />}>
              Ke Daftar Stan
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
