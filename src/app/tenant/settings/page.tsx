'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Settings,
  Store,
  Clock,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export default function TenantSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [defaultPreparationTime, setDefaultPreparationTime] = useState(15);
  const [maxOrdersPerSlot, setMaxOrdersPerSlot] = useState(5);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);

  // Operating Hours (0 to 6)
  const [hours, setHours] = useState<any[]>([]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tenant/profile');
      const data = await res.json();
      if (res.ok && data.data) {
        const t = data.data;
        setName(t.name || '');
        setDescription(t.description || '');
        setLocation(t.location || '');
        setDefaultPreparationTime(t.defaultPreparationTime || 15);
        setMaxOrdersPerSlot(t.maxOrdersPerSlot || 5);
        setIsAcceptingOrders(t.isAcceptingOrders ?? true);

        // Prepopulate 7 days
        const existingHours: any[] = t.operatingHours || [];
        const fullWeek = Array.from({ length: 7 }, (_, dayOfWeek) => {
          const found = existingHours.find((h) => h.dayOfWeek === dayOfWeek);
          return {
            dayOfWeek,
            openTime: found ? found.openTime : '09:00',
            closeTime: found ? found.closeTime : '17:00',
            isClosed: found ? found.isClosed : dayOfWeek === 0, // default closed Sunday
          };
        });
        setHours(fullWeek);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setSuccessMsg(null);
      const res = await fetch('/api/tenant/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          location,
          defaultPreparationTime: Number(defaultPreparationTime),
          maxOrdersPerSlot: Number(maxOrdersPerSlot),
          isAcceptingOrders,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan profil.');
      setSuccessMsg('Profil toko berhasil diperbarui.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleHourChange = (dayOfWeek: number, field: string, value: any) => {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h))
    );
  };

  const handleSaveHours = async () => {
    try {
      setSavingHours(true);
      setSuccessMsg(null);
      const res = await fetch('/api/tenant/operating-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan jam operasional.');
      setSuccessMsg('Jadwal jam operasional berhasil diperbarui.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingHours(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary-500)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <p style={{ color: 'var(--color-text-muted)' }}>Memuat pengaturan toko...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.75rem', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 850, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={24} color="var(--color-primary-500)" />
          Pengaturan Toko & Jadwal Operasional
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Atur informasi stand, kapasitas dapur, dan jadwal buka harian
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

      {/* Profile Card */}
      <Card style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Store size={20} color="var(--color-primary-500)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Profil Stand / Tenant</h2>
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Nama Stand:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Lokasi Stand di Food Court:
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Stand A-03, Lantai 2 Dekat Tangga"
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Deskripsi Singkat:
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Menyajikan aneka masakan rumahan lezat..."
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Waktu Masak Standar (Menit):
              </label>
              <input
                type="number"
                min={5}
                max={60}
                value={defaultPreparationTime}
                onChange={(e) => setDefaultPreparationTime(parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Batas Pesanan per Slot (Kapasitas):
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={maxOrdersPerSlot}
                onChange={(e) => setMaxOrdersPerSlot(parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          {/* Accept orders toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            background: 'var(--color-surface-hover)',
            borderRadius: 'var(--radius-md)',
            marginTop: '0.5rem'
          }}>
            <div>
              <div style={{ fontWeight: 750, fontSize: '0.9rem' }}>Status Buka Toko (Menerima Pesanan)</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Nonaktifkan sakelar ini jika toko ingin libur mendadak atau stok habis total.
              </div>
            </div>
            <input
              type="checkbox"
              checked={isAcceptingOrders}
              onChange={(e) => setIsAcceptingOrders(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button variant="primary" type="submit" disabled={savingProfile}>
              {savingProfile ? 'Menyimpan...' : 'Simpan Profil Toko'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Operating Hours Card */}
      <Card style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} color="var(--color-primary-500)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Jadwal Jam Buka Mingguan</h2>
          </div>
          <Button variant="primary" size="sm" onClick={handleSaveHours} disabled={savingHours}>
            {savingHours ? 'Menyimpan...' : 'Simpan Jam Buka'}
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {hours.map((h) => {
            const dayName = DAYS[h.dayOfWeek];

            return (
              <div
                key={h.dayOfWeek}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: h.isClosed ? '#F9FAFB' : '#FFFFFF',
                  border: '1px solid var(--color-border)',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ minWidth: '100px', fontWeight: 750, fontSize: '0.9rem', color: h.isClosed ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                  {dayName}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={h.isClosed}
                      onChange={(e) => handleHourChange(h.dayOfWeek, 'isClosed', e.target.checked)}
                    />
                    <span>Tutup</span>
                  </label>

                  {!h.isClosed && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="time"
                        value={h.openTime}
                        onChange={(e) => handleHourChange(h.dayOfWeek, 'openTime', e.target.value)}
                        style={{
                          padding: '0.35rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          fontSize: '0.85rem'
                        }}
                      />
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>s/d</span>
                      <input
                        type="time"
                        value={h.closeTime}
                        onChange={(e) => handleHourChange(h.dayOfWeek, 'closeTime', e.target.value)}
                        style={{
                          padding: '0.35rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
