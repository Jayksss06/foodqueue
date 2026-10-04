'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Store, UtensilsCrossed } from 'lucide-react';

export default function RegisterTenantPage() {
  const { refreshUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          storeName,
          location,
          description,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Pendaftaran tenant gagal.');
      }

      await refreshUser();
      router.push('/tenant');
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
        padding: '2rem 1.5rem',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '520px' }}>
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
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '0.75rem' }}>
            Daftarkan Stan Makanan Anda
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-500)' }}>
            Bergabung dengan platform digitalisasi kantin kampus
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

            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary-600)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem' }}>
              1. Informasi Stan / Toko
            </div>

            <Input
              label="Nama Stan / Tenant"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Contoh: Warung Bu Sari, Kopi Kencana"
              required
            />

            <Input
              label="Lokasi Stan di Kantin"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Kantin Pusat Lt. 1 Stan No. 04"
              required
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink-700)' }}>
                Deskripsi Singkat / Menu Unggulan
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Aneka nasi goreng rempah, ayam bakar, es teh..."
                rows={2}
                style={{
                  padding: '0.625rem 0.875rem',
                  fontSize: '0.95rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary-600)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem', marginTop: '0.5rem' }}>
              2. Akun Pemilik Stan
            </div>

            <Input
              label="Nama Lengkap Pemilik / Pengelola"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Ibu Hj. Siti Sari"
              required
            />

            <Input
              label="Alamat Email Login"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tenant@email.com"
              required
            />

            <Input
              label="Nomor WhatsApp Aktif"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081288880001"
              required
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
              Daftarkan Stan Sekarang
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
            Sudah terdaftar?{' '}
            <Link href="/login" style={{ color: 'var(--color-primary-600)', fontWeight: 700 }}>
              Masuk ke Portal Tenant
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
