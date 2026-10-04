'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { formatRupiah, formatSlotTime } from '@/lib/utils';
import { Clock, ShoppingBag, Store, ChevronRight, AlertCircle, Calendar } from 'lucide-react';

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const fetchOrders = async (scope: 'active' | 'history') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders?scope=${scope}&pageSize=30`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.data || []);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-light)', paddingBottom: '120px' }}>
      <Navbar />

      <main className="container" style={{ maxWidth: '760px', padding: '1.5rem 1rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 850, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
            Daftar Pesanan Saya
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Pantau status pre-order dan riwayat pengambilan makanan Anda
          </p>
        </div>

        {/* Tab Filter */}
        <div style={{
          display: 'flex',
          background: 'var(--color-surface)',
          padding: '0.35rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'active' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'active' ? '#FFFFFF' : 'var(--color-text)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Sedang Berjalan (Aktif)
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'history' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'history' ? '#FFFFFF' : 'var(--color-text)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Riwayat Selesai / Batal
          </button>
        </div>

        {/* Orders Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }} />
            <p style={{ color: 'var(--color-text-muted)' }}>Memuat pesanan...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--color-surface-hover)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: 'var(--color-text-muted)'
            }}>
              <ShoppingBag size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {activeTab === 'active' ? 'Belum Ada Pesanan Aktif' : 'Belum Ada Riwayat Pesanan'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '360px', margin: '0 auto 1.5rem' }}>
              {activeTab === 'active'
                ? 'Pesan makanan lebih awal, pilih jam slot pickup, dan nikmati istirahat tanpa antre.'
                : 'Semua pesanan yang telah Anda ambil atau batalkan akan tercatat di sini.'}
            </p>
            <Button variant="primary" onClick={() => router.push('/tenants')}>
              Jelajahi Menu & Tenant
            </Button>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map((order) => {
              const slotTimeStr = order.pickupSlot
                ? `${formatSlotTime(order.pickupSlot.startTime)} - ${formatSlotTime(order.pickupSlot.endTime)}`
                : '-';
              const isReady = order.status === 'READY_FOR_PICKUP';
              const isPendingPayment = order.status === 'PENDING_PAYMENT';

              return (
                <Card 
                  key={order.id} 
                  hoverable 
                  onClick={() => router.push(`/orders/${order.id}`)}
                  style={{
                    border: isReady ? '2px solid var(--color-forest)' : '1px solid var(--color-border)',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                >
                  {/* Top Bar: Tenant & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Store size={18} color="var(--color-primary)" />
                      <span style={{ fontWeight: 750, fontSize: '1rem', color: 'var(--color-text)' }}>
                        {order.tenant?.name || 'Tenant Food Court'}
                      </span>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  {/* Slot & Date Time */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    fontSize: '0.8rem', 
                    color: 'var(--color-text-muted)',
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} />
                      {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.35rem',
                      fontWeight: 700,
                      color: isReady ? 'var(--color-forest)' : 'var(--color-primary)',
                      background: isReady ? '#ECFDF5' : 'var(--color-surface-hover)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      <Clock size={14} />
                      Slot: {slotTimeStr}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      #{order.orderNumber}
                    </span>
                  </div>

                  {/* Items summary */}
                  <div style={{ 
                    padding: '0.75rem', 
                    background: 'var(--color-surface-hover)', 
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '0.75rem',
                    fontSize: '0.85rem'
                  }}>
                    {order.items?.slice(0, 2).map((item: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: idx === 0 && order.items.length > 1 ? '0.25rem' : '0' }}>
                        <span>{item.menuNameSnapshot || item.menuName || item.menu?.name} ×{item.quantity}</span>
                        <span style={{ fontFamily: 'monospace' }}>{formatRupiah(item.subtotal || (item.priceSnapshot * item.quantity))}</span>
                      </div>
                    ))}
                    {order.items?.length > 2 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        + {order.items.length - 2} menu lainnya...
                      </div>
                    )}
                  </div>

                  {/* Footer with Total & Action */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Total Bayar</span>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text)', fontFamily: 'monospace' }}>
                        {formatRupiah(order.total ?? order.totalAmount ?? 0)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {isPendingPayment ? (
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/orders/${order.id}/pay`);
                          }}
                        >
                          Bayar Sekarang
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          Lihat Detail <ChevronRight size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
