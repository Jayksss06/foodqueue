'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UtensilsCrossed } from 'lucide-react';

export default function RegisterCustomerPage() {
  const { refreshUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Registrasi gagal.');
      }

      await refreshUser();
      router.push('/home');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
              }}
            >
              <UtensilsCrossed size={22} />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-ink-900)' }}>
              Food<span style={{ color: 'var(--color-primary-500)' }}>Queue</span>
            </span>
          </Link>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.75rem' }}>
            Daftar Akun Pelanggan
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-500)' }}>
            Untuk mahasiswa, dosen, staf, dan pengunjung kantin
          </p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-danger-bg)',
                  color: 'var(--color-danger-text)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            <Input
              label="Nama Lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Rina Kartika"
              required
            />

            <Input
              label="Alamat Email Kampus / Pribadi"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
            />

            <Input
              label="Nomor WhatsApp / HP"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08123456789"
              helperText="Digunakan untuk konfirmasi pesanan"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
            />

            <Button type="submit" size="lg" loading={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              Daftar Sekarang
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
            Sudah punya akun?{' '}
            <Link href="/login" style={{ color: 'var(--color-primary-600)', fontWeight: 700 }}>
              Masuk di sini
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
