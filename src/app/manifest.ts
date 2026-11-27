import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FoodQueue — Pre-Order & Scheduled Pickup Food Court',
    short_name: 'FoodQueue',
    description:
      'Platform pre-order dan scheduled pickup kantin kampus untuk menghilangkan antrean, mempercepat pengambilan, dan mengoptimalkan produksi tenant.',
    start_url: '/tenants',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAF8F5',
    theme_color: '#F0592A',
    lang: 'id',
    categories: ['food', 'shopping', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Pesan Makanan',
        short_name: 'Stan Kantin',
        url: '/tenants',
        description: 'Jelajahi stan makanan dan pesan untuk slot pengambilan',
      },
      {
        name: 'Pesanan Saya',
        short_name: 'Pesanan',
        url: '/orders',
        description: 'Pantau status pesanan dan QR Code pengambilan',
      },
      {
        name: 'Scan Pickup Tenant',
        short_name: 'Scan QR',
        url: '/tenant/scan',
        description: 'Verifikasi QR Code pengambilan makanan di kasir stan',
      },
    ],
  };
}
