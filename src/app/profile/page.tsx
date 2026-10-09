'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

const GUEST_INFO_STORAGE_KEY = 'foodqueue_guest_info';
const GUEST_ORDERS_STORAGE_KEY = 'foodqueue_guest_orders';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  // Local guest profile state
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [guestOrderCount, setGuestOrderCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(GUEST_INFO_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.name) setGuestName(parsed.name);
          if (parsed.phone) setGuestPhone(parsed.phone);
        }

        const orders = JSON.parse(localStorage.getItem(GUEST_ORDERS_STORAGE_KEY) || '[]');
        setGuestOrderCount(orders.length);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSaveGuestInfo = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(
        GUEST_INFO_STORAGE_KEY,
        JSON.stringify({ name: guestName.trim(), phone: guestPhone.trim() })
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetGuestInfo = () => {
    if (confirm('Hapus biodata dan riwayat pesanan lokal dari perangkat ini?')) {
      localStorage.removeItem(GUEST_INFO_STORAGE_KEY);
      localStorage.removeItem(GUEST_ORDERS_STORAGE_KEY);
      setGuestName('');
      setGuestPhone('');
      setGuestOrderCount(0);
      alert('Data lokal berhasil dibersihkan.');
    }
  };

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari akun pengelola ini?')) {
      await logout();
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', paddingBottom: '90px' }}>
        <Navbar />
        <main className="container" style={{ maxWidth: '600px', padding: '3rem 1rem', textAlign: 'center' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-primary-500)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: 'var(--color-ink-400)' }}>Memuat profil...</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  // Jika Login sebagai TENANT atau ADMIN
  if (user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', paddingBottom: '120px' }}>
        <Navbar />

        <main className="container" style={{ maxWidth: '640px', padding: '1.5rem 1rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-ink-900)', marginBottom: '1.25rem' }}>
            Akun & Portal Pengelola
          </h1>

          {/* User Card */}
          <Card style={{ marginBottom: '1.25rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(240, 89, 42, 0.3)',
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ink-900)' }}>
                  {user.name}
                </h2>
                <span
                  style={{
                    display: 'inline-block',
                    background: user.role === 'ADMIN' ? '#EFF6FF' : '#ECFDF5',
                    color: user.role === 'ADMIN' ? '#1D4ED8' : 'var(--color-forest)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    marginTop: '0.25rem',
                  }}
                >
                  {user.role === 'ADMIN' ? 'Administrator Sistem' : 'Pemilik Tenant Stan'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-ink-500)' }}>
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
            <div
              style={{
                background: 'linear-gradient(135deg, #0A4332 0%, #14684F 100%)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                color: '#FFFFFF',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-md)',
              }}
            >
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
                style={{ background: '#FFFFFF', color: 'var(--color-forest)', borderColor: '#FFFFFF', fontWeight: 700 }}
              >
                Buka Merchant Portal
              </Button>
            </div>
          )}

          {user.role === 'ADMIN' && (
            <div
              style={{
                background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                color: '#FFFFFF',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-md)',
              }}
            >
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
                style={{ background: '#FFFFFF', color: '#1E1B4B', borderColor: '#FFFFFF', fontWeight: 700 }}
              >
                Buka Admin Portal
              </Button>
            </div>
          )}

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
              padding: '0.75rem',
            }}
          >
            <LogOut size={18} /> Keluar dari Akun Pengelola
          </Button>
        </main>

        <BottomNav />
      </div>
    );
  }

  // Pengguna Tamu / Pembeli (100% Tanpa Login)
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', paddingBottom: '120px' }}>
      <Navbar />

      <main className="container" style={{ maxWidth: '640px', padding: '1.5rem 1rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-ink-900)' }}>
              Profil & Pengaturan Pemesan
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-500)', marginTop: '0.2rem' }}>
            Pemesanan langsung tanpa login · Data otomatis tersimpan di browser perangkat Anda
          </p>
        </div>

        {/* Card 1: Biodata Tamu */}
        <Card padding="lg" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <User size={18} color="var(--color-primary-600)" />
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-ink-900)' }}>
                Biodata Pemesan di Perangkat Ini
              </span>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-forest)',
                background: '#ECFDF5',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              Mode Tamu
            </span>
          </div>

          <p style={{ fontSize: '0.825rem', color: 'var(--color-ink-500)', marginBottom: '1.25rem' }}>
            Data ini digunakan otomatis saat checkout agar Anda tidak perlu mengetik ulang setiap kali memesan makanan.
          </p>

          <form onSubmit={handleSaveGuestInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Nama Lengkap / Panggilan"
              placeholder="Contoh: Rina Kartika"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />

            <Input
              label="Nomor WhatsApp / HP"
              type="tel"
              placeholder="Contoh: 081234567890"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              helperText="Digunakan untuk identifikasi di stan dan notifikasi pesanan"
            />

            {savedSuccess && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ECFDF5',
                  color: 'var(--color-forest)',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <CheckCircle2 size={16} /> Biodata berhasil disimpan untuk pesanan berikutnya!
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <Button type="submit" size="md" icon={<Save size={16} />}>
                Simpan Biodata
              </Button>
              {(guestName || guestPhone || guestOrderCount > 0) && (
                <Button type="button" variant="outline" size="md" onClick={handleResetGuestInfo} icon={<RotateCcw size={16} />}>
                  Reset Data
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Card 2: Navigasi Pesanan */}
        <Card padding="md" style={{ marginBottom: '1.25rem' }}>
          <Link
            href="/orders"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
              color: 'var(--color-ink-900)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary-600)',
                }}
              >
                <ShoppingBag size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 750, fontSize: '0.95rem' }}>Pesanan Saya</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-400)' }}>
                  {guestOrderCount > 0 ? `${guestOrderCount} pesanan tercatat di perangkat ini` : 'Belum ada pesanan aktif'}
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="var(--color-ink-400)" />
          </Link>
        </Card>

        {/* Card 3: Akses Portal Pengelola */}
        <Card padding="md" style={{ marginBottom: '1.25rem', border: '1px dashed var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Store size={22} color="var(--color-ink-600)" />
              <div>
                <div style={{ fontWeight: 750, fontSize: '0.9rem', color: 'var(--color-ink-900)' }}>
                  Portal Pengelola Kantin
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-500)' }}>
                  Khusus pemilik stan tenant & administrator
                </div>
              </div>
            </div>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <Button variant="outline" size="sm">
                Masuk Portal
              </Button>
            </Link>
          </div>
        </Card>

        {/* Card 4: Info SDG */}
        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-ink-400)', padding: '1rem 0' }}>
          FoodQueue v1.0.0 · Platform Pre-Order Kantin Tanpa Antre
          <br />
          Mendukung SDGs 2026: Komunitas Berkelanjutan (SDG 11) & Efisiensi Konsumsi (SDG 12)
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
