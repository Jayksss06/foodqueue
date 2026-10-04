'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Settings,
  Save,
  CheckCircle2,
  Sliders,
  DollarSign,
  Clock,
  Shield,
  CreditCard,
  Info
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [platformFee, setPlatformFee] = useState('1000');
  const [paymentExpiry, setPaymentExpiry] = useState('15');
  const [slotDuration, setSlotDuration] = useState('15');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [mockPayment, setMockPayment] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          for (const item of json.data) {
            if (item.key === 'PLATFORM_FEE') setPlatformFee(item.value);
            if (item.key === 'PAYMENT_EXPIRY_MINUTES') setPaymentExpiry(item.value);
            if (item.key === 'SLOT_DURATION_MINUTES') setSlotDuration(item.value);
            if (item.key === 'MAINTENANCE_MODE') setMaintenanceMode(item.value === 'true');
            if (item.key === 'MOCK_PAYMENT_ENABLED') setMockPayment(item.value === 'true');
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg(null);

      const payload = {
        settings: [
          { key: 'PLATFORM_FEE', value: platformFee, description: 'Biaya layanan per transaksi dalam Rupiah' },
          { key: 'PAYMENT_EXPIRY_MINUTES', value: paymentExpiry, description: 'Batas waktu pembayaran sebelum order kedaluwarsa' },
          { key: 'SLOT_DURATION_MINUTES', value: slotDuration, description: 'Durasi standar interval jendela waktu pickup' },
          { key: 'MAINTENANCE_MODE', value: maintenanceMode.toString(), description: 'Mode pemeliharaan platform' },
          { key: 'MOCK_PAYMENT_ENABLED', value: mockPayment.toString(), description: 'Gunakan simulasi simulator pembayaran instan' },
        ],
      };

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal menyimpan pengaturan.');

      setSuccessMsg('Pengaturan platform berhasil diperbarui.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '1.75rem', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 850, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={24} color="var(--color-primary-500)" />
          Pengaturan Sistem & Konfigurasi Platform
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Kelola parameter operasional, biaya layanan, dan simulator pembayaran platform
        </p>
      </div>

      {successMsg && (
        <div style={{
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          color: 'var(--color-forest)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.85rem',
          fontWeight: 700
        }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Financial & Time Parameters */}
        <Card style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={20} color="var(--color-primary-500)" />
            Parameter Finansial & Durasi Slot
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Biaya Layanan Platform (Rp):
              </label>
              <input
                type="number"
                min={0}
                step={500}
                value={platformFee}
                onChange={(e) => setPlatformFee(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Dikenakan per transaksi untuk pemeliharaan server food court.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Batas Waktu Bayar / TTL (Menit):
              </label>
              <input
                type="number"
                min={5}
                max={60}
                value={paymentExpiry}
                onChange={(e) => setPaymentExpiry(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Waktu sebelum pesanan yang belum dibayar otomatis dibatalkan & slot dilepas.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Interval Durasi Slot Pickup (Menit):
              </label>
              <input
                type="number"
                min={10}
                max={60}
                step={5}
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Jendela waktu pengambilan berulang per hari (standar: 15 menit).
              </span>
            </div>
          </div>
        </Card>

        {/* Payment & Environment Settings */}
        <Card style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={20} color="var(--color-forest)" />
            Integrasi Gateway & Pengujian
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              background: 'var(--color-surface-hover)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <div style={{ fontWeight: 750, fontSize: '0.9rem' }}>Simulator Mock Payment Provider</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Mengizinkan pengujian alur bayar instan (QRIS, VA, E-Wallet) tanpa integrasi kartu kredit nyata.
                </div>
              </div>
              <input
                type="checkbox"
                checked={mockPayment}
                onChange={(e) => setMockPayment(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              background: 'var(--color-surface-hover)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <div style={{ fontWeight: 750, fontSize: '0.9rem', color: '#DC2626' }}>Mode Pemeliharaan (Maintenance Mode)</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Jika aktif, pelanggan tidak dapat membuat pesanan baru sementara waktu.
                </div>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="primary"
            type="submit"
            size="lg"
            disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', minWidth: '200px' }}
          >
            <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
