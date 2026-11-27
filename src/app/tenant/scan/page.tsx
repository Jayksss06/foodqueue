'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatRupiah } from '@/lib/utils';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShoppingBag,
  User,
  Camera,
  CameraOff,
  Keyboard,
  RefreshCw,
} from 'lucide-react';

type ScanMode = 'CAMERA' | 'MANUAL';

const QR_READER_ELEMENT_ID = 'fq-qr-reader-viewport';

export default function TenantScanPickupPage() {
  const [mode, setMode] = useState<ScanMode>('CAMERA');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifiedOrder, setVerifiedOrder] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera Scanner States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const scannerRef = useRef<any>(null);
  const isProcessingRef = useRef(false);
  const lastFailedScanRef = useRef<{ code: string; at: number } | null>(null);
  const [pendingAutoStart, setPendingAutoStart] = useState(false);

  const stopCamera = useCallback(async () => {
    const instance = scannerRef.current;
    scannerRef.current = null;
    setCameraActive(false);
    setCameraStarting(false);

    if (!instance) return;
    try {
      const state = typeof instance.getState === 'function' ? instance.getState() : null;
      // Html5QrcodeScannerState: SCANNING = 2, PAUSED = 3
      if (state === 2 || state === 3) {
        await instance.stop();
      }
    } catch {
      // Abaikan jika stream kamera sudah berhenti
    }
    try {
      await instance.clear();
    } catch {
      // Abaikan error pembersihan DOM
    }
  }, []);

  const verifyPickupCode = useCallback(
    async (rawCode: string) => {
      const normalized = rawCode.trim().toUpperCase();
      if (!normalized || normalized.length < 4) {
        setErrorMessage('Masukkan minimal 4 karakter kode pengambilan.');
        return;
      }

      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        setLoading(true);
        setErrorMessage(null);
        setVerifiedOrder(null);

        const res = await fetch('/api/tenant/pickup/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: normalized }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.error?.message || data.message || 'Gagal memverifikasi kode pengambilan.'
          );
        }

        setVerifiedOrder(data.data?.order || data.data);
        setCode('');
        setLastScannedCode(normalized);
        lastFailedScanRef.current = null;
        await stopCamera();
      } catch (err: any) {
        lastFailedScanRef.current = { code: normalized, at: Date.now() };
        setErrorMessage(err.message || 'Terjadi kesalahan sistem saat verifikasi.');
      } finally {
        setLoading(false);
        isProcessingRef.current = false;
      }
    },
    [stopCamera]
  );

  const startCamera = useCallback(async () => {
    if (cameraStarting || cameraActive) return;

    setCameraError(null);
    setErrorMessage(null);
    setVerifiedOrder(null);
    setCameraStarting(true);

    try {
      if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
        throw new Error(
          'Kamera tidak didukung di browser ini atau halaman tidak dibuka melalui HTTPS. Gunakan tab Input Manual.'
        );
      }

      await stopCamera();

      const { Html5Qrcode } = await import('html5-qrcode');
      const container = document.getElementById(QR_READER_ELEMENT_ID);
      if (!container) {
        throw new Error('Area kamera belum siap. Silakan coba lagi.');
      }

      const scanner = new Html5Qrcode(QR_READER_ELEMENT_ID, { verbose: false });
      scannerRef.current = scanner;

      const onDecoded = (decodedText: string) => {
        if (isProcessingRef.current) return;
        const cleaned = decodedText.trim().toUpperCase();
        if (cleaned.length < 4 || cleaned.length > 12) return;

        // Cegah spam request berulang saat QR yang salah/sudah dipakai masih berada di depan lensa
        const lastFailed = lastFailedScanRef.current;
        if (lastFailed && lastFailed.code === cleaned && Date.now() - lastFailed.at < 3000) {
          return;
        }

        setCode(cleaned);
        void verifyPickupCode(cleaned);
      };

      const scanConfig = {
        fps: 10,
        qrbox: { width: 230, height: 230 },
        aspectRatio: 1.0,
      };

      try {
        await scanner.start(
          { facingMode: 'environment' },
          scanConfig,
          onDecoded,
          () => {}
        );
      } catch {
        // Fallback ke kamera default (misal webcam laptop) jika kamera belakang tidak tersedia
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          throw new Error('Tidak ditemukan perangkat kamera pada perangkat ini.');
        }
        await scanner.start(cameras[0].id, scanConfig, onDecoded, () => {});
      }

      setCameraActive(true);
    } catch (err: any) {
      await stopCamera();
      const rawMsg = String(err?.message || err || '');
      if (/NotAllowedError|Permission denied|permission/i.test(rawMsg)) {
        setCameraError(
          'Izin kamera ditolak oleh browser. Aktifkan izin kamera pada pengaturan browser atau gunakan tab Input Manual.'
        );
      } else if (/NotFoundError|Requested device not found/i.test(rawMsg)) {
        setCameraError('Perangkat kamera tidak ditemukan. Gunakan tab Input Manual untuk memasukkan 6 karakter kode.');
      } else {
        setCameraError(rawMsg || 'Gagal menyalakan kamera QR Scanner.');
      }
    } finally {
      setCameraStarting(false);
    }
  }, [cameraActive, cameraStarting, stopCamera, verifyPickupCode]);

  // Pastikan stream kamera dimatikan bersih saat berpindah mode atau meninggalkan halaman
  useEffect(() => {
    if (mode !== 'CAMERA') {
      void stopCamera();
    }
  }, [mode, stopCamera]);

  useEffect(() => {
    if (pendingAutoStart && mode === 'CAMERA' && !verifiedOrder) {
      setPendingAutoStart(false);
      void startCamera();
    }
  }, [pendingAutoStart, mode, verifiedOrder, startCamera]);

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, [stopCamera]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyPickupCode(code);
  };

  const handleResetAndScanNext = () => {
    setVerifiedOrder(null);
    setErrorMessage(null);
    setLastScannedCode(null);
    lastFailedScanRef.current = null;
    setCode('');
    if (mode === 'CAMERA') {
      setPendingAutoStart(true);
    }
  };

  return (
    <div style={{ padding: '1.75rem', maxWidth: '720px', width: '100%', margin: '0 auto' }}>
      {/* Back button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          href="/tenant"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-text-muted)',
            fontSize: '0.85rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--color-forest)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.85rem',
            boxShadow: '0 4px 14px rgba(20, 104, 79, 0.25)',
          }}
        >
          <QrCode size={28} />
        </div>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 850, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
          Verifikasi Pengambilan Makanan
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Pindai langsung QR Code pelanggan dengan kamera atau ketik 6 karakter kode pengambilan
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          padding: '0.35rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.25rem',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setMode('CAMERA');
            setErrorMessage(null);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            padding: '0.7rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: mode === 'CAMERA' ? 'var(--color-forest)' : 'transparent',
            color: mode === 'CAMERA' ? '#FFFFFF' : 'var(--color-text-muted)',
            fontWeight: 750,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <Camera size={17} /> Pindai Kamera QR
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('MANUAL');
            setErrorMessage(null);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            padding: '0.7rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: mode === 'MANUAL' ? 'var(--color-forest)' : 'transparent',
            color: mode === 'MANUAL' ? '#FFFFFF' : 'var(--color-text-muted)',
            fontWeight: 750,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <Keyboard size={17} /> Input Kode Manual
        </button>
      </div>

      {/* Mode 1: LIVE CAMERA QR SCANNER */}
      {mode === 'CAMERA' && !verifiedOrder && (
        <Card style={{ padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '380px',
              minHeight: cameraActive ? '300px' : '220px',
              margin: '0 auto 1.15rem',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              background: '#0F172A',
              border: cameraActive ? '2px solid var(--color-forest)' : '1px dashed var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              id={QR_READER_ELEMENT_ID}
              style={{ width: '100%', display: cameraActive || cameraStarting ? 'block' : 'none' }}
            />

            {!cameraActive && !cameraStarting && (
              <div style={{ padding: '2rem 1.25rem', color: '#CBD5E1' }}>
                <Camera size={42} style={{ margin: '0 auto 0.65rem', opacity: 0.8 }} />
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#FFFFFF' }}>
                  Kamera QR Scanner Siap Digunakan
                </div>
                <div style={{ fontSize: '0.78rem', marginTop: '0.25rem', lineHeight: 1.45 }}>
                  Arahkan kamera belakang ke QR Code di layar HP pelanggan untuk verifikasi instan.
                </div>
              </div>
            )}

            {cameraStarting && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.85)',
                  color: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <RefreshCw size={26} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 650 }}>Menghubungkan ke kamera...</span>
              </div>
            )}
          </div>

          {cameraError && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                fontSize: '0.82rem',
                fontWeight: 600,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                textAlign: 'left',
              }}
            >
              <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{cameraError}</span>
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                fontSize: '0.85rem',
                fontWeight: 650,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
              }}
            >
              <AlertCircle size={17} /> {errorMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!cameraActive ? (
              <Button
                type="button"
                variant="primary"
                size="lg"
                loading={cameraStarting || loading}
                onClick={() => void startCamera()}
                style={{ background: 'var(--color-forest)', minWidth: '210px' }}
                icon={<Camera size={18} />}
              >
                {loading ? 'Memverifikasi QR...' : 'Aktifkan Kamera QR'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => void stopCamera()}
                style={{ borderColor: '#DC2626', color: '#DC2626', minWidth: '190px' }}
                icon={<CameraOff size={18} />}
              >
                Matikan Kamera
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setMode('MANUAL')}
              icon={<Keyboard size={17} />}
            >
              Ketik Manual
            </Button>
          </div>
        </Card>
      )}

      {/* Mode 2: MANUAL INPUT FORM */}
      {mode === 'MANUAL' && !verifiedOrder && (
        <Card style={{ padding: '2rem 1.75rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <form onSubmit={handleManualSubmit}>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--color-text-muted)',
                marginBottom: '0.75rem',
                letterSpacing: '0.5px',
              }}
            >
              MASUKKAN KODE PENGAMBILAN (6 KARAKTER)
            </label>

            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setErrorMessage(null);
              }}
              placeholder="CONTOH: 7K9X2B"
              maxLength={12}
              autoFocus
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                fontFamily: 'monospace',
                letterSpacing: '6px',
                textAlign: 'center',
                width: '100%',
                maxWidth: '360px',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: errorMessage ? '2px solid var(--color-coral)' : '2px solid var(--color-forest)',
                background: '#F9FAFB',
                outline: 'none',
                marginBottom: '1rem',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
              }}
            />

            {errorMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  color: 'var(--color-coral)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                }}
              >
                <AlertCircle size={16} /> {errorMessage}
              </div>
            )}

            <div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || !code}
                style={{
                  minWidth: '220px',
                  background: 'var(--color-forest)',
                  fontSize: '1rem',
                  fontWeight: 750,
                }}
              >
                {loading ? 'Memverifikasi...' : 'Verifikasi & Serahkan'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Success Result Card */}
      {verifiedOrder && (
        <Card
          style={{
            border: '2px solid var(--color-forest)',
            background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%)',
            padding: '2rem 1.5rem',
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-forest)',
              fontWeight: 800,
              fontSize: '1.1rem',
              marginBottom: '0.5rem',
            }}
          >
            <CheckCircle2 size={26} /> PENGAMBILAN BERHASIL DIVERIFIKASI!
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Status pesanan <strong>#{verifiedOrder.orderNumber}</strong>{' '}
            {lastScannedCode ? `(Kode: ${lastScannedCode})` : ''} telah diubah menjadi{' '}
            <strong>COMPLETED (Selesai)</strong>.
          </p>

          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              textAlign: 'left',
              border: '1px solid #D1FAE5',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <User size={16} color="var(--color-text-muted)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 750 }}>
                Pelanggan:{' '}
                {verifiedOrder.isGuest
                  ? `${verifiedOrder.guestName} (Tamu / ${verifiedOrder.guestPhone})`
                  : verifiedOrder.user?.name || 'Pelanggan'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <ShoppingBag size={16} color="var(--color-text-muted)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Total Bayar:{' '}
                <strong style={{ color: 'var(--color-text)', fontFamily: 'monospace' }}>
                  {formatRupiah(verifiedOrder.total)}
                </strong>
              </span>
            </div>

            <div style={{ borderTop: '1px dashed #E5E7EB', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                Item yang Diserahkan:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>
                {verifiedOrder.items?.map((i: any) => (
                  <li key={i.id}>
                    <strong>{i.quantity}x</strong> {i.menuNameSnapshot}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleResetAndScanNext}
            style={{ background: 'var(--color-forest)', fontWeight: 750 }}
            icon={mode === 'CAMERA' ? <Camera size={17} /> : <QrCode size={17} />}
          >
            {mode === 'CAMERA' ? 'Pindai Pesanan Berikutnya' : 'Verifikasi Pesanan Lainnya'}
          </Button>
        </Card>
      )}
    </div>
  );
}
