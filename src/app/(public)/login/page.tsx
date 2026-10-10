'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UtensilsCrossed, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'TENANT') {
        router.push('/tenant');
      } else {
        router.push('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Login gagal.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

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
      <div style={{ width: '100%', maxWidth: '440px' }}>
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
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.75rem', color: 'var(--color-ink-900)' }}>
            Portal Pengelola (Tenant & Admin)
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-500)' }}>
            Masuk khusus pemilik stan makanan dan staf administrator kantin
          </p>
        </div>

        {/* Notice Khusus Pembeli */}
        <div
          style={{
            padding: '0.9rem 1rem',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <UtensilsCrossed size={20} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.85rem', color: '#1E40AF', lineHeight: 1.45 }}>
            <strong>Untuk Pembeli & Mahasiswa:</strong> Anda <b>tidak perlu login</b>! Pemesanan di FoodQueue kini 100% langsung tanpa akun.
            <div style={{ marginTop: '0.35rem' }}>
              <Link
                href="/home"
                style={{
                  color: '#1D4ED8',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                Pesan Makanan Langsung di Sini →
              </Link>
            </div>
          </div>
        </div>

        {/* Demo Accounts Pill Switcher */}
        <div
          style={{
            padding: '0.85rem',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--color-primary-600)',
              marginBottom: '0.5rem',
            }}
          >
            <Sparkles size={14} /> AKUN DEMO PENGUJIAN PENGELOLA:
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => handleDemoFill('tenant.sari@foodqueue.id', 'Tenant123!')}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-50)',
                border: '1px solid var(--color-primary-200)',
                color: 'var(--color-ink-900)',
                cursor: 'pointer',
              }}
            >
              Tenant 1: Bu Sari
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('tenant.kencana@foodqueue.id', 'Tenant123!')}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-50)',
                border: '1px solid var(--color-primary-200)',
                color: 'var(--color-ink-900)',
                cursor: 'pointer',
              }}
            >
              Tenant 2: Mas Dimas
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('admin@foodqueue.id', 'Admin123!')}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-50)',
                border: '1px solid var(--color-primary-200)',
                color: 'var(--color-ink-900)',
                cursor: 'pointer',
              }}
            >
              Admin: Budi
            </button>
          </div>
        </div>

        {/* Card Form */}
        <Card padding="lg">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  color: 'var(--color-danger-text)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            <Input
              label="Email Akun Pengelola"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="stan@foodqueue.id atau admin@foodqueue.id"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" size="lg" loading={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              Masuk ke Portal Pengelola
            </Button>
          </form>

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
            Ingin mendaftarkan stan baru di kantin?{' '}
            <Link href="/register/tenant" style={{ color: 'var(--color-primary-600)', fontWeight: 700 }}>
              Daftar Stan Tenant
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
