import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { Plus_Jakarta_Sans, Source_Serif_4 } from 'next/font/google';
import BarraPartidosNav from '@/components/BarraPartidosNav';
import AvisoCookies from '@/components/AvisoCookies';
import NavPrincipal from '@/components/NavPrincipal';
import MenuMovil from '@/components/MenuMovil';
import BotonArriba from '@/components/BotonArriba';
import { DONACION_URL } from '@/content/legal';
import HeaderCountdown from '@/components/HeaderCountdown';
import './globals.css';

const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-source-serif', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://elecciones.online'),
  title: { default: 'elecciones.online — Elecciones Generales 29-N: Qué propone y qué vota cada partido', template: '%s · Elecciones Generales 29-N · elecciones.online' },
  description:
    'Guía ciudadana para las elecciones generales del 29-N (29 de noviembre de 2026): cómo afectan a tu día a día las propuestas de cada partido, qué han votado realmente en el Congreso y quién se presenta en tu provincia. Con enlace a cada documento oficial.',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'elecciones.online',
    title: 'elecciones.online — Elecciones Generales del 29-N en España',
    description:
      'Comparador de programas oficiales en PDF para el 29-N, 2.175 votaciones nominales del Congreso, videoteca con minutaje y candidaturas del BOE.',
    url: 'https://elecciones.online',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'elecciones.online — Elecciones Generales 29-N: qué propone y qué vota cada partido',
    description:
      'Programas en PDF con cita y página para el 29-N, votaciones del Congreso y entrevistas con minutaje verificable.',
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

const NAV_PRINCIPAL = [
  ['/espana/generales/2026/programas', 'Programas'],
  ['/espana/generales/2026/comparador/vivienda', 'Comparador'],
  ['/espana/congreso/xv-legislatura/votaciones', 'Votaciones'],
  ['/espana/generales/2026/entrevistas', 'Entrevistas'],
  ['/espana/generales/2026/candidaturas', 'Candidaturas'],
  ['/espana/generales/2026/termometro', 'Tu opinión de voto'],
  ['/espana/generales/2026/guias', 'Guías'],
  [DONACION_URL, 'Apoya el proyecto'],
] as const;

const MAS_SECCIONES = [
  ['/espana/generales/2026/calendario', 'Calendario electoral'],
  ['/espana/generales/2026/pactometro', 'Pactómetro'],
  ['/espana/generales/2026/simulador', 'Simulador de escaños'],
  ['/espana/generales/2023', 'Resultados de 2023'],
  ['/espana/generales/historico', 'Histórico 1977–2023'],
  ['/espana/generales/2026/hemeroteca', 'Hemeroteca'],
  ['/actualidad', 'Actualidad'],
  ['/tests', 'Tests'],
] as const;

const PARTIDOS_RAPIDOS = [
  ['pp', 'PP', '#0056a8'],
  ['psoe', 'PSOE', '#e30613'],
  ['psc', 'PSC', '#c8102e'],
  ['vox', 'VOX', '#5cb811'],
  ['frente-amplio', 'Sumar', '#e51c55'],
  ['podemos', 'Podemos', '#6b21a8'],
  ['erc', 'ERC', '#f2a900'],
  ['junts', 'Junts', '#00a7a0'],
  ['eh-bildu', 'EH Bildu', '#6aa84f'],
  ['eaj-pnv', 'PNV', '#15803d'],
  ['bng', 'BNG', '#0284c7'],
  ['cc', 'CCa', '#ca8a04'],
  ['compromis', 'Compromís', '#ea580c'],
  ['upn', 'UPN', '#1e3a8a'],
  ['salf', 'SALF', '#1c1917'],
  ['pacma', 'PACMA', '#15803d'],
  ['mj', 'M+J', '#009688'],
  ['iustitia-europa', 'IE', '#475569'],
  ['d21', 'D21', '#2563eb'],
] as const;

const LEGAL = [
  ['/legal/aviso-legal', 'Aviso legal'],
  ['/legal/privacidad', 'Privacidad'],
  ['/legal/cookies', 'Cookies'],
  ['/legal/metodologia', 'Metodología y fuentes'],
  ['/legal/transparencia', 'Transparencia'],
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://elecciones.online/#website',
        url: 'https://elecciones.online',
        name: 'elecciones.online',
        inLanguage: 'es-ES',
        description:
          'Guía ciudadana verificable sobre programas electorales en PDF, votaciones nominales del Congreso, candidaturas del BOE y entrevistas con minutaje.',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://elecciones.online/espana/congreso/xv-legislatura/votaciones?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://elecciones.online/#organization',
        name: 'elecciones.online',
        url: 'https://elecciones.online',
        logo: 'https://elecciones.online/icon.png',
      },
    ],
  };

  return (
    <html lang="es" className={`${sans.variable} ${serif.variable}`}>
      <head>
        <Script
          id="google-consent-mode"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied'
              });
              try {
                if (localStorage.getItem('consentimiento-cookies') === 'aceptadas') {
                  gtag('consent', 'update', {
                    'analytics_storage': 'granted',
                    'ad_storage': 'granted',
                    'ad_user_data': 'granted',
                    'ad_personalization': 'granted'
                  });
                }
              } catch (e) {}
              gtag('js', new Date());
            `,
          }}
        />
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXXXXX"
        />
        <Script
          id="google-adsense"
          strategy="afterInteractive"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-neutral-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Saltar al contenido principal
        </a>

        <div className="bg-neutral-950">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-x-6 px-4 py-2">
            <HeaderCountdown />
            <div className="hidden items-center gap-5 text-sm text-neutral-300 md:flex">
              {MAS_SECCIONES.slice(0, 4).map(([href, label]) => (
                <Link key={href} href={href} className="hover:text-white hover:underline underline-offset-4">
                  {label}
                </Link>
              ))}
            </div>
            {DONACION_URL && (
              <a href={DONACION_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 shrink-0 items-center text-sm font-semibold text-white underline underline-offset-4 hover:text-amber-200">
                Apoyar
              </a>
            )}
          </div>
        </div>

        <header className="sticky top-0 z-30 border-b border-[#e4dfd3] bg-[#faf7f2]">
          <div className="mx-auto max-w-6xl px-4 py-1.5 md:pb-0 md:pt-3">
            <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between md:gap-6">
              <div className="flex items-center justify-between gap-3">
                <Link href="/" className="flex min-w-0 items-center gap-2 font-editorial text-xl font-bold tracking-tight text-neutral-950 hover:text-red-900 sm:text-[1.75rem] md:gap-2.5 md:pb-2">
                  <img src="/icon.svg" alt="" width={32} height={32} className="h-7 w-7 shrink-0 md:h-8 md:w-8" />
                  <span>
                  elecciones<span className="text-red-800">.online</span></span>
                </Link>
                <MenuMovil principal={NAV_PRINCIPAL} secundario={MAS_SECCIONES} partidos={PARTIDOS_RAPIDOS} />
              </div>
              <div className="hidden min-w-0 md:block">
                <NavPrincipal enlaces={NAV_PRINCIPAL.filter(([h]) => !h.startsWith('http'))} />
              </div>
            </div>
            <div className="hidden pb-2 md:block">
              <BarraPartidosNav partidos={PARTIDOS_RAPIDOS} />
            </div>
          </div>
        </header>

        <main id="contenido" className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10 flex-1">
          {children}
        </main>
        <BotonArriba />

        <footer className="border-t border-[#dfd9cc] bg-[#f3efe6] text-sm text-neutral-700 mt-16">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <p className="font-editorial text-xl font-bold text-neutral-950">
                  elecciones<span className="text-red-800">.online</span>
                </p>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                  Portal ciudadano independiente para entender qué propone cada partido en tu vida diaria y qué vota realmente en el Congreso de los Diputados. Sin tertulias ni adjetivos: cada dato enlaza al documento público oficial.
                </p>
              </div>
              <nav aria-label="Más secciones">
                <p className="text-sm font-semibold text-neutral-950">Más secciones</p>
                <ul className="mt-2 grid grid-cols-2 gap-x-4 text-sm text-neutral-700">
                  {MAS_SECCIONES.map(([href, label]) => (
                    <li key={href}>
                      <Link href={href} className="inline-flex min-h-9 items-center hover:text-neutral-950 hover:underline underline-offset-4">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div>
                <p className="text-sm font-semibold text-neutral-950">Transparencia y contacto</p>
                <p className="mt-2 text-xs text-neutral-600">
                  Si detectas cualquier errata o un dato que no coincida con su documento oficial, escríbenos a{' '}
                  <a href="mailto:correo@example.org" className="font-semibold text-neutral-900 underline">
                    correo@example.org
                  </a>
                  .
                </p>
                <p className="mt-3 text-xs text-neutral-600">
                  Del mismo autor:{' '}
                  <a href="https://licitia.eu" target="_blank" rel="noopener" className="font-semibold text-neutral-900 underline">
                    licitia.eu
                  </a>
                  , buscador de licitaciones y gasto público.
                </p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-neutral-700">
                  {LEGAL.map(([href, label]) => (
                    <Link key={href} href={href} className="inline-flex min-h-8 items-center hover:text-neutral-950 underline underline-offset-2">
                      {label}
                    </Link>
                  ))}
<a href="https://github.com/Mikelmangel/elecciones.online" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center underline underline-offset-2 hover:text-neutral-950">
                    Código abierto
                  </a>
{DONACION_URL && (
                    <a href={DONACION_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center font-semibold text-red-900 underline underline-offset-2 hover:text-red-700">
                      Apoyar el proyecto
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </footer>
        <AvisoCookies />
      </body>
    </html>
  );
}
