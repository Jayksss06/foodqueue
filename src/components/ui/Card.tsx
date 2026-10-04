import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  interactive = false,
  hoverable = false,
  padding = 'md',
  className = '',
  style,
  ...props
}: CardProps) {
  const paddingMap = {
    none: '0',
    sm: '0.75rem',
    md: '1.25rem',
    lg: '1.75rem',
  };

  const isInteractive = interactive || hoverable;

  return (
    <div
      className={`${isInteractive ? 'interactive-card' : ''} ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        padding: paddingMap[padding],
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
