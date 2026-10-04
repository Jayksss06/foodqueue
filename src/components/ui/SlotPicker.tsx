'use client';

import React from 'react';
import { SlotAvailability } from '@/types';
import { Check, AlertCircle } from 'lucide-react';

export interface SlotPickerProps {
  slots: SlotAvailability[];
  selectedSlotId: string | null;
  onSelectSlot: (slot: SlotAvailability) => void;
  loading?: boolean;
}

export function SlotPicker({
  slots,
  selectedSlotId,
  onSelectSlot,
  loading = false,
}: SlotPickerProps) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: '68px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-surface-hover)',
              animation: 'pulse 1.2s ease-in-out infinite',
            }}
          />
        ))}
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div
        style={{
          padding: '1.5rem',
          textAlign: 'center',
          backgroundColor: 'var(--color-surface-hover)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-ink-500)',
          fontSize: '0.9rem',
        }}
      >
        <AlertCircle size={28} style={{ margin: '0 auto 0.5rem auto', color: 'var(--color-ink-400)' }} />
        Tidak ada slot pengambilan yang tersedia pada tanggal ini.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
        }}
      >
        {slots.map((slot) => {
          const isSelected = selectedSlotId === slot.slotId;
          const isAvailable = slot.isAvailable;
          const isLow = isAvailable && slot.remainingCapacity <= 3;

          return (
            <button
              key={slot.slotId || slot.startAt}
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && onSelectSlot(slot)}
              className={isAvailable ? 'pressable' : ''}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                padding: '0.75rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isSelected
                  ? 'var(--color-primary-50)'
                  : isAvailable
                  ? 'var(--color-surface)'
                  : 'var(--color-surface-hover)',
                border: `2px solid ${
                  isSelected
                    ? 'var(--color-primary-500)'
                    : isAvailable
                    ? 'var(--color-border)'
                    : 'var(--color-border-subtle)'
                }`,
                opacity: isAvailable ? 1 : 0.55,
                cursor: isAvailable ? 'pointer' : 'not-allowed',
                textAlign: 'left',
                position: 'relative',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: isSelected
                      ? 'var(--color-primary-600)'
                      : isAvailable
                      ? 'var(--color-ink-900)'
                      : 'var(--color-ink-400)',
                    textDecoration: !isAvailable ? 'line-through' : 'none',
                  }}
                >
                  {slot.startTimeLabel}–{slot.endTimeLabel}
                </span>

                {isSelected && (
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary-500)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>

              <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>
                {!isAvailable ? (
                  <span style={{ color: 'var(--color-ink-400)' }}>
                    {slot.reason?.includes('penuh') ? 'Penuh' : 'Tidak tersedia'}
                  </span>
                ) : isLow ? (
                  <span
                    style={{
                      color: '#B45309',
                      backgroundColor: '#FEF3C7',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                    }}
                  >
                    Sisa {slot.remainingCapacity} (Hampir penuh)
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-secondary-600)' }}>
                    Sisa {slot.remainingCapacity} slot
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-400)', marginTop: '0.25rem' }}>
        ℹ️ Kapasitas tiap slot dibatasi maksimal 10 pesanan untuk mencegah antrean fisik di kantin.
      </p>
    </div>
  );
}
