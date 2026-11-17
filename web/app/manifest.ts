import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'elecciones.online — Guía ciudadana 29-N',
    short_name: 'elecciones.online',
    description:
      'Qué propone cada partido y qué vota de verdad en el Congreso, explicado en claro con enlaces a fuentes oficiales.',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf7f2',
    theme_color: '#7f1d1d',
    lang: 'es',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    shortcuts: [
      {
        name: 'Comparador de programas',
        url: '/espana/generales/2026/comparador/vivienda',
      },
      {
        name: 'Votaciones del Congreso',
        url: '/espana/congreso/xv-legislatura/votaciones',
      },
      {
        name: 'Entrevistas por minuto',
        url: '/espana/generales/2026/entrevistas',
      },
      {
        name: 'Candidaturas 29-N',
        url: '/espana/generales/2026/candidaturas',
      },
    ],
  };
}
