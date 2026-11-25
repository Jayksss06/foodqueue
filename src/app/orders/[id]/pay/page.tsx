'use client';

import React, { useEffect, useState, use, Suspense, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { formatRupiah } from '@/lib/utils';
import {
  PaymentChannelCode,
  PaymentMethod,
  PaymentRuntimeConfig,
} from '@/types';
import {
  Clock,
  QrCode,
  Smartphone,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';

interface ChargeView {
  transactionReference: string;
  externalReference?: string;
  provider: string;
  channelCode: PaymentChannelCode;
  status: string;
  qrPayload?: string;
  qrImageDataUrl?: string;
  vaNumber?: string;
  vaAccountName?: string;
  checkoutUrl?: string;
  deeplinkUrl?: string;
  expiresAt?: string;
  instructions: string[];
}

const DEFAULT_CHANNELS: PaymentRuntimeConfig['channels'] = {
  QRIS: [
    {
      code: 'QRIS',
      method: 'QRIS',
      label: 'QRIS (Semua Bank & E-Wallet)',
      shortLabel: 'QRIS',
      description: 'Scan lewat BCA Mobile, Livin, BRImo, GoPay, OVO, DANA, ShopeePay',
    },
  ],
  VIRTUAL_ACCOUNT: [
    { code: 'BCA_VIRTUAL_ACCOUNT', method: 'VIRTUAL_ACCOUNT', label: 'BCA Virtual Account', shortLabel: 'BCA', description: 'm-BCA, myBCA, KlikBCA, ATM BCA' },
    { code: 'BNI_VIRTUAL_ACCOUNT', method: 'VIRTUAL_ACCOUNT', label: 'BNI Virtual Account', shortLabel: 'BNI', description: 'wondr by BNI, BNI Mobile, ATM BNI' },
    { code: 'BRI_VIRTUAL_ACCOUNT', method: 'VIRTUAL_ACCOUNT', label: 'BRI Virtual Account', shortLabel: 'BRI', description: 'BRImo, ATM BRI' },
    { code: 'MANDIRI_VIRTUAL_ACCOUNT', method: 'VIRTUAL_ACCOUNT', label: 'Mandiri Virtual Account', shortLabel: 'Mandiri', description: 'Livin by Mandiri, ATM Mandiri' },
    { code: 'PERMATA_VIRTUAL_ACCOUNT', method: 'VIRTUAL_ACCOUNT', label: 'Permata Virtual Account', shortLabel: 'Permata', description: 'PermataMobile X, ATM Bersama' },
    { code: 'BSI_VIRTUAL_ACCOUNT', method: 'VIRTUAL_ACCOUNT', label: 'BSI Virtual Account', shortLabel: 'BSI', description: 'BYOND by BSI, BSI Mobile' },
  ],
  EWALLET: [
    { code: 'DANA', method: 'EWALLET', label: 'DANA', shortLabel: 'DANA', description: 'Bayar via aplikasi DANA' },
    { code: 'SHOPEEPAY', method: 'EWALLET', label: 'ShopeePay', shortLabel: 'ShopeePay', description: 'Bayar via aplikasi ShopeePay' },
    { code: 'OVO', method: 'EWALLET', label: 'OVO', shortLabel: 'OVO', description: 'Push / konfirmasi di aplikasi OVO', requiresPhone: true },
  ],
};

function OrderPayContent({ orderId }: { orderId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const paymentReturnState = searchParams.get('payment');

  const [order, setOrder] = useState<any>(null);
  const [runtime, setRuntime] = useState<PaymentRuntimeConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('QRIS');
  const [selectedVaChannel, setSelectedVaChannel] = useState<PaymentChannelCode>('BCA_VIRTUAL_ACCOUNT');
  const [selectedEwalletChannel, setSelectedEwalletChannel] = useState<PaymentChannelCode>('DANA');
  const [ewalletPhone, setEwalletPhone] = useState('');

  const [chargeData, setChargeData] = useState<ChargeView | null>(null);
  const [chargeLoading, setChargeLoading] = useState(false);
  const [syncingStatus, setSyncingStatus] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(15 * 60);
  const pollCounterRef = useRef(0);
  const isExpired = timeLeftSeconds <= 0;

  const channels = runtime?.channels || DEFAULT_CHANNELS;

  const getTrackUrl = useCallback(() => {
    return token ? `/orders/${orderId}?token=${encodeURIComponent(token)}` : `/orders/${orderId}`;
  }, [orderId, token]);

  // Muat order & konfigurasi runtime payment
  useEffect(() => {
    const fetchUrl = token
      ? `/api/orders/${orderId}?token=${encodeURIComponent(token)}`
      : `/api/orders/${orderId}`;

    Promise.all([
      fetch(fetchUrl).then((r) => r.json()),
      fetch('/api/payments/config').then((r) => r.json()).catch(() => null),
    ])
      .then(([orderJson, configJson]) => {
        if (configJson?.data) {
          setRuntime(configJson.data);
        }

        if (orderJson?.data) {
          const loadedOrder = orderJson.data;
          setOrder(loadedOrder);

          if (loadedOrder.guestPhone) {
            setEwalletPhone(loadedOrder.guestPhone);
          }

          if (loadedOrder.payment?.method) {
            const prevMethod = loadedOrder.payment.method as PaymentMethod;
            setSelectedMethod(prevMethod);
            const prevChannel = loadedOrder.payment.channelCode as PaymentChannelCode | undefined;
            if (prevMethod === 'VIRTUAL_ACCOUNT' && prevChannel) {
              setSelectedVaChannel(prevChannel);
            } else if (prevMethod === 'EWALLET' && prevChannel) {
              setSelectedEwalletChannel(prevChannel);
            }
          }

          if (loadedOrder.status !== 'PENDING_PAYMENT') {
            router.replace(getTrackUrl());
            return;
          }

          if (loadedOrder.expiresAt) {
            const exp = new Date(loadedOrder.expiresAt).getTime();
            const now = Date.now();
            setTimeLeftSeconds(Math.max(0, Math.floor((exp - now) / 1000)));
          }
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Gagal memuat data pesanan.');
      })
      .finally(() => setLoading(false));
  }, [orderId, token, router, getTrackUrl]);

  useEffect(() => {
    if (paymentReturnState === 'failed') {
      setError('Pembayaran E-Wallet belum selesai atau dibatalkan. Silakan coba lagi atau pilih metode lain.');
    }
  }, [paymentReturnState]);

  const initiateCharge = useCallback(
    async (
      method: PaymentMethod,
      channelCode: PaymentChannelCode,
      opts?: { customerPhone?: string; forceRefresh?: boolean }
    ) => {
      if (!order || order.status !== 'PENDING_PAYMENT') return;

      setChargeLoading(true);
      setError(null);
      setInfoMsg(null);

      try {
        const res = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            method,
            channelCode,
            customerPhone: opts?.customerPhone || undefined,
            forceRefresh: opts?.forceRefresh || false,
            token: token || undefined,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || 'Gagal membuat instruksi pembayaran.');
        }

        if (json.data?.runtime) {
          setRuntime(json.data.runtime);
        }

        if (json.data?.charge) {
          setChargeData(json.data.charge);
        }
      } catch (err: any) {
        setError(err.message || 'Gagal menginisialisasi pembayaran.');
        setChargeData(null);
      } finally {
        setChargeLoading(false);
      }
    },
    [order, orderId, token]
  );

  // Auto-inisialisasi untuk QRIS dan Virtual Account saat method/bank berubah
  // Untuk E-Wallet: auto-load hanya jika sudah ada charge aktif untuk channel tsb; jika belum, tunggu klik tombol user
  useEffect(() => {
    if (!order || order.status !== 'PENDING_PAYMENT' || isExpired) return;

    if (selectedMethod === 'QRIS') {
      initiateCharge('QRIS', 'QRIS');
    } else if (selectedMethod === 'VIRTUAL_ACCOUNT') {
      initiateCharge('VIRTUAL_ACCOUNT', selectedVaChannel);
    } else if (selectedMethod === 'EWALLET') {
      if (
        order.payment?.method === 'EWALLET' &&
        order.payment?.channelCode === selectedEwalletChannel &&
        order.payment?.transactionReference
      ) {
        initiateCharge('EWALLET', selectedEwalletChannel);
      } else {
        setChargeData((prev) =>
          prev && prev.channelCode === selectedEwalletChannel ? prev : null
        );
      }
    }
  }, [order, selectedMethod, selectedVaChannel, selectedEwalletChannel, isExpired, initiateCharge]);

  // Countdown interval
  useEffect(() => {
    if (isExpired) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isExpired]);

  const checkPaymentStatus = useCallback(
    async (useGatewaySync = false, manualTrigger = false) => {
      if (!order || paidSuccess) return;

      if (manualTrigger) {
        setSyncingStatus(true);
        setError(null);
        setInfoMsg(null);
      }

      try {
        if (useGatewaySync && runtime?.provider === 'XENDIT') {
          const syncRes = await fetch(`/api/payments/${orderId}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token || undefined }),
          });
          const syncJson = await syncRes.json();

          if (syncRes.ok && syncJson.data?.paid) {
            setPaidSuccess(true);
            setTimeout(() => router.replace(getTrackUrl()), 1200);
            return;
          }

          if (syncRes.ok && syncJson.data?.orderStatus && syncJson.data.orderStatus !== 'PENDING_PAYMENT') {
            router.replace(getTrackUrl());
            return;
          }

          if (manualTrigger) {
            setInfoMsg('Pembayaran belum terdeteksi masuk. Jika Anda baru saja membayar, tunggu 5–10 detik lalu cek ulang.');
          }
          return;
        }

        const fetchUrl = token
          ? `/api/orders/${orderId}?token=${encodeURIComponent(token)}`
          : `/api/orders/${orderId}`;
        const res = await fetch(fetchUrl);
        const json = await res.json();

        if (res.ok && json.data) {
          if (json.data.status === 'PAID' || json.data.payment?.status === 'PAID') {
            setPaidSuccess(true);
            setTimeout(() => router.replace(getTrackUrl()), 1200);
          } else if (json.data.status !== 'PENDING_PAYMENT') {
            router.replace(getTrackUrl());
          } else if (manualTrigger) {
            setInfoMsg('Status masih menunggu pembayaran.');
          }
        }
      } catch (err) {
        if (manualTrigger) {
          setError('Gagal memeriksa status pembayaran. Coba beberapa saat lagi.');
        } else {
          console.error('Polling payment error:', err);
        }
      } finally {
        if (manualTrigger) {
          setSyncingStatus(false);
        }
      }
    },
    [order, paidSuccess, runtime?.provider, orderId, token, router, getTrackUrl]
  );

  // Auto-polling status pembayaran setiap 5 detik (setiap 15 detik sync langsung ke Xendit)
  useEffect(() => {
    if (!order || order.status !== 'PENDING_PAYMENT' || timeLeftSeconds <= 0 || paidSuccess) {
      return;
    }

    const interval = setInterval(() => {
      pollCounterRef.current += 1;
      const shouldSyncGateway =
        runtime?.provider === 'XENDIT' && Boolean(chargeData?.transactionReference) && pollCounterRef.current % 3 === 0;
      checkPaymentStatus(shouldSyncGateway, false);
    }, 5000);

    return () => clearInterval(interval);
  }, [order, timeLeftSeconds, paidSuccess, runtime?.provider, chargeData?.transactionReference, checkPaymentStatus]);

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setError('Gagal menyalin ke clipboard.');
    }
  };

  const handleDownloadQr = () => {
    if (!chargeData?.qrImageDataUrl || !order) return;
    const link = document.createElement('a');
    link.href = chargeData.qrImageDataUrl;
    link.download = `QRIS-${order.orderNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateEwalletCharge = async () => {
    if (selectedEwalletChannel === 'OVO') {
      const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
      if (!phoneRegex.test(ewalletPhone.trim())) {
        setError('Masukkan nomor HP akun OVO yang valid (contoh: 081234567890).');
        return;
      }
    }

    await initiateCharge('EWALLET', selectedEwalletChannel, {
      customerPhone: selectedEwalletChannel === 'OVO' ? ewalletPhone.trim() : undefined,
      forceRefresh: selectedEwalletChannel === 'OVO',
    });
  };

  const handleSimulatePayment = async (outcome: 'SUCCESS' | 'FAILURE', autoAdvanceToReady = false) => {
    if (!runtime?.simulationEnabled) return;
    setIsSimulating(true);
    setError(null);

    try {
      const res = await fetch(`/api/payments/${orderId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome, token: token || undefined }),
      });

      const json = await res.json();

      if (!res.ok || !json.data?.success) {
        throw new Error(json.error?.message || json.data?.message || 'Simulasi pembayaran gagal.');
      }

      if (outcome === 'SUCCESS' && autoAdvanceToReady) {
        await fetch(`/api/orders/${orderId}/simulate-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: 'READY_FOR_PICKUP', token: token || undefined }),
        });
      }

      router.push(getTrackUrl());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--color-ink-400)' }}>
        Memuat halaman pembayaran...
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <h2>Pesanan tidak ditemukan atau akses ditolak.</h2>
        <Link href="/orders">
          <Button style={{ marginTop: '1rem' }}>Kembali ke Pesanan</Button>
        </Link>
      </div>
    );
  }

  if (paidSuccess) {
    return (
      <div className="container-sm" style={{ maxWidth: '540px', textAlign: 'center', padding: '3rem 1rem' }}>
        <Card padding="lg" style={{ border: '2px solid var(--color-forest)', background: '#F0FDF4' }}>
          <CheckCircle2 size={56} color="var(--color-forest)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-ink-900)' }}>
            Pembayaran Berhasil Diterima!
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-600)', marginTop: '0.5rem' }}>
            Pesanan #{order.orderNumber} sudah diteruskan ke dapur {order.tenant?.name}. Mengalihkan ke halaman pelacakan...
          </p>
        </Card>
      </div>
    );
  }

  const activeEwalletOption = channels.EWALLET.find((c) => c.code === selectedEwalletChannel);
  const activeVaOption = channels.VIRTUAL_ACCOUNT.find((c) => c.code === selectedVaChannel);
  const ewalletActionUrl = chargeData?.deeplinkUrl || chargeData?.checkoutUrl;

  return (
    <div className="container-sm" style={{ maxWidth: '560px' }}>
      {/* Top Back Link */}
      <div style={{ marginBottom: '1rem' }}>
        <Link
          href={getTrackUrl()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--color-ink-500)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} /> Lihat Detail Pesanan
        </Link>
      </div>

      {/* Header & Countdown */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.55rem' }}>
          <Badge variant={isExpired ? 'danger' : 'warning'}>
            {isExpired ? 'Waktu Pembayaran Habis' : 'Menunggu Pembayaran'}
          </Badge>
          {order.isGuest && <Badge variant="neutral">Tamu: {order.guestName}</Badge>}
          {runtime?.mode === 'SANDBOX' && <Badge variant="warning">Xendit Sandbox</Badge>}
          {runtime?.mode === 'MOCK' && <Badge variant="neutral">Local Dev Mock</Badge>}
          {runtime?.mode === 'PRODUCTION' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                background: '#ECFDF5',
                color: 'var(--color-forest)',
              }}
            >
              <ShieldCheck size={13} /> Xendit Verified
            </span>
          )}
        </div>

        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-ink-900)' }}>
          Pembayaran Pesanan #{order.orderNumber}
        </h1>

        <div
          className="tabular-nums"
          style={{
            fontSize: '2rem',
            fontWeight: 850,
            color: 'var(--color-primary-600)',
            margin: '0.3rem 0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>{formatRupiah(order.total)}</span>
          <button
            type="button"
            onClick={() => handleCopy('amount', String(order.total))}
            title="Salin nominal"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.25rem 0.45rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--color-ink-600)',
            }}
          >
            {copiedKey === 'amount' ? <Check size={13} color="var(--color-forest)" /> : <Copy size={13} />}
            {copiedKey === 'amount' ? 'Disalin' : 'Salin'}
          </button>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.875rem',
            color: timeLeftSeconds <= 120 ? 'var(--color-danger-text)' : 'var(--color-ink-500)',
            fontWeight: 600,
            marginTop: '0.15rem',
          }}
        >
          <Clock size={16} /> Selesaikan dalam{' '}
          <span className="tabular-nums" style={{ fontWeight: 800 }}>
            {formatCountdown(timeLeftSeconds)}
          </span>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '0.8rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            color: 'var(--color-danger-text)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{error}</span>
        </div>
      )}

      {infoMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            color: '#1E40AF',
            fontSize: '0.83rem',
            fontWeight: 600,
            marginBottom: '1rem',
          }}
        >
          {infoMsg}
        </div>
      )}

      {isExpired ? (
        <Card padding="lg" style={{ textAlign: 'center' }}>
          <Clock size={44} color="var(--color-danger-text)" style={{ margin: '0 auto 0.75rem' }} />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            Batas Waktu Pembayaran Berakhir
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-500)', marginBottom: '1.25rem' }}>
            Slot pengambilan dan stok menu akan dilepaskan otomatis agar bisa digunakan pelanggan lain. Silakan buat pesanan baru.
          </p>
          <Link href="/tenants">
            <Button variant="primary">Pesan Lagi</Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* Payment Method Selector */}
          <Card padding="md" style={{ marginBottom: '1.15rem' }}>
            <label
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--color-ink-900)',
                display: 'block',
                marginBottom: '0.75rem',
              }}
            >
              Pilih Metode Pembayaran
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {[
                { method: 'QRIS' as PaymentMethod, label: 'QRIS', icon: <QrCode size={18} /> },
                { method: 'EWALLET' as PaymentMethod, label: 'E-Wallet', icon: <Smartphone size={18} /> },
                { method: 'VIRTUAL_ACCOUNT' as PaymentMethod, label: 'VA Bank', icon: <Building2 size={18} /> },
              ].map((m) => (
                <button
                  key={m.method}
                  type="button"
                  onClick={() => {
                    setError(null);
                    setInfoMsg(null);
                    setSelectedMethod(m.method);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.75rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${selectedMethod === m.method ? 'var(--color-primary-500)' : 'var(--color-border)'}`,
                    backgroundColor: selectedMethod === m.method ? 'var(--color-primary-50)' : 'var(--color-surface)',
                    color: selectedMethod === m.method ? 'var(--color-primary-600)' : 'var(--color-ink-700)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Sub-Channel Picker untuk Virtual Account */}
            {selectedMethod === 'VIRTUAL_ACCOUNT' && (
              <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-ink-700)', marginBottom: '0.5rem' }}>
                  Pilih Bank Virtual Account:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                  {channels.VIRTUAL_ACCOUNT.map((bank) => (
                    <button
                      key={bank.code}
                      type="button"
                      onClick={() => setSelectedVaChannel(bank.code)}
                      style={{
                        padding: '0.55rem 0.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${selectedVaChannel === bank.code ? 'var(--color-primary-500)' : 'var(--color-border)'}`,
                        background: selectedVaChannel === bank.code ? 'var(--color-primary-50)' : '#FFFFFF',
                        color: selectedVaChannel === bank.code ? 'var(--color-primary-600)' : 'var(--color-ink-700)',
                        fontWeight: 750,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      {bank.shortLabel}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-Channel Picker untuk E-Wallet */}
            {selectedMethod === 'EWALLET' && (
              <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-ink-700)', marginBottom: '0.5rem' }}>
                  Pilih Dompet Digital:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                  {channels.EWALLET.map((wallet) => (
                    <button
                      key={wallet.code}
                      type="button"
                      onClick={() => {
                        setError(null);
                        setSelectedEwalletChannel(wallet.code);
                      }}
                      style={{
                        padding: '0.6rem 0.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${selectedEwalletChannel === wallet.code ? 'var(--color-primary-500)' : 'var(--color-border)'}`,
                        background: selectedEwalletChannel === wallet.code ? 'var(--color-primary-50)' : '#FFFFFF',
                        color: selectedEwalletChannel === wallet.code ? 'var(--color-primary-600)' : 'var(--color-ink-700)',
                        fontWeight: 750,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      {wallet.shortLabel}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Main Payment Instruction Card */}
          <Card padding="lg" style={{ marginBottom: '1.25rem' }}>
            {chargeLoading ? (
              <div style={{ textAlign: 'center', padding: '2.25rem 1rem', color: 'var(--color-ink-500)' }}>
                <RefreshCw size={28} style={{ margin: '0 auto 0.65rem', animation: 'spin 1s linear infinite' }} />
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Menyiapkan instruksi pembayaran...</div>
                <div style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
                  Menghubungi gateway pembayaran secara aman
                </div>
              </div>
            ) : (
              <>
                {/* QRIS VIEW */}
                {selectedMethod === 'QRIS' && (
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        width: '220px',
                        height: '220px',
                        margin: '0 auto 1rem auto',
                        padding: '0.75rem',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {chargeData?.qrImageDataUrl ? (
                        <img
                          src={chargeData.qrImageDataUrl}
                          alt={`QRIS Pesanan ${order.orderNumber}`}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <div style={{ color: 'var(--color-ink-400)', fontSize: '0.8rem' }}>
                          QRIS tidak tersedia
                        </div>
                      )}
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-ink-900)' }}>
                      Scan QRIS Dinamis
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-500)', marginTop: '0.2rem' }}>
                      Nominal otomatis terisi {formatRupiah(order.total)} • Mendukung semua bank & e-wallet Indonesia
                    </div>

                    {chargeData?.qrImageDataUrl && (
                      <div style={{ marginTop: '0.85rem' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadQr}
                          icon={<Download size={15} />}
                        >
                          Unduh Gambar QRIS
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* VIRTUAL ACCOUNT VIEW */}
                {selectedMethod === 'VIRTUAL_ACCOUNT' && (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-500)', fontWeight: 600 }}>
                      {activeVaOption?.label || 'Virtual Account'}
                    </div>
                    <div
                      style={{
                        marginTop: '0.45rem',
                        padding: '0.9rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-ink-400)', textTransform: 'uppercase', fontWeight: 700 }}>
                          Nomor Virtual Account
                        </div>
                        <div
                          className="tabular-nums"
                          style={{
                            fontSize: '1.35rem',
                            fontWeight: 850,
                            color: 'var(--color-ink-900)',
                            letterSpacing: '0.06em',
                            marginTop: '0.15rem',
                          }}
                        >
                          {chargeData?.vaNumber || '-'}
                        </div>
                      </div>

                      {chargeData?.vaNumber && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy('va', chargeData.vaNumber!)}
                          icon={copiedKey === 'va' ? <Check size={15} color="var(--color-forest)" /> : <Copy size={15} />}
                        >
                          {copiedKey === 'va' ? 'Disalin!' : 'Salin VA'}
                        </Button>
                      )}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-500)', marginTop: '0.5rem' }}>
                      Atas Nama: <strong>{chargeData?.vaAccountName || 'FoodQueue Kampus'}</strong>
                    </div>
                  </div>
                )}

                {/* E-WALLET VIEW */}
                {selectedMethod === 'EWALLET' && (
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-ink-900)' }}>
                      Bayar dengan {activeEwalletOption?.label || selectedEwalletChannel}
                    </div>
                    <p style={{ fontSize: '0.83rem', color: 'var(--color-ink-500)', marginTop: '0.25rem' }}>
                      {activeEwalletOption?.description}
                    </p>

                    {activeEwalletOption?.requiresPhone && (
                      <div style={{ marginTop: '0.9rem' }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: 'var(--color-ink-800)',
                            marginBottom: '0.35rem',
                          }}
                        >
                          Nomor HP Terdaftar di {activeEwalletOption.shortLabel}
                        </label>
                        <Input
                          type="tel"
                          placeholder="Contoh: 081234567890"
                          value={ewalletPhone}
                          onChange={(e) => setEwalletPhone(e.target.value)}
                        />
                      </div>
                    )}

                    {chargeData && chargeData.channelCode === selectedEwalletChannel ? (
                      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {ewalletActionUrl ? (
                          <a
                            href={ewalletActionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none' }}
                          >
                            <Button
                              variant="primary"
                              size="lg"
                              style={{ width: '100%' }}
                              icon={<ExternalLink size={17} />}
                            >
                              Buka Halaman Pembayaran {activeEwalletOption?.shortLabel}
                            </Button>
                          </a>
                        ) : (
                          <div
                            style={{
                              padding: '0.85rem 1rem',
                              borderRadius: 'var(--radius-md)',
                              background: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              color: 'var(--color-forest)',
                              fontSize: '0.83rem',
                              fontWeight: 650,
                            }}
                          >
                            Permintaan pembayaran telah dikirim ke aplikasi {activeEwalletOption?.shortLabel} Anda. Buka aplikasi dan setujui tagihan sebesar {formatRupiah(order.total)}.
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCreateEwalletCharge}
                          style={{ width: '100%' }}
                        >
                          Buat Ulang Permintaan {activeEwalletOption?.shortLabel}
                        </Button>
                      </div>
                    ) : (
                      <div style={{ marginTop: '1rem' }}>
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={handleCreateEwalletCharge}
                          style={{ width: '100%' }}
                        >
                          Lanjutkan Bayar via {activeEwalletOption?.shortLabel}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Step-by-Step Instructions */}
                {chargeData?.instructions && chargeData.instructions.length > 0 && (
                  <div
                    style={{
                      marginTop: '1.25rem',
                      paddingTop: '1rem',
                      borderTop: '1px dashed var(--color-border)',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 750, color: 'var(--color-ink-800)', marginBottom: '0.45rem' }}>
                      Cara Pembayaran:
                    </div>
                    <ol
                      style={{
                        margin: 0,
                        paddingLeft: '1.15rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                        fontSize: '0.8rem',
                        color: 'var(--color-ink-600)',
                        lineHeight: 1.45,
                      }}
                    >
                      {chargeData.instructions.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Live Payment Status Check Bar */}
          <Card padding="md" style={{ marginBottom: '1.25rem', background: 'var(--color-surface)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-600)' }}>
                <div style={{ fontWeight: 750, color: 'var(--color-ink-900)' }}>
                  Konfirmasi Otomatis Aktif
                </div>
                <div>
                  Halaman otomatis berpindah setelah pembayaran terverifikasi.
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                loading={syncingStatus}
                onClick={() => checkPaymentStatus(true, true)}
                icon={<RefreshCw size={14} />}
              >
                Saya Sudah Bayar
              </Button>
            </div>
          </Card>

          {/* SIMULATION ACTION BUTTONS — HANYA TAMPIL DI LOCAL DEV + MOCK PROVIDER */}
          {runtime?.simulationEnabled && (
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--color-primary-50)',
                border: '2px dashed var(--color-primary-500)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: 'var(--color-primary-600)',
                  textTransform: 'uppercase',
                  marginBottom: '0.75rem',
                }}
              >
                <Sparkles size={16} /> Mode Simulasi Local Development (Mock)
              </div>

              <p style={{ fontSize: '0.83rem', color: 'var(--color-ink-700)', marginBottom: '1rem' }}>
                Panel ini otomatis disembunyikan & endpoint dikunci saat menggunakan Xendit atau mode Production.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <Button
                  size="lg"
                  loading={isSimulating}
                  onClick={() => handleSimulatePayment('SUCCESS', false)}
                  style={{ width: '100%', backgroundColor: 'var(--color-secondary-500)' }}
                  icon={<CheckCircle2 size={18} />}
                >
                  Simulasikan Pembayaran Sukses (Antre Dapur)
                </Button>

                <Button
                  size="lg"
                  loading={isSimulating}
                  onClick={() => handleSimulatePayment('SUCCESS', true)}
                  style={{ width: '100%', backgroundColor: 'var(--color-primary-500)' }}
                  icon={<QrCode size={18} />}
                >
                  Simulasikan & Langsung Siap Diambil (QR Code)
                </Button>

                <Button
                  variant="outline"
                  loading={isSimulating}
                  onClick={() => handleSimulatePayment('FAILURE')}
                  style={{
                    width: '100%',
                    borderColor: 'var(--color-danger-border)',
                    color: 'var(--color-danger-text)',
                  }}
                >
                  Simulasikan Pembayaran Gagal
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function OrderPayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '1.5rem 1rem 4rem 1rem' }}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '5rem' }}>Memuat...</div>}>
          <OrderPayContent orderId={id} />
        </Suspense>
      </main>
    </div>
  );
}
