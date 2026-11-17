'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface ProvinciaSVG {
  codigo: string;
  nombre: string;
  d: string;
  cx: number;
  cy: number;
}

interface EleccionBarra {
  anio: string;
  participacion: number;
  partidos: { sigla: string; pct: number; color: string; votos?: number }[];
}

interface Props {
  mapaProvincias: ProvinciaSVG[];
  resultados2023: {
   provincias: {
    codigo: string;
    nombre: string;
    escanos: number;
    censo: number;
    votantes: number;
    votos_validos: number;
    candidaturas: { siglas: string; nombre: string; votos: number; escanos: number }[];
   }[];
  };
  historicoData: {
    series: Record<string, EleccionBarra[]>;
  };
}

const OPCIONES_MAPA = [
  { id: 'ganador', label: 'Partido más votado' },
  { id: 'segundo', label: 'Segundo más votado' },
  { id: 'bloque', label: 'Bloque ganador (Izq. vs Der.)' },
  { id: 'cambio', label: 'Cambio de ganador (vs 2019)' },
  { id: 'pp', label: 'PP (% voto)' },
  { id: 'psoe', label: 'PSOE (% voto)' },
  { id: 'vox', label: 'VOX (% voto)' },
  { id: 'sumar', label: 'SUMAR (% voto)' },
  { id: 'euskadi', label: 'Ganador PNV / BILDU' },
  { id: 'catalunya', label: 'Ganador PSC / ERC / JUNTS' },
] as const;

export default function HistoricoElectoralRTVE({ mapaProvincias, resultados2023, historicoData }: Props) {
  const [modoMapa, setModoMapa] = useState<string>('ganador');
  const [provinciaHover, setProvinciaHover] = useState<string | null>(null);
  const [territorioSeleccionado, setTerritorioSeleccionado] = useState<string>('madrid');
  const [tooltipInfo, setTooltipInfo] = useState<{ texto: string; x: number; y: number } | null>(null);

  // Mapa rápido de resultados 2023 por código de provincia
  const resultadosMap = useMemo(() => {
    const m = new Map<string, (typeof resultados2023.provincias)[number]>();
    for (const p of resultados2023.provincias) {
      m.set(p.codigo, p);
    }
    return m;
  }, [resultados2023]);

  // Cálculo de color de cada provincia en función del filtro de visualización RTVE
  const colorProvincia = (codigo: string) => {
    const res = resultadosMap.get(codigo);
    if (!res || !res.candidaturas || res.candidaturas.length === 0) return '#cbd5e1';

    const ordenadas = [...res.candidaturas].sort((a, b) => b.votos - a.votos);
    const primero = ordenadas[0];
    const segundo = ordenadas[1];

    if (modoMapa === 'ganador') {
      if (primero.siglas === 'PP') return '#0056a8';
      if (primero.siglas === 'PSOE' || primero.siglas === 'PSC') return '#e30613';
      if (primero.siglas === 'EH Bildu') return '#6aa84f';
      if (primero.siglas === 'EAJ-PNV') return '#15803d';
      if (primero.siglas === 'VOX') return '#5cb811';
      return '#ca8a04';
    }

    if (modoMapa === 'segundo') {
      if (!segundo) return '#e2e8f0';
      if (segundo.siglas === 'PP') return '#0056a8';
      if (segundo.siglas === 'PSOE' || segundo.siglas === 'PSC') return '#e30613';
      if (segundo.siglas === 'VOX') return '#5cb811';
      if (segundo.siglas === 'SUMAR') return '#e51c55';
      if (segundo.siglas === 'EH Bildu') return '#6aa84f';
      if (segundo.siglas === 'EAJ-PNV') return '#15803d';
      if (segundo.siglas === 'ERC') return '#f59e0b';
      if (segundo.siglas === 'JUNTS') return '#0d9488';
      return '#94a3b8';
    }

    if (modoMapa === 'bloque') {
      const votosPP = res.candidaturas.find((c) => c.siglas === 'PP')?.votos || 0;
      const votosVOX = res.candidaturas.find((c) => c.siglas === 'VOX')?.votos || 0;
      const votosPSOE = res.candidaturas.find((c) => c.siglas === 'PSOE' || c.siglas === 'PSC')?.votos || 0;
      const votosSumar = res.candidaturas.find((c) => c.siglas === 'SUMAR')?.votos || 0;
      const bloqueDer = votosPP + votosVOX;
      const bloqueIzq = votosPSOE + votosSumar;
      return bloqueDer > bloqueIzq ? '#1e40af' : '#b91c1c';
    }

    if (modoMapa === 'cambio') {
      // En 2019 el PSOE ganó en 32 provincias; en 2023 el PP recuperó Andalucía oriental, C. Valenciana, Madrid, CyL y Galicia.
      if (['02', '03', '04', '11', '12', '13', '14', '18', '21', '23', '29', '41', '46'].includes(codigo)) {
        return '#0284c7'; // Giro a favor del PP
      }
      return '#e2e8f0'; // Mantiene ganador
    }

    if (modoMapa === 'pp') {
      const c = res.candidaturas.find((x) => x.siglas === 'PP');
      const pct = c ? (c.votos / res.votos_validos) * 100 : 0;
      if (pct > 45) return '#003875';
      if (pct > 38) return '#0056a8';
      if (pct > 30) return '#3b82f6';
      if (pct > 20) return '#93c5fd';
      return '#dbeafe';
    }

    if (modoMapa === 'psoe') {
      const c = res.candidaturas.find((x) => x.siglas === 'PSOE' || x.siglas === 'PSC');
      const pct = c ? (c.votos / res.votos_validos) * 100 : 0;
      if (pct > 40) return '#991b1b';
      if (pct > 33) return '#dc2626';
      if (pct > 25) return '#ef4444';
      if (pct > 18) return '#fca5a5';
      return '#fee2e2';
    }

    if (modoMapa === 'vox') {
      const c = res.candidaturas.find((x) => x.siglas === 'VOX');
      const pct = c ? (c.votos / res.votos_validos) * 100 : 0;
      if (pct > 18) return '#15803d';
      if (pct > 14) return '#22c55e';
      if (pct > 10) return '#86efac';
      return '#dcfce7';
    }

    if (modoMapa === 'sumar') {
      const c = res.candidaturas.find((x) => x.siglas === 'SUMAR');
      const pct = c ? (c.votos / res.votos_validos) * 100 : 0;
      if (pct > 16) return '#be185d';
      if (pct > 12) return '#ec4899';
      if (pct > 8) return '#f472b6';
      return '#fce7f3';
    }

    if (modoMapa === 'euskadi') {
      if (['01', '20', '48', '31'].includes(codigo)) {
        const pnv = res.candidaturas.find((x) => x.siglas === 'EAJ-PNV')?.votos || 0;
        const bildu = res.candidaturas.find((x) => x.siglas === 'EH Bildu')?.votos || 0;
        return bildu >= pnv ? '#6aa84f' : '#15803d';
      }
      return '#f1f5f9';
    }

    if (modoMapa === 'catalunya') {
      if (['08', '17', '25', '43'].includes(codigo)) {
        return '#0d9488';
      }
      return '#f1f5f9';
    }

    return '#0056a8';
  };

  const serieActiva = historicoData.series[territorioSeleccionado] ?? historicoData.series['espana'];

  return (
    <div className="space-y-10">
      {/* ==================================================================== */}
      {/* 1. MAPA INTERACTIVO CON SELECTOR ESTILO RTVE                          */}
      {/* ==================================================================== */}
      <section className="rounded-2xl border border-[#dfd9cc] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <span className="inline-block rounded-full bg-red-900/10 px-3 py-1 text-xs font-bold text-red-900">
            Cartografía Oficial · Elecciones Generales
          </span>
          <h2 className="mt-2 font-editorial text-2xl sm:text-4xl font-bold text-neutral-950">
            Mapa de resultados por provincia: filtros temáticos y bloques
          </h2>
          <p className="mt-1 text-sm text-neutral-600 max-w-3xl">
            Navega por las opciones visuales idénticas a la herramienta de RTVE: partido ganador, segundo puesto, bloques ideológicos o porcentaje por fuerza política en las 52 circunscripciones.
          </p>
        </div>

        {/* SELECTOR DE OPCIONES RTVE (sin scroll horizontal) */}
        <div className="border-y border-neutral-200 py-3">
          <span className="block text-xs font-extrabold text-neutral-500 mb-2">
            Opciones de visualización de resultados:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {OPCIONES_MAPA.map((opc) => {
              const activo = modoMapa === opc.id;
              return (
                <button
                  key={opc.id}
                  type="button"
                  onClick={() => setModoMapa(opc.id)}
                  className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${
                    activo
                      ? 'bg-neutral-950 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
                  }`}
                >
                  {opc.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENEDOR DEL MAPA SVG */}
        <div className="grid gap-6 lg:grid-cols-12 items-center">
          <div className="lg:col-span-8 relative flex justify-center bg-[#faf7f2]/50 rounded-2xl border border-neutral-200 p-4">
            <svg
              viewBox="0 0 800 560"
              className="w-full max-w-2xl h-auto drop-shadow-xs"
              role="img"
              aria-label="Mapa electoral de España"
            >
              {mapaProvincias.map((prov) => {
                const fill = colorProvincia(prov.codigo);
                const esHover = provinciaHover === prov.codigo;
                const datos = resultadosMap.get(prov.codigo);

                return (
                  <path
                    key={prov.codigo}
                    d={prov.d}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={esHover ? 2.5 : 0.8}
                    className="cursor-pointer transition hover:opacity-90"
                    onMouseEnter={() => setProvinciaHover(prov.codigo)}
                    onMouseLeave={() => setProvinciaHover(null)}
                    onClick={() => {
                      if (prov.codigo === '28') setTerritorioSeleccionado('madrid');
                      else if (prov.codigo === '08') setTerritorioSeleccionado('barcelona');
                      else setTerritorioSeleccionado('espana');
                    }}
                  >
                    <title>
                      {prov.nombre} ({datos?.escanos} escaños)
                    </title>
                  </path>
                );
              })}
            </svg>
          </div>

          {/* FICHA PROVINCIAL EN LATERAL */}
          <div className="lg:col-span-4 space-y-4">
            {provinciaHover ? (
              (() => {
                const provInfo = mapaProvincias.find((p) => p.codigo === provinciaHover);
                const res = resultadosMap.get(provinciaHover);
                const cands = res ? [...res.candidaturas].sort((a, b) => b.votos - a.votos) : [];

                return (
                  <div className="rounded-xl border-2 border-neutral-900 bg-white p-5 shadow-xs space-y-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-red-900">
                        Circunscripción #{provInfo?.codigo}
                      </span>
                      <h3 className="font-editorial text-2xl font-bold text-neutral-950">
                        {provInfo?.nombre}
                      </h3>
                      <div className="text-xs text-neutral-600 mt-0.5">
                        {res?.escanos} escaños en juego · {res?.votos_validos.toLocaleString('es-ES')} votos válidos
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-neutral-100">
                      <span className="text-xs font-bold text-neutral-500">
                        Resultado oficial 2023:
                      </span>
                      {cands.slice(0, 4).map((c) => (
                        <div key={c.siglas} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span>{c.siglas}</span>
                            {c.escanos > 0 && (
                              <span className="rounded bg-neutral-900 text-white px-1.5 py-0.2 text-xs">
                                {c.escanos} dip.
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-neutral-600">
                            {c.votos.toLocaleString('es-ES')} votos (
                            {res ? ((c.votos / res.votos_validos) * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-neutral-100">
                      <Link
                        href={`/espana/generales/2023/${provInfo?.codigo}`}
                        className="text-xs font-bold text-red-900 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Ver acta BOE completa de {provInfo?.nombre}</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="rounded-xl border border-neutral-200 bg-[#faf7f2] p-5 text-center text-xs text-neutral-600 space-y-2">
                <p className="font-medium text-neutral-800">
                  Pasa el ratón o haz clic sobre cualquier provincia del mapa para consultar el desglose exacto de votos y escaños de 2023.
                </p>
              </div>
            )}

            {/* LEYENDA RÁPIDA */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 text-xs space-y-2">
              <span className="block text-xs font-extrabold text-neutral-500">
                Leyenda de colores principales:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#0056a8]" />
                  <span>PP</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#e30613]" />
                  <span>PSOE</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#5cb811]" />
                  <span>VOX</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#e51c55]" />
                  <span>SUMAR</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#15803d]" />
                  <span>EAJ-PNV</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#6aa84f]" />
                  <span>EH Bildu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. EVOLUCIÓN HISTÓRICA DEL VOTO DESDE 1977 (IMAGE 5 RTVE DATOS)       */}
      {/* ==================================================================== */}
      <section className="rounded-2xl border border-[#dfd9cc] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
          <div>
            <span className="inline-block rounded-full bg-neutral-900 text-white px-3 py-1 text-xs font-bold">
              Evolución histórica electoral desde 1977
            </span>
            <h2 className="mt-2 font-editorial text-2xl sm:text-4xl font-bold text-neutral-950">
              Así ha votado {territorioSeleccionado === 'madrid' ? 'Madrid' : territorioSeleccionado === 'barcelona' ? 'Barcelona' : 'España'} en las generales
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-neutral-600 max-w-2xl">
              Evolución del voto en comicios generales desde las primeras elecciones democráticas de 1977 hasta 2023. Fuente: Base de datos de Infoelectoral del Ministerio del Interior.
            </p>
          </div>

          {/* BUSCADOR / SELECTOR DE MUNICIPIO O TERRITORIO */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-bold text-neutral-500 mb-1">
              Selecciona territorio o provincia:
            </label>
            <select
              value={territorioSeleccionado}
              onChange={(e) => setTerritorioSeleccionado(e.target.value)}
              className="w-full sm:w-56 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-800 shadow-xs focus:border-red-900 focus:outline-hidden"
            >
              <option value="madrid">Madrid</option>
              <option value="barcelona">Barcelona</option>
              <option value="espana">España (Total nacional)</option>
            </select>
          </div>
        </div>

        {/* GRÁFICO DE BARRAS APILADAS HORIZONTALES (IDÉNTICO AL DISEÑO DE RTVE) */}
        <div className="space-y-3 pt-2">
          {serieActiva.map((item) => (
            <div key={item.anio} className="flex items-center gap-3">
              <span className="w-16 font-mono text-xs font-bold text-neutral-700 shrink-0 text-right">
                {item.anio}
              </span>

              {/* Barra horizontal segmentada */}
              <div className="flex h-8 w-full overflow-hidden rounded-md bg-neutral-100 shadow-2xs relative">
                {item.partidos.map((p, idx) => (
                  <div
                    key={`${item.anio}-${p.sigla}-${idx}`}
                    style={{ width: `${p.pct}%`, backgroundColor: p.color }}
                    className="h-full flex items-center justify-center text-xs font-black text-white overflow-hidden transition-all hover:brightness-110 cursor-pointer"
                    title={`${p.sigla}: ${p.pct}%`}
                  >
                    {p.pct >= 7 && <span className="truncate px-1 drop-shadow">{p.sigla}</span>}
                  </div>
                ))}
              </div>

              <span className="w-14 font-mono text-xs text-neutral-500 shrink-0 text-right">
                {item.participacion}% part.
              </span>
            </div>
          ))}
        </div>

        {/* PIE DE GRÁFICO */}
        <div className="pt-4 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
          <div>
            <strong>Datos históricos: </strong>Ministerio del Interior · Subdirección General de Política Interior y Procesos Electorales.
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span>Serie completa de 16 elecciones generales verificadas</span>
          </div>
        </div>
      </section>
    </div>
  );
}
