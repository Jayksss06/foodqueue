'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KpiCard } from '@/components/ui/KpiCard';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { formatRupiah } from '@/lib/utils';
import {
  ShoppingBag,
  Clock,
  ChefHat,
  CheckCircle2,
  DollarSign,
  QrCode,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Users,
  Flame,
  ArrowRight
} from 'lucide-react';

export default function TenantDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchDashboard = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const res = await fetch('/api/tenant/dashboard');
      const data = await res.json();
      if (res.ok) {
        setDashboardData(data.data);
      }
    } catch (err) {
      console.error('Error fetching tenant dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh every 15 seconds for real-time kitchen operations
    const interval = setInterval(() => {
      fetchDashboard(true);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await fetch(`/api/tenant/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengubah status');
      await fetchDashboard(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary-500)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <p style={{ color: 'var(--color-text-muted)' }}>Memuat dashboard operasional dapur...</p>
      </div>
    );
  }

  const kpi = dashboardData?.kpi || {
    totalOrders: 0,
    pendingCount: 0,
    preparingCount: 0,
    readyCount: 0,
    completedCount: 0,
    todayRevenue: 0,
  };

  const slotBoard = dashboardData?.slotBoard || [];
  const productionSummary = dashboardData?.productionSummary || [];

  return (
    <div style={{ padding: '1.75rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 850, color: 'var(--color-text)' }}>
              Dashboard Operasional
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: '#ECFDF5',
              color: 'var(--color-forest)',
              fontSize: '0.75rem',
              fontWeight: 750,
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-forest)' }} />
              Live Kitchen Sync
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • Merchant ID: {user?.tenantId?.slice(0, 10) || '-'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Memperbarui...' : 'Refresh'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push('/tenant/scan')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-forest)' }}
          >
            <QrCode size={16} /> Verifikasi Pickup
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <KpiCard
          title="Total Pesanan Hari Ini"
          value={kpi.totalOrders}
          icon={ShoppingBag}
        />
        <KpiCard
          title="Menunggu Diproses"
          value={kpi.pendingCount}
          icon={Clock}
          color="warning"
        />
        <KpiCard
          title="Sedang Dimasak"
          value={kpi.preparingCount}
          icon={ChefHat}
          color="primary"
        />
        <KpiCard
          title="Siap Diambil"
          value={kpi.readyCount}
          icon={CheckCircle2}
          color="forest"
        />
        <KpiCard
          title="Omzet Bersih Hari Ini"
          value={formatRupiah(kpi.todayRevenue)}
          icon={DollarSign}
        />
      </div>

      {/* 2-Column Section: Production Summary & Slot Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Aggregated Kitchen Production (SDG 12 Waste Prevention) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card style={{ borderLeft: '4px solid var(--color-coral)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Flame size={18} color="var(--color-coral)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Dapur: Batch Masak</h3>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>SDG 12 Efisiensi</span>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.4 }}>
              Total porsi menu yang sedang menunggu / disiapkan untuk slot mendatang:
            </p>

            {productionSummary.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Tidak ada antrean porsi masak saat ini.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {productionSummary.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.75rem',
                      background: 'var(--color-surface-hover)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span style={{ fontWeight: 650, color: 'var(--color-text)' }}>{item.name}</span>
                    <span style={{
                      fontWeight: 800,
                      color: 'var(--color-coral)',
                      background: '#FEF3EE',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.9rem'
                    }}>
                      {item.quantity} porsi
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Scanner Promotion Card */}
          <Card style={{ background: 'linear-gradient(135deg, #0A4332 0%, #14684F 100%)', color: '#FFFFFF' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.35rem' }}>
              Pelanggan Tiba di Stand?
            </h4>
            <p style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: '1rem', lineHeight: 1.4 }}>
              Cukup scan QR Code di HP pembeli atau masukkan 6 karakter kode pengambilan manual.
            </p>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => router.push('/tenant/scan')}
              style={{ background: '#FFFFFF', color: 'var(--color-forest)', borderColor: '#FFFFFF', fontWeight: 750 }}
            >
              Buka Scanner QR <ArrowRight size={14} style={{ marginLeft: '0.25rem' }} />
            </Button>
          </Card>
        </div>

        {/* Right Column: Time Slot Schedule Board */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="var(--color-primary-500)" />
              Timeline Slot Pengambilan Hari Ini
            </h2>
            <Link
              href="/tenant/orders"
              style={{ fontSize: '0.85rem', color: 'var(--color-primary-500)', fontWeight: 700, textDecoration: 'none' }}
            >
              Lihat Tabel Semua Pesanan →
            </Link>
          </div>

          {slotBoard.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <Clock size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.25rem' }}>Belum Ada Pesanan Terjadwal</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                Pesanan pre-order yang masuk dan telah dibayar oleh mahasiswa akan otomatis terkelompokkan ke dalam slot waktu masing-masing.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {slotBoard.map((slot: any) => {
                const occupancyPercent = Math.min(100, Math.round((slot.orders.length / slot.capacity) * 100));

                return (
                  <Card key={slot.slotId} style={{ padding: '1.25rem' }}>
                    {/* Slot Header Bar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid var(--color-border)',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          background: 'var(--color-forest)',
                          color: '#FFFFFF',
                          padding: '0.35rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 800,
                          fontSize: '0.95rem'
                        }}>
                          {slot.timeLabel}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                          Kapasitas Slot: <strong>{slot.orders.length}/{slot.capacity} kuota</strong>
                        </span>
                      </div>

                      {/* Mini Capacity Bar */}
                      <div style={{ width: '120px', background: '#E5E7EB', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${occupancyPercent}%`,
                          height: '100%',
                          background: occupancyPercent > 80 ? 'var(--color-coral)' : 'var(--color-forest)',
                          borderRadius: '4px'
                        }} />
                      </div>
                    </div>

                    {/* Orders in this Slot */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {slot.orders.map((ord: any) => {
                        const isPending = ord.status === 'PAID' || ord.status === 'ACCEPTED';
                        const isPreparing = ord.status === 'PREPARING';
                        const isReady = ord.status === 'READY_FOR_PICKUP';

                        return (
                          <div
                            key={ord.id}
                            style={{
                              border: isReady ? '1.5px solid var(--color-forest)' : '1px solid var(--color-border)',
                              background: isReady ? '#F0FDF4' : 'var(--color-surface)',
                              borderRadius: 'var(--radius-md)',
                              padding: '0.875rem 1rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '0.75rem'
                            }}
                          >
                            <div style={{ flex: 1, minWidth: '240px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{ord.orderNumber}</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>• {ord.customerName}</span>
                                <OrderStatusBadge status={ord.status} />
                              </div>

                              <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', marginBottom: '0.25rem', fontWeight: 600 }}>
                                {ord.items}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{formatRupiah(ord.total)}</span>
                                <span>• Kode Ambil: <strong style={{ color: 'var(--color-forest)', letterSpacing: '1px' }}>{ord.pickupCode}</strong></span>
                              </div>
                            </div>

                            {/* Action Buttons based on state machine */}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {isPending && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={updatingOrderId === ord.id}
                                  onClick={() => handleUpdateStatus(ord.id, 'PREPARING')}
                                  style={{ background: 'var(--color-coral)' }}
                                >
                                  {updatingOrderId === ord.id ? 'Memperbarui...' : 'Mulai Masak'}
                                </Button>
                              )}

                              {isPreparing && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={updatingOrderId === ord.id}
                                  onClick={() => handleUpdateStatus(ord.id, 'READY_FOR_PICKUP')}
                                  style={{ background: 'var(--color-forest)' }}
                                >
                                  {updatingOrderId === ord.id ? 'Memperbarui...' : 'Pesanan Siap Diambil'}
                                </Button>
                              )}

                              {isReady && (
                                <span style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 750,
                                  color: 'var(--color-forest)',
                                  background: '#ECFDF5',
                                  padding: '0.4rem 0.75rem',
                                  borderRadius: 'var(--radius-md)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem'
                                }}>
                                  <CheckCircle2 size={16} /> Menunggu Pengambilan
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
