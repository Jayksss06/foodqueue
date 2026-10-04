'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { formatRupiah } from '@/lib/utils';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, AlertCircle, Store } from 'lucide-react';

export default function CartPage() {
  const { cart, loading, updateItem, removeItem, clearCart } = useCart();
  const router = useRouter();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--color-ink-400)' }}>
          Memuat keranjang belanja...
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
        <Navbar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                color: 'var(--color-ink-400)',
              }}
            >
              <ShoppingBag size={28} />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-ink-900)' }}>
              Keranjang Masih Kosong
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-500)', marginTop: '0.35rem', marginBottom: '1.5rem' }}>
              Pilih menu makanan atau minuman dari tenant kantin kampus untuk memesan lebih awal.
            </p>
            <Link href="/tenants">
              <Button size="lg">Lihat Daftar Stan</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '1.5rem 1rem 4rem 1rem' }}>
        <div className="container-sm" style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-ink-900)' }}>
                Keranjang Belanja
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-primary-600)', fontWeight: 600, marginTop: '0.2rem' }}>
                <Store size={15} /> {cart.tenantName}
              </div>
            </div>

            <button
              onClick={clearCart}
              style={{
                fontSize: '0.825rem',
                color: 'var(--color-danger-text)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={15} /> Kosongkan
            </button>
          </div>

          {/* Alert jika ada perubahan harga menu */}
          {cart.hasPriceChanges && (
            <div
              style={{
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-warning-bg)',
                border: '1px solid var(--color-warning-border)',
                color: 'var(--color-warning-text)',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={18} />
              Harga beberapa menu telah diperbarui oleh stan.
            </div>
          )}

          {/* Daftar Cart Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {cart.items.map((item) => (
              <Card key={item.id} padding="sm">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-ink-900)' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-primary-600)', fontWeight: 700 }}>
                      {formatRupiah(item.price)}
                    </div>
                    {item.notes && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-400)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                        Catatan: &ldquo;{item.notes}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Quantity Stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => (item.quantity === 1 ? removeItem(item.id) : updateItem(item.id, item.quantity - 1))}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      {item.quantity === 1 ? <Trash2 size={14} color="#EF4444" /> : <Minus size={14} />}
                    </button>

                    <span style={{ fontSize: '0.95rem', fontWeight: 700, width: '24px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => updateItem(item.id, item.quantity + 1)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Ringkasan Pembayaran */}
          <Card padding="md" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-ink-900)' }}>
              Rincian Pembayaran
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-ink-700)' }}>
                <span>Subtotal Pesanan</span>
                <span className="tabular-nums" style={{ fontWeight: 600 }}>{formatRupiah(cart.subtotal)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-ink-700)' }}>
                <span>Biaya Layanan Platform</span>
                <span className="tabular-nums" style={{ fontWeight: 600 }}>{formatRupiah(cart.fee)}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--color-border)',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: 'var(--color-ink-900)',
                }}
              >
                <span>Total Pembayaran</span>
                <span className="tabular-nums" style={{ color: 'var(--color-primary-600)' }}>
                  {formatRupiah(cart.total)}
                </span>
              </div>
            </div>
          </Card>

          {/* CTA Next Step */}
          <Button
            size="lg"
            onClick={() => router.push('/checkout')}
            style={{ width: '100%' }}
            icon={<ArrowRight size={18} />}
          >
            Pilih Waktu Pengambilan
          </Button>
        </div>
      </main>
    </div>
  );
}
