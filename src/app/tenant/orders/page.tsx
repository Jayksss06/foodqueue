'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatRupiah, formatSlotTime } from '@/lib/utils';
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  CheckCircle,
  ChefHat,
  Clock,
  User,
  Phone,
  RefreshCw
} from 'lucide-react';

export default function TenantOrdersManagementPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'ALL'
        ? '/api/tenant/orders?pageSize=50'
        : `/api/tenant/orders?status=${statusFilter}&pageSize=50`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      setUpdatingId(orderId);
      const res = await fetch(`/api/tenant/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengubah status');
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: nextStatus }));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(q) ||
      (order.user?.name && order.user.name.toLowerCase().includes(q)) ||
      order.pickupCode.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: '1.75rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
      {/* Top Header */}
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
            Daftar Pesanan Tenant
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Kelola pesanan masuk, pantau status persiapan, dan serahkan pesanan ke pelanggan
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
          Segarkan Data
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Semua', val: 'ALL' },
            { label: 'Perlu Dimasak', val: 'PAID' },
            { label: 'Sedang Dimasak', val: 'PREPARING' },
            { label: 'Siap Diambil', val: 'READY_FOR_PICKUP' },
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

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Cari No. Order / Pelanggan..."
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
                <th style={{ padding: '0.75rem 1rem' }}>Pelanggan</th>
                <th style={{ padding: '0.75rem 1rem' }}>Slot Waktu</th>
                <th style={{ padding: '0.75rem 1rem' }}>Rincian Menu</th>
                <th style={{ padding: '0.75rem 1rem' }}>Total</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    Memuat pesanan...
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
                    <tr
                      key={ord.id}
                      style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s' }}
                    >
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800 }}>
                        {ord.orderNumber}
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                          Kode: <strong style={{ color: 'var(--color-forest)' }}>{ord.pickupCode}</strong>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 650 }}>{ord.user?.name || 'Pelanggan'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{ord.user?.phone || '-'}</div>
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
                      <td style={{ padding: '0.85rem 1rem', maxWidth: '280px' }}>
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
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          {ord.status === 'PAID' && (
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={updatingId === ord.id}
                              onClick={() => handleUpdateStatus(ord.id, 'PREPARING')}
                              style={{ background: 'var(--color-coral)' }}
                            >
                              Mulai Masak
                            </Button>
                          )}
                          {ord.status === 'PREPARING' && (
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={updatingId === ord.id}
                              onClick={() => handleUpdateStatus(ord.id, 'READY_FOR_PICKUP')}
                              style={{ background: 'var(--color-forest)' }}
                            >
                              Siap Ambil
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(ord)}
                          >
                            <Eye size={14} /> Detail
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Detail Pesanan #${selectedOrder.orderNumber}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Status Saat Ini:</span>
                <div style={{ marginTop: '0.2rem' }}><OrderStatusBadge status={selectedOrder.status} /></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Kode Pengambilan:</span>
                <div style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 900, color: 'var(--color-forest)' }}>
                  {selectedOrder.pickupCode}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--color-surface-hover)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Pelanggan: {selectedOrder.user?.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No. Telp / WhatsApp: {selectedOrder.user?.phone || '-'}</div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 750, marginBottom: '0.5rem' }}>Menu yang Dipesan:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px dashed var(--color-border)', paddingBottom: '0.4rem' }}>
                    <div>
                      <span><strong>{item.quantity}x</strong> {item.menuNameSnapshot}</span>
                      {item.notes && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Catatan: {item.notes}</div>}
                    </div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
              <span>Total Pesanan:</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--color-primary-500)' }}>{formatRupiah(selectedOrder.total)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
