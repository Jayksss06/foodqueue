'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  style,
  ...props
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    display: fullWidth ? 'flex' : 'inline-flex',
    width: fullWidth ? '100%' : undefined,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition-fast)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    border: '1px solid transparent',
    ...style,
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '0.4rem 0.75rem', fontSize: '0.85rem' },
    md: { padding: '0.625rem 1.25rem', fontSize: '0.95rem' },
    lg: { padding: '0.875rem 1.75rem', fontSize: '1.05rem', borderRadius: 'var(--radius-lg)' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--gradient-primary)',
      color: '#FFFFFF',
      boxShadow: '0 4px 12px rgba(240, 89, 42, 0.25)',
    },
    secondary: {
      backgroundColor: 'var(--color-secondary-500)',
      color: '#FFFFFF',
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: 'var(--color-border)',
      color: 'var(--color-ink-900)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-ink-700)',
    },
    danger: {
      backgroundColor: 'var(--color-danger-bg)',
      color: 'var(--color-danger-text)',
      borderColor: 'var(--color-danger-border)',
    },
  };

  return (
    <button
      className={`pressable ${className}`}
      disabled={disabled || loading}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: '1em',
            height: '1em',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      ) : (
        icon
      )}
      {children}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
}
