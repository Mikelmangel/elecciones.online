import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    host: 'https://elecciones.online',
    sitemap: 'https://elecciones.online/sitemap.xml',
  };
}
