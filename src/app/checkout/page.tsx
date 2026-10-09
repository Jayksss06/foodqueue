'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SlotPicker } from '@/components/ui/SlotPicker';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { SlotAvailability } from '@/types';
import { formatRupiah, generateUUID } from '@/lib/utils';
import {
  ArrowLeft,
  Clock,
  AlertCircle,
  User,
  Phone,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';

const GUEST_INFO_STORAGE_KEY = 'foodqueue_guest_info';
const GUEST_ORDERS_STORAGE_KEY = 'foodqueue_guest_orders';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, refreshCart, clearCart } = useCart();

  // Guest inputs
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const [dateList, setDateList] = useState<{ label: string; dateStr: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotAvailability | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate 1 valid RFC4122 UUID v4 per checkout session
  const [idempotencyKey] = useState<string>(() => generateUUID());

  // Load saved guest info from previous order if available
  useEffect(() => {
    if (!user) {
      try {
        const saved = localStorage.getItem(GUEST_INFO_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.name) setGuestName(parsed.name);
          if (parsed.phone) setGuestPhone(parsed.phone);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [user]);

  // Inisialisasi daftar tanggal (Hari ini, Besok, H+2)
  useEffect(() => {
    const dates: { label: string; dateStr: string }[] = [];
    const now = new Date();
    const daysName = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthsName = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];

    for (let i = 0; i < 3; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);

      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      let label = '';
      if (i === 0)
        label = `Hari ini, ${daysName[d.getDay()]} ${d.getDate()} ${monthsName[d.getMonth()]}`;
      else if (i === 1) label = `Besok, ${daysName[d.getDay()]}`;
      else label = `${daysName[d.getDay()]}, ${d.getDate()} ${monthsName[d.getMonth()]}`;

      dates.push({ label, dateStr });
    }

    setDateList(dates);
    if (dates[0]) {
      setSelectedDate(dates[0].dateStr);
    }
  }, []);

  // Fetch slots ketika tenant dan tanggal terpilih
  useEffect(() => {
    if (!cart?.tenantId || !selectedDate) return;

    setSlotsLoading(true);
    setErrorMessage(null);

    fetch(`/api/tenants/${cart.tenantId}/pickup-slots?date=${selectedDate}`)
      .then((r) => r.json())
      .then((j) => {
        const availableSlots: SlotAvailability[] = j.data || [];
        setSlots(availableSlots);
        setSelectedSlot(null);
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage('Gagal memuat slot pengambilan.');
      })
      .finally(() => setSlotsLoading(false));
  }, [cart?.tenantId, selectedDate]);

  const handleCheckoutSubmit = async () => {
    if (!selectedSlot?.slotId) {
      setErrorMessage('Pilih salah satu slot waktu pengambilan terlebih dahulu.');
      return;
    }

    // Validasi input guest jika pengguna belum login
    if (!user) {
      if (!guestName.trim() || guestName.trim().length < 2) {
        setErrorMessage('Masukkan nama lengkap pemesan (minimal 2 karakter).');
        return;
      }
      const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
      if (!phoneRegex.test(guestPhone.trim())) {
        setErrorMessage(
          'Format nomor WhatsApp tidak valid. Gunakan format seluler Indonesia (contoh: 081234567890).'
        );
        return;
      }
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: any = {
        pickupSlotId: selectedSlot.slotId,
        notes: orderNotes.trim() || undefined,
        idempotencyKey,
      };

      if (!user) {
        payload.isGuest = true;
        payload.guestName = guestName.trim();
        payload.guestPhone = guestPhone.trim();
        payload.guestItems = cart?.items.map((i) => ({
          menuId: i.menuId,
          quantity: i.quantity,
          notes: i.notes || undefined,
        }));
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || 'Gagal memproses pesanan.');
      }

      // Simpan biodata guest ke storage agar mudah digunakan kembali
      if (!user) {
        try {
          localStorage.setItem(
            GUEST_INFO_STORAGE_KEY,
            JSON.stringify({ name: guestName.trim(), phone: guestPhone.trim() })
          );

          // Simpan order history guest di localStorage
          const prevOrders = JSON.parse(
            localStorage.getItem(GUEST_ORDERS_STORAGE_KEY) || '[]'
          );
          prevOrders.unshift({
            id: json.data.id,
            orderNumber: json.data.orderNumber,
            guestToken: json.data.guestToken,
            tenantName: cart?.tenantName,
            createdAt: new Date().toISOString(),
          });
          localStorage.setItem(
            GUEST_ORDERS_STORAGE_KEY,
            JSON.stringify(prevOrders.slice(0, 30))
          );
        } catch (storageErr) {
          console.error('Storage error:', storageErr);
        }
      }

      // Kosongkan keranjang
      await clearCart();

      // Redirect ke halaman pembayaran dengan token (jika guest)
      if (json.data.guestToken) {
        router.push(`/orders/${json.data.id}/pay?token=${json.data.guestToken}`);
      } else {
        router.push(`/orders/${json.data.id}/pay`);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      if (err.message?.includes('penuh') || err.message?.includes('SLOT_FULL')) {
        fetch(`/api/tenants/${cart?.tenantId}/pickup-slots?date=${selectedDate}`)
          .then((r) => r.json())
          .then((j) => setSlots(j.data || []));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <h2>Keranjang Kosong</h2>
          <Link href="/tenants">
            <Button style={{ marginTop: '1rem' }}>Pilih Menu Makanan</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      <Navbar />

      <main style={{ flex: 1, padding: '1.25rem 1rem 8rem 1rem' }}>
        <div className="container-sm" style={{ maxWidth: '640px' }}>
          {/* Top Bar Navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.25rem',
            }}
          >
            <button
              onClick={() => router.back()}
              style={{
                padding: '0.4rem',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-ink-700)',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={22} />
            </button>
            <h1
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'var(--color-ink-900)',
              }}
            >
              Checkout Pesanan
            </h1>
          </div>

          {/* Stepper Indikator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '1.75rem',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                color: 'var(--color-secondary-600)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              ✓ Keranjang
            </span>
            <span style={{ color: 'var(--color-border)' }}>•</span>
            <span
              style={{
                color: 'var(--color-primary-600)',
                fontWeight: 800,
              }}
            >
              2. Data & Waktu Ambil
            </span>
            <span style={{ color: 'var(--color-border)' }}>•</span>
            <span style={{ color: 'var(--color-ink-400)' }}>3. Bayar</span>
          </div>

          {errorMessage && (
            <div
              style={{
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
                color: 'var(--color-danger-text)',
                fontSize: '0.875rem',
                fontWeight: 600,
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={18} />
              {errorMessage}
            </div>
          )}

          {/* SECTION: DATA PEMESAN */}
          {user ? (
            <Card padding="md" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--color-primary-500)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ink-500)', letterSpacing: '0.05em' }}>
                    Data Pemesan (Akun Terdaftar)
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-ink-900)', marginTop: '0.2rem' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-ink-500)' }}>
                    {user.email} {user.phone ? `· ${user.phone}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-forest)', fontSize: '0.8rem', fontWeight: 700 }}>
                  <CheckCircle2 size={18} /> Terverifikasi
                </div>
              </div>
            </Card>
          ) : (
            <Card padding="lg" style={{ marginBottom: '1.5rem', border: '1px solid var(--color-primary-200)', background: 'linear-gradient(180deg, rgba(240, 89, 42, 0.03) 0%, #FFFFFF 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Sparkles size={18} color="var(--color-primary-600)" />
                  <span style={{ fontSize: '1rem', fontWeight: 850, color: 'var(--color-ink-900)' }}>
                    Pesan Langsung (Tanpa Login)
                  </span>
                </div>
                <Link href="/login" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-600)' }}>
                  Sudah punya akun? Masuk
                </Link>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-ink-500)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                Isi nama dan nomor WhatsApp Anda agar stan dapat mengonfirmasi pesanan dan Anda dapat mengambil makanan tepat waktu.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-ink-800)', marginBottom: '0.35rem' }}>
                    Nama Lengkap / Panggilan <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <Input
                    placeholder="Contoh: Dimas Setiawan"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-ink-800)', marginBottom: '0.35rem' }}>
                    Nomor WhatsApp / HP <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <Input
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    required
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.775rem', color: 'var(--color-ink-500)', marginTop: '0.35rem' }}>
                    <Info size={13} />
                    <span>Digunakan untuk identifikasi di stan dan notifikasi pesanan</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Section: Pilih Tanggal */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--color-ink-900)',
                display: 'block',
                marginBottom: '0.5rem',
              }}
            >
              Pilih Tanggal Pengambilan
            </label>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                overflowX: 'auto',
                paddingBottom: '0.25rem',
              }}
            >
              {dateList.map((d) => (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(d.dateStr)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor:
                      selectedDate === d.dateStr
                        ? 'var(--color-ink-900)'
                        : 'var(--color-surface)',
                    color:
                      selectedDate === d.dateStr
                        ? '#FFFFFF'
                        : 'var(--color-ink-700)',
                    border: `1px solid ${
                      selectedDate === d.dateStr
                        ? 'var(--color-ink-900)'
                        : 'var(--color-border)'
                    }`,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Pilih Jam Slot */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}
            >
              <label
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--color-ink-900)',
                }}
              >
                Pilih Waktu Pengambilan
              </label>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-ink-500)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <Clock size={13} /> Interval 15 menit
              </span>
            </div>

            <SlotPicker
              slots={slots}
              selectedSlotId={selectedSlot?.slotId || null}
              onSelectSlot={(slot) => setSelectedSlot(slot)}
              loading={slotsLoading}
            />
          </div>

          {/* Catatan Pengambilan Pesanan */}
          <Card padding="md" style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--color-ink-900)',
                display: 'block',
                marginBottom: '0.35rem',
              }}
            >
              Catatan untuk Stan (opsional)
            </label>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Contoh: Tolong sambal dipisah, dibungkus rapat..."
              rows={2}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                fontSize: '0.9rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </Card>
        </div>
      </main>

      {/* STICKY BOTTOM SUMMARY BAR */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          padding: '1rem',
          zIndex: 40,
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.06)',
        }}
      >
        <div
          className="container-sm"
          style={{
            maxWidth: '640px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-ink-500)',
              }}
            >
              {cart.tenantName} · {cart.itemCount} item
            </div>
            <div
              className="tabular-nums"
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--color-primary-600)',
              }}
            >
              {formatRupiah(cart.total)}
            </div>
          </div>

          <Button
            size="lg"
            disabled={!selectedSlot}
            loading={submitting}
            onClick={handleCheckoutSubmit}
            style={{ minWidth: '180px' }}
          >
            Lanjut ke Pembayaran
          </Button>
        </div>
      </div>
    </div>
  );
}
