'use client';

import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Botón flotante para volver arriba; aparece tras dos pantallas de scroll. */
export default function BotonArriba() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const f = () => setVisible(window.scrollY > window.innerHeight * 2);
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Volver arriba"
      className="fixed bottom-5 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-950 text-white shadow-lg hover:bg-red-900"
    >
      <ArrowUp className="h-5 w-5" aria-hidden />
    </button>
  );
}
