'use client';

import { useState } from 'react';

export interface PartidoEscanos {
  siglas: string;
  escanos: number;
  color: string;
}

const TOTAL = 350;
const MAYORIA = 176;

const PACTOS_RAPIDOS: { nombre: string; siglas: string[] }[] = [
  {
    nombre: 'Pacto de Investidura 2023 (179)',
    siglas: ['PSOE', 'PSC', 'SUMAR', 'ERC', 'JUNTS', 'EH Bildu', 'EAJ-PNV', 'BNG', 'CCa'],
  },
  {
    nombre: 'Bloque PP + VOX + UPN + CCa (172)',
    siglas: ['PP', 'VOX', 'UPN', 'CCa'],
  },
  {
    nombre: 'Coalición Gobierno actual (PSOE + PSC + Sumar: 152)',
    siglas: ['PSOE', 'PSC', 'SUMAR'],
  },
];

export default function Pactometro({ partidos }: { partidos: PartidoEscanos[] }) {
  const [sel, setSel] = useState<string[]>(['PSOE', 'PSC', 'SUMAR', 'ERC', 'JUNTS', 'EH Bildu', 'EAJ-PNV', 'BNG', 'CCa']);
  const activos = partidos.filter((p) => sel.includes(p.siglas));
  const enContra = partidos.filter((p) => !sel.includes(p.siglas));
  const suma = activos.reduce((a, p) => a + p.escanos, 0);
  const sumaContra = TOTAL - suma;

  return (
    <div className="space-y-6">
      {/* Botones de combinaciones rápidas */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#ece7dc] pb-4">
        <span className="text-sm font-semibold text-neutral-500 mr-1">
          Probar mayorías:
        </span>
        {PACTOS_RAPIDOS.map((pacto) => (
          <button
            key={pacto.nombre}
            type="button"
            onClick={() => setSel(pacto.siglas)}
            className="min-h-11 rounded-xl border border-[#e4dfd3] bg-[#faf7f2] px-3 py-1.5 text-xs font-bold text-neutral-800 hover:border-neutral-900 hover:bg-white transition"
          >
            {pacto.nombre}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSel([])}
          className="min-h-11 rounded-xl bg-red-100 px-3 py-1.5 text-xs font-bold text-red-900 hover:bg-red-200 transition"
        >
          Vaciar todo
        </button>
      </div>

      {/* Marcador de investidura */}
      <div className="grid gap-4 divide-y divide-[#ece7dc] sm:grid-cols-3 sm:divide-y-0">
        <div
          className={`border-l-4 p-4 ${
            suma >= MAYORIA
              ? 'border-emerald-400 bg-emerald-50/70'
              : 'border-amber-400 bg-amber-50/70'
          }`}
        >
          <div className="text-sm font-semibold text-neutral-600">
            Bloque seleccionado (SÍ)
          </div>
          <div className="mt-1 font-mono text-4xl font-extrabold text-neutral-950">
            {suma} <span className="text-base font-normal text-neutral-500">/ 350</span>
          </div>
          <p className="mt-1 text-sm font-bold text-neutral-800" aria-live="polite">
            {suma >= MAYORIA
              ? `Mayoría absoluta (+${suma - MAYORIA} sobre 176)`
              : `Faltan ${MAYORIA - suma} escaños para los 176`}
          </p>
        </div>

        <div className="bg-[#faf7f2] p-4">
          <div className="text-sm font-semibold text-neutral-600">
            Umbral de mayoría absoluta
          </div>
          <div className="mt-1 font-mono text-4xl font-extrabold text-red-900">{MAYORIA}</div>
          <p className="mt-1 text-sm text-neutral-600">
            Mitad más uno de los 350 diputados del Congreso
          </p>
        </div>

        <div className="bg-neutral-50 p-4">
          <div className="text-sm font-semibold text-neutral-600">
            Resto del hemiciclo
          </div>
          <div className="mt-1 font-mono text-4xl font-extrabold text-neutral-700">{sumaContra}</div>
          <p className="mt-1 break-words text-sm text-neutral-600">
            {enContra.map((p) => p.siglas).join(', ') || 'Ningún partido fuera del pacto'}
          </p>
        </div>
      </div>

      {/* Barra de progreso hacia los 176 escaños */}
      <div>
        <div className="flex flex-wrap justify-between gap-x-2 text-xs font-bold text-neutral-600 mb-1.5">
          <span>0 escaños</span>
          <span className="text-red-900">▼ Mayoría absoluta (176)</span>
          <span>350 escaños</span>
        </div>
        <div
          className="relative w-full h-12 bg-neutral-100 rounded-xl overflow-hidden flex border border-neutral-300"
          role="img"
          aria-label={`${suma} de ${TOTAL} escaños seleccionados; la mayoría absoluta son ${MAYORIA}`}
        >
          {activos.map((p) => (
            <div
              key={p.siglas}
              style={{ width: `${(p.escanos / TOTAL) * 100}%`, backgroundColor: p.color }}
              className="h-full flex items-center justify-center text-white text-xs font-extrabold border-r border-white/30 transition-all"
              title={`${p.siglas}: ${p.escanos} escaños`}
            >
              {p.escanos >= 10 ? `${p.siglas} ${p.escanos}` : ''}
            </div>
          ))}
          <div
            style={{ left: `${(MAYORIA / TOTAL) * 100}%` }}
            className="absolute top-0 bottom-0 w-1 bg-neutral-950 z-10"
          />
        </div>
      </div>

      {/* Tarjetas interactivas de cada partido */}
      <div>
        <p className="text-sm font-semibold text-neutral-500 mb-3">
          Pulsa en cada partido para sumarlo o quitarlo del pacto:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {partidos.map((p) => {
            const activo = sel.includes(p.siglas);
            return (
              <button
                key={p.siglas}
                type="button"
                aria-pressed={activo}
                onClick={() => setSel(activo ? sel.filter((s) => s !== p.siglas) : [...sel, p.siglas])}
                className={`min-h-11 min-w-0 p-3.5 rounded-xl border text-left transition ${
                  activo
                    ? 'border-neutral-950 ring-2 ring-neutral-950 bg-[#faf7f2] shadow-xs'
                    : 'border-[#e4dfd3] bg-white opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="font-bold text-sm text-neutral-950">{p.siglas}</span>
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-extrabold ${
                      activo ? 'bg-emerald-100 text-emerald-900' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {activo ? 'Sumado' : 'Fuera'}
                  </span>
                </div>
                <span className="block font-mono text-2xl font-extrabold text-neutral-950 mt-1.5">
                  {p.escanos} <span className="text-xs font-normal text-neutral-500">escaños</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
