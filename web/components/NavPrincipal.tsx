'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function NavPrincipal({ enlaces }: { enlaces: readonly (readonly [string, string])[] }) {
  const ruta = usePathname();
  const ref = useRef<HTMLElement>(null);
  // en móvil la barra se desplaza: que la sección actual quede a la vista
  useEffect(() => {
    const nav = ref.current;
    const activo = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && activo && nav.scrollWidth > nav.clientWidth) {
      nav.scrollLeft = activo.offsetLeft - (nav.clientWidth - activo.offsetWidth) / 2;
    }
  }, [ruta]);
  return (
    <nav
      ref={ref}
      aria-label="Principal"
      className="-mx-4 flex overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,#000_85%,transparent)] md:[mask-image:none]"
    >
      {enlaces.map(([href, label]) => {
        const esExterno = href.startsWith('http');
        if (esExterno) {
          return (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 shrink-0 items-center border-b-2 border-transparent px-3 text-[0.9375rem] font-semibold text-amber-800 hover:border-amber-600 hover:text-amber-950 transition-colors"
            >
              {label}
            </a>
          );
        }

        // la sección es el prefijo sin el último tramo variable (p. ej. /comparador/vivienda)
        const base = href.replace(/\/comparador\/.*/, '/comparador');
        const activo = ruta === href || ruta.startsWith(base + '/') || ruta === base;
        return (
          <Link
            key={href}
            href={href}
            aria-current={activo ? 'page' : undefined}
            className={`flex min-h-11 shrink-0 items-center border-b-2 px-3 text-[0.9375rem] font-medium transition-colors ${
              activo
                ? 'border-red-800 text-neutral-950'
                : 'border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-950'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
