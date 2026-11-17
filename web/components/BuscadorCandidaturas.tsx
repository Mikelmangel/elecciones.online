'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { colorPartido } from '@/lib/colores';
import { rutas } from '@/lib/rutas';

export interface CircunscripcionCandidaturas {
  codigo: string;
  nombre: string;
  candidaturas: {
    denominacion: string;
    siglas: string;
    cabeza_de_lista: string | null;
  }[];
}

const SIGLAS_DESTACADAS = ['PP', 'PSOE', 'PSC', 'VOX', 'SUMAR', 'PODEMOS', 'ERC', 'JUNTS', 'EH BILDU', 'EAJ-PNV', 'BNG', 'CCa', 'UPN', 'SALF'];

export default function BuscadorCandidaturas({
  circunscripciones,
}: {
  circunscripciones: CircunscripcionCandidaturas[];
}) {
  const [busqueda, setBusqueda] = useState('');
  const [partidoFiltro, setPartidoFiltro] = useState('TODOS');

  const query = busqueda.trim().toLowerCase();

  const resultados = useMemo(() => {
    const out: {
      codigo: string;
      provincia: string;
      siglas: string;
      denominacion: string;
      cabeza: string | null;
    }[] = [];

    for (const c of circunscripciones) {
      for (const cand of c.candidaturas) {
        if (partidoFiltro !== 'TODOS') {
          const s = cand.siglas.toUpperCase();
          if (!s.includes(partidoFiltro.toUpperCase())) continue;
        }
        if (query) {
          const match =
            c.nombre.toLowerCase().includes(query) ||
            cand.siglas.toLowerCase().includes(query) ||
            cand.denominacion.toLowerCase().includes(query) ||
            (cand.cabeza_de_lista && cand.cabeza_de_lista.toLowerCase().includes(query));
          if (!match) continue;
        }
        out.push({
          codigo: c.codigo,
          provincia: c.nombre,
          siglas: cand.siglas,
          denominacion: cand.denominacion,
          cabeza: cand.cabeza_de_lista,
        });
      }
    }
    return out;
  }, [circunscripciones, query, partidoFiltro]);

  const mostrandoLista = Boolean(query || partidoFiltro !== 'TODOS');

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#dfd9cc] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-editorial text-xl font-bold text-neutral-950">
              Buscador de candidatos, partidos y provincias
            </h2>
            <p className="text-xs text-neutral-600">
              Escribe el nombre de un cabeza de lista (ej. Feijóo, Sánchez, Abascal, Rufián), unas siglas o tu provincia.
            </p>
          </div>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-mono font-bold text-neutral-700">
            {resultados.length} candidaturas
          </span>
        </div>

        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre de candidato/a, siglas o provincia (ej: Madrid, Sevilla, VOX, Feijóo)..."
          className="min-h-12 w-full rounded-lg border border-neutral-300 px-3.5 text-base focus:border-red-900 focus:outline-hidden"
        />

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPartidoFiltro('TODOS')}
            className={`inline-flex min-h-9 items-center rounded-full px-3 text-xs font-bold border transition ${
              partidoFiltro === 'TODOS'
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            Todos
          </button>
          {SIGLAS_DESTACADAS.map((sigla) => (
            <button
              key={sigla}
              type="button"
              onClick={() => setPartidoFiltro(sigla)}
              className={`inline-flex min-h-9 items-center rounded-full px-3 text-xs font-bold border transition ${
                partidoFiltro === sigla
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              {sigla}
            </button>
          ))}
        </div>
      </section>

      {mostrandoLista ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-lg font-bold text-neutral-950">
              Resultados ({resultados.length})
            </h3>
            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setPartidoFiltro('TODOS');
              }}
              className="text-xs font-bold text-red-900 underline"
            >
              Limpiar filtro y ver las 52 provincias
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resultados.slice(0, 60).map((item, idx) => (
              <Link
                key={`${item.codigo}-${item.siglas}-${idx}`}
                href={rutas.candidaturaProvincia(item.codigo, item.provincia)}
                className="rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-400 transition space-y-2"
                style={{ borderLeftWidth: 4, borderLeftColor: colorPartido(item.siglas) }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-neutral-900">{item.siglas}</span>
                  <span className="text-xs font-mono text-neutral-500">{item.provincia}</span>
                </div>
                <div className="font-editorial text-base font-bold text-neutral-950">
                  {item.cabeza ?? 'Cabeza de lista sin especificar'}
                </div>
                <p className="text-xs text-neutral-600 line-clamp-2">{item.denominacion}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          <h3 className="font-editorial text-xl font-bold text-neutral-950">
            Todas las circunscripciones (52)
          </h3>
          <ul className="divide-y divide-[#ece7dc] border-y border-[#ece7dc] sm:grid sm:grid-cols-2 sm:gap-3 sm:divide-y-0 sm:border-0 md:grid-cols-3">
            {circunscripciones.map((c) => {
              const principales = c.candidaturas.slice(0, 3);
              return (
                <li
                  key={c.codigo}
                  className="py-1 sm:space-y-2 sm:rounded-xl sm:border sm:border-[#e4dfd3] sm:bg-white sm:p-4 sm:hover:border-neutral-400"
                >
                  <div className="flex min-h-11 items-center justify-between gap-2 sm:min-h-0 sm:items-baseline">
                    <Link
                      href={rutas.candidaturaProvincia(c.codigo, c.nombre)}
                      className="font-editorial text-lg font-bold text-neutral-950 hover:text-red-900 hover:underline"
                    >
                      {c.nombre}
                    </Link>
                    <span className="text-xs font-mono text-neutral-500">
                      {c.candidaturas.length} listas
                    </span>
                  </div>
                  <div className="hidden space-y-1 text-xs text-neutral-600 sm:block">
                    {principales.map((p, i) => (
                      <div key={`${c.codigo}-${p.siglas}-${i}`} className="truncate">
                        <strong className="text-neutral-800">{p.siglas}:</strong>{' '}
                        {p.cabeza_de_lista ?? '—'}
                      </div>
                    ))}
                  </div>
                  <Link
                    href={rutas.candidaturaProvincia(c.codigo, c.nombre)}
                    className="hidden pt-1 text-xs font-bold text-red-900 hover:underline sm:inline-block"
                  >
                    Ver las {c.candidaturas.length} listas de {c.nombre} →
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
