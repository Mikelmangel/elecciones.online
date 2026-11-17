'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { rutas } from '@/lib/rutas';

export interface ProvinciaMapaInfo {
  codigo: string;
  nombre: string;
  d: string;
  cx: number;
  cy: number;
  escanos2026: number;
  escanos2023: number;
  candidaturasCount: number;
  ganador2023: string;
  ganadorVotos2023: number;
  reparto2023: { siglas: string; escanos: number }[];
}

const PARTIDOS_CON_ESCANO: [string, string, string][] = [
  ['PP', 'PP', '#0056a8'],
  ['PSOE', 'PSOE', '#e30613'],
  ['PSC', 'PSC (Catalunya)', '#c8102e'],
  ['VOX', 'VOX', '#5cb811'],
  ['SUMAR', 'Sumar / Comuns', '#e51c55'],
  ['ERC', 'ERC', '#f2a900'],
  ['JUNTS', 'Junts', '#00a7a0'],
  ['EH Bildu', 'EH Bildu', '#6aa84f'],
  ['EAJ-PNV', 'EAJ-PNV', '#15803d'],
  ['BNG', 'BNG', '#0284c7'],
  ['CCa', 'CCa', '#ca8a04'],
  ['UPN', 'UPN', '#1e3a8a'],
];

const COLOR_PARTIDO: Record<string, string> = Object.fromEntries(
  PARTIDOS_CON_ESCANO.map(([siglas, , color]) => [siglas, color])
);

function colorGanador(siglas: string): string {
  if (COLOR_PARTIDO[siglas]) return COLOR_PARTIDO[siglas];
  for (const [k, v] of Object.entries(COLOR_PARTIDO)) {
    if (siglas.toUpperCase().includes(k.toUpperCase())) return v;
  }
  return '#64748b';
}

export function MapaEspana({ provincias }: { provincias: ProvinciaMapaInfo[] }) {
  const [modo, setModo] = useState<'ganador' | 'cambios' | 'partido'>('ganador');
  const [partidoFiltro, setPartidoFiltro] = useState<string>('ERC');
  const [seleccionada, setSeleccionada] = useState<string>('08');
  const [hover, setHover] = useState<string | null>(null);

  const mapaPorCodigo = useMemo(
    () => new Map(provincias.map((p) => [p.codigo, p])),
    [provincias]
  );

  const activa = mapaPorCodigo.get(hover ?? seleccionada) ?? provincias[0];

  function fillDe(p: ProvinciaMapaInfo): string {
    if (modo === 'ganador') return colorGanador(p.ganador2023);
    if (modo === 'partido') {
      const tiene = p.reparto2023.find((r) => r.siglas === partidoFiltro);
      return tiene ? colorGanador(partidoFiltro) : '#e2e8f0';
    }
    const diff = p.escanos2026 - p.escanos2023;
    if (diff > 0) return '#059669';
    if (diff < 0) return '#d97706';
    return '#cbd5e1';
  }

  return (
    <div className="rounded-2xl border border-[#dfd9cc] bg-white p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-editorial text-xl sm:text-2xl font-bold text-neutral-950">
            Mapa interactivo por circunscripciones (52)
          </h3>
          <p className="text-xs text-neutral-600">
            Pasa el ratón o haz clic en cualquier provincia, Ceuta o Melilla, o pulsa en un partido de la leyenda para ver dónde obtuvo escaños.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModo('ganador')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              modo === 'ganador'
                ? 'bg-neutral-900 text-white'
                : 'border border-[#e4dfd3] bg-[#faf7f2] text-neutral-700 hover:bg-white'
            }`}
          >
            1.ª fuerza en 2023
          </button>
          <button
            type="button"
            onClick={() => setModo('cambios')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              modo === 'cambios'
                ? 'bg-neutral-900 text-white'
                : 'border border-[#e4dfd3] bg-[#faf7f2] text-neutral-700 hover:bg-white'
            }`}
          >
            Cambios escaños 2023 → 2026
          </button>
          <select
            aria-label="Seleccionar circunscripción"
            value={seleccionada}
            onChange={(e) => setSeleccionada(e.target.value)}
            className="rounded-xl border border-[#c9c1b0] bg-[#faf7f2] px-2.5 py-1.5 text-xs font-semibold text-neutral-900"
          >
            {provincias.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.codigo} · {p.nombre} ({p.escanos2026} esc.)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leyenda interactiva con TODOS los partidos con representación parlamentaria */}
      <div className="mt-3 pt-3 border-t border-[#ece7dc] flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 mr-1">
          Ver escaños por partido (12):
        </span>
        {PARTIDOS_CON_ESCANO.map(([siglas, etiqueta, col]) => {
          const activo = modo === 'partido' && partidoFiltro === siglas;
          return (
            <button
              key={siglas}
              type="button"
              onClick={() => {
                setPartidoFiltro(siglas);
                setModo('partido');
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                activo
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-[#e4dfd3] bg-[#faf7f2] text-neutral-800 hover:bg-white'
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col }} />
              {etiqueta}
            </button>
          );
        })}
        {modo === 'partido' && (
          <button
            type="button"
            onClick={() => setModo('ganador')}
            className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-900"
          >
            Volver a 1.ª fuerza
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="relative overflow-hidden rounded-xl border border-[#e4dfd3] bg-[#f3efe6]/60 p-2">
          <svg
            viewBox="0 0 800 570"
            className="h-auto w-full select-none"
            role="img"
            aria-label="Mapa interactivo de las 52 circunscripciones electorales de España"
          >
            <rect
              x="16"
              y="432"
              width="202"
              height="126"
              rx="6"
              fill="#ffffff"
              fillOpacity="0.88"
              stroke="#94a3b8"
              strokeDasharray="4 3"
              strokeWidth="1"
            />
            <text x="24" y="446" fontSize="10" fill="#475569" fontWeight="600">
              Canarias
            </text>

            {provincias.map((p) => {
              const isSelected = p.codigo === seleccionada;
              const isHover = p.codigo === hover;
              return (
                <path
                  key={p.codigo}
                  d={p.d}
                  fill={fillDe(p)}
                  fillOpacity={isHover || isSelected ? 1 : 0.88}
                  stroke={isSelected ? '#0f172a' : isHover ? '#1e293b' : '#ffffff'}
                  strokeWidth={isSelected ? 2.2 : isHover ? 1.6 : 0.8}
                  className="cursor-pointer transition-opacity"
                  tabIndex={0}
                  aria-label={`${p.nombre}: ${p.escanos2026} escaños`}
                  onMouseEnter={() => setHover(p.codigo)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(p.codigo)}
                  onBlur={() => setHover(null)}
                  onClick={() => setSeleccionada(p.codigo)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSeleccionada(p.codigo);
                    }
                  }}
                />
              );
            })}

            {(['51', '52'] as const).map((cod) => {
              const p = mapaPorCodigo.get(cod);
              if (!p) return null;
              const isSel = p.codigo === seleccionada;
              return (
                <g
                  key={`badge-${cod}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHover(cod)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setSeleccionada(cod)}
                >
                  <circle
                    cx={p.cx}
                    cy={p.cy}
                    r={isSel ? 9 : 7}
                    fill={fillDe(p)}
                    stroke="#0f172a"
                    strokeWidth={isSel ? 2 : 1}
                  />
                  <text
                    x={p.cx + 11}
                    y={p.cy + 3}
                    fontSize="10"
                    fontWeight="600"
                    fill="#1e293b"
                  >
                    {p.nombre}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {activa && (
          <div className="flex flex-col justify-between rounded-xl border border-[#e4dfd3] bg-[#faf7f2] p-5">
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="font-editorial text-2xl font-bold text-neutral-950">{activa.nombre}</h4>
                <span className="font-mono text-xs text-neutral-500">INE {activa.codigo}</span>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2.5 text-sm">
                <div className="rounded-xl border border-[#e4dfd3] bg-white p-3">
                  <dt className="text-xs text-neutral-500">Escaños 2026</dt>
                  <dd className="font-mono text-xl font-extrabold text-neutral-950">
                    {activa.escanos2026}
                    {activa.escanos2026 !== activa.escanos2023 && (
                      <span
                        className={`ml-1.5 text-xs font-bold ${
                          activa.escanos2026 > activa.escanos2023
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        ({activa.escanos2026 > activa.escanos2023 ? '+1' : '-1'} vs 2023)
                      </span>
                    )}
                  </dd>
                </div>
                <div className="rounded-xl border border-[#e4dfd3] bg-white p-3">
                  <dt className="text-xs text-neutral-500">Listas proclamadas</dt>
                  <dd className="font-mono text-xl font-extrabold text-neutral-950">
                    {activa.candidaturasCount}
                  </dd>
                </div>
              </dl>

              <div className="mt-3 rounded-xl border border-[#e4dfd3] bg-white p-3.5 text-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Reparto de escaños en 2023
                </p>
                <p className="mt-1 text-xs text-neutral-700">
                  1.ª fuerza: <strong>{activa.ganador2023}</strong> (
                  {activa.ganadorVotos2023.toLocaleString('es-ES')} votos)
                </p>

                {/* Barra apilada visual de los escaños de esta provincia */}
                <div className="mt-2.5 flex h-4 w-full overflow-hidden rounded-full bg-neutral-100">
                  {activa.reparto2023.map((r) => (
                    <div
                      key={r.siglas}
                      style={{
                        width: `${(r.escanos / Math.max(1, activa.escanos2023)) * 100}%`,
                        backgroundColor: colorGanador(r.siglas),
                      }}
                      title={`${r.siglas}: ${r.escanos} escaños`}
                    />
                  ))}
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {activa.reparto2023.map((r) => (
                    <span
                      key={r.siglas}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#e4dfd3] bg-[#faf7f2] px-2 py-0.5 text-xs font-semibold text-neutral-900"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: colorGanador(r.siglas) }}
                      />
                      {r.siglas}: <strong>{r.escanos}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={rutas.candidaturaProvincia(activa.codigo, activa.nombre)}
                className="rounded-xl bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-900 transition"
              >
                Ver listas 2026 en {activa.nombre} →
              </Link>
              <Link
                href={rutas.resultados2023Provincia(activa.codigo, activa.nombre)}
                className="rounded-xl border border-[#c9c1b0] bg-white px-3.5 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-100 transition"
              >
                Gráficos 2023 →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
