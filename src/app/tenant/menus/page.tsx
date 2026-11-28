'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatRupiah } from '@/lib/utils';
import {
  UtensilsCrossed,
  Plus,
  Edit,
  Trash2,
  Clock,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export default function TenantMenusPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Daily stock reset modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetStockValue, setResetStockValue] = useState('30');
  const [includeUnavailable, setIncludeUnavailable] = useState(false);
  const [resettingStock, setResettingStock] = useState(false);
  const [resetBanner, setResetBanner] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('20000');
  const [stock, setStock] = useState('20');
  const [preparationTime, setPreparationTime] = useState('15');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<'AVAILABLE' | 'UNAVAILABLE' | 'OUT_OF_STOCK'>('AVAILABLE');
  const [imageUrl, setImageUrl] = useState('');

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const [menuRes, catRes] = await Promise.all([
        fetch('/api/tenant/menus'),
        fetch('/api/categories'),
      ]);
      const menuData = await menuRes.json();
      const catData = await catRes.json();

      if (menuRes.ok) setMenus(menuData.data || []);
      if (catRes.ok) {
        setCategories(catData.data || []);
        if (catData.data?.length > 0 && !categoryId) {
          setCategoryId(catData.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const openCreateModal = () => {
    setEditingMenu(null);
    setName('');
    setDescription('');
    setPrice('20000');
    setStock('20');
    setPreparationTime('15');
    setStatus('AVAILABLE');
    setImageUrl('');
    if (categories.length > 0) setCategoryId(categories[0].id);
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingMenu(item);
    setName(item.name);
    setDescription(item.description || '');
    setPrice(item.price.toString());
    setStock(item.stock.toString());
    setPreparationTime(item.preparationTime.toString());
    setStatus(item.status);
    setImageUrl(item.imageUrl || '');
    setCategoryId(item.categoryId || (categories[0]?.id ?? ''));
    setModalOpen(true);
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name,
        description: description || undefined,
        price: parseInt(price, 10),
        stock: parseInt(stock, 10),
        preparationTime: parseInt(preparationTime, 10),
        categoryId,
        status,
        imageUrl: imageUrl || undefined,
      };

      let res;
      if (editingMenu) {
        res = await fetch(`/api/tenant/menus/${editingMenu.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/tenant/menus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.message || 'Gagal menyimpan menu.');

      setModalOpen(false);
      await fetchMenus();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetDailyStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedStock = parseInt(resetStockValue, 10);
    if (Number.isNaN(parsedStock) || parsedStock < 1 || parsedStock > 500) {
      alert('Masukkan jumlah stok harian antara 1 hingga 500 porsi.');
      return;
    }

    try {
      setResettingStock(true);
      const res = await fetch('/api/tenant/menus/reset-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultStock: parsedStock,
          includeUnavailable,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || 'Gagal mereset stok harian.');
      }

      setResetModalOpen(false);
      setResetBanner(
        data.data?.message || `Stok menu berhasil direset menjadi ${parsedStock} porsi.`
      );
      await fetchMenus();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResettingStock(false);
    }
  };

  const handleDelete = async (id: string, menuName: string) => {
    if (!confirm(`Hapus menu "${menuName}" dari katalog?`)) return;
    try {
      const res = await fetch(`/api/tenant/menus/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menghapus menu.');
      await fetchMenus();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleQuickStatus = async (item: any, newStatus: string) => {
    try {
      const res = await fetch(`/api/tenant/menus/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) await fetchMenus();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '1.75rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 850, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UtensilsCrossed size={24} color="var(--color-primary-500)" />
            Katalog Menu & Manajemen Stok
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Kelola hidangan, sesuaikan harga, dan perbarui sisa porsi harian
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {menus.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setResetBanner(null);
                setResetModalOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderColor: 'var(--color-forest)',
                color: 'var(--color-forest)',
              }}
            >
              <RotateCcw size={16} /> Reset Stok Harian
            </Button>
          )}
          <Button
            variant="primary"
            onClick={openCreateModal}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={18} /> Tambah Menu Baru
          </Button>
        </div>
      </div>

      {resetBanner && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '0.85rem 1.1rem',
            marginBottom: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            fontSize: '0.875rem',
            fontWeight: 650,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} color="var(--color-forest)" />
            {resetBanner}
          </span>
          <button
            type="button"
            onClick={() => setResetBanner(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#065F46',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            Tutup
          </button>
        </div>
      )}

      {/* Grid of Menus */}
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
          <p style={{ color: 'var(--color-text-muted)' }}>Memuat daftar menu...</p>
        </div>
      ) : menus.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <UtensilsCrossed size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.25rem' }}>Belum Ada Menu Terdaftar</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Tambahkan hidangan andalan Anda sekarang agar pelanggan dapat mulai memesan secara pre-order.
          </p>
          <Button variant="primary" onClick={openCreateModal}>
            Tambah Menu Sekarang
          </Button>
        </Card>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem'
        }}>
          {menus.map((item) => {
            const isAvail = item.status === 'AVAILABLE';
            const isOut = item.status === 'OUT_OF_STOCK';

            return (
              <Card key={item.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--color-forest)',
                      background: '#ECFDF5',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      {item.category?.name || 'Makanan'}
                    </span>

                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 750,
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isAvail ? '#ECFDF5' : isOut ? '#FEF3C7' : '#FEE2E2',
                      color: isAvail ? 'var(--color-forest)' : isOut ? '#B45309' : '#DC2626'
                    }}>
                      {isAvail ? 'Tersedia' : isOut ? 'Habis' : 'Dinonaktifkan'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                    {item.name}
                  </h3>

                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.4, marginBottom: '0.75rem', minHeight: '36px' }}>
                    {item.description || 'Tidak ada deskripsi hidangan.'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={13} /> ±{item.preparationTime} mnt
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      Stok: <strong style={{ color: item.stock <= 5 ? 'var(--color-coral)' : 'var(--color-text)' }}>{item.stock} porsi</strong>
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 850, fontFamily: 'monospace', color: 'var(--color-primary-500)' }}>
                      {formatRupiah(item.price)}
                    </span>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => openEditModal(item)}
                        style={{
                          background: 'none',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.35rem 0.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.75rem',
                          color: 'var(--color-text)'
                        }}
                      >
                        <Edit size={13} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        style={{
                          background: 'none',
                          border: '1px solid #FECACA',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.35rem 0.5rem',
                          cursor: 'pointer',
                          color: '#DC2626',
                          fontSize: '0.75rem'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Fast Stock Toggle Button */}
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {isAvail ? (
                      <button
                        onClick={() => handleQuickStatus(item, 'OUT_OF_STOCK')}
                        style={{
                          width: '100%',
                          padding: '0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid #FDE68A',
                          background: '#FFFBEB',
                          color: '#B45309',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Tandai Stok Habis
                      </button>
                    ) : (
                      <button
                        onClick={() => handleQuickStatus(item, 'AVAILABLE')}
                        style={{
                          width: '100%',
                          padding: '0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid #A7F3D0',
                          background: '#ECFDF5',
                          color: 'var(--color-forest)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Tandai Tersedia
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Menu Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMenu ? 'Edit Menu Hidangan' : 'Tambah Menu Baru'}
      >
        <form onSubmit={handleSaveMenu} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Nama Menu:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Misal: Nasi Ayam Bakar Sambal Terasi"
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Kategori:
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.9rem',
                background: '#FFFFFF'
              }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Harga (Rp):
              </label>
              <input
                type="number"
                required
                min={1000}
                step={500}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Stok Harian (Porsi):
              </label>
              <input
                type="number"
                required
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Waktu Masak (Menit):
              </label>
              <input
                type="number"
                required
                min={1}
                max={60}
                value={preparationTime}
                onChange={(e) => setPreparationTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Status Ketersediaan:
              </label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem',
                  background: '#FFFFFF'
                }}
              >
                <option value="AVAILABLE">Tersedia (Bisa Dipesan)</option>
                <option value="OUT_OF_STOCK">Habis (Out of Stock)</option>
                <option value="UNAVAILABLE">Nonaktif (Sembunyikan)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Deskripsi Singkat (opsional):
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsikan bumbu atau lauk pelengkap..."
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : editingMenu ? 'Perbarui Menu' : 'Tambah ke Katalog'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 1-Click Daily Stock Reset Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Buka Hari Baru — Reset Stok Harian"
      >
        <form onSubmit={handleResetDailyStock} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
            Isi ulang stok seluruh menu aktif sekaligus dan ubah menu berstatus <strong>Habis</strong> kembali menjadi{' '}
            <strong>Tersedia</strong> dalam 1 klik.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 650, marginBottom: '0.45rem' }}>
              Pilih Jumlah Stok Standar (Porsi per Menu):
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem' }}>
              {['20', '30', '50', '100'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setResetStockValue(preset)}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border:
                      resetStockValue === preset
                        ? '1.5px solid var(--color-forest)'
                        : '1px solid var(--color-border)',
                    background: resetStockValue === preset ? '#ECFDF5' : '#FFFFFF',
                    color: resetStockValue === preset ? 'var(--color-forest)' : 'var(--color-text)',
                    fontWeight: 750,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  {preset} porsi
                </button>
              ))}
            </div>
            <input
              type="number"
              required
              min={1}
              max={500}
              value={resetStockValue}
              onChange={(e) => setResetStockValue(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.95rem',
                fontWeight: 700,
              }}
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.55rem',
              fontSize: '0.82rem',
              color: 'var(--color-text)',
              cursor: 'pointer',
              padding: '0.65rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              background: '#F9FAFB',
              border: '1px solid var(--color-border)',
            }}
          >
            <input
              type="checkbox"
              checked={includeUnavailable}
              onChange={(e) => setIncludeUnavailable(e.target.checked)}
              style={{ marginTop: '2px' }}
            />
            <span>
              Sertakan menu yang berstatus <strong>Dinonaktifkan</strong> (secara default hanya menu Tersedia & Habis yang direset).
            </span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
            <Button variant="outline" type="button" onClick={() => setResetModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={resettingStock}
              style={{ background: 'var(--color-forest)' }}
            >
              {resettingStock ? 'Mereset Stok...' : `Reset ke ${resetStockValue || '0'} Porsi`}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
