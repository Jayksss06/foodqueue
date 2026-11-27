'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[FoodQueue Global Error]:', error);
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          backgroundColor: '#FAF8F5',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#1C1917',
        }}
      >
        <div
          style={{
            maxWidth: '440px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E7E5E4',
            borderRadius: '16px',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          }}
        >
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
            Gangguan Sistem FoodQueue
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#57534E', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
            Terjadi kesalahan tak terduga pada aplikasi. Silakan muat ulang halaman untuk melanjutkan.
          </p>
          {error?.digest && (
            <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#78716C', marginBottom: '1.25rem' }}>
              Ref: {error.digest}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#F0592A',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Muat Ulang
            </button>
            <a
              href="/tenants"
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                border: '1px solid #D6D3D1',
                backgroundColor: '#FFFFFF',
                color: '#1C1917',
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              Beranda
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
