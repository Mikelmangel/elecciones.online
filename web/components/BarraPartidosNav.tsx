'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

interface PartidoRapido {
  slug: string;
  nombre: string;
  color: string;
}

interface Props {
  partidos: readonly (readonly [string, string, string])[];
}

export default function BarraPartidosNav({ partidos }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [mostrarMenu, setMostrarMenu] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const delta = direction === 'left' ? -220 : 220;
    el.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  return (
    <div className="pt-1 relative">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 shrink-0">
          Partidos
        </span>

        {/* Contenedor relativo con controles de scroll y degradados */}
        <div className="relative flex-1 min-w-0 flex items-center">
          {/* Botón scroll izquierda */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Desplazar a la izquierda"
              className="absolute left-0 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 border border-neutral-300 text-neutral-700 shadow-xs hover:bg-neutral-100 hover:text-neutral-950 transition -ml-1"
            >
              ‹
            </button>
          )}

          {/* Degradado indicador izquierdo */}
          {canScrollLeft && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#faf7f2] to-transparent z-5" />
          )}

          {/* Carrusel de partidos en fila única */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex items-center gap-1.5 overflow-x-auto scroll-smooth py-0.5 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full"
          >
            {partidos.map(([slugPartido, nombre, color]) => (
              <Link
                key={slugPartido}
                href={`/espana/generales/2026/partidos/${slugPartido}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white px-3 py-1 text-xs font-semibold text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50 transition shrink-0"
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span>{nombre}</span>
              </Link>
            ))}
          </div>

          {/* Degradado indicador derecho */}
          {canScrollRight && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#faf7f2] to-transparent z-5" />
          )}

          {/* Botón scroll derecha */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Desplazar a la derecha"
              className="absolute right-0 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 border border-neutral-300 text-neutral-700 shadow-xs hover:bg-neutral-100 hover:text-neutral-950 transition -mr-1"
            >
              ›
            </button>
          )}
        </div>

        {/* Desplegable alternativo "Todos (13) ▾" para no tener que scrollear */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMostrarMenu(!mostrarMenu)}
            aria-expanded={mostrarMenu}
            onKeyDown={(e) => e.key === 'Escape' && setMostrarMenu(false)}
            className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-xs font-bold text-neutral-700 hover:bg-white hover:border-neutral-400 transition"
          >
            <span>Todos ({partidos.length})</span>
            <span className="text-xs">▾</span>
          </button>

          {mostrarMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMostrarMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-neutral-200 bg-white p-2.5 shadow-lg space-y-1">
                <div className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 px-1.5 pb-1 border-b border-neutral-100">
                  Acceso a ficha de cada partido
                </div>
                <div className="grid grid-cols-2 gap-1 pt-1 max-h-60 overflow-y-auto">
                  {partidos.map(([slugPartido, nombre, color]) => (
                    <Link
                      key={slugPartido}
                      href={`/espana/generales/2026/partidos/${slugPartido}`}
                      onClick={() => setMostrarMenu(false)}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 transition"
                    >
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="truncate">{nombre}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
