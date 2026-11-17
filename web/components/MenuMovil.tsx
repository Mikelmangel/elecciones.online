'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

type Enlace = readonly [string, string];

interface Props {
  principal: readonly Enlace[];
  secundario: readonly Enlace[];
  partidos: readonly (readonly [string, string, string])[];
}

/** Menú completo para móvil: todas las secciones y los partidos, que en la barra no caben. */
export default function MenuMovil({ principal, secundario, partidos }: Props) {
  const [abierto, setAbierto] = useState(false);
  const ruta = usePathname();

  useEffect(() => setAbierto(false), [ruta]);
  useEffect(() => {
    if (!abierto) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [abierto]);

  const enlace = (href: string, label: string) =>
    href.startsWith('http') ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center font-semibold text-red-900">
        {label}
      </a>
    ) : (
      <Link
        href={href}
        aria-current={ruta === href ? 'page' : undefined}
        className="flex min-h-11 items-center text-neutral-900 aria-[current=page]:font-semibold aria-[current=page]:text-red-900"
      >
        {label}
      </Link>
    );

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls="menu-movil"
        className="flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-200/60"
      >
        {abierto ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        Menú
      </button>
      {abierto && (
        <div
          id="menu-movil"
          className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-8rem)] overflow-y-auto border-b border-[#e4dfd3] bg-[#faf7f2] px-4 pb-6 shadow-[0_12px_24px_-12px_rgb(0_0_0/0.25)]"
        >
          <nav aria-label="Menú completo" className="grid grid-cols-2 gap-x-6 border-b border-[#e4dfd3] py-2">
            <ul>{principal.map(([h, l]) => <li key={h}>{enlace(h, l)}</li>)}</ul>
            <ul>{secundario.map(([h, l]) => <li key={h}>{enlace(h, l)}</li>)}</ul>
          </nav>
          <p className="pt-4 text-sm font-semibold text-neutral-950">Partidos</p>
          <ul className="mt-1 grid grid-cols-3 gap-x-4">
            {partidos.map(([slug, nombre, color]) => (
              <li key={slug}>
                <Link href={`/espana/generales/2026/partidos/${slug}`} className="flex min-h-11 items-center gap-2 text-neutral-900">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                  {nombre}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
