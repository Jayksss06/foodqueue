'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Search, Clock, UtensilsCrossed, Star } from 'lucide-react';

function TenantsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get('category') || null;

  const [tenants, setTenants] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((j) => setCategories(j.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = `/api/tenants?q=${encodeURIComponent(searchQuery)}`;
    if (selectedCategory) {
      url += `&category=${encodeURIComponent(selectedCategory)}`;
    }
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        setTenants(j.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchQuery, selectedCategory]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '1rem 1rem 6rem 1rem' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-ink-900)' }}>
              Daftar Stan & Tenant Kantin
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-500)' }}>
              Pilih stan makanan atau minuman untuk melihat menu dan slot pengambilan
            </p>
          </div>

          {/* Search bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 1rem',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              marginBottom: '1rem',
            }}
          >
            <Search size={18} color="var(--color-ink-400)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari stan atau makanan..."
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '0.95rem',
                backgroundColor: 'transparent',
              }}
            />
          </div>

          {/* Category Filter Chips */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.75rem',
              marginBottom: '1.5rem',
              scrollbarWidth: 'none',
            }}
          >
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: selectedCategory === null ? 'var(--color-primary-500)' : 'var(--color-surface)',
                color: selectedCategory === null ? '#FFFFFF' : 'var(--color-ink-700)',
                border: selectedCategory === null ? 'none' : '1px solid var(--color-border)',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Semua Stan
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.slug)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: selectedCategory === c.slug ? 'var(--color-primary-500)' : 'var(--color-surface)',
                  color: selectedCategory === c.slug ? '#FFFFFF' : 'var(--color-ink-700)',
                  border: selectedCategory === c.slug ? 'none' : '1px solid var(--color-border)',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Tenant Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-ink-400)' }}>
              Memuat daftar tenant...
            </div>
          ) : tenants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <UtensilsCrossed size={40} style={{ margin: '0 auto 0.75rem auto', color: 'var(--color-ink-300)' }} />
              <div style={{ fontWeight: 700, color: 'var(--color-ink-700)' }}>Tenant tidak ditemukan</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-400)', marginTop: '0.25rem' }}>
                Coba gunakan kata kunci pencarian lainnya.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1.25rem' }}>
              {tenants.map((t) => (
                <Link key={t.id} href={`/tenants/${t.slug}`}>
                  <Card interactive padding="none" style={{ overflow: 'hidden', height: '100%' }}>
                    <div style={{ position: 'relative', height: '140px', backgroundColor: '#E7E5E4' }}>
                      {t.logoUrl ? (
                        <img src={t.logoUrl} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <UtensilsCrossed size={32} color="#A8A29E" />
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                        <Badge variant="success">Buka · Slot Tersedia</Badge>
                      </div>
                    </div>

                    <div style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-ink-900)' }}>{t.name}</h3>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#D97706', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Star size={14} fill="#D97706" /> {t.ratingAvg.toFixed(1)}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.825rem', color: 'var(--color-ink-500)', marginTop: '0.35rem' }}>
                        {t.description || t.location}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-ink-400)', fontWeight: 600 }}>
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
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export default function TenantsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--color-ink-400)' }}>Memuat stan kantin...</p>
        </div>
      }
    >
      <TenantsContent />
    </Suspense>
  );
}
