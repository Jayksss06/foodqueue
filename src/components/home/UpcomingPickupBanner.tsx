'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Sparkles } from 'lucide-react';

const GUEST_ORDERS_STORAGE_KEY = 'foodqueue_guest_orders';

export function UpcomingPickupBanner({ initialOrder }: { initialOrder?: any }) {
  const [activeOrder, setActiveOrder] = useState<any>(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);

  useEffect(() => {
    // Jika tidak ada initialOrder dari server, cek localStorage guest orders
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(GUEST_ORDERS_STORAGE_KEY);
      if (!stored) {
        setLoading(false);
        return;
      }

      const orders = JSON.parse(stored);
      if (!Array.isArray(orders) || orders.length === 0) {
        setLoading(false);
        return;
      }

      // Ambil order pertama (terbaru)
      const latest = orders[0];
      if (!latest?.id) {
        setLoading(false);
        return;
      }

      const tokenParam = latest.guestToken ? `?token=${latest.guestToken}` : '';
      fetch(`/api/orders/${latest.id}${tokenParam}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.data) {
            const ord = json.data;
            const activeStatuses = [
              'PENDING_PAYMENT',
              'PAID',
              'ACCEPTED',
              'PREPARING',
              'READY_FOR_PICKUP',
            ];
            if (activeStatuses.includes(ord.status)) {
              setActiveOrder(ord);
            }
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  const formatSlotTime = (startStr: string | Date, endStr: string | Date) => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(start.getHours())}:${pad(start.getMinutes())}–${pad(end.getHours())}:${pad(end.getMinutes())}`;
    } catch {
      return '-';
    }
  };

  if (activeOrder) {
    const isPendingPay = activeOrder.status === 'PENDING_PAYMENT';
    const isReady = activeOrder.status === 'READY_FOR_PICKUP';
    const isPrep = activeOrder.status === 'PREPARING';
    const isAccepted = activeOrder.status === 'ACCEPTED' || activeOrder.status === 'PAID';

    const targetUrl = isPendingPay
      ? `/orders/${activeOrder.id}/pay${activeOrder.guestToken ? `?token=${activeOrder.guestToken}` : ''}`
      : `/orders/${activeOrder.id}${activeOrder.guestToken ? `?token=${activeOrder.guestToken}` : ''}`;

    const slotTimeText = activeOrder.pickupSlot
      ? formatSlotTime(activeOrder.pickupSlot.startAt, activeOrder.pickupSlot.endAt)
      : '-';

    return (
      <Link href={targetUrl} style={{ textDecoration: 'none', display: 'block', marginBottom: '1.5rem' }}>
        <div
          className="interactive-card pressable"
          style={{
            background: isPendingPay
              ? 'linear-gradient(135deg, #D97706 0%, #B45309 100%)'
              : 'var(--gradient-pickup)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem 1.5rem',
            color: '#FFFFFF',
            boxShadow: 'var(--shadow-float)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
              Upcoming Pickup
            </span>
            <span
              style={{
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                fontSize: '0.75rem',
                fontWeight: 700,
                backdropFilter: 'blur(4px)',
              }}
            >
              {isReady
                ? 'Siap Diambil 🎉'
                : isPrep
                ? 'Sedang Dimasak 🍳'
                : isAccepted
                ? 'Diterima Stan 👨‍🍳'
                : 'Menunggu Pembayaran ⏳'}
            </span>
          </div>

          <div style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            {isPendingPay ? 'Selesaikan Pembayaran' : `Ambil pukul ${slotTimeText}`}
          </div>

          <div style={{ fontSize: '0.875rem', opacity: 0.95, marginBottom: '0.75rem' }}>
            {activeOrder.tenant?.name || 'Stan Kantin'} · #{activeOrder.orderNumber}
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: '6px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: '#FFFFFF',
                width: isReady ? '100%' : isPrep ? '70%' : isAccepted ? '40%' : '15%',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.5s ease-in-out',
              }}
            />
          </div>
        </div>
      </Link>
    );
  }

  // Default Banner jika tidak ada pesanan aktif
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1C1917 0%, #292524 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem 1.5rem',
        color: '#FFFFFF',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Pesan Makanan Lebih Awal</div>
        <div style={{ fontSize: '0.8rem', color: '#A8A29E', marginTop: '0.2rem' }}>
          Tentukan jam ambil, tanpa buang waktu mengantre
        </div>
      </div>
      <Link
        href="/tenants"
        style={{
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-primary-500)',
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: '0.85rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          textDecoration: 'none',
        }}
      >
        Pesan <ArrowRight size={16} />
      </Link>
    </div>
  );
}
