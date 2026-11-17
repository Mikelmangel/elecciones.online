'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { claseResultado, resultado } from '@/lib/resultado';

const POR_PAGINA = 20;

export interface VotacionResumenItem {
  id: string;
  slugUrl: string;
  fecha: string;
  titulo: string;
  expediente: string;
  subgrupo: string;
  si: number;
  no: number;
  abs: number;
  esClave: boolean;
  tituloLlano: string | null;
  casoCoherencia?: {
    tipo: string;
    etiqueta: string;
    resumen: string;
  } | null;
}

const FILTROS_RAPIDOS = [
  ['principales', 'Leyes, Decretos y Votaciones Finales'],
  ['coherencia', 'Giros de voto y contradicciones'],
  ['renidas', 'Votaciones al límite (margen <= 10 votos)'],
  ['rechazadas', 'Rechazadas / Tumbadas en el Pleno'],
  ['decretos', 'Reales Decretos-leyes (paquetes cerrados)'],
  ['todas', 'Las 2.175 votaciones completas'],
] as const;

const BUSQUEDAS_SUGERIDAS = [
  'pensiones',
  'vivienda',
  'alquiler',
  'impuesto',
  'amnistía',
  'DANA',
  'transporte',
  'desempleo',
  'paridad',
  'judicial',
];

export default function BuscadorVotaciones({ items }: { items: VotacionResumenItem[] }) {
  const [q, setQ] = useState('');
  const [modo, setModo] = useState<(typeof FILTROS_RAPIDOS)[number][0]>('principales');
  const [anio, setAnio] = useState<string>('todos');
  const [limite, setLimite] = useState(POR_PAGINA);

  const filtradas = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((v) => {
      if (anio !== 'todos' && !v.fecha.startsWith(anio)) return false;

      if (modo === 'principales') {
        const sub = v.subgrupo.toLowerCase();
        const tit = v.titulo.toLowerCase();
        const esEnmiendaSuelta =
          sub.startsWith('enmienda') ||
          sub.startsWith('voto particular') ||
          tit.startsWith('enmiendas del senado');
        if (esEnmiendaSuelta && !v.esClave) return false;
      } else if (modo === 'coherencia') {
        if (!v.casoCoherencia) return false;
      } else if (modo === 'renidas') {
        if (Math.abs(v.si - v.no) > 10 || v.si + v.no < 100) return false;
      } else if (modo === 'rechazadas') {
        const sub = v.subgrupo.toLowerCase();
        if (v.no <= v.si) return false;
        if (sub.startsWith('enmienda') && !v.esClave) return false;
      } else if (modo === 'decretos') {
        if (!v.titulo.toLowerCase().includes('decreto') && !v.expediente.toLowerCase().includes('decreto')) {
          return false;
        }
      }

      if (!query) return true;
      return (
        v.titulo.toLowerCase().includes(query) ||
        v.expediente.toLowerCase().includes(query) ||
        (v.tituloLlano && v.tituloLlano.toLowerCase().includes(query)) ||
        v.id === query
      );
    });
  }, [items, q, modo, anio]);

  const visibles = filtradas.slice(0, limite);

  return (
    <div className="space-y-5">
      {/* Barra de búsqueda e interruptores */}
      <div className="rounded-2xl border border-[#dfd9cc] bg-white p-5 shadow-xs">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="buscar-votacion" className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
              Buscar en las {items.length.toLocaleString('es-ES')} votaciones de la XV Legislatura
            </label>
            <input
              id="buscar-votacion"
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setLimite(POR_PAGINA);
              }}
              placeholder="Escribe p. ej. pensiones, vivienda, impuesto, DANA, amnistía, 78-2..."
              className="w-full rounded-xl border border-[#c9c1b0] bg-[#faf7f2] px-4 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="filtro-anio" className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
              Año
            </label>
            <select
              id="filtro-anio"
              value={anio}
              onChange={(e) => {
                setAnio(e.target.value);
                setLimite(POR_PAGINA);
              }}
              className="rounded-xl border border-[#c9c1b0] bg-[#faf7f2] px-3 py-2.5 text-sm font-semibold text-neutral-900"
            >
              <option value="todos">Todos (2023–2026)</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>
        </div>

        {/* Sugerencias rápidas */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-neutral-500 font-medium mr-1">Búsquedas frecuentes:</span>
          {BUSQUEDAS_SUGERIDAS.map((palabra) => (
            <button
              key={palabra}
              type="button"
              onClick={() => {
                setQ(palabra);
                setModo('todas');
              }}
              className="min-h-8 rounded-full border border-[#e4dfd3] bg-[#faf7f2] px-3 font-medium text-neutral-700 hover:border-neutral-400 hover:bg-white"
            >
              {palabra}
            </button>
          ))}
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              className="min-h-8 rounded-full bg-red-100 px-3 font-bold text-red-900"
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {/* Pestañas de modo */}
        <div className="mt-4 pt-3 border-t border-[#ece7dc] flex flex-wrap gap-2">
          {FILTROS_RAPIDOS.map(([idModo, label]) => (
            <button
              key={idModo}
              type="button"
              aria-pressed={modo === idModo}
              onClick={() => {
                setModo(idModo);
                setLimite(POR_PAGINA);
              }}
              className={`min-h-9 rounded-xl px-3 text-xs font-bold transition ${
                modo === idModo
                  ? 'bg-neutral-900 text-white'
                  : 'border border-[#e4dfd3] bg-[#faf7f2] text-neutral-700 hover:bg-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="flex items-center justify-between text-xs text-neutral-600 px-1">
        <span>
          Mostrando <strong>{visibles.length}</strong> de <strong>{filtradas.length.toLocaleString('es-ES')}</strong> votaciones encontradas
        </span>
        <Link href="/espana/generales/2026/hemeroteca" className="font-bold text-red-900 underline">
          Ver análisis de Decretos Ómnibus y cosas mezcladas →
        </Link>
      </div>

      {/* Lista visual con barras de Sí / No / Abstención */}
      <div className="divide-y divide-[#ece7dc] border-y border-[#ece7dc]">
        {visibles.map((v) => {
          const total = Math.max(1, v.si + v.no + v.abs);
          const pctSi = (v.si / total) * 100;
          const pctNo = (v.no / total) * 100;
          const pctAbs = (v.abs / total) * 100;
          const r = resultado(v);
          const margen = Math.abs(v.si - v.no);

          return (
            <article
              key={v.id}
              className="py-3.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 max-w-3xl space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded bg-neutral-900 px-1.5 py-0.5 font-mono text-xs font-bold text-white">
                      {v.id}
                    </span>
                    <span className="text-neutral-500 font-medium">{v.fecha}</span>
                    {v.esClave && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-extrabold uppercase text-amber-900">
                        Votación clave
                      </span>
                    )}
                    {margen <= 10 && v.si + v.no >= 100 && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-extrabold text-red-900">
                        Margen de {margen} votos
                      </span>
                    )}
                  </div>

                  <h3 className="break-words font-bold text-base leading-snug text-neutral-950">
                    <Link href={v.slugUrl} className="hover:text-red-900 hover:underline">
                      {v.tituloLlano ?? v.titulo}
                    </Link>
                  </h3>

                  {v.expediente && (
                    <p className="hidden text-xs text-neutral-600 line-clamp-2 sm:block">{v.expediente}</p>
                  )}
                  {v.subgrupo && (
                    <p className="hidden text-xs text-neutral-500 italic sm:block">{v.subgrupo}</p>
                  )}

                  {v.casoCoherencia && (
                    <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50/70 p-2.5 text-xs text-amber-950">
                      <div className="flex items-center gap-1.5 font-bold mb-0.5">
                        <span className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
                        <span>{v.casoCoherencia.etiqueta}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-amber-900">{v.casoCoherencia.resumen}</p>
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                      claseResultado[r]
                    }`}
                  >
                    {r}
                  </span>
                  <div className="mt-1.5 font-mono text-xs text-neutral-700">
                    <strong className="text-emerald-700">{v.si} Sí</strong> ·{' '}
                    <strong className="text-rose-700">{v.no} No</strong> ·{' '}
                    <span className="text-amber-700">{v.abs} Abs.</span>
                  </div>
                </div>
              </div>

              {/* Barra visual apilada Sí / No / Abstención */}
              <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
                <div style={{ width: `${pctSi}%` }} className="bg-emerald-600" title={`${v.si} Sí`} />
                <div style={{ width: `${pctNo}%` }} className="bg-rose-600" title={`${v.no} No`} />
                <div style={{ width: `${pctAbs}%` }} className="bg-amber-400" title={`${v.abs} Abstenciones`} />
              </div>
            </article>
          );
        })}
      </div>

      {filtradas.length > limite && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setLimite((l) => l + POR_PAGINA)}
            className="min-h-11 rounded-xl bg-neutral-900 px-5 text-sm font-bold text-white hover:bg-red-900 transition"
          >
            Mostrar más votaciones ({filtradas.length - limite} restantes)
          </button>
        </div>
      )}
    </div>
  );
}
