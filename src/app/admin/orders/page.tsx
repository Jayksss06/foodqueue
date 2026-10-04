'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { formatRupiah, formatSlotTime } from '@/lib/utils';
import {
  ClipboardList,
  Search,
  RefreshCw,
  Store,
  Clock,
  Calendar
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'ALL'
        ? '/api/admin/orders?pageSize=50'
        : `/api/admin/orders?status=${statusFilter}&pageSize=50`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setOrders(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      (o.tenant?.name && o.tenant.name.toLowerCase().includes(q)) ||
      (o.user?.name && o.user.name.toLowerCase().includes(q)) ||
      o.pickupCode.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: '1.75rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
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
            <ClipboardList size={24} color="var(--color-primary-500)" />
            Pengawasan Pesanan Platform (Platform Orders)
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Monitor seluruh transaksi, ketepatan waktu slot, dan alur pergerakan pesanan di kampus
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Segarkan
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Semua', val: 'ALL' },
            { label: 'Menunggu Bayar', val: 'PENDING_PAYMENT' },
            { label: 'Dibayar', val: 'PAID' },
            { label: 'Dimasak', val: 'PREPARING' },
            { label: 'Siap Ambil', val: 'READY_FOR_PICKUP' },
            { label: 'Selesai', val: 'COMPLETED' },
            { label: 'Batal', val: 'CANCELLED' },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setStatusFilter(tab.val)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: statusFilter === tab.val ? 750 : 500,
                border: statusFilter === tab.val ? '1px solid var(--color-primary-500)' : '1px solid var(--color-border)',
                background: statusFilter === tab.val ? 'var(--color-primary-500)' : '#FFFFFF',
                color: statusFilter === tab.val ? '#FFFFFF' : 'var(--color-text)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Cari order / tenant / pembeli..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Orders Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>No. Order</th>
                <th style={{ padding: '0.75rem 1rem' }}>Stand Tenant</th>
                <th style={{ padding: '0.75rem 1rem' }}>Pelanggan</th>
                <th style={{ padding: '0.75rem 1rem' }}>Slot Pickup</th>
                <th style={{ padding: '0.75rem 1rem' }}>Menu</th>
                <th style={{ padding: '0.75rem 1rem' }}>Total</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    Memuat data transaksi...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    Tidak ada pesanan yang sesuai filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const slotStr = ord.pickupSlot
                    ? `${formatSlotTime(ord.pickupSlot.startAt)} - ${formatSlotTime(ord.pickupSlot.endAt)}`
                    : '-';

                  return (
                    <tr key={ord.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800 }}>
                        {ord.orderNumber}
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Kode: <strong style={{ color: 'var(--color-forest)' }}>{ord.pickupCode}</strong>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>
                        {ord.tenant?.name || '-'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div>{ord.user?.name || '-'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{ord.user?.email || '-'}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          background: '#ECFDF5',
                          color: 'var(--color-forest)',
                          fontWeight: 750,
                          fontSize: '0.8rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {slotStr}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', maxWidth: '240px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ord.items?.map((i: any) => `${i.quantity}x ${i.menuNameSnapshot}`).join(', ')}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 750 }}>
                        {formatRupiah(ord.total)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <OrderStatusBadge status={ord.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
