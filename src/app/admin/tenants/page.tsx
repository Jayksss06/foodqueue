'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Store,
  CheckCircle,
  XCircle,
  Ban,
  Search,
  RefreshCw,
  AlertTriangle,
  User,
  MapPin
} from 'lucide-react';

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'ALL'
        ? `/api/admin/tenants?q=${encodeURIComponent(searchQuery)}`
        : `/api/admin/tenants?status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setTenants(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengubah status verifikasi.');
      await fetchTenants();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

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
            <Store size={24} color="var(--color-primary-500)" />
            Verifikasi & Manajemen Tenant Mitra
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Tinjau pendaftaran tenant baru, verifikasi stand makanan, dan kelola hak operasional
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchTenants}
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
            { label: 'Perlu Verifikasi', val: 'PENDING_VERIFICATION' },
            { label: 'Aktif', val: 'ACTIVE' },
            { label: 'Ditangguhkan', val: 'SUSPENDED' },
            { label: 'Ditolak', val: 'REJECTED' },
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

        <form onSubmit={(e) => { e.preventDefault(); fetchTenants(); }} style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Cari nama tenant / lokasi..."
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
        </form>
      </div>

      {/* Tenants Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Nama Tenant</th>
                <th style={{ padding: '0.75rem 1rem' }}>Pemilik (Owner)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Lokasi Stand</th>
                <th style={{ padding: '0.75rem 1rem' }}>Menu</th>
                <th style={{ padding: '0.75rem 1rem' }}>Pesanan</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    Memuat daftar tenant...
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    Tidak ada tenant yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                tenants.map((t) => {
                  const isPending = t.status === 'PENDING_VERIFICATION';
                  const isActive = t.status === 'ACTIVE';

                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800 }}>
                        {t.name}
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                          Rating: ⭐ {t.ratingAvg || 0} ({t.ratingCount || 0})
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 650 }}>{t.owner?.name || '-'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t.owner?.email || '-'}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>
                        {t.location}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace' }}>
                        {t._count?.menus || 0} menu
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700 }}>
                        {t._count?.orders || 0} order
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          background: isPending ? '#FEF3C7' : isActive ? '#ECFDF5' : '#FEE2E2',
                          color: isPending ? '#B45309' : isActive ? 'var(--color-forest)' : '#DC2626'
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          {isPending && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={updatingId === t.id}
                                onClick={() => handleUpdateStatus(t.id, 'ACTIVE')}
                                style={{ background: 'var(--color-forest)', fontSize: '0.75rem' }}
                              >
                                Setujui
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updatingId === t.id}
                                onClick={() => handleUpdateStatus(t.id, 'REJECTED')}
                                style={{ color: '#DC2626', borderColor: '#FECACA', fontSize: '0.75rem' }}
                              >
                                Tolak
                              </Button>
                            </>
                          )}

                          {isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={updatingId === t.id}
                              onClick={() => handleUpdateStatus(t.id, 'SUSPENDED')}
                              style={{ color: '#B45309', borderColor: '#FDE68A', fontSize: '0.75rem' }}
                            >
                              Tangguhkan
                            </Button>
                          )}

                          {t.status === 'SUSPENDED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={updatingId === t.id}
                              onClick={() => handleUpdateStatus(t.id, 'ACTIVE')}
                              style={{ color: 'var(--color-forest)', borderColor: '#A7F3D0', fontSize: '0.75rem' }}
                            >
                              Aktifkan Kembali
                            </Button>
                          )}
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
    </div>
  );
}
