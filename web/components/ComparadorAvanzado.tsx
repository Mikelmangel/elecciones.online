'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Area, CasoCoherenciaItem, PartidoFicha, VerificacionEntrevistaItem } from '@/lib/datos';
import { colorPartido } from '@/lib/colores';
import { rutas } from '@/lib/rutas';

export interface PropuestaItem {
  area: Area;
  titular: string;
  cita: string;
  pagina: number;
  ley_afectada?: string | null;
  situacion_actual?: string | null;
  en_tu_dia_a_dia?: string | null;
}

export interface ProgramaData {
  siglas: string;
  nombre: string;
  fuente_url: string;
  propuestas: PropuestaItem[];
}

export interface VotacionClaveData {
  id: string;
  tema: string;
  categoria: string;
  titulo_llano: string;
  fecha?: string;
  por_grupo?: Record<string, { si: number; no: number; abstencion: number; no_vota: number }> | null;
}

interface Props {
  area: Area;
  nombreArea: string;
  programas: ProgramaData[];
  partidos: readonly PartidoFicha[];
  votaciones: VotacionClaveData[];
  resumenes?: Record<string, { resumen: string; a_quien_afecta: string }>;
  verificaciones: VerificacionEntrevistaItem[];
  coherenciaCasos: CasoCoherenciaItem[];
}

type TabType = 'matriz' | 'factchecking' | 'propuestas';

function normalizarClavePartido(s: string): string {
  const u = s.toUpperCase().trim();
  if (u === 'SUMAR / FA' || u === 'FRENTE AMPLIO' || u === 'SUMAR' || u === 'FA') return 'SUMAR';
  if (u === 'CCA' || u === 'CC') return 'CC';
  if (u === 'EAJ-PNV' || u === 'PNV') return 'EAJ-PNV';
  if (u === 'EH BILDU' || u === 'BILDU') return 'EH BILDU';
  if (u === 'JUNTS' || u === 'JXCAT') return 'JUNTS';
  if (u === 'PODEMOS') return 'PODEMOS';
  return u;
}

function estiloVeredicto(veredicto: string) {
  const v = veredicto.toUpperCase();
  if (v === 'VERDADERO' || v === 'CIERTO' || v.includes('COHERENTE')) {
    return {
      etiqueta: 'VERIFICADO / CIERTO',
      clase: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      borde: 'border-emerald-300 bg-emerald-50/40',
    };
  }
  if (v === 'FALSO' || v.includes('CONTRADICCIÓN')) {
    return {
      etiqueta: 'FALSO / CONTRADICCIÓN',
      clase: 'bg-rose-100 text-rose-900 border-rose-300',
      borde: 'border-rose-300 bg-rose-50/40',
    };
  }
  if (v === 'ENGAÑOSO') {
    return {
      etiqueta: 'ENGAÑOSO / INCOMPLETO',
      clase: 'bg-orange-100 text-orange-950 border-orange-300',
      borde: 'border-orange-300 bg-orange-50/40',
    };
  }
  if (v === 'CON MATICES' || v.includes('MATICES') || v.includes('MATIZADO')) {
    return {
      etiqueta: 'CON MATICES',
      clase: 'bg-amber-100 text-amber-950 border-amber-300',
      borde: 'border-amber-300 bg-amber-50/40',
    };
  }
  return {
    etiqueta: 'SIN EVALUAR',
    clase: 'bg-neutral-100 text-neutral-700 border-neutral-300',
    borde: 'border-neutral-200 bg-neutral-50',
  };
}


const MEDIDAS_INICIALES = 6;
const CLAVE_SELECCION = 'comparador-partidos';

export default function ComparadorAvanzado({
  area,
  nombreArea,
  programas,
  partidos,
  resumenes = {},
  verificaciones,
  coherenciaCasos,
}: Props) {
  const [tab, setTab] = useState<TabType>('matriz');
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState('');
  const [filtroPartidoBuscador, setFiltroPartidoBuscador] = useState<string>('TODOS');
  const [partidosSeleccionados, setPartidosSeleccionados] = useState<string[]>(['PP', 'PSOE', 'VOX']);
  const [filtroVeredicto, setFiltroVeredicto] = useState<'todos' | 'seleccionados'>('todos');
  const searchInputId = useId();

  // la selección se recuerda al cambiar de tema (y entre visitas); se lee tras montar para no romper la hidratación
  useEffect(() => {
    try {
      const guardados = JSON.parse(localStorage.getItem(CLAVE_SELECCION) ?? 'null');
      const validos = Array.isArray(guardados)
        ? guardados.filter((x): x is string => typeof x === 'string' && partidos.some((p) => p.siglas === x)).slice(0, 4)
        : [];
      if (validos.length) setPartidosSeleccionados(validos);
    } catch {}
  }, [partidos]);
  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_SELECCION, JSON.stringify(partidosSeleccionados));
    } catch {}
  }, [partidosSeleccionados]);

  const togglePartido = (sigla: string) => {
    if (partidosSeleccionados.includes(sigla)) {
      if (partidosSeleccionados.length > 1) {
        setPartidosSeleccionados(partidosSeleccionados.filter((x) => x !== sigla));
      }
    } else if (partidosSeleccionados.length < 4) {
      setPartidosSeleccionados([...partidosSeleccionados, sigla]);
    } else {
      setPartidosSeleccionados([...partidosSeleccionados.slice(1), sigla]);
    }
  };

  const seleccionarSoloUno = (sigla: string) => {
    setPartidosSeleccionados([sigla]);
  };

  const partidosNacionales = useMemo(
    () => partidos.filter((p) => p.ambito !== 'regional'),
    [partidos]
  );
  const partidosRegionales = useMemo(
    () => partidos.filter((p) => p.ambito === 'regional'),
    [partidos]
  );

  const buscarPrograma = (sigla: string): ProgramaData | undefined => {
    const clave = normalizarClavePartido(sigla);
    return programas.find((p) => normalizarClavePartido(p.siglas) === clave);
  };

  const buscarFicha = (sigla: string): PartidoFicha | undefined => {
    const clave = normalizarClavePartido(sigla);
    return partidos.find((p) => normalizarClavePartido(p.siglas) === clave);
  };

  // Propuestas del área para los partidos seleccionados (todas, sin límite de 3)
  const propuestasPorPartido = useMemo(() => {
    return partidosSeleccionados.map((sigla) => {
      const prog = buscarPrograma(sigla);
      const medidas = prog ? prog.propuestas.filter((p) => p.area === area) : [];
      return {
        sigla,
        nombre: prog?.nombre ?? buscarFicha(sigla)?.nombre ?? sigla,
        fuenteUrl: prog?.fuente_url ?? null,
        medidas,
      };
    });
  }, [partidosSeleccionados, programas, area]);

  // Verificaciones auditadas (revisado === true y con veredicto real) vs citas sin evaluar
  const verificacionesAuditadas = useMemo(() => {
    const base = verificaciones.filter((v) => v.revisado === true && v.veredicto !== 'NO COMPROBADO');
    if (filtroVeredicto === 'seleccionados') {
      const claves = new Set(partidosSeleccionados.map(normalizarClavePartido));
      const filtradas = base.filter((v) => claves.has(normalizarClavePartido(v.partido)));
      return filtradas;
    }
    return base;
  }, [verificaciones, filtroVeredicto, partidosSeleccionados]);

  // Agrupadas por partido para una lectura clara por colores
  const verificacionesAgrupadas = useMemo(() => {
    const grupos = new Map<string, VerificacionEntrevistaItem[]>();
    for (const v of verificacionesAuditadas) {
      const lista = grupos.get(v.partido) ?? [];
      lista.push(v);
      grupos.set(v.partido, lista);
    }
    return Array.from(grupos.entries());
  }, [verificacionesAuditadas]);

  const citasSinEvaluar = useMemo(
    () => verificaciones.filter((v) => v.revisado !== true || v.veredicto === 'NO COMPROBADO'),
    [verificaciones]
  );

  // Filtrado de propuestas para el buscador de programas oficiales
  const propuestasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const resultado: { sigla: string; nombre: string; pdf: string; propuesta: PropuestaItem }[] = [];

    for (const prog of programas) {
      if (filtroPartidoBuscador !== 'TODOS' && normalizarClavePartido(prog.siglas) !== normalizarClavePartido(filtroPartidoBuscador)) {
        continue;
      }
      for (const p of prog.propuestas) {
        if (p.area !== area) continue;
        if (
          !q ||
          p.titular.toLowerCase().includes(q) ||
          p.cita.toLowerCase().includes(q) ||
          prog.siglas.toLowerCase().includes(q)
        ) {
          resultado.push({
            sigla: prog.siglas,
            nombre: prog.nombre,
            pdf: prog.fuente_url,
            propuesta: p,
          });
        }
      }
    }
    return resultado;
  }, [programas, area, busqueda, filtroPartidoBuscador]);

  // móvil: columnas en paralelo (dos a la vista, se desliza para ver la 3.ª y 4.ª); escritorio: rejilla
  const gridColsClass =
    partidosSeleccionados.length === 1
      ? 'md:grid-cols-1'
      : partidosSeleccionados.length === 2
      ? 'md:grid-cols-2'
      : partidosSeleccionados.length === 3
      ? 'md:grid-cols-3'
      : 'md:grid-cols-2 lg:grid-cols-4';
  const anchoColumnaMovil = partidosSeleccionados.length === 1 ? 'w-full' : 'w-[calc(50%-0.25rem)]';

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-2xl border border-[#dfd9cc] bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="font-editorial text-xl font-bold text-neutral-950">Partidos</h2>
          <p className="text-sm text-neutral-600">
            Uno para leer todo su programa, hasta cuatro para comparar.{' '}
            <span className="font-semibold text-neutral-900 tabular-nums">{partidosSeleccionados.length} de 4</span>
          </p>
        </div>
        {([['Nacionales', partidosNacionales], ['Autonómicos', partidosRegionales]] as const).map(([titulo, lista]) => (
          <div key={titulo} className="flex flex-wrap items-center gap-1.5 border-t border-neutral-100 pt-3 first-of-type:border-0">
            <span className="mr-1 w-full text-xs font-semibold text-neutral-600 sm:w-auto">{titulo}</span>
            {lista.map((p) => {
              const activo = partidosSeleccionados.includes(p.siglas);
              return (
                <button
                  key={p.slug}
                  type="button"
                  aria-pressed={activo}
                  title={'territorio' in p && p.territorio ? String(p.territorio) : undefined}
                  onClick={() => togglePartido(p.siglas)}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition-colors ${
                    activo
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-300 bg-white text-neutral-800 hover:border-neutral-500'
                  }`}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colorPartido(p.siglas) }} aria-hidden />
                  {p.siglas}
                </button>
              );
            })}
          </div>
        ))}
        {partidosSeleccionados.length > 1 && (
          <button
            type="button"
            onClick={() => seleccionarSoloUno(partidosSeleccionados[0])}
            className="min-h-9 text-sm font-semibold text-red-900 underline underline-offset-2"
          >
            Ver solo {partidosSeleccionados[0]}
          </button>
        )}
      </section>

      <div role="tablist" aria-label="Vista" className="-mx-4 flex overflow-x-auto border-b border-[#dfd9cc] px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {([
          ['matriz', partidosSeleccionados.length === 1 ? `Programa de ${partidosSeleccionados[0]}` : 'Medidas', propuestasPorPartido.reduce((acc, p) => acc + p.medidas.length, 0)],
          ['factchecking', 'Veredictos', verificacionesAuditadas.length + coherenciaCasos.length],
          ['propuestas', 'Buscar en programas', propuestasFiltradas.length],
        ] as const).map(([id, label, n]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-semibold transition-colors ${
              tab === id ? 'border-red-800 text-neutral-950' : 'border-transparent text-neutral-600 hover:text-neutral-950'
            }`}
          >
            {label}
            <span className="text-xs font-normal text-neutral-500 tabular-nums">{n}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: EJES CLAVE + TODAS LAS PROPUESTAS POR PARTIDO */}
      {tab === 'matriz' && (
        <div className="space-y-6">
          {/* Bloque B: TODAS LAS MEDIDAS EXTRAÍDAS POR PARTIDO (sin límite de 3) */}
          <section className="space-y-4">
            <p className="max-w-3xl text-sm text-neutral-600">
              Cada medida lleva la cita literal del programa y enlaza a su página en el PDF oficial.
            </p>

            {partidosSeleccionados.length > 2 && (
              <p className="text-xs text-neutral-600 md:hidden">Desliza a los lados para ver los {partidosSeleccionados.length} partidos.</p>
            )}
            <div className={`-mx-4 flex snap-x snap-mandatory scroll-px-4 items-start gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:grid md:gap-4 md:overflow-visible md:px-0 ${gridColsClass}`}>
              {propuestasPorPartido.map((col) => {
                const color = colorPartido(col.sigla);
                const ficha = buscarFicha(col.sigla);
                return (
                  <div
                    key={`cat-${col.sigla}`}
                    className={`min-w-0 shrink-0 snap-start overflow-hidden rounded-xl border border-[#dfd9cc] bg-white md:w-auto ${anchoColumnaMovil}`}
                  >
                    <div
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-white md:gap-3 md:px-4 md:py-3"
                      style={{ backgroundColor: color }}
                    >
                      <div>
                        <div className="font-editorial text-lg font-black">{col.sigla}</div>
                        <div className="text-xs text-white/85">
                          {col.medidas.length} medidas<span className="hidden md:inline"> en {nombreArea}</span>
                        </div>
                      </div>
                      {ficha && (
                        <Link
                          href={rutas.partidoArea(ficha.slug, area)}
                          className="hidden min-h-9 items-center rounded-full bg-black/25 px-3 text-sm font-semibold transition-colors hover:bg-black/40 md:inline-flex"
                        >
                          Ficha completa
                        </Link>
                      )}
                    </div>

                    {resumenes[col.sigla] && (
                      <details className="group border-b border-[#e4dfd3] bg-[#faf7f2] text-sm text-neutral-800 md:hidden">
                        <summary className="flex min-h-11 cursor-pointer list-none items-center px-3 font-semibold text-neutral-950 [&::-webkit-details-marker]:hidden">
                          Resumen <span aria-hidden className="ml-auto group-open:rotate-180">▾</span>
                        </summary>
                        <p className="px-3 pb-3">{resumenes[col.sigla].resumen}</p>
                        <p className="px-3 pb-3 text-xs text-neutral-600">Resumen de elecciones.online, no es una cita del programa.</p>
                      </details>
                    )}
                    {resumenes[col.sigla] && (
                      <div className="hidden border-b border-[#e4dfd3] bg-[#faf7f2] p-4 text-sm text-neutral-800 md:block">
                        <p>{resumenes[col.sigla].resumen}</p>
                        <p className="mt-2"><strong className="font-semibold text-neutral-950">A quién afecta:</strong> {resumenes[col.sigla].a_quien_afecta}</p>
                        <p className="mt-2 text-xs text-neutral-600">Resumen de elecciones.online a partir de las medidas de abajo. No es una cita del programa.</p>
                      </div>
                    )}
                    {col.medidas.length === 0 ? (
                      <div className="p-5 text-xs text-neutral-600 space-y-2">
                        <p className="font-semibold text-neutral-800">
                          Programa de 2026 sin PDF oficial publicado/extraído todavía en el portal.
                        </p>
                        <p>
                          Puedes consultar lo que ha votado su grupo en el Congreso o sus entrevistas.
                        </p>
                      </div>
                    ) : (
                      <>
                      <ul className="divide-y divide-neutral-200">
                        {(abiertos.has(col.sigla) ? col.medidas : col.medidas.slice(0, MEDIDAS_INICIALES)).map((m, i) => (
                          <li key={`${col.sigla}-m-${i}`} className="space-y-1.5 px-3 py-2.5 md:px-4 md:py-3">
                            <h4 className="break-words text-sm font-semibold leading-snug text-neutral-950">{m.titular}</h4>
                            <details className="md:hidden">
                              <summary className="inline-flex min-h-8 cursor-pointer items-center text-xs font-semibold text-red-900 underline underline-offset-2">
                                Cita · pág. {m.pagina}
                              </summary>
                              <blockquote className="mt-1 break-words text-xs italic leading-relaxed text-neutral-600">&ldquo;{m.cita}&rdquo;</blockquote>
                              {col.fuenteUrl && (
                                <a href={`${col.fuenteUrl}#page=${m.pagina}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center text-xs font-semibold text-red-900 underline">
                                  Abrir el PDF
                                </a>
                              )}
                            </details>
                            <blockquote className="hidden text-sm italic leading-relaxed text-neutral-600 md:block">&ldquo;{m.cita}&rdquo;</blockquote>
                            {!col.fuenteUrl ? null : (
                              <a
                                href={`${col.fuenteUrl}#page=${m.pagina}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden min-h-8 items-center text-sm font-semibold text-red-900 underline underline-offset-2 md:inline-flex"
                              >
                                Página {m.pagina} del programa
                              </a>
                            )}
                            {col.fuenteUrl ? null : <p className="hidden text-sm text-neutral-600 md:block">Página {m.pagina}</p>}
                          </li>
                        ))}
                      </ul>
                      {col.medidas.length > MEDIDAS_INICIALES && (
                        <button
                          type="button"
                          aria-expanded={abiertos.has(col.sigla)}
                          onClick={() =>
                            setAbiertos((prev) => {
                              const n = new Set(prev);
                              if (n.has(col.sigla)) n.delete(col.sigla);
                              else n.add(col.sigla);
                              return n;
                            })
                          }
                          className="min-h-12 w-full border-t border-neutral-200 text-sm font-semibold text-neutral-950 hover:bg-[#faf7f2]"
                        >
                          {abiertos.has(col.sigla) ? 'Ver menos' : `Ver las ${col.medidas.length} medidas de ${col.sigla}`}
                        </button>
                      )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: DICHO VS. HECHO (ORGANIZADO POR PARTIDO Y COLORES) */}
      {tab === 'factchecking' && (
        <div className="space-y-6">
          {/* Bloque 1: Lo votado en el Congreso vs. Promesas */}
          {coherenciaCasos.length > 0 && (
          <section className="rounded-2xl border border-[#dfd9cc] bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200 pb-3">
              <div>
                <h3 className="font-editorial text-xl font-bold text-neutral-950">
                  Votos reales en el Congreso frente a promesas de campaña
                </h3>
                <p className="text-xs text-neutral-600">
                  Casos auditados contra las actas nominales oficiales de la XV Legislatura.
                </p>
              </div>
              <Link href={rutas.votacionesCongresoHub()} className="text-xs font-bold text-red-900 underline">
                Ir al explorador de 2.175 votaciones
              </Link>
            </div>

            {coherenciaCasos.length === 0 ? (
              <p className="text-xs text-neutral-600">
                No hay casos de coherencia parlamentaria marcados como revisados en este momento.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {coherenciaCasos.map((caso) => (
                  <div
                    key={caso.id_votacion}
                    className="rounded-xl border border-neutral-200 bg-[#faf7f2]/60 p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded bg-neutral-900 px-2 py-0.5 text-xs font-mono font-bold text-white">
                        Votación #{caso.id_votacion}
                      </span>
                      <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-950">
                        {caso.etiqueta}
                      </span>
                    </div>
                    <h4 className="font-editorial text-base font-bold text-neutral-950 leading-snug">
                      {caso.titulo_llano}
                    </h4>
                    <p className="text-xs text-neutral-700 leading-relaxed">{caso.resumen}</p>
                    <div className="space-y-2 pt-2 border-t border-neutral-200">
                      {caso.partidos.map((p) => (
                        <div
                          key={`${caso.id_votacion}-${p.siglas}`}
                          className="rounded-lg bg-white border border-neutral-200 p-2.5 text-xs space-y-1"
                          style={{ borderLeftWidth: 4, borderLeftColor: colorPartido(p.siglas) }}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="font-bold text-neutral-950">{p.siglas}</span>
                            <span className="font-mono text-xs font-bold text-neutral-800">
                              Voto: {p.voto_emitido}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600">
                            <strong>Promesa / posición previa:</strong> {p.promesa_previa}
                          </p>
                          <p className="text-xs font-semibold text-neutral-800">
                            {p.coherencia} — <span className="font-normal text-neutral-600">{p.motivo_oficial}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="pt-1">
                      <Link
                        href={rutas.votacionCongreso(caso.id_votacion, caso.titulo_llano)}
                        className="text-xs font-bold text-red-900 hover:underline"
                      >
                        Consultar acta completa de la votación #{caso.id_votacion} →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          )}

          {/* Bloque 2: Datos comprobados en entrevistas (organizado por partido y colores) */}
          <section className="rounded-2xl border border-[#dfd9cc] bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
              <div>
                <h3 className="font-editorial text-xl font-bold text-neutral-950">
                  Declaraciones comprobadas en entrevistas
                </h3>
                <p className="text-xs text-neutral-600">
                  Solo mostramos aquí afirmaciones con cifra o hecho contrastado frente a fuente oficial (INE, Banco de España, IGAE, Congreso).
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFiltroVeredicto('todos')}
                  className={`inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-semibold ${
                    filtroVeredicto === 'todos'
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-300'
                  }`}
                >
                  Todos los partidos
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroVeredicto('seleccionados')}
                  className={`inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-semibold ${
                    filtroVeredicto === 'seleccionados'
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-300'
                  }`}
                >
                  Solo seleccionados ({partidosSeleccionados.join(', ')})
                </button>
              </div>
            </div>

            {verificacionesAgrupadas.length === 0 ? (
              <p className="text-xs text-neutral-600">
                No hay afirmaciones auditadas para los partidos filtrados. Prueba «Todos los partidos» o abre las citas registradas debajo.
              </p>
            ) : (
              <div className="space-y-5">
                {verificacionesAgrupadas.map(([partido, lista]) => {
                  const color = colorPartido(partido);
                  return (
                    <div
                      key={`fc-group-${partido}`}
                      className="rounded-xl border border-neutral-200 overflow-hidden"
                    >
                      <div
                        className="px-4 py-2.5 text-white flex items-center justify-between"
                        style={{ backgroundColor: color }}
                      >
                        <span className="font-editorial text-base font-bold">{partido}</span>
                        <span className="text-xs font-mono bg-black/25 rounded-full px-2.5 py-0.5">
                          {lista.length} {lista.length === 1 ? 'verificación' : 'verificaciones'}
                        </span>
                      </div>
                      <div className="grid gap-4 p-4 md:grid-cols-2 bg-white">
                        {lista.map((v) => {
                          const est = estiloVeredicto(v.veredicto);
                          return (
                            <div key={v.id} className={`rounded-xl border p-4 space-y-2.5 ${est.borde}`}>
                              <div className="flex flex-wrap items-center justify-between gap-1">
                                <span className={`rounded border px-2 py-0.5 text-xs font-extrabold ${est.clase}`}>
                                  {est.etiqueta}
                                </span>
                                <span className="text-xs font-bold text-neutral-700">
                                  {v.persona} · {v.medio} ({v.contexto_minuto})
                                </span>
                              </div>
                              <p className="font-bold text-sm text-neutral-950 leading-snug">
                                {v.afirmacion}
                              </p>
                              <blockquote className="italic text-xs text-neutral-700 bg-white/80 rounded p-2 border border-neutral-200/70">
                                &ldquo;{v.cita_literal}&rdquo;
                              </blockquote>
                              <div className="text-xs text-neutral-800 space-y-1">
                                <div>
                                  <strong>Dato oficial: </strong>
                                  {v.dato_oficial}
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600 pt-1">
                                  <a
                                    href={v.fuente_oficial_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-red-900 underline"
                                  >
                                    Fuente: {v.fuente_oficial_nombre}
                                  </a>
                                  <Link
                                    href={`/espana/generales/2026/entrevistas/${v.entrevista_id}`}
                                    className="font-semibold text-neutral-900 underline"
                                  >
                                    Ver vídeo ({v.contexto_minuto})
                                  </Link>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Citas pendientes de evaluación (colapsadas para no ensuciar) */}
            {citasSinEvaluar.length > 0 && (
              <details className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <summary className="cursor-pointer text-xs font-bold text-neutral-700 select-none">
                  Ver {citasSinEvaluar.length} citas literales registradas en entrevistas pendientes de verificación oficial
                </summary>
                <div className="mt-3 grid gap-2 md:grid-cols-2 max-h-96 overflow-y-auto">
                  {citasSinEvaluar.slice(0, 40).map((c) => (
                    <div key={c.id} className="rounded-lg border border-neutral-200 bg-white p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-neutral-800">
                        <span>{c.persona} ({c.partido})</span>
                        <span className="font-mono text-xs text-neutral-500">{c.contexto_minuto}</span>
                      </div>
                      <p className="italic text-neutral-600">&ldquo;{c.cita_literal}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </section>
        </div>
      )}

      {/* TAB 3: BUSCADOR DE PROPUESTAS CON FILTRO DE PARTIDO Y ENLACE AL PDF */}
      {tab === 'propuestas' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-300 bg-white p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor={searchInputId} className="font-editorial text-lg font-bold text-neutral-950">
                Buscar texto exacto en programas oficiales ({nombreArea}):
              </label>
              <span className="text-xs text-neutral-500 font-mono">
                {propuestasFiltradas.length} citas encontradas
              </span>
            </div>
            <p className="text-xs text-neutral-600">
              Busca cualquier palabra clave (ej. alquiler, IRPF, hipoteca, desalojo) entre todas las medidas extraídas de los PDF oficiales. Cada tarjeta enlaza a la página exacta del programa.
            </p>
            <input
              id={searchInputId}
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar palabra clave en titulares o citas literales..."
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm focus:border-red-900 focus:outline-hidden"
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setFiltroPartidoBuscador('TODOS')}
                className={`inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-semibold ${
                  filtroPartidoBuscador === 'TODOS'
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-300'
                }`}
              >
                Todos ({programas.reduce((a, p) => a + p.propuestas.filter((x) => x.area === area).length, 0)})
              </button>
              {programas.map((prog) => {
                const count = prog.propuestas.filter((x) => x.area === area).length;
                if (count === 0) return null;
                const activo = filtroPartidoBuscador === prog.siglas;
                return (
                  <button
                    key={`filt-${prog.siglas}`}
                    type="button"
                    onClick={() => setFiltroPartidoBuscador(prog.siglas)}
                    className={`inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-semibold ${
                      activo
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-700 border-neutral-300'
                    }`}
                  >
                    {prog.siglas} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {propuestasFiltradas.map((item, idx) => (
              <div
                key={`${item.sigla}-${idx}`}
                className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                    style={{ backgroundColor: colorPartido(item.sigla) }}
                  >
                    {item.sigla}
                  </span>
                  <a
                    href={`${item.pdf}#page=${item.propuesta.pagina}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono font-bold text-red-900 hover:underline"
                  >
                    PDF oficial · Pág. {item.propuesta.pagina}
                  </a>
                </div>
                <h4 className="font-bold text-sm text-neutral-900 leading-snug">
                  {item.propuesta.titular}
                </h4>
                <blockquote className="border-l-2 border-neutral-300 pl-2.5 text-xs text-neutral-600 italic">
                  &ldquo;{item.propuesta.cita}&rdquo;
                </blockquote>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
