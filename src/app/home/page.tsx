import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { UpcomingPickupBanner } from '@/components/home/UpcomingPickupBanner';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifySessionToken, COOKIE_NAME } from '@/lib/jwt';
import {
  Search,
  Clock,
  ArrowRight,
  Bell,
  UtensilsCrossed,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CustomerHomePage() {
  // Ambil sesi user yang sedang login jika ada
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  let activeOrder: any = null;
  let categories: any[] = [];
  let tenants: any[] = [];

  try {
    // 1. Ambil active upcoming order jika user login
    if (session?.sub) {
      activeOrder = await prisma.order.findFirst({
        where: {
          userId: session.sub,
          status: { in: ['PAID', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'] },
        },
        include: {
          tenant: { select: { name: true, location: true } },
          pickupSlot: true,
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // 2. Ambil categories
    categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      take: 8,
    });

    // 3. Ambil tenants aktif
    tenants = await prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
      include: {
        menus: {
          where: { deletedAt: null, status: 'AVAILABLE' },
          take: 2,
        },
      },
      orderBy: { ratingAvg: 'desc' },
    });
  } catch (err) {
    console.error('Home page DB fetch error:', err);
  }


  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '1rem 1rem 6rem 1rem' }}>
        <div className="container-sm" style={{ maxWidth: '640px' }}>
          {/* Greeting */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              marginTop: '0.5rem',
            }}
          >
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-ink-900)' }}>
                Halo, {session ? session.name.split(' ')[0] : 'Kawan Kampus'} 👋
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-500)' }}>
                Mau santap apa di kantin hari ini?
              </p>
            </div>

            <Link
              href="/notifications"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-ink-700)',
              }}
            >
              <Bell size={20} />
            </Link>
          </div>

          {/* UPCOMING PICKUP CARD (Supports Guest & Logged-in Orders) */}
          <UpcomingPickupBanner initialOrder={activeOrder} />

          {/* Search Bar Input */}
          <Link href="/tenants" style={{ display: 'block', marginBottom: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-ink-400)',
                fontSize: '0.9rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Search size={18} />
              <span>Cari makanan atau tenant...</span>
            </div>
          </Link>

          {/* Category Chips Bar */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              marginBottom: '1.5rem',
              scrollbarWidth: 'none',
            }}
          >
            <Link
              href="/tenants"
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-500)',
                color: '#FFFFFF',
                fontSize: '0.825rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              Semua
            </Link>

            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/tenants?category=${c.slug}`}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-ink-700)',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {c.name}
              </Link>
            ))}
          </div>

          {/* Section: Tenant Populer */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ink-900)' }}>
                Tenant Populer
              </h2>
              <Link href="/tenants" style={{ fontSize: '0.825rem', color: 'var(--color-primary-600)', fontWeight: 700 }}>
                Lihat Semua
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tenants.map((t) => (
                <Link key={t.id} href={`/tenants/${t.slug}`}>
                  <Card interactive padding="none" style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', height: '110px' }}>
                      <div
                        style={{
                          width: '110px',
                          flexShrink: 0,
                          backgroundColor: '#E7E5E4',
                          position: 'relative',
                        }}
                      >
                        {t.logoUrl ? (
                          <img
                            src={t.logoUrl}
                            alt={t.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UtensilsCrossed size={28} color="#A8A29E" />
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-ink-900)' }}>
                            {t.name}
                          </h3>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#D97706' }}>
                            ★ {t.ratingAvg.toFixed(1)}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-500)', marginTop: '0.2rem' }}>
                          {t.location}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <Badge variant="success" size="sm">Buka · Slot Tersedia</Badge>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-400)' }}>
                            Siap ~{t.defaultPreparationTime} mnt
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
