'use client';

import { useEffect, useRef, useState } from 'react';

/** Índice fijo de la página: chips que llevan a cada sección y marcan la que se está leyendo. */
export default function IndicePagina({ secciones, className = '' }: { secciones: readonly (readonly [string, string])[]; className?: string }) {
  const [activa, setActiva] = useState(secciones[0]?.[0]);
  const barra = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (es) => {
        const visible = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiva(visible.target.id);
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    secciones.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [secciones]);

  useEffect(() => {
    const b = barra.current;
    const el = b?.querySelector<HTMLElement>('[aria-current="true"]');
    if (b && el) b.scrollTo({ left: el.offsetLeft - (b.clientWidth - el.clientWidth) / 2, behavior: 'smooth' });
  }, [activa]);

  return (
    <nav aria-label="En esta página" className={`sticky top-[3.75rem] z-20 -mx-4 border-b border-[#e4dfd3] bg-[#faf7f2]/95 px-4 backdrop-blur md:top-[6.75rem] ${className}`}>
      <div ref={barra} className="relative flex gap-1.5 overflow-x-auto py-2 [scrollbar-width:none]">
        {secciones.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={activa === id}
            className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-[#e4dfd3] bg-white px-3.5 text-sm font-medium text-neutral-800 aria-[current=true]:border-neutral-950 aria-[current=true]:bg-neutral-950 aria-[current=true]:text-white"
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}
