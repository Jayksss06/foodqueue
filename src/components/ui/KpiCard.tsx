import React from 'react';
import { Card } from './Card';

export interface KpiCardProps {
  label?: string;
  title?: string;
  value: string | number;
  subtext?: string;
  icon?: any;
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'neutral' | 'forest';
  color?: string;
}

export function KpiCard({
  label,
  title,
  value,
  subtext,
  icon,
  variant,
  color,
}: KpiCardProps) {
  const effectiveLabel = label || title || '';
  const effectiveVariant = (variant || color || 'neutral') as string;

  const colorMap: Record<string, { text: string; bg: string }> = {
    primary: { text: 'var(--color-primary-500)', bg: 'rgba(240, 89, 42, 0.1)' },
    success: { text: 'var(--color-forest)', bg: '#ECFDF5' },
    forest: { text: 'var(--color-forest)', bg: '#ECFDF5' },
    warning: { text: '#D97706', bg: '#FFFBEB' },
    info: { text: '#0284C7', bg: '#F0F9FF' },
    neutral: { text: 'var(--color-text)', bg: 'var(--color-surface-hover)' },
  };

  const c = colorMap[effectiveVariant] || colorMap.neutral;

  // Render icon whether it's a JSX element or a component type (like LucideIcon)
  const renderedIcon = icon ? (
    React.isValidElement(icon) ? icon : React.createElement(icon, { size: 18 })
  ) : null;

  return (
    <Card padding="md">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          {effectiveLabel}
        </span>
        {renderedIcon && (
          <div
            style={{
              padding: '0.4rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: c.bg,
              color: c.text,
              display: 'flex',
            }}
          >
            {renderedIcon}
          </div>
        )}
      </div>

      <div
        className="tabular-nums"
        style={{
          fontSize: '1.85rem',
          fontWeight: 800,
          color: c.text,
          lineHeight: 1.1,
          marginBottom: subtext ? '0.35rem' : 0,
        }}
      >
        {value}
      </div>

      {subtext && (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-400)' }}>
          {subtext}
        </span>
      )}
    </Card>
  );
}
