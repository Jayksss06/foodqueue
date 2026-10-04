'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Users,
  Search,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Mail,
  Phone
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url = roleFilter === 'ALL'
        ? `/api/admin/users?q=${encodeURIComponent(searchQuery)}`
        : `/api/admin/users?role=${roleFilter}&q=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setUsers(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengubah status pengguna.');
      await fetchUsers();
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
            <Users size={24} color="var(--color-primary-500)" />
            Manajemen Akun Pengguna & Otoritas
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Pantau akun mahasiswa, pemilik tenant kantin, dan hak akses administrator
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
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
            { label: 'Semua Akun', val: 'ALL' },
            { label: 'Mahasiswa / Pelanggan', val: 'CUSTOMER' },
            { label: 'Mitra Tenant', val: 'TENANT' },
            { label: 'Administrator', val: 'ADMIN' },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setRoleFilter(tab.val)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: roleFilter === tab.val ? 750 : 500,
                border: roleFilter === tab.val ? '1px solid var(--color-primary-500)' : '1px solid var(--color-border)',
                background: roleFilter === tab.val ? 'var(--color-primary-500)' : '#FFFFFF',
                color: roleFilter === tab.val ? '#FFFFFF' : 'var(--color-text)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); fetchUsers(); }} style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Cari nama / email pengguna..."
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

      {/* Users Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Pengguna</th>
                <th style={{ padding: '0.75rem 1rem' }}>Kontak</th>
                <th style={{ padding: '0.75rem 1rem' }}>Peran (Role)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Stand Tenant</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status Akun</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    Memuat daftar pengguna...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    Tidak ada akun yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isActive = u.status === 'ACTIVE';

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 800 }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Terdaftar: {new Date(u.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontSize: '0.85rem' }}>{u.email}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{u.phone || '-'}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          background: u.role === 'ADMIN' ? '#EFF6FF' : u.role === 'TENANT' ? '#ECFDF5' : '#F5F5F4',
                          color: u.role === 'ADMIN' ? '#1D4ED8' : u.role === 'TENANT' ? 'var(--color-forest)' : 'var(--color-text)'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>
                        {u.tenant ? u.tenant.name : '-'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 750,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          background: isActive ? '#ECFDF5' : '#FEE2E2',
                          color: isActive ? 'var(--color-forest)' : '#DC2626'
                        }}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        {u.role !== 'ADMIN' && (
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            {isActive ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updatingId === u.id}
                                onClick={() => handleUpdateStatus(u.id, 'SUSPENDED')}
                                style={{ color: '#DC2626', borderColor: '#FECACA', fontSize: '0.75rem' }}
                              >
                                Suspend
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updatingId === u.id}
                                onClick={() => handleUpdateStatus(u.id, 'ACTIVE')}
                                style={{ color: 'var(--color-forest)', borderColor: '#A7F3D0', fontSize: '0.75rem' }}
                              >
                                Aktifkan
                              </Button>
                            )}
                          </div>
                        )}
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
