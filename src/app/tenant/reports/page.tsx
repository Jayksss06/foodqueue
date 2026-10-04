'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KpiCard } from '@/components/ui/KpiCard';
import { formatRupiah } from '@/lib/utils';
import {
  FileBarChart,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Clock,
  Printer,
  Calendar
} from 'lucide-react';

export default function TenantReportsPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tenant/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setDashboardData(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const kpi = dashboardData?.kpi || {
    totalOrders: 0,
    completedCount: 0,
    todayRevenue: 0,
  };

  const aov = kpi.completedCount > 0
    ? Math.round(kpi.todayRevenue / kpi.completedCount)
    : 0;

  return (
    <div style={{ padding: '1.75rem', maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
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
            <FileBarChart size={24} color="var(--color-primary-500)" />
            Laporan Finansial & Penjualan
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Rekap transaksi harian, volume penjualan, dan nilai rata-rata pesanan
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Printer size={15} /> Cetak Laporan
        </Button>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <KpiCard
          title="Total Omzet Bersih"
          value={formatRupiah(kpi.todayRevenue)}
          icon={DollarSign}
        />
        <KpiCard
          title="Pesanan Selesai Terjual"
          value={`${kpi.completedCount} transaksi`}
          icon={ShoppingBag}
        />
        <KpiCard
          title="Rata-rata Nilai Transaksi (AOV)"
          value={formatRupiah(aov)}
          icon={TrendingUp}
          color="forest"
        />
      </div>

      {/* Financial Breakdown Card */}
      <Card style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem' }}>
          Ikhtisar Arus Kas Penjualan
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Gross Merchandise Value (GMV)</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{formatRupiah(kpi.todayRevenue)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Potongan Komisi Platform (0% Promosi Kampus)</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-forest)' }}>Rp 0</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', fontSize: '1.15rem', fontWeight: 850 }}>
            <span>Pendapatan Bersih Ditransfer ke Rekening</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--color-primary-500)' }}>{formatRupiah(kpi.todayRevenue)}</span>
          </div>
        </div>
      </Card>

      {/* Sustainable Canteen Impact Note */}
      <Card style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1.25rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-forest)', marginBottom: '0.35rem' }}>
          Dampak Efisiensi Operasional (SDG 8 & SDG 12)
        </h4>
        <p style={{ fontSize: '0.85rem', color: '#065F46', lineHeight: 1.5 }}>
          Dengan model pre-order FoodQueue, estimasi bahan sisa berkurang signifikan karena porsi diproduksi sesuai slot terpesona. Hal ini menghemat biaya modal harian UMKM kantin hingga 15–20% dibandingkan sistem antrean langsung.
        </p>
      </Card>
    </div>
  );
}
