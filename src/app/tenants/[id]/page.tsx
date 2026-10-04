'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatRupiah } from '@/lib/utils';
import {
  Clock,
  Star,
  MapPin,
  UtensilsCrossed,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

export default function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { cart, addItem } = useCart();

  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State untuk modal tambah menu
  const [selectedMenu, setSelectedMenu] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // State untuk dialog konflik tenant (BR-05)
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  useEffect(() => {
    fetch(`/api/tenants/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.data) setTenant(j.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleOpenAddModal = (menu: any) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setSelectedMenu(menu);
    setQuantity(1);
    setNotes('');
  };

  const handleConfirmAddToCart = async (replaceCart = false) => {
    if (!selectedMenu) return;
    setIsAdding(true);

    const result = await addItem(selectedMenu.id, quantity, notes, replaceCart);
    setIsAdding(false);

    if (result.success) {
      setSelectedMenu(null);
      setShowConflictDialog(false);
    } else if (result.conflict) {
      setShowConflictDialog(true);
    } else if (result.message) {
      alert(result.message);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--color-ink-400)' }}>
          Memuat menu tenant...
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <h2>Stan Tidak Ditemukan</h2>
          <Link href="/tenants">
            <Button style={{ marginTop: '1rem' }}>Kembali ke Daftar Tenant</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main style={{ flex: 1, paddingBottom: cart && cart.itemCount > 0 ? '7rem' : '3rem' }}>
        {/* Header Cover & Info */}
        <div style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '2rem 1rem 1.5rem 1rem' }}>
          <div className="container" style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }}>
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: '#E7E5E4',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {tenant.logoUrl ? (
                  <img src={tenant.logoUrl} alt={tenant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UtensilsCrossed size={36} color="#A8A29E" />
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-ink-900)' }}>
                    {tenant.name}
                  </h1>
                  <Badge variant="success" size="sm">Buka · Menerima Pesanan</Badge>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-500)', marginBottom: '0.5rem' }}>
                  {tenant.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-ink-500)', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#D97706' }}>
                    <Star size={14} fill="#D97706" /> {tenant.ratingAvg.toFixed(1)} ({tenant.ratingCount} ulasan)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={14} /> {tenant.location}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={14} /> Estimasi siap: ~{tenant.defaultPreparationTime} menit
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Catalog Section */}
        <div className="container" style={{ maxWidth: '900px', marginTop: '1.5rem', padding: '0 1rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-ink-900)', marginBottom: '1rem' }}>
            Daftar Menu
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {tenant.menus.map((menu: any) => {
              const isAvailable = menu.status === 'AVAILABLE' && menu.stock > 0;

              return (
                <Card key={menu.id} padding="none" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative', height: '160px', backgroundColor: '#E7E5E4' }}>
                    {menu.imageUrl ? (
                      <img src={menu.imageUrl} alt={menu.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UtensilsCrossed size={36} color="#A8A29E" />
                      </div>
                    )}

                    {!isAvailable && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(28, 25, 23, 0.65)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                        }}
                      >
                        Habis
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-ink-900)' }}>
                        {menu.name}
                      </h3>
                      {menu.description && (
                        <p
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--color-ink-500)',
                            marginTop: '0.25rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {menu.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary-600)' }}>
                          {formatRupiah(menu.price)}
                        </div>
                        {menu.stock <= 5 && isAvailable && (
                          <div style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 600 }}>
                            Sisa {menu.stock} porsi
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        disabled={!isAvailable}
                        onClick={() => handleOpenAddModal(menu)}
                        icon={<Plus size={16} />}
                      >
                        Tambah
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      {/* MODAL TAMBAH MENU KE KERANJANG */}
      <Modal isOpen={!!selectedMenu} onClose={() => setSelectedMenu(null)} title="Tambah ke Keranjang">
        {selectedMenu && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedMenu.name}</h4>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary-600)', marginTop: '0.25rem' }}>
                {formatRupiah(selectedMenu.price)}
              </div>
              {selectedMenu.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-500)', marginTop: '0.35rem' }}>
                  {selectedMenu.description}
                </p>
              )}
            </div>

            {/* Stepper Jumlah */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Jumlah Porsi:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                    opacity: quantity <= 1 ? 0.5 : 1,
                  }}
                >
                  <Minus size={16} />
                </button>

                <span style={{ fontSize: '1.1rem', fontWeight: 800, width: '28px', textAlign: 'center' }}>
                  {quantity}
                </span>

                <button
                  type="button"
                  disabled={quantity >= selectedMenu.stock}
                  onClick={() => setQuantity((q) => Math.min(selectedMenu.stock, q + 1))}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: quantity >= selectedMenu.stock ? 'not-allowed' : 'pointer',
                    opacity: quantity >= selectedMenu.stock ? 0.5 : 1,
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Catatan Pesanan */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink-700)' }}>
                Catatan Khusus (opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Sambal dipisah, tanpa es..."
                style={{
                  width: '100%',
                  marginTop: '0.35rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                }}
              />
            </div>

            <Button
              size="lg"
              loading={isAdding}
              onClick={() => handleConfirmAddToCart(false)}
              style={{ width: '100%' }}
            >
              Tambah ({formatRupiah(selectedMenu.price * quantity)})
            </Button>
          </div>
        )}
      </Modal>

      {/* DIALOG KONFLIK TENANT (BR-05) */}
      <Modal isOpen={showConflictDialog} onClose={() => setShowConflictDialog(false)} title="Ganti Pesanan Tenant?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#D97706' }}>
            <AlertTriangle size={32} />
            <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-700)', lineHeight: 1.5 }}>
              Satu checkout hanya dapat dilakukan dari <b>satu stan makanan</b>. Keranjang Anda saat ini
              berisi pesanan dari stan lain.
            </p>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-500)' }}>
            Apakah Anda ingin mengosongkan keranjang sebelumnya dan melanjutkan pesanan di <b>{tenant.name}</b>?
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="outline" onClick={() => setShowConflictDialog(false)} style={{ flex: 1 }}>
              Batal
            </Button>
            <Button
              loading={isAdding}
              onClick={() => handleConfirmAddToCart(true)}
              style={{ flex: 1 }}
            >
              Kosongkan & Ganti
            </Button>
          </div>
        </div>
      </Modal>

      {/* FLOATING MINI CART BAR */}
      {cart && cart.itemCount > 0 && cart.tenantId === tenant.id && (
        <div
          style={{
            position: 'fixed',
            bottom: '1rem',
            left: '1rem',
            right: '1rem',
            maxWidth: '640px',
            margin: '0 auto',
            zIndex: 40,
          }}
        >
          <div
            style={{
              padding: '0.875rem 1.25rem',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--gradient-primary)',
              color: '#FFFFFF',
              boxShadow: 'var(--shadow-float)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShoppingBag size={24} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{cart.itemCount} Item Dipilih</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Total {formatRupiah(cart.total)}</div>
              </div>
            </div>

            <Link
              href="/cart"
              style={{
                padding: '0.5rem 1.15rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#FFFFFF',
                color: 'var(--color-primary-600)',
                fontWeight: 700,
                fontSize: '0.875rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              Lihat Keranjang <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
