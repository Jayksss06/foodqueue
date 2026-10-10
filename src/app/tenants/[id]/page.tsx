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
    setSelectedMenu(menu);
    setQuantity(1);
    setNotes('');
  };

  const handleConfirmAddToCart = async (replaceCart = false) => {
    if (!selectedMenu || !tenant) return;
    setIsAdding(true);

    const result = await addItem(selectedMenu.id, quantity, notes, replaceCart, {
      name: selectedMenu.name,
      price: selectedMenu.price,
      imageUrl: selectedMenu.imageUrl,
      tenantId: tenant.id,
      tenantName: tenant.name,
      stock: selectedMenu.stock,
    });
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

  const isCartBelongsToTenant = cart && cart.itemCount > 0 && cart.tenantId === tenant.id;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main style={{ flex: 1, paddingBottom: isCartBelongsToTenant ? '8.5rem' : '4.5rem' }}>
        {/* Header Cover & Info */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            padding: '1.25rem 1rem 1.25rem 1rem',
          }}
        >
          <div className="container" style={{ maxWidth: '960px' }}>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
              }}
              className="tenant-header-flex"
            >
              <div
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: '#E7E5E4',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)',
                }}
                className="tenant-logo-box"
              >
                {tenant.logoUrl ? (
                  <img
                    src={tenant.logoUrl}
                    alt={tenant.name}
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
                    }}
                  >
                    <UtensilsCrossed size={32} color="#A8A29E" />
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '0.4rem',
                    marginBottom: '0.2rem',
                  }}
                >
                  <h1
                    style={{
                      fontSize: 'clamp(1.2rem, 4vw, 1.55rem)',
                      fontWeight: 850,
                      color: 'var(--color-ink-900)',
                      lineHeight: 1.2,
                    }}
                  >
                    {tenant.name}
                  </h1>
                  <Badge variant="success" size="sm">
                    Buka · Menerima Pesanan
                  </Badge>
                </div>

                {tenant.description && (
                  <p
                    style={{
                      fontSize: '0.825rem',
                      color: 'var(--color-ink-500)',
                      marginBottom: '0.45rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.35,
                    }}
                  >
                    {tenant.description}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    fontSize: '0.775rem',
                    color: 'var(--color-ink-500)',
                    fontWeight: 650,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#D97706' }}>
                    <Star size={13} fill="#D97706" /> {tenant.ratingAvg.toFixed(1)} ({tenant.ratingCount})
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <MapPin size={13} /> {tenant.location}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Clock size={13} /> ~{tenant.defaultPreparationTime} mnt
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Catalog Section: 2 Kolom Makanan di Browser HP */}
        <div className="container" style={{ maxWidth: '960px', marginTop: '1.25rem', padding: '0 0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 850, color: 'var(--color-ink-900)' }}>
              Daftar Menu
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-400)', fontWeight: 600 }}>
              {tenant.menus?.length || 0} Hidangan
            </span>
          </div>

          {/* 2-COLUMN FOOD GRID ON MOBILE */}
          <div className="menu-two-column-grid">
            {tenant.menus.map((menu: any) => {
              const isAvailable = menu.status === 'AVAILABLE' && menu.stock > 0;

              return (
                <div key={menu.id} className="food-menu-card">
                  {/* Gambar Menu */}
                  <div className="food-image-wrapper">
                    {menu.imageUrl ? (
                      <img
                        src={menu.imageUrl}
                        alt={menu.name}
                        className="food-img"
                      />
                    ) : (
                      <div className="food-img-fallback">
                        <UtensilsCrossed size={30} color="#A8A29E" />
                      </div>
                    )}

                    {/* Stock Alert Pill */}
                    {isAvailable && menu.stock <= 5 && (
                      <span className="stock-badge">
                        Sisa {menu.stock}
                      </span>
                    )}

                    {/* Sold out overlay */}
                    {!isAvailable && (
                      <div className="soldout-overlay">
                        Habis
                      </div>
                    )}
                  </div>

                  {/* Body Card */}
                  <div className="food-card-body">
                    <div>
                      <h3 className="food-title" title={menu.name}>
                        {menu.name}
                      </h3>
                      {menu.description && (
                        <p className="food-desc">
                          {menu.description}
                        </p>
                      )}
                    </div>

                    <div className="food-bottom-row">
                      <div className="food-price">
                        {formatRupiah(menu.price)}
                      </div>

                      <button
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => handleOpenAddModal(menu)}
                        className={`add-food-btn ${!isAvailable ? 'disabled' : ''}`}
                        aria-label={`Tambah ${menu.name}`}
                      >
                        <Plus size={15} strokeWidth={2.5} />
                        <span>Tambah</span>
                      </button>
                    </div>
                  </div>
                </div>
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
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-ink-900)' }}>
                {selectedMenu.name}
              </h4>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 850,
                  color: 'var(--color-primary-600)',
                  marginTop: '0.2rem',
                }}
              >
                {formatRupiah(selectedMenu.price)}
              </div>
              {selectedMenu.description && (
                <p style={{ fontSize: '0.825rem', color: 'var(--color-ink-500)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                  {selectedMenu.description}
                </p>
              )}
            </div>

            {/* Stepper Jumlah Porsi */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 0',
                borderTop: '1px solid var(--color-border)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-ink-800)' }}>
                Jumlah Porsi:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                    opacity: quantity <= 1 ? 0.4 : 1,
                  }}
                >
                  <Minus size={16} />
                </button>

                <span style={{ fontSize: '1.15rem', fontWeight: 800, width: '32px', textAlign: 'center' }}>
                  {quantity}
                </span>

                <button
                  type="button"
                  disabled={quantity >= selectedMenu.stock}
                  onClick={() => setQuantity((q) => Math.min(selectedMenu.stock, q + 1))}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: quantity >= selectedMenu.stock ? 'not-allowed' : 'pointer',
                    opacity: quantity >= selectedMenu.stock ? 0.4 : 1,
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Catatan Pesanan */}
            <div>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-ink-700)' }}>
                Catatan Pesanan (opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Sambal dipisah, tidak pakai daun bawang..."
                style={{
                  width: '100%',
                  marginTop: '0.35rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <Button
              size="lg"
              loading={isAdding}
              onClick={() => handleConfirmAddToCart(false)}
              style={{ width: '100%', marginTop: '0.25rem' }}
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
            <AlertTriangle size={32} style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-700)', lineHeight: 1.5 }}>
              Satu pesanan hanya dapat dilakukan dari <b>satu stan makanan</b>. Keranjang Anda saat ini
              berisi hidangan dari stan lain.
            </p>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-500)', lineHeight: 1.45 }}>
            Apakah Anda ingin mengosongkan keranjang sebelumnya dan beralih memesan di <b>{tenant.name}</b>?
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

      {/* FLOATING MINI CART BAR (Mobile-Optimized) */}
      {isCartBelongsToTenant && (
        <div className="floating-cart-bar">
          <div className="floating-cart-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="cart-icon-circle">
                <ShoppingBag size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.925rem' }}>
                  {cart.itemCount} Item Dipilih
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                  Total {formatRupiah(cart.total)}
                </div>
              </div>
            </div>

            <Link href="/checkout" className="view-cart-btn">
              <span>Lanjut Checkout</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}

      {/* Responsive Styles untuk 2 Kolom Menu di HP & Universal Layout */}
      <style jsx>{`
        /* 2-Kolom Grid: Default 2 kolom untuk Mobile HP */
        .menu-two-column-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }

        @media (min-width: 640px) {
          .menu-two-column-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 1rem;
          }
        }

        @media (min-width: 768px) {
          .menu-two-column-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1.15rem;
          }
        }

        @media (min-width: 1024px) {
          .menu-two-column-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 1.25rem;
          }
        }

        /* Food Menu Card */
        .food-menu-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }

        .food-menu-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .food-image-wrapper {
          position: relative;
          height: 125px;
          background-color: #f5f5f4;
          overflow: hidden;
        }

        @media (min-width: 640px) {
          .food-image-wrapper {
            height: 145px;
          }
        }

        .food-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .food-menu-card:hover .food-img {
          transform: scale(1.04);
        }

        .food-img-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stock-badge {
          position: absolute;
          top: 0.4rem;
          left: 0.4rem;
          background-color: #fef3c7;
          color: #92400e;
          font-size: 0.68rem;
          font-weight: 750;
          padding: 0.18rem 0.45rem;
          border-radius: var(--radius-full);
          border: 1px solid #fde68a;
          box-shadow: 0 2px 4px rgba(0,0,0,0.06);
        }

        .soldout-overlay {
          position: absolute;
          inset: 0;
          background-color: rgba(28, 25, 23, 0.72);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          font-size: 0.85rem;
          backdrop-filter: blur(2px);
        }

        .food-card-body {
          padding: 0.75rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .food-title {
          font-size: clamp(0.85rem, 3.2vw, 0.975rem);
          font-weight: 750;
          color: var(--color-ink-900);
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.2rem;
        }

        .food-desc {
          font-size: 0.75rem;
          color: var(--color-ink-500);
          margin-top: 0.2rem;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.3;
        }

        .food-bottom-row {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          margin-top: 0.65rem;
        }

        .food-price {
          font-size: clamp(0.9rem, 3.5vw, 1.05rem);
          font-weight: 850;
          color: var(--color-primary-600);
        }

        .add-food-btn {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          padding: 0.45rem 0.65rem;
          background-color: var(--color-primary-500);
          color: #ffffff;
          font-weight: 750;
          font-size: 0.8rem;
          border-radius: var(--radius-md);
          transition: background-color var(--transition-fast), transform var(--transition-fast);
          cursor: pointer;
        }

        .add-food-btn:hover:not(:disabled) {
          background-color: var(--color-primary-600);
        }

        .add-food-btn:active:not(:disabled) {
          transform: scale(0.97);
        }

        .add-food-btn.disabled {
          background-color: #e7e5e4;
          color: #a8a29e;
          cursor: not-allowed;
        }

        /* Floating Mini Cart Bar */
        .floating-cart-bar {
          position: fixed;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 0.85rem);
          left: 0.85rem;
          right: 0.85rem;
          max-width: 640px;
          margin: 0 auto;
          z-index: 45;
          animation: slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .floating-cart-inner {
          padding: 0.75rem 1.15rem;
          border-radius: var(--radius-xl);
          background: var(--gradient-primary);
          color: #ffffff;
          box-shadow: 0 16px 36px rgba(240, 89, 42, 0.28);
          display: flex;
          align-items: center;
          justify-content: space-between;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.25);
        }

        .cart-icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .view-cart-btn {
          padding: 0.5rem 1rem;
          border-radius: var(--radius-lg);
          background-color: #ffffff;
          color: var(--color-primary-600);
          font-weight: 750;
          font-size: 0.825rem;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          text-decoration: none;
          white-space: nowrap;
          transition: transform var(--transition-fast);
        }

        .view-cart-btn:active {
          transform: scale(0.96);
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
