import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { BottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { prisma } from '@/lib/prisma';
import {
  Clock,
  QrCode,
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Leaf,
  Users,
  Star,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  // Ambil data tenant aktif dari database
  let tenants: any[] = [];
  let stats = {
    totalOrders: 0,
    activeTenants: 0,
    completionRate: '98%',
  };

  try {
    tenants = await prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
      include: {
        menus: {
          where: { deletedAt: null, status: 'AVAILABLE' },
          take: 3,
        },
      },
      take: 6,
      orderBy: { ratingAvg: 'desc' },
    });

    const orderCount = await prisma.order.count();
    const tenantCount = await prisma.tenant.count({ where: { status: 'ACTIVE' } });
    stats = {
      totalOrders: orderCount,
      activeTenants: tenantCount,
      completionRate: '98%',
    };
  } catch (err) {
    console.error('Landing page DB fetch error:', err);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* HERO SECTION */}
        <section
          style={{
            padding: '3.5rem 1rem 4rem 1rem',
            background: 'radial-gradient(ellipse at top, rgba(240, 89, 42, 0.08) 0%, transparent 70%)',
            textAlign: 'center',
          }}
        >
          <div className="container" style={{ maxWidth: '800px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-50)',
                color: 'var(--color-primary-600)',
                fontSize: '0.85rem',
                fontWeight: 700,
                marginBottom: '1.25rem',
                border: '1px solid var(--color-primary-200)',
              }}
            >
              <Sparkles size={16} /> Solusi Pintar Pengurangan Antrean Kantin Kampus
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
                fontWeight: 800,
                color: 'var(--color-ink-900)',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                marginBottom: '1.25rem',
              }}
            >
              Pesan Dulu, Ambil Tanpa Antre di{' '}
              <span style={{ color: 'var(--color-primary-500)' }}>Food Court Kampus</span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                color: 'var(--color-ink-500)',
                lineHeight: 1.6,
                marginBottom: '2rem',
                maxWidth: '650px',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Ubah pola <i>antre berdesakan</i> menjadi jadwal pengambilan terjadwal. Makanan dimasak
              tepat waktu, waktu istirahat mahasiswa lebih berharga.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '1rem',
                marginBottom: '3rem',
              }}
            >
              <Link href="/home">
                <Button size="lg" icon={<UtensilsCrossed size={20} />}>
                  Mulai Pesan Sekarang
                </Button>
              </Link>
              <Link href="/register/tenant">
                <Button variant="outline" size="lg">
                  Daftarkan Stan / Tenant
                </Button>
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                padding: '1.25rem',
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-500)' }}>
                  15 Menit
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-500)', fontWeight: 600 }}>
                  Interval Slot Teratur
                </div>
              </div>

              <div style={{ borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-secondary-500)' }}>
                  0 Menit
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-500)', fontWeight: 600 }}>
                  Waktu Tunggu Antre
                </div>
              </div>

              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706' }}>
                  100% QR
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-500)', fontWeight: 600 }}>
                  Verifikasi Tanpa Salah Ambil
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CARA KERJA (HOW IT WORKS) */}
        <section style={{ padding: '3.5rem 1rem', backgroundColor: 'var(--color-surface)' }}>
          <div className="container" style={{ maxWidth: '1000px' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-ink-900)' }}>
                Bagaimana FoodQueue Bekerja?
              </h2>
              <p style={{ color: 'var(--color-ink-500)', marginTop: '0.5rem' }}>
                Hanya butuh 4 langkah mudah dari smartphone Anda
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <Card padding="md">
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-50)',
                    color: 'var(--color-primary-500)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    marginBottom: '1rem',
                  }}
                >
                  1
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Pilih Menu</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-500)', lineHeight: 1.5 }}>
                  Buka katalog menu stan kantin kampus favorit Anda sebelum jam istirahat dimulai.
                </p>
              </Card>

              <Card padding="md">
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-secondary-50)',
                    color: 'var(--color-secondary-500)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    marginBottom: '1rem',
                  }}
                >
                  2
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Tentukan Jam Ambil</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-500)', lineHeight: 1.5 }}>
                  Pilih slot waktu (misal: 12:15–12:30). Kapasitas dibatasi agar tidak ada kerumunan.
                </p>
              </Card>

              <Card padding="md">
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#FEF3C7',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    marginBottom: '1rem',
                  }}
                >
                  3
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Tenant Memasak</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-500)', lineHeight: 1.5 }}>
                  Stan melihat pesanan per batch slot dan memasak tepat sebelum Anda tiba.
                </p>
              </Card>

              <Card padding="md">
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#E0F2FE',
                    color: '#0284C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    marginBottom: '1rem',
                  }}
                >
                  4
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Tunjukkan QR Code</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-500)', lineHeight: 1.5 }}>
                  Datang ke counter stan pada waktu yang dipilih, scan QR code, dan langsung santap!
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* TENANTS POPULER */}
        <section style={{ padding: '3.5rem 1rem' }}>
          <div className="container">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-ink-900)' }}>
                  Tenant Makanan Kampus
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-500)' }}>
                  Pesan langsung dari stan terpercaya di kantin
                </p>
              </div>

              <Link href="/tenants" style={{ color: 'var(--color-primary-600)', fontWeight: 700, fontSize: '0.9rem' }}>
                Lihat Semua →
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {tenants.map((t) => (
                <Link key={t.id} href={`/tenants/${t.slug}`}>
                  <Card interactive padding="none" style={{ overflow: 'hidden', height: '100%' }}>
                    <div style={{ position: 'relative', height: '140px', backgroundColor: '#E7E5E4' }}>
                      {t.logoUrl ? (
                        <img
                          src={t.logoUrl}
                          alt={t.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#A8A29E',
                          }}
                        >
                          <UtensilsCrossed size={36} />
                        </div>
                      )}

                      <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                        <Badge variant="success">Buka · Slot Tersedia</Badge>
                      </div>
                    </div>

                    <div style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-ink-900)' }}>
                          {t.name}
                        </h3>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#D97706', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Star size={14} fill="#D97706" color="#D97706" /> {t.ratingAvg.toFixed(1)}
                        </span>
                      </div>

                      <p
                        style={{
                          fontSize: '0.825rem',
                          color: 'var(--color-ink-500)',
                          marginTop: '0.35rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {t.description || t.location}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          marginTop: '0.75rem',
                          fontSize: '0.75rem',
                          color: 'var(--color-ink-400)',
                          fontWeight: 600,
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={13} /> Siap ~{t.defaultPreparationTime} mnt
                        </span>
                        <span>•</span>
                        <span>{t.location}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* SDG IMPACT SECTION */}
        <section
          style={{
            padding: '3rem 1rem',
            backgroundColor: '#1C1917',
            color: '#FFFFFF',
          }}
        >
          <div className="container" style={{ maxWidth: '900px' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <Badge variant="neutral" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FEF08A' }}>
                Sustainable Development Goals
              </Badge>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.75rem' }}>
                Dampak Nyata Terhadap Keberlanjutan Kampus
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div style={{ color: '#F97316', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  SDG 11: Kota & Komunitas Berkelanjutan
                </div>
                <p style={{ fontSize: '0.85rem', color: '#D6D3D1', lineHeight: 1.5 }}>
                  Mengatur arus kedatangan fisik di ruang publik kantin via time slots 15 menit sehingga
                  mencegah kepadatan dan penumpukan orang.
                </p>
              </div>

              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div style={{ color: '#22C55E', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  SDG 12: Konsumsi & Produksi Bertanggung Jawab
                </div>
                <p style={{ fontSize: '0.85rem', color: '#D6D3D1', lineHeight: 1.5 }}>
                  Tenant melihat pesanan masuk lebih awal sebelum jam makan dimulai, memungkinkan perencanaan
                  produksi tepat porsi dan menekan sisa makanan.
                </p>
              </div>

              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div style={{ color: '#38BDF8', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  SDG 8: Pertumbuhan Ekonomi & Pekerjaan Layak
                </div>
                <p style={{ fontSize: '0.85rem', color: '#D6D3D1', lineHeight: 1.5 }}>
                  Mendorong digitalisasi dan efisiensi operasional bagi UMKM penjual makanan di area kampus
                  tanpa investasi perangkat keras rumit.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer
        style={{
          padding: '2rem 1rem 6rem 1rem',
          backgroundColor: 'var(--color-bg)',
          borderTop: '1px solid var(--color-border)',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'var(--color-ink-500)',
        }}
      >
        <div className="container">
          <div style={{ fontWeight: 800, color: 'var(--color-ink-900)', fontSize: '1rem', marginBottom: '0.25rem' }}>
            Food<span style={{ color: 'var(--color-primary-500)' }}>Queue</span>
          </div>
          <p>Sistem Informasi Pre-order & Scheduled Pickup Food Court & Kantin Kampus</p>
          <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--color-ink-400)' }}>
            Dirancang & dibangun sesuai standar akademik & SDGs 2026.
          </div>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
