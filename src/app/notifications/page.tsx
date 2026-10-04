'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Bell, CheckCheck, Clock, ExternalLink, Info, CheckCircle2 } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications?pageSize=40');
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      const res = await fetch('/api/notifications', { method: 'PATCH' });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleItemClick = async (notif: any) => {
    if (!notif.isRead) {
      try {
        await fetch(`/api/notifications/${notif.id}/read`, { method: 'PATCH' });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error(err);
      }
    }

    if (notif.orderId) {
      router.push(`/orders/${notif.orderId}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-light)', paddingBottom: '120px' }}>
      <Navbar />

      <main className="container" style={{ maxWidth: '680px', padding: '1.5rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 850, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={24} color="var(--color-primary)" />
              Notifikasi
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Pembaruan status pesanan dan pengingat slot pengambilan
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
            >
              <CheckCheck size={16} /> Tandai Semua Dibaca
            </Button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }} />
            <p style={{ color: 'var(--color-text-muted)' }}>Memuat notifikasi...</p>
          </div>
        ) : notifications.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'var(--color-surface-hover)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: 'var(--color-text-muted)'
            }}>
              <Bell size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.25rem' }}>Belum Ada Notifikasi</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Notifikasi tentang pesanan dan slot pengambilan akan muncul di sini.
            </p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                style={{
                  background: n.isRead ? 'var(--color-surface)' : '#FEF3EE',
                  border: n.isRead ? '1px solid var(--color-border)' : '1px solid #FDCBB9',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem 1.25rem',
                  cursor: n.orderId ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                {!n.isRead && (
                  <span style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)'
                  }} />
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: n.type === 'READY_FOR_PICKUP' ? '#ECFDF5' : 'var(--color-surface-hover)',
                    color: n.type === 'READY_FOR_PICKUP' ? 'var(--color-forest)' : 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {n.type === 'READY_FOR_PICKUP' ? <CheckCircle2 size={20} /> : <Info size={20} />}
                  </div>

                  <div style={{ flex: 1, paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: n.isRead ? 700 : 800, color: 'var(--color-text)' }}>
                        {n.title}
                      </h4>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                      {n.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} />
                        {new Date(n.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      {n.orderId && (
                        <span style={{ color: 'var(--color-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          Buka Detail Pesanan <ExternalLink size={12} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
