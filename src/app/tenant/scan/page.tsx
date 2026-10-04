'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatRupiah } from '@/lib/utils';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Clock,
  User
} from 'lucide-react';

export default function TenantScanPickupPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifiedOrder, setVerifiedOrder] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code || code.trim().length < 4) {
      setErrorMessage('Masukkan minimal 4 karakter kode pengambilan.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setVerifiedOrder(null);

      const res = await fetch('/api/tenant/pickup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal memverifikasi kode.');
      }

      setVerifiedOrder(data.data.order);
      setCode('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.75rem', maxWidth: '720px', width: '100%', margin: '0 auto' }}>
      {/* Back button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          href="/tenant"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-text-muted)',
            fontSize: '0.85rem',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--color-forest)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
          boxShadow: '0 4px 14px rgba(20, 104, 79, 0.25)'
        }}>
          <QrCode size={28} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 850, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
          Verifikasi Pengambilan Makanan
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Pindai barcode/QR dari aplikasi pelanggan atau masukkan 6 karakter kode pengambilan manual
        </p>
      </div>

      {/* Input Verification Form */}
      <Card style={{ padding: '2rem 1.75rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        <form onSubmit={handleVerify}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>
            MASUKKAN KODE PENGAMBILAN (6 KARAKTER)
          </label>

          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setErrorMessage(null);
            }}
            placeholder="CONTOH: 7K9X2B"
            maxLength={10}
            autoFocus
            style={{
              fontSize: '2rem',
              fontWeight: 900,
              fontFamily: 'monospace',
              letterSpacing: '6px',
              textAlign: 'center',
              width: '100%',
              maxWidth: '360px',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: errorMessage ? '2px solid var(--color-coral)' : '2px solid var(--color-forest)',
              background: '#F9FAFB',
              outline: 'none',
              marginBottom: '1rem',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
            }}
          />

          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: 'var(--color-coral)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1rem'
            }}>
              <AlertCircle size={16} /> {errorMessage}
            </div>
          )}

          <div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || !code}
              style={{
                minWidth: '220px',
                background: 'var(--color-forest)',
                fontSize: '1rem',
                fontWeight: 750
              }}
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi & Serahkan'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Success Result Card */}
      {verifiedOrder && (
        <Card style={{
          border: '2px solid var(--color-forest)',
          background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%)',
          padding: '2rem 1.5rem',
          boxShadow: 'var(--shadow-md)',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--color-forest)',
            fontWeight: 800,
            fontSize: '1.1rem',
            marginBottom: '0.5rem'
          }}>
            <CheckCircle2 size={26} /> PENGAMBILAN BERHASIL DIVERIFIKASI!
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Status pesanan #{verifiedOrder.orderNumber} telah diubah menjadi <strong>COMPLETED (Selesai)</strong>.
          </p>

          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'left',
            border: '1px solid #D1FAE5',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <User size={16} color="var(--color-text-muted)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 750 }}>
                Pelanggan: {verifiedOrder.user?.name || 'Mahasiswa'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <ShoppingBag size={16} color="var(--color-text-muted)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Total Bayar: <strong style={{ color: 'var(--color-text)', fontFamily: 'monospace' }}>{formatRupiah(verifiedOrder.total)}</strong>
              </span>
            </div>

            <div style={{ borderTop: '1px dashed #E5E7EB', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                Item yang Diserahkan:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>
                {verifiedOrder.items?.map((i: any) => (
                  <li key={i.id}>
                    <strong>{i.quantity}x</strong> {i.menuNameSnapshot}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setVerifiedOrder(null)}
            style={{ fontWeight: 700 }}
          >
            Verifikasi Pesanan Lainnya
          </Button>
        </Card>
      )}
    </div>
  );
}
