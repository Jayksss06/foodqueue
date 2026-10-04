'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatSlotTime } from '@/lib/utils';
import {
  Clock,
  Calendar,
  Lock,
  Unlock,
  Sliders,
  AlertTriangle,
  RefreshCw,
  Info
} from 'lucide-react';

export default function TenantSlotsPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  });

  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tenant/slots?date=${selectedDate}`);
      const data = await res.json();
      if (res.ok) {
        setSlots(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedDate]);

  const handleToggleStatus = async (slot: any) => {
    const newStatus = slot.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      setUpdatingId(slot.id);
      const res = await fetch('/api/tenant/slots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: slot.id, status: newStatus }),
      });
      if (res.ok) await fetchSlots();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleChangeCapacity = async (slot: any, delta: number) => {
    const newCap = Math.max(slot.currentOrders, slot.capacity + delta);
    try {
      setUpdatingId(slot.id);
      const res = await fetch('/api/tenant/slots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: slot.id, capacity: newCap }),
      });
      if (res.ok) await fetchSlots();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ padding: '1.75rem', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 850, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={24} color="var(--color-primary-500)" />
            Manajemen Kapasitas Slot Pickup
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Kendalikan batas kuota pesanan per jendela 15 menit untuk mencegah kerumunan fisik (SDG 11)
          </p>
        </div>

        {/* Date Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={18} color="var(--color-text-muted)" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: '0.85rem',
              fontWeight: 650,
              background: '#FFFFFF'
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSlots}
            disabled={loading}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </Button>
        </div>
      </div>

      {/* Info Notice Box */}
      <div style={{
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: 'var(--radius-md)',
        padding: '0.875rem 1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        <Info size={20} color="#1D4ED8" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.85rem', color: '#1E40AF', lineHeight: 1.45 }}>
          <strong>Panduan Operasional:</strong> Jika dapur Anda sedang penuh atau kekurangan bahan mendadak, Anda dapat menutup slot tertentu secara darurat dengan tombol <strong>Tutup Slot</strong>. Pelanggan tidak akan dapat memilih slot tersebut saat checkout.
        </div>
      </div>

      {/* Slots Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-primary-500)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Memuat slot waktu...</p>
        </div>
      ) : slots.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <Clock size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.25rem' }}>Tidak Ada Slot untuk Tanggal Ini</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Pastikan jam operasional toko pada hari tersebut sudah diaktifkan di menu Pengaturan Toko.
          </p>
        </Card>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem'
        }}>
          {slots.map((slot) => {
            const isOpen = slot.status === 'OPEN';
            const isFull = slot.currentOrders >= slot.capacity;
            const percent = slot.capacity > 0 ? Math.min(100, Math.round((slot.currentOrders / slot.capacity) * 100)) : 100;

            return (
              <Card
                key={slot.id}
                style={{
                  padding: '1.25rem',
                  border: !isOpen ? '1px dashed #D1D5DB' : isFull ? '1.5px solid var(--color-coral)' : '1px solid var(--color-border)',
                  background: !isOpen ? '#F9FAFB' : '#FFFFFF',
                  opacity: !isOpen ? 0.75 : 1
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: 850,
                    color: isOpen ? 'var(--color-text)' : 'var(--color-text-muted)'
                  }}>
                    {formatSlotTime(slot.startAt)} – {formatSlotTime(slot.endAt)}
                  </span>

                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: !isOpen ? '#F3F4F6' : isFull ? '#FEE2E2' : '#ECFDF5',
                    color: !isOpen ? '#6B7280' : isFull ? '#DC2626' : 'var(--color-forest)'
                  }}>
                    {!isOpen ? 'TERTUTUP' : isFull ? 'PENUH' : 'TERSEDIA'}
                  </span>
                </div>

                {/* Capacity Counter & Progress */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                    <span>Terisi: <strong>{slot.currentOrders}</strong> pesanan</span>
                    <span>Kuota: <strong>{slot.capacity}</strong></span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${percent}%`,
                      height: '100%',
                      background: percent > 85 ? 'var(--color-coral)' : 'var(--color-forest)',
                      borderRadius: '3px'
                    }} />
                  </div>
                </div>

                {/* Adjust Capacity Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Kuota:</span>
                    <button
                      onClick={() => handleChangeCapacity(slot, -1)}
                      disabled={updatingId === slot.id || slot.capacity <= slot.currentOrders || slot.capacity <= 1}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        background: '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, minWidth: '18px', textAlign: 'center' }}>
                      {slot.capacity}
                    </span>
                    <button
                      onClick={() => handleChangeCapacity(slot, 1)}
                      disabled={updatingId === slot.id || slot.capacity >= 50}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        background: '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Toggle Open/Closed */}
                  <button
                    onClick={() => handleToggleStatus(slot)}
                    disabled={updatingId === slot.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      background: 'none',
                      border: 'none',
                      color: isOpen ? '#DC2626' : 'var(--color-forest)',
                      fontSize: '0.75rem',
                      fontWeight: 750,
                      cursor: 'pointer'
                    }}
                  >
                    {isOpen ? <><Lock size={13} /> Tutup Slot</> : <><Unlock size={13} /> Buka Slot</>}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
