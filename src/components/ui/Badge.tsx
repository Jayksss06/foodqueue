import React from 'react';
import { OrderStatus } from '@/types';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  style,
}: BadgeProps) {
  const variantStyles: Record<string, { bg: string; text: string; border: string }> = {
    success: {
      bg: 'var(--color-success-bg)',
      text: 'var(--color-success-text)',
      border: 'var(--color-success-border)',
    },
    warning: {
      bg: 'var(--color-warning-bg)',
      text: 'var(--color-warning-text)',
      border: 'var(--color-warning-border)',
    },
    info: {
      bg: 'var(--color-info-bg)',
      text: 'var(--color-info-text)',
      border: 'var(--color-info-border)',
    },
    danger: {
      bg: 'var(--color-danger-bg)',
      text: 'var(--color-danger-text)',
      border: 'var(--color-danger-border)',
    },
    neutral: {
      bg: 'var(--color-surface-hover)',
      text: 'var(--color-ink-700)',
      border: 'var(--color-border)',
    },
  };

  const v = variantStyles[variant];

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: size === 'sm' ? '0.15rem 0.5rem' : '0.25rem 0.75rem',
        fontSize: size === 'sm' ? '0.75rem' : '0.85rem',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        backgroundColor: v.bg,
        color: v.text,
        border: `1px solid ${v.border}`,
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: v.text,
          }}
        />
      )}
      {children}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { label: string; variant: BadgeProps['variant'] }> = {
    PENDING_PAYMENT: { label: 'Menunggu Pembayaran', variant: 'warning' },
    PAID: { label: 'Dibayar · Antre Dapur', variant: 'warning' },
    ACCEPTED: { label: 'Diterima Tenant', variant: 'info' },
    PREPARING: { label: 'Sedang Dimasak', variant: 'info' },
    READY_FOR_PICKUP: { label: 'Siap Diambil 🎉', variant: 'success' },
    COMPLETED: { label: 'Selesai', variant: 'neutral' },
    CANCELLED: { label: 'Dibatalkan', variant: 'danger' },
    REJECTED: { label: 'Ditolak (Refund)', variant: 'danger' },
    REFUNDED: { label: 'Dana Dikembalikan', variant: 'neutral' },
    NO_SHOW: { label: 'Tidak Diambil', variant: 'danger' },
  };

  const cfg = map[status] || { label: status, variant: 'neutral' };
  return (
    <Badge variant={cfg.variant} dot={status === 'READY_FOR_PICKUP'}>
      {cfg.label}
    </Badge>
  );
}
