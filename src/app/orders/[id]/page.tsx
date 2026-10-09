'use client';

import React, { useEffect, useState, use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { OrderTimeline } from '@/components/ui/OrderTimeline';
import { Modal } from '@/components/ui/Modal';
import { formatRupiah, formatSlotTime } from '@/lib/utils';
import {
  ArrowLeft,
  Store,
  Clock,
  MapPin,
  QrCode,
  AlertCircle,
  CreditCard,
  RotateCcw,
  Star,
  CheckCircle2,
  Calendar,
  PhoneCall,
  Sparkles,
  Copy,
  Share2,
} from 'lucide-react';

function OrderDetailContent({ orderId }: { orderId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams?.get('token');

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Helper untuk token guest
  const getGuestToken = () => {
    if (urlToken) return urlToken;
    if (typeof window === 'undefined') return null;
    try {
      const savedOrders = JSON.parse(
        localStorage.getItem('foodqueue_guest_orders') || '[]'
      );
      const match = savedOrders.find((o: any) => o.id === orderId);
      return match ? match.guestToken : null;
    } catch {
      return null;
    }
  };

  const activeToken = getGuestToken();

  // Cancel Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Berubah pikiran / jadwal');
  const [cancelling, setCancelling] = useState(false);

  // Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch order data
  const fetchOrder = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const url = activeToken
        ? `/api/orders/${orderId}?token=${activeToken}`
        : `/api/orders/${orderId}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal memuat detail pesanan.');
      }
      setOrder(data.data);
      setError(null);
    } catch (err: any) {
      if (!isSilent) setError(err.message);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Auto-polling setiap 12 detik selama pesanan aktif
    const interval = setInterval(() => {
      if (
        order &&
        ['COMPLETED', 'CANCELLED', 'REJECTED', 'REFUNDED'].includes(order.status)
      ) {
        return;
      }
      fetchOrder(true);
    }, 12000);

    return () => clearInterval(interval);
  }, [orderId, activeToken, order?.status]);

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      const url = activeToken
        ? `/api/orders/${orderId}/cancel?token=${activeToken}`
        : `/api/orders/${orderId}/cancel`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason, token: activeToken || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal membatalkan pesanan.');
      setCancelModalOpen(false);
      await fetchOrder();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleReviewSubmit = async () => {
    try {
      setSubmittingReview(true);
      const res = await fetch(`/api/orders/${orderId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: reviewComment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengirim ulasan.');
      setReviewModalOpen(false);
      await fetchOrder();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = activeToken
        ? `${window.location.origin}/orders/${orderId}?token=${activeToken}`
        : window.location.href;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (loading) {
    return (
      <main className="container" style={{ maxWidth: '720px', padding: '3rem 1rem', textAlign: 'center' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }}
        />
        <p style={{ color: 'var(--color-text-muted)' }}>Memuat data pesanan...</p>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="container" style={{ maxWidth: '600px', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <AlertCircle size={56} color="var(--color-coral)" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Pesanan Tidak Ditemukan</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
          {error || 'Data pesanan tidak dapat diakses atau tautan otorisasi tamu tidak valid.'}
        </p>
        <Button variant="primary" onClick={() => router.push('/orders')}>
          Kembali ke Daftar Pesanan
        </Button>
      </main>
    );
  }

  const isPendingPayment = order.status === 'PENDING_PAYMENT';
  const isReady = order.status === 'READY_FOR_PICKUP';
  const isCompleted = order.status === 'COMPLETED';
  const canCancel = ['PENDING_PAYMENT', 'PAID'].includes(order.status);

  const slotStart = order.pickupSlot?.startAt || order.pickupSlot?.startTime;
  const slotEnd = order.pickupSlot?.endAt || order.pickupSlot?.endTime;
  const slotTimeStr = slotStart && slotEnd
    ? `${formatSlotTime(slotStart)} - ${formatSlotTime(slotEnd)}`
    : '-';

  const slotDateStr = order.pickupSlot?.date || order.pickupSlot?.startAt
    ? new Date(order.pickupSlot.date || order.pickupSlot.startAt).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '-';

  return (
    <main className="container" style={{ maxWidth: '760px', padding: '1.5rem 1rem' }}>
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}
      >
        <Link
          href="/orders"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--color-text-muted)',
            fontSize: '0.9rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={18} />
          Daftar Pesanan
        </Link>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          #{order.orderNumber}
        </span>
      </div>

      {/* Guest Mode Banner */}
      {order.isGuest && (
        <Card
          padding="md"
          style={{
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            border: '1px solid #FDE68A',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} color="#D97706" />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#92400E' }}>
                  Pesanan Tamu: {order.guestName} ({order.guestPhone})
                </div>
                <div style={{ fontSize: '0.775rem', color: '#B45309' }}>
                  Akses tersimpan di browser ini. Simpan link pelacakan agar tidak hilang.
                </div>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              style={{
                borderColor: '#D97706',
                color: '#92400E',
                background: '#FFFFFF',
                fontWeight: 700,
              }}
              icon={copiedLink ? <CheckCircle2 size={15} color="var(--color-forest)" /> : <Share2 size={15} />}
            >
              {copiedLink ? 'Tautan Disalin!' : 'Salin Tautan Pelacakan'}
            </Button>
          </div>
        </Card>
      )}

      {/* Pending Payment Alert Banner */}
      {isPendingPayment && (
        <div
          style={{
            background: 'var(--color-warning-light)',
            border: '1px solid var(--color-warning)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock color="var(--color-warning)" size={24} />
            <div>
              <h4 style={{ fontWeight: 750, color: 'var(--color-text)', fontSize: '0.95rem' }}>
                Menunggu Pembayaran
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Selesaikan pembayaran sebelum batas waktu berakhir agar slot tidak dibatalkan.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const payUrl = activeToken
                ? `/orders/${order.id}/pay?token=${activeToken}`
                : `/orders/${order.id}/pay`;
              router.push(payUrl);
            }}
          >
            Bayar Sekarang ({formatRupiah(order.total || order.totalAmount)})
          </Button>
        </div>
      )}

      {/* QR Code & Pickup Banner when READY_FOR_PICKUP */}
      {isReady && (
        <Card
          style={{
            textAlign: 'center',
            marginBottom: '1.5rem',
            background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%)',
            border: '2px solid var(--color-forest)',
            boxShadow: 'var(--shadow-md)',
            padding: '2rem 1.5rem',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-forest)',
              fontWeight: 750,
              fontSize: '1rem',
              marginBottom: '0.5rem',
            }}
          >
            <CheckCircle2 size={22} />
            PESANAN SIAP DIAMBIL!
          </div>
          <h3
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--color-text)',
              marginBottom: '0.25rem',
            }}
          >
            Tunjukkan QR Code ke Kasir / Stan
          </h3>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--color-text-muted)',
              marginBottom: '1.5rem',
            }}
          >
            Tenant: <strong>{order.tenant?.name}</strong> • Lokasi:{' '}
            {order.tenant?.location || 'Food Court Area'}
          </p>

          {/* QR Code Display */}
          {order.qrCodeDataUrl ? (
            <div
              style={{
                display: 'inline-block',
                background: '#FFFFFF',
                padding: '1rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                border: '1px solid var(--color-border)',
                marginBottom: '1rem',
              }}
            >
              <img
                src={order.qrCodeDataUrl}
                alt="QR Code Pickup"
                style={{ width: '220px', height: '220px', display: 'block' }}
              />
            </div>
          ) : (
            <div
              style={{
                padding: '2rem',
                background: '#F5F5F4',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
              }}
            >
              <QrCode size={64} color="var(--color-text-muted)" style={{ margin: '0 auto' }} />
            </div>
          )}

          {/* Big Alpha-numeric Pickup Code */}
          <div style={{ marginTop: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: 'var(--color-text-muted)',
                fontWeight: 700,
              }}
            >
              KODE PENGAMBILAN MANUAL
            </span>
            <div
              style={{
                fontSize: '2rem',
                fontFamily: 'monospace',
                fontWeight: 900,
                letterSpacing: '4px',
                color: 'var(--color-forest)',
                background: '#ECFDF5',
                padding: '0.4rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                display: 'inline-block',
                marginTop: '0.25rem',
                border: '1px dashed var(--color-forest)',
              }}
            >
              {order.pickupCode}
            </div>
          </div>
        </Card>
      )}

      {/* Order Main Status Card */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Pesanan #{order.orderNumber}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Dipesan pada{' '}
              {new Date(order.createdAt).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>

          {/* Quick Actions (Cancel if applicable) */}
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              style={{ color: 'var(--color-coral)', borderColor: 'var(--color-coral)' }}
            >
              Batalkan Pesanan
            </Button>
          )}

          {/* Review Button if completed */}
          {isCompleted && !order.review && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setReviewModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Star size={16} /> Beri Ulasan
            </Button>
          )}
        </div>

        {/* Timeline of Statuses */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text)' }}>
            Progres Pesanan
          </h4>
          <OrderTimeline currentStatus={order.status} statusLogs={order.statusLogs || []} />
        </div>
      </Card>

      {/* Slot & Tenant Location Card */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 750,
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Calendar size={18} color="var(--color-primary)" />
          Jadwal & Lokasi Pengambilan
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--color-surface-hover)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Slot Waktu Terjadwal
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>
              {slotTimeStr}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', marginTop: '0.15rem' }}>
              {slotDateStr}
            </div>
          </div>

          <div style={{ background: 'var(--color-surface-hover)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Stand / Tenant
            </span>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '0.25rem' }}>
              {order.tenant?.name || 'Tenant Food Court'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <MapPin size={14} /> {order.tenant?.location || 'Lantai 2, Food Court Kampus'}
            </div>
          </div>
        </div>
      </Card>

      {/* Item Details Card */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 750, marginBottom: '1rem' }}>
          Rincian Menu ({order.items?.length || 0} item)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
          {order.items?.map((item: any) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingBottom: '0.75rem',
                borderBottom: '1px dashed var(--color-border)',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {item.menuNameSnapshot || item.menuName || item.menu?.name}{' '}
                  <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>×{item.quantity}</span>
                </div>
                {item.notes && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                    Catatan: &ldquo;{item.notes}&rdquo;
                  </div>
                )}
              </div>
              <div style={{ fontWeight: 750, fontSize: '0.95rem', fontFamily: 'monospace' }}>
                {formatRupiah(item.subtotal || item.priceSnapshot * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        {/* Payment & Fee Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--color-surface-hover)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            <span>Subtotal Menu</span>
            <span style={{ fontFamily: 'monospace' }}>{formatRupiah(order.subtotal ?? order.subtotalAmount ?? 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            <span>Biaya Layanan Platform</span>
            <span style={{ fontFamily: 'monospace' }}>{formatRupiah(order.fee ?? order.platformFee ?? 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text)', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
            <span>Total Pembayaran</span>
            <span style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>
              {formatRupiah(order.total ?? order.totalAmount ?? 0)}
            </span>
          </div>
        </div>
      </Card>

      {/* Existing Review Card if already submitted */}
      {order.review && (
        <Card style={{ marginBottom: '1.5rem', background: '#FDFBF7', border: '1px solid #FDE68A' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 750, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={16} fill="#F59E0B" color="#F59E0B" /> Ulasan Anda ({order.review.rating}/5)
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', fontStyle: 'italic' }}>
            &ldquo;{order.review.comment || 'Puas dengan pelayanan dan ketepatan waktu pengambilan.'}&rdquo;
          </p>
        </Card>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Konfirmasi Pembatalan Pesanan">
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Apakah Anda yakin ingin membatalkan pesanan #{order.orderNumber}? Slot dan reservasi stok akan dilepaskan kembali.
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
            Alasan Pembatalan:
          </label>
          <select
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: '#FFFFFF',
              fontSize: '0.9rem',
            }}
          >
            <option value="Berubah pikiran / jadwal">Berubah pikiran / jadwal</option>
            <option value="Ingin mengganti menu">Ingin mengganti menu pesanan</option>
            <option value="Waktu slot tidak cocok lagi">Waktu slot tidak cocok lagi</option>
            <option value="Alasan lainnya">Lainnya</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={handleCancelOrder}
            disabled={cancelling}
            style={{ background: 'var(--color-coral)' }}
          >
            {cancelling ? 'Membatalkan...' : 'Ya, Batalkan Pesanan'}
          </Button>
        </div>
      </Modal>

      {/* Review Dialog Modal */}
      <Modal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Beri Ulasan Tenant">
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            Bagaimana pengalaman Anda mengambil pesanan di <strong>{order.tenant?.name}</strong>?
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                <Star
                  size={32}
                  fill={star <= rating ? '#F59E0B' : 'transparent'}
                  color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                />
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
            Komentar / Masukan (opsional):
          </label>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Makanannya enak, slot tepat waktu tidak antre sama sekali..."
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: '0.9rem',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
            Nanti Saja
          </Button>
          <Button variant="primary" onClick={handleReviewSubmit} disabled={submittingReview}>
            {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
          </Button>
        </div>
      </Modal>
    </main>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-light)', paddingBottom: '120px' }}>
      <Navbar />
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '5rem' }}>Memuat pesanan...</div>}>
        <OrderDetailContent orderId={id} />
      </Suspense>
      <BottomNav />
    </div>
  );
}
