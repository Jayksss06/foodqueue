'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  icon,
  className = '',
  id,
  style,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-ink-700)',
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <div
            style={{
              position: 'absolute',
              left: '0.75rem',
              color: 'var(--color-ink-400)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {icon}
          </div>
        )}

        <input
          id={inputId}
          className={className}
          style={{
            width: '100%',
            padding: icon ? '0.625rem 0.875rem 0.625rem 2.5rem' : '0.625rem 0.875rem',
            fontSize: '0.95rem',
            color: 'var(--color-ink-900)',
            backgroundColor: 'var(--color-surface)',
            border: `1px solid ${error ? 'var(--color-danger-border)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--color-danger-text)' : 'var(--color-primary-500)';
            e.currentTarget.style.boxShadow = error
              ? '0 0 0 3px rgba(239, 68, 68, 0.15)'
              : '0 0 0 3px rgba(240, 89, 42, 0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--color-danger-border)' : 'var(--color-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          {...props}
        />
      </div>

      {error ? (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-danger-text)', fontWeight: 500 }}>
          {error}
        </span>
      ) : helperText ? (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-400)' }}>{helperText}</span>
      ) : null}
    </div>
  );
}
