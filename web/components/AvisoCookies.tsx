'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type GtagFn = (...args: unknown[]) => void;

interface WindowWithGtag extends Window {
  gtag?: GtagFn;
}

export default function AvisoCookies() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const estado = localStorage.getItem('consentimiento-cookies');
      if (estado !== 'aceptadas' && estado !== 'rechazadas') {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const aceptar = () => {
    try {
      localStorage.setItem('consentimiento-cookies', 'aceptadas');
      if (typeof window !== 'undefined') {
        const win = window as unknown as WindowWithGtag;
        win.gtag?.('consent', 'update', {
          analytics_storage: 'granted',
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
        });
      }
    } catch {}
    setVisible(false);
  };

  const rechazar = () => {
    try {
      localStorage.setItem('consentimiento-cookies', 'rechazadas');
      if (typeof window !== 'undefined') {
        const win = window as unknown as WindowWithGtag;
        win.gtag?.('consent', 'update', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        });
      }
    } catch {}
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#c9c1b0] bg-white shadow-xl"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3.5 text-sm text-neutral-800">
        <p className="max-w-[70ch] leading-relaxed">
          Utilizamos cookies técnicas necesarias (Cloudflare) y, si lo autorizas, cookies analíticas y publicitarias de Google para medir el uso del sitio y ayudar a financiar su mantenimiento.{' '}
          <Link href="/legal/cookies" className="font-semibold text-neutral-950 underline hover:text-red-900">
            Política de cookies
          </Link>
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={rechazar}
            className="min-h-11 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-neutral-400"
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={aceptar}
            className="min-h-11 rounded-md bg-neutral-950 px-5 py-2 text-sm font-semibold text-white hover:bg-red-900 focus:outline-hidden focus:ring-2 focus:ring-neutral-950"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
