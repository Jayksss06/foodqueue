import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://foodqueue-putd.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl),
  title: 'FoodQueue — Pre-order & Scheduled Pickup Food Court',
  description:
    'Platform pre-order dan scheduled pickup makanan kampus untuk menghilangkan antrean, mempercepat pengambilan, dan mengoptimalkan produksi tenant.',
  applicationName: 'FoodQueue',
  keywords: [
    'FoodQueue',
    'pre-order makanan',
    'pickup food court',
    'kantin kampus',
    'smart canteen',
    'QRIS',
    'SDG 11',
    'SDG 12',
    'SDG 8',
  ],
  appleWebApp: {
    capable: true,
    title: 'FoodQueue',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'FoodQueue',
    title: 'FoodQueue — Pre-order & Scheduled Pickup Food Court',
    description:
      'Pesan makanan kantin kampus lebih awal, bayar nontunai via QRIS/VA/E-Wallet, dan ambil tepat waktu tanpa antre.',
  },
};

export const viewport: Viewport = {
  themeColor: '#F0592A',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
