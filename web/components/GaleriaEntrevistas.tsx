'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { EntrevistasData } from '@/lib/datos';
import { colorPartido } from '@/lib/colores';

function extraerYoutubeId(url: string): string | null {
  const m = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(url);
  return m ? m[1] : null;
}

const POR_PAGINA = 18;

const CANALES_DESTACADOS = [
  ['todos', 'Todos'],
  ['wild', 'The Wild Project'],
  ['revuelta', 'La Revuelta (RTVE)'],
  ['rtve', 'RTVE / La 1 / RNE'],
  ['lasexta', 'laSexta'],
  ['radio', 'Radio'],
] as const;

export default function GaleriaEntrevistas({
  data,
  slugsConAnalisis = [],
}: {
  data: EntrevistasData;
  slugsConAnalisis?: string[];
}) {
  const [canal, setCanal] = useState<(typeof CANALES_DESTACADOS)[number][0]>('todos');
  const [partidoFiltro, setPartidoFiltro] = useState<string>('todos');
  const [soloConAnalisis, setSoloConAnalisis] = useState<boolean>(false);

  const partidosUnicos = useMemo(() => {
    return Array.from(new Set(data.entrevistas.map((e) => e.partido)));
  }, [data.entrevistas]);

  const entrevistasFiltradas = useMemo(() => {
    return data.entrevistas.filter((e) => {
      const ytId = extraerYoutubeId(e.fuente_url);
      const tieneAnalisis =
        slugsConAnalisis.includes(e.slug || '') ||
        slugsConAnalisis.includes(e.id || '') ||
        (ytId && slugsConAnalisis.includes(ytId));
      if (soloConAnalisis && !tieneAnalisis) return false;
      if (partidoFiltro !== 'todos' && e.partido !== partidoFiltro) return false;
      const m = (e.medio + ' ' + e.titulo).toLowerCase();
      if (canal === 'wild') return m.includes('wild');
      if (canal === 'revuelta') return m.includes('revuelta');
      if (canal === 'rtve') return m.includes('rtve') || m.includes('rne') || m.includes('la 1');
      if (canal === 'lasexta') return m.includes('sexta');
      if (canal === 'radio') return e.formato === 'radio' || m.includes('radio') || m.includes('ser') || m.includes('onda');
      return true;
    }).sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));
  }, [data.entrevistas, canal, partidoFiltro, soloConAnalisis, slugsConAnalisis]);

  const [mostrar, setMostrar] = useState(POR_PAGINA);
  const visibles = entrevistasFiltradas.slice(0, mostrar);
  const chip = (activo: boolean) =>
    `inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition-colors ${
      activo ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-[#d6cfc0] bg-white text-neutral-800 hover:border-neutral-500'
    }`;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <p className="mb-1.5 text-sm font-semibold text-neutral-900">Medio</p>
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            {CANALES_DESTACADOS.map(([id, label]) => (
              <button key={id} type="button" aria-pressed={canal === id} onClick={() => { setCanal(id); setMostrar(POR_PAGINA); }} className={chip(canal === id)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-neutral-900">Partido</p>
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            <button type="button" aria-pressed={partidoFiltro === 'todos'} onClick={() => { setPartidoFiltro('todos'); setMostrar(POR_PAGINA); }} className={chip(partidoFiltro === 'todos')}>
              Todos
            </button>
            {partidosUnicos.map((p) => (
              <button key={p} type="button" aria-pressed={partidoFiltro === p} onClick={() => { setPartidoFiltro(p); setMostrar(POR_PAGINA); }} className={chip(partidoFiltro === p)}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colorPartido(p) }} aria-hidden />
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#f0ede6]">
          <p className="text-sm text-neutral-600" aria-live="polite">
            {entrevistasFiltradas.length} {entrevistasFiltradas.length === 1 ? 'entrevista' : 'entrevistas'}
          </p>
          {slugsConAnalisis.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSoloConAnalisis((v) => !v);
                setMostrar(POR_PAGINA);
              }}
              aria-pressed={soloConAnalisis}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                soloConAnalisis
                  ? 'bg-red-900 text-white'
                  : 'bg-red-50 text-red-950 border border-red-200 hover:bg-red-100'
              }`}
            >
              <span>Solo con análisis editorial ({slugsConAnalisis.length})</span>
            </button>
          )}
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 sm:gap-y-8 lg:grid-cols-3">
        {visibles.map((e) => {
          const ytId = extraerYoutubeId(e.fuente_url);
          const tieneAnalisis =
            slugsConAnalisis.includes(e.slug || '') ||
            slugsConAnalisis.includes(e.id || '') ||
            (ytId && slugsConAnalisis.includes(ytId));
          const rutaDetalle = `/espana/generales/2026/entrevistas/${e.slug || e.id || ytId}`;
          return (
            <li key={e.fuente_url} className="border-b border-[#e4dfd3] py-3 sm:border-0 sm:py-0">
              <Link href={rutaDetalle} className="group flex gap-3 sm:flex-col">
                <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md bg-neutral-900 sm:w-full">
                  {ytId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`}
                      alt=""
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center p-2 text-center text-xs font-semibold text-neutral-300">{e.medio}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-600">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colorPartido(e.partido) }} aria-hidden />
                    <span className="font-semibold text-neutral-800">{e.persona}</span>
                    {e.fecha && <span className="tabular-nums">· {e.fecha.split('-').reverse().slice(0, 2).join('/')}</span>}
                    {tieneAnalisis && (
                      <span className="rounded bg-red-100 text-red-950 px-1.5 py-0.5 text-[10px] font-bold">
                        Análisis
                      </span>
                    )}
                  </div>
                  <h3 className="mt-0.5 line-clamp-3 font-semibold leading-snug text-neutral-950 group-hover:text-red-900 sm:font-editorial sm:text-lg sm:font-bold">
                    {e.titulo}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-neutral-500">{e.medio}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {entrevistasFiltradas.length > mostrar && (
        <button
          type="button"
          onClick={() => setMostrar((n) => n + POR_PAGINA)}
          className="min-h-12 w-full rounded-lg border border-neutral-900 font-semibold text-neutral-950 transition-colors hover:bg-neutral-950 hover:text-white sm:w-auto sm:px-6"
        >
          Ver más entrevistas ({entrevistasFiltradas.length - mostrar})
        </button>
      )}
    </div>
  );
}
