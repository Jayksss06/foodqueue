'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KpiCard } from '@/components/ui/KpiCard';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { formatRupiah } from '@/lib/utils';
import {
  ShieldCheck,
  Users,
  Store,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Globe2,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      if (res.ok) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

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
        <p style={{ color: 'var(--color-text-muted)' }}>Memuat analitik platform food court...</p>
      </div>
    );
  }

  const kpi = data?.kpi || {};
  const statusDistribution = data?.statusDistribution || [];
  const topTenants = data?.topTenants || [];

  return (
    <div style={{ padding: '1.75rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 850, color: 'var(--color-text)' }}>
              Pusat Kendali Administrator
            </h1>
            <span style={{
              background: '#EFF6FF',
              color: '#1D4ED8',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)'
            }}>
              Sistem Aktif
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Ringkasan transaksi agregat, tenant, pengguna, dan metrik keberlanjutan kampus
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} /> Segarkan
          </Button>

          <Link href="/admin/impact" style={{ textDecoration: 'none' }}>
            <Button
              variant="primary"
              size="sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-forest)' }}
            >
              <Globe2 size={16} /> Lihat SDG Impact
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <KpiCard
          title="Total Transaksi Masuk"
          value={kpi.totalOrders ?? 0}
          icon={ShoppingBag}
        />
        <KpiCard
          title="Gross Merchandise Value"
          value={formatRupiah(kpi.totalRevenue ?? 0)}
          icon={DollarSign}
        />
        <KpiCard
          title="Biaya Platform Terkumpul"
          value={formatRupiah(kpi.platformFeeCollected ?? 0)}
          icon={TrendingUp}
          color="forest"
        />
        <KpiCard
          title="Tenant Aktif / Terdaftar"
          value={`${kpi.activeTenants ?? 0} / ${kpi.totalTenants ?? 0}`}
          icon={Store}
        />
        <KpiCard
          title="Total Pelanggan Terlayani"
          value={kpi.totalUsers ?? 0}
          icon={Users}
        />
      </div>

      {/* 2-Columns: Top Tenants & Status Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Top Tenants Ranking */}
        <Card style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Store size={18} color="var(--color-primary-500)" />
              Tenant Terpopuler (Berdasarkan Volume)
            </h3>
            <Link href="/admin/tenants" style={{ fontSize: '0.8rem', color: 'var(--color-primary-500)', fontWeight: 700, textDecoration: 'none' }}>
              Kelola Tenant →
            </Link>
          </div>

          {topTenants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Belum ada data tenant yang bertransaksi.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {topTenants.map((t: any, idx: number) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-hover)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: idx === 0 ? 'var(--color-coral)' : '#E5E7EB',
                      color: idx === 0 ? '#FFFFFF' : '#4B5563',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 800
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 750, fontSize: '0.9rem' }}>{t.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t.location}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-primary-500)' }}>
                      {t.ordersCount} pesanan
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Status Breakdown */}
        <Card style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={18} color="var(--color-forest)" />
              Distribusi Status Pesanan
            </h3>
            <Link href="/admin/orders" style={{ fontSize: '0.8rem', color: 'var(--color-primary-500)', fontWeight: 700, textDecoration: 'none' }}>
              Lihat Semua Pesanan →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {statusDistribution.map((item: any) => (
              <div
                key={item.status}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderBottom: '1px solid var(--color-border)'
                }}
              >
                <OrderStatusBadge status={item.status} />
                <span style={{ fontWeight: 800, fontSize: '0.95rem', fontFamily: 'monospace' }}>
                  {item.count} order
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Sustainable Campus Food Court Banner */}
      <Card style={{
        background: 'linear-gradient(135deg, #0A4332 0%, #14684F 100%)',
        color: '#FFFFFF',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.15)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Globe2 size={14} /> Sustainable Development Goals (SDG)
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 850, marginBottom: '0.35rem' }}>
            FoodQueue Mendukung SDG 8, SDG 11, dan SDG 12
          </h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.88, maxWidth: '640px', lineHeight: 1.45 }}>
            Solusi pre-order dan scheduled pickup tidak hanya menyelesaikan waktu tunggu mahasiswa, tetapi juga mengurangi sampah sisa makanan kantin dan mencegah penumpukan kerumunan fisik.
          </p>
        </div>

        <Link href="/admin/impact" style={{ textDecoration: 'none' }}>
          <Button
            variant="outline"
            style={{ background: '#FFFFFF', color: 'var(--color-forest)', borderColor: '#FFFFFF', fontWeight: 800 }}
          >
            Buka SDG Impact Dashboard
          </Button>
        </Link>
      </Card>
    </div>
  );
}
