import React from 'react';
import { OrderStatus } from '@/types';
import { Check, Clock, Utensils, Sparkles, AlertCircle } from 'lucide-react';

export interface OrderTimelineProps {
  status?: OrderStatus;
  currentStatus?: OrderStatus;
  statusLogs?: any[];
  createdAt?: string | Date;
  paidAt?: string | Date | null;
  acceptedAt?: string | Date | null;
  readyAt?: string | Date | null;
  completedAt?: string | Date | null;
  cancelledAt?: string | Date | null;
  cancelReason?: string | null;
}

export function OrderTimeline({
  status,
  currentStatus,
  statusLogs,
  cancelReason,
}: OrderTimelineProps) {
  const activeStatus = currentStatus || status || 'PENDING_PAYMENT';
  if (activeStatus === 'CANCELLED' || activeStatus === 'REJECTED' || activeStatus === 'REFUNDED') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem',
          backgroundColor: 'var(--color-danger-bg)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-danger-text)',
        }}
      >
        <AlertCircle size={24} />
        <div>
          <div style={{ fontWeight: 700 }}>Pesanan {activeStatus === 'REJECTED' ? 'Ditolak' : 'Dibatalkan'}</div>
          {cancelReason && <div style={{ fontSize: '0.85rem' }}>Alasan: {cancelReason}</div>}
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'PENDING_PAYMENT', label: 'Pesanan Dibuat', icon: <Clock size={16} /> },
    { key: 'PAID', label: 'Pembayaran Berhasil', icon: <Check size={16} /> },
    { key: 'ACCEPTED', label: 'Diterima Tenant', icon: <Utensils size={16} /> },
    { key: 'PREPARING', label: 'Sedang Dimasak', icon: <Utensils size={16} /> },
    { key: 'READY_FOR_PICKUP', label: 'Siap Diambil', icon: <Sparkles size={16} /> },
    { key: 'COMPLETED', label: 'Selesai', icon: <Check size={16} /> },
  ];

  const statusOrder: OrderStatus[] = [
    'PENDING_PAYMENT',
    'PAID',
    'ACCEPTED',
    'PREPARING',
    'READY_FOR_PICKUP',
    'COMPLETED',
  ];

  const currentIndex = statusOrder.indexOf(activeStatus);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
      {steps.map((step, idx) => {
        const isDone = currentIndex >= idx;
        const isCurrent = currentIndex === idx;

        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDone
                  ? isCurrent
                    ? 'var(--color-primary-500)'
                    : 'var(--color-secondary-500)'
                  : 'var(--color-border)',
                color: isDone ? '#FFFFFF' : 'var(--color-ink-400)',
                boxShadow: isCurrent ? '0 0 0 4px var(--color-primary-100)' : 'none',
                transition: 'all var(--transition-normal)',
                flexShrink: 0,
              }}
            >
              {isDone ? <Check size={16} /> : step.icon}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '0.9rem',
                  fontWeight: isCurrent ? 700 : isDone ? 600 : 400,
                  color: isCurrent
                    ? 'var(--color-primary-600)'
                    : isDone
                    ? 'var(--color-ink-900)'
                    : 'var(--color-ink-400)',
                }}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
