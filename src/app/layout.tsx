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

export const metadata: Metadata = {
  title: 'FoodQueue — Pre-order & Scheduled Pickup Food Court',
  description:
    'Platform pre-order dan scheduled pickup makanan kampus untuk menghilangkan antrean, mempercepat pengambilan, dan mengoptimalkan produksi tenant.',
  keywords: [
    'FoodQueue',
    'pre-order makanan',
    'pickup food court',
    'kantin kampus',
    'smart canteen',
    'SDG 11',
    'SDG 12',
    'SDG 8',
  ],
};

export const viewport: Viewport = {
  themeColor: '#F0592A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={jakarta.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
