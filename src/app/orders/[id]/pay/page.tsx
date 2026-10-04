'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatRupiah } from '@/lib/utils';
import { PaymentMethod } from '@/types';
import {
  Clock,
  QrCode,
  Smartphone,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function OrderPayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('QRIS');
  const [chargeData, setChargeData] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Countdown timer 15 menit
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(15 * 60);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.data) {
          setOrder(j.data);
          if (j.data.status !== 'PENDING_PAYMENT') {
            // Jika sudah dibayar, langsung arahkan ke tracking
            router.push(`/orders/${id}`);
          }
          if (j.data.expiresAt) {
            const exp = new Date(j.data.expiresAt).getTime();
            const now = Date.now();
            setTimeLeftSeconds(Math.max(0, Math.floor((exp - now) / 1000)));
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, router]);

  // Inisialisasi payment instruction saat method berubah
  useEffect(() => {
    if (!order || order.status !== 'PENDING_PAYMENT') return;

    fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id, method: selectedMethod }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.data?.charge) {
          setChargeData(j.data.charge);
        }
      })
      .catch(console.error);
  }, [id, selectedMethod, order]);

  // Countdown interval
  useEffect(() => {
    if (timeLeftSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeftSeconds]);

  const handleSimulatePayment = async (outcome: 'SUCCESS' | 'FAILURE') => {
    setIsSimulating(true);
    setError(null);

    try {
      const res = await fetch(`/api/payments/${id}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome }),
      });

      const json = await res.json();

      if (!res.ok || !json.data?.success) {
        throw new Error(json.error?.message || json.data?.message || 'Simulasi pembayaran gagal.');
      }

      // Redirect ke status order
      router.push(`/orders/${id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--color-ink-400)' }}>
          Memuat halaman pembayaran...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '5rem' }}>Pesanan tidak ditemukan</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '1.5rem 1rem 4rem 1rem' }}>
        <div className="container-sm" style={{ maxWidth: '540px' }}>
          {/* Header & Countdown */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <Badge variant="warning" style={{ marginBottom: '0.5rem' }}>
              Menunggu Pembayaran
            </Badge>

            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-ink-900)' }}>
              Pembayaran Pesanan #{order.orderNumber}
            </h1>

            <div
              className="tabular-nums"
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--color-primary-600)',
                margin: '0.25rem 0',
              }}
            >
              {formatRupiah(order.total)}
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.875rem',
                color: timeLeftSeconds <= 120 ? 'var(--color-danger-text)' : 'var(--color-ink-500)',
                fontWeight: 600,
              }}
            >
              <Clock size={16} /> Selesaikan dalam{' '}
              <span className="tabular-nums" style={{ fontWeight: 800 }}>
                {formatCountdown(timeLeftSeconds)}
              </span>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-danger-bg)',
                color: 'var(--color-danger-text)',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Payment Method Selector */}
          <Card padding="md" style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-ink-900)', display: 'block', marginBottom: '0.75rem' }}>
              Pilih Metode Pembayaran
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {[
                { method: 'QRIS' as PaymentMethod, label: 'QRIS', icon: <QrCode size={18} /> },
                { method: 'EWALLET' as PaymentMethod, label: 'E-Wallet', icon: <Smartphone size={18} /> },
                { method: 'VIRTUAL_ACCOUNT' as PaymentMethod, label: 'VA Bank', icon: <Building2 size={18} /> },
              ].map((m) => (
                <button
                  key={m.method}
                  type="button"
                  onClick={() => setSelectedMethod(m.method)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.75rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${selectedMethod === m.method ? 'var(--color-primary-500)' : 'var(--color-border)'}`,
                    backgroundColor: selectedMethod === m.method ? 'var(--color-primary-50)' : 'var(--color-surface)',
                    color: selectedMethod === m.method ? 'var(--color-primary-600)' : 'var(--color-ink-700)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Payment Instruction & Mock Payload */}
          <Card padding="lg" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            {selectedMethod === 'QRIS' && (
              <div>
                <div
                  style={{
                    width: '180px',
                    height: '180px',
                    margin: '0 auto 1rem auto',
                    padding: '0.75rem',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=FOODQUEUE_MOCK_QRIS_PAYMENT"
                    alt="Mock QRIS"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Scan QRIS di atas</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-500)', marginTop: '0.2rem' }}>
                  Mendukung BCA Mobile, Livin, GoPay, OVO, Dana, ShopeePay
                </div>
              </div>
            )}

            {selectedMethod === 'VIRTUAL_ACCOUNT' && (
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-500)' }}>Nomor Virtual Account:</div>
                <div className="tabular-nums" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-ink-900)', letterSpacing: '0.05em' }}>
                  {chargeData?.vaNumber || '8808 1234 5678 9012'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-400)', marginTop: '0.2rem' }}>
                  Atas Nama: FoodQueue Kantin Kampus
                </div>
              </div>
            )}

            {selectedMethod === 'EWALLET' && (
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Konfirmasi di Smartphone</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-500)', marginTop: '0.25rem' }}>
                  Buka aplikasi e-wallet Anda dan setujui permintaan pembayaran sebesar{' '}
                  <b>{formatRupiah(order.total)}</b>.
                </p>
              </div>
            )}
          </Card>

          {/* SIMULATION ACTION BUTTONS (Khusus Demo / Testing Akademik) */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--color-primary-50)',
              border: '2px dashed var(--color-primary-500)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 800,
                color: 'var(--color-primary-600)',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
              }}
            >
              <Sparkles size={16} /> Mode Simulasi Pembayaran Prototype
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-700)', marginBottom: '1rem' }}>
              Klik tombol di bawah untuk menguji respon sistem saat pembayaran berhasil atau gagal:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Button
                size="lg"
                loading={isSimulating}
                onClick={() => handleSimulatePayment('SUCCESS')}
                style={{ width: '100%', backgroundColor: 'var(--color-secondary-500)' }}
                icon={<CheckCircle2 size={18} />}
              >
                ⚡ Simulasikan Pembayaran Sukses
              </Button>

              <Button
                variant="outline"
                loading={isSimulating}
                onClick={() => handleSimulatePayment('FAILURE')}
                style={{ width: '100%', borderColor: 'var(--color-danger-border)', color: 'var(--color-danger-text)' }}
              >
                Simulasikan Pembayaran Gagal
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
