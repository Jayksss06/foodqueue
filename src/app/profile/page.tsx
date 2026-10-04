'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  ShoppingBag, 
  Bell, 
  Store, 
  ShieldCheck, 
  LogOut, 
  ChevronRight,
  HelpCircle,
  FileText
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-light)', paddingBottom: '90px' }}>
        <Navbar />
        <main className="container" style={{ maxWidth: '600px', padding: '3rem 1rem', textAlign: 'center' }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Memuat profil...</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-light)', paddingBottom: '90px' }}>
        <Navbar />
        <main className="container" style={{ maxWidth: '480px', padding: '4rem 1.5rem', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--color-surface-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: 'var(--color-text-muted)'
          }}>
            <User size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Anda Belum Masuk</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Masuk untuk melihat pesanan Anda, mengatur preferensi, atau mengakses portal merchant.
          </p>
          <Button variant="primary" onClick={() => router.push('/login')}>
            Masuk ke Akun
          </Button>
        </main>
        <BottomNav />
      </div>
    );
  }

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari akun ini?')) {
      await logout();
      router.push('/login');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-light)', paddingBottom: '120px' }}>
      <Navbar />

      <main className="container" style={{ maxWidth: '640px', padding: '1.5rem 1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 850, color: 'var(--color-text)', marginBottom: '1.25rem' }}>
          Akun & Profil
        </h1>

        {/* User Card */}
        <Card style={{ marginBottom: '1.25rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-coral), #D44215)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(240, 89, 42, 0.3)'
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>
                {user.name}
              </h2>
              <span style={{
                display: 'inline-block',
                background: user.role === 'ADMIN' ? '#EFF6FF' : user.role === 'TENANT' ? '#ECFDF5' : '#F5F5F4',
                color: user.role === 'ADMIN' ? '#1D4ED8' : user.role === 'TENANT' ? 'var(--color-forest)' : 'var(--color-text-muted)',
                fontSize: '0.75rem',
                fontWeight: 750,
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                marginTop: '0.25rem'
              }}>
                {user.role === 'ADMIN' ? 'Administrator Sistem' : user.role === 'TENANT' ? 'Pemilik Tenant' : 'Mahasiswa / Pelanggan'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={16} /> {user.email}
            </div>
            {user.phoneNumber && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} /> {user.phoneNumber}
              </div>
            )}
          </div>
        </Card>

        {/* Portal Switching if Tenant / Admin */}
        {user.role === 'TENANT' && (
          <div style={{
            background: 'linear-gradient(135deg, #0A4332 0%, #14684F 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            color: '#FFFFFF',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Store size={24} />
              <div>
                <h4 style={{ fontWeight: 800, fontSize: '0.95rem' }}>Dashboard Tenant Aktif</h4>
                <p style={{ fontSize: '0.8rem', opacity: 0.85 }}>Kelola antrean slot & pesanan masuk</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/tenant')}
              style={{ background: '#FFFFFF', color: 'var(--color-forest)', borderColor: '#FFFFFF', fontWeight: 750 }}
            >
              Buka Merchant Portal
            </Button>
          </div>
        )}

        {user.role === 'ADMIN' && (
          <div style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            color: '#FFFFFF',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldCheck size={24} />
              <div>
                <h4 style={{ fontWeight: 800, fontSize: '0.95rem' }}>Admin Control Center</h4>
                <p style={{ fontSize: '0.8rem', opacity: 0.85 }}>Monitor SDG Impact & operasional food court</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin')}
              style={{ background: '#FFFFFF', color: '#1E1B4B', borderColor: '#FFFFFF', fontWeight: 750 }}
            >
              Buka Admin Portal
            </Button>
          </div>
        )}

        {/* Menu Navigation Links */}
        <Card style={{ padding: '0.5rem', marginBottom: '1.25rem' }}>
          <Link
            href="/orders"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              color: 'var(--color-text)',
              transition: 'background 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShoppingBag size={20} color="var(--color-primary)" />
              <span style={{ fontWeight: 650, fontSize: '0.9rem' }}>Pesanan Saya</span>
            </div>
            <ChevronRight size={18} color="var(--color-text-muted)" />
          </Link>

          <Link
            href="/notifications"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              color: 'var(--color-text)',
              transition: 'background 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Bell size={20} color="var(--color-primary)" />
              <span style={{ fontWeight: 650, fontSize: '0.9rem' }}>Pusat Notifikasi</span>
            </div>
            <ChevronRight size={18} color="var(--color-text-muted)" />
          </Link>

          <div
            onClick={() => alert('FoodQueue v1.0.0 - Platform Pre-Order & Scheduled Pickup Food Court Kampus untuk Mendukung SDG 8, 11, dan 12.')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: 'var(--color-text)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <HelpCircle size={20} color="var(--color-text-muted)" />
              <span style={{ fontWeight: 650, fontSize: '0.9rem' }}>Tentang FoodQueue & Bantuan</span>
            </div>
            <ChevronRight size={18} color="var(--color-text-muted)" />
          </div>
        </Card>

        {/* Logout Action */}
        <Button
          variant="outline"
          fullWidth
          onClick={handleLogout}
          style={{
            borderColor: '#FCA5A5',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.75rem'
          }}
        >
          <LogOut size={18} /> Keluar dari Akun
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
