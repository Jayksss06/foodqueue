'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  User,
  Calendar,
  RefreshCw
} from 'lucide-react';

export default function TenantReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tenant/reviews');
      const data = await res.json();
      if (res.ok) {
        setReviews(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';

  return (
    <div style={{ padding: '1.75rem', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
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
            <Star size={24} color="#F59E0B" fill="#F59E0B" />
            Ulasan & Kepuasan Pelanggan
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Umpan balik langsung dari mahasiswa dan sivitas akademika setelah pengambilan makanan
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchReviews}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Segarkan
        </Button>
      </div>

      {/* Rating Overview Card */}
      <Card style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center', minWidth: '120px' }}>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>
              {avgRating}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.2rem', margin: '0.5rem 0' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={18}
                  fill={s <= Math.round(Number(avgRating)) ? '#F59E0B' : 'transparent'}
                  color={s <= Math.round(Number(avgRating)) ? '#F59E0B' : '#D1D5DB'}
                />
              ))}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Berdasarkan {totalReviews} ulasan
            </span>
          </div>

          <div style={{ flex: 1, borderLeft: '1px solid var(--color-border)', paddingLeft: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 750, marginBottom: '0.5rem' }}>
              Kualitas Layanan & Ketepatan Slot
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Pelanggan yang mengambil pesanan tepat waktu tanpa antre panjang cenderung memberikan ulasan bintang 5. Jaga konsistensi waktu persiapan agar kepuasan tetap prima!
            </p>
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-primary-500)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Memuat ulasan pelanggan...</p>
        </div>
      ) : reviews.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <MessageSquare size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.25rem' }}>Belum Ada Ulasan</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Ulasan akan muncul di sini setelah pelanggan menyelesaikan pesanan mereka dan memberikan rating.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {reviews.map((rev) => (
            <Card key={rev.id} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--color-surface-hover)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}>
                    {rev.user?.name ? rev.user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 750, fontSize: '0.9rem' }}>{rev.user?.name || 'Mahasiswa'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Pesanan #{rev.order?.orderNumber}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      fill={s <= rev.rating ? '#F59E0B' : 'transparent'}
                      color={s <= rev.rating ? '#F59E0B' : '#D1D5DB'}
                    />
                  ))}
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, marginLeft: '0.25rem', color: 'var(--color-text)' }}>
                    {rev.rating}.0
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: 1.5, margin: '0.5rem 0' }}>
                &ldquo;{rev.comment || 'Puas dengan pelayanan makanan dan slot tepat waktu.'}&rdquo;
              </p>

              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={12} />
                {new Date(rev.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
