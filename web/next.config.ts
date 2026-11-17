import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // data/ vive fuera de web/: la raíz de trazado es el repo
  outputFileTracingRoot: path.join(__dirname, '..'),
  cleanDistDir: false,
  generateBuildId: async () => 'elecciones-2026',
  async headers() {
    return [
      {
        // HTML estático: cacheable 5 min en Cloudflare (requiere regla "Cache Everything" salvo /api/*)
        source: '/((?!api/|_next/).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // test retirado el 17-nov: puntuaba y etiquetaba a personas con nombre sin documento (ver tasks/cuarentena)
      { source: '/tests/que-politico-eres', destination: '/tests', permanent: false },
      {
        source: '/calendario',
        destination: '/espana/generales/2026/calendario',
        permanent: true,
      },
      {
        source: '/historico',
        destination: '/espana/generales/historico',
        permanent: true,
      },
      {
        source: '/hemeroteca',
        destination: '/espana/generales/2026/hemeroteca',
        permanent: true,
      },
      {
        source: '/termometro',
        destination: '/espana/generales/2026/termometro',
        permanent: true,
      },
      {
        source: '/partidos',
        destination: '/espana/generales/2026/partidos',
        permanent: true,
      },
      {
        source: '/partidos/:siglas',
        destination: '/espana/generales/2026/partidos/:siglas',
        permanent: true,
      },
      {
        source: '/partidos/:siglas/:area',
        destination: '/espana/generales/2026/partidos/:siglas/:area',
        permanent: true,
      },
      {
        source: '/comparador',
        destination: '/espana/generales/2026/comparador/vivienda',
        permanent: true,
      },
      {
        source: '/comparador/:area',
        destination: '/espana/generales/2026/comparador/:area',
        permanent: true,
      },
      {
        source: '/pactometro',
        destination: '/espana/generales/2026/pactometro',
        permanent: true,
      },
      {
        source: '/candidaturas',
        destination: '/espana/generales/2026/candidaturas',
        permanent: true,
      },
      {
        source: '/candidaturas/:codigo',
        destination: '/espana/generales/2026/candidaturas/:codigo',
        permanent: true,
      },
      {
        source: '/programas',
        destination: '/espana/generales/2026/programas',
        permanent: true,
      },
      {
        source: '/programas/:siglas',
        destination: '/espana/generales/2026/programas/:siglas',
        permanent: true,
      },
      {
        source: '/guias',
        destination: '/espana/generales/2026/guias',
        permanent: true,
      },
      {
        source: '/guias/:slug',
        destination: '/espana/generales/2026/guias/:slug',
        permanent: true,
      },
      {
        source: '/entrevistas',
        destination: '/espana/generales/2026/entrevistas',
        permanent: true,
      },
      {
        source: '/entrevistas/:id',
        destination: '/espana/generales/2026/entrevistas/:id',
        permanent: true,
      },
      {
        source: '/cumplimiento',
        destination: '/espana/generales/2026/cumplimiento',
        permanent: true,
      },
      {
        source: '/simulador',
        destination: '/espana/generales/2026/simulador',
        permanent: true,
      },
      {
        source: '/resultados-2023',
        destination: '/espana/generales/2023',
        permanent: true,
      },
      {
        source: '/resultados-2023/:codigo',
        destination: '/espana/generales/2023/:codigo',
        permanent: true,
      },
      {
        source: '/votaciones',
        destination: '/espana/congreso/xv-legislatura/votaciones',
        permanent: true,
      },
      {
        source: '/votaciones/:id',
        destination: '/espana/congreso/xv-legislatura/votaciones/:id',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
