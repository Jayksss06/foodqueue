import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://foodqueue-putd.vercel.app').replace(
    /\/+$/,
    ''
  );

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/tenants'],
        disallow: ['/api/', '/admin/', '/tenant/', '/orders/', '/checkout', '/cart'],
      },
    ],
    host: baseUrl,
  };
}
