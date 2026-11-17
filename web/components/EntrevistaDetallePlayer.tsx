'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { AnalisisEntrevistaItem, VerificacionEntrevistaItem } from '@/lib/datos';
import { colorPartido } from '@/lib/colores';

interface EntrevistaInfo {
  id?: string;
  slug?: string;
  partido: string;
  persona: string;
  titulo: string;
  medio: string;
  formato: 'youtube' | 'tv' | 'radio' | 'prensa';
  fecha: string | null;
  fuente_url: string;
}

interface Props {
  entrevista: EntrevistaInfo;
  declaraciones: VerificacionEntrevistaItem[];
  analisis?: AnalisisEntrevistaItem | null;
}

function parseMinutoASegundos(minutoStr: string): number {
  if (!minutoStr) return 0;
  const partes = minutoStr.trim().replace('[', '').replace(']', '').split(':');
  if (partes.length === 2) {
    const min = parseInt(partes[0], 10) || 0;
    const sec = parseInt(partes[1], 10) || 0;
    return min * 60 + sec;
  }
  if (partes.length === 3) {
    const horas = parseInt(partes[0], 10) || 0;
    const min = parseInt(partes[1], 10) || 0;
    const sec = parseInt(partes[2], 10) || 0;
    return horas * 3600 + min * 60 + sec;
  }
  return 0;
}

function extraerYoutubeId(url: string): string | null {
  const m = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(url);
  return m ? m[1] : null;
}

export default function EntrevistaDetallePlayer({ entrevista, declaraciones, analisis }: Props) {
  const ytId = extraerYoutubeId(entrevista.fuente_url);
  const [tiempoActual, setTiempoActual] = useState<number>(0);
  const [minutoActivo, setMinutoActivo] = useState<string | null>(null);
  const [autoplay, setAutoplay] = useState<boolean>(false);
  const [pestaña, setPestaña] = useState<'minutaje' | 'analisis' | 'verificados'>('minutaje');
  const [temaFiltro, setTemaFiltro] = useState<string>('todos');
  const [soloVerificados, setSoloVerificados] = useState<boolean>(false);
  const [busqueda, setBusqueda] = useState<string>('');
  const playerRef = useRef<HTMLDivElement | null>(null);

  const verificadas = useMemo(
    () => declaraciones.filter((d) => d.revisado === true && d.veredicto !== 'NO COMPROBADO'),
    [declaraciones]
  );

  const totalVerificados = verificadas.length;

  // Temas únicos con recuento
  const temasConRecuento = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of declaraciones) {
      const t = d.tema || 'general';
      map.set(t, (map.get(t) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [declaraciones]);

  // Filtrado y ordenación cronológica estricta de declaraciones
  const declaracionesFiltradas = useMemo(() => {
    return declaraciones
      .filter((d) => {
        if (soloVerificados && (d.revisado !== true || d.veredicto === 'NO COMPROBADO')) return false;
        if (temaFiltro !== 'todos' && d.tema !== temaFiltro) return false;
        if (busqueda.trim()) {
          const q = busqueda.toLowerCase();
          const enCita = (d.cita_literal || '').toLowerCase().includes(q);
          const enAfirmacion = (d.afirmacion || '').toLowerCase().includes(q);
          const enExplicacion = (d.explicacion || '').toLowerCase().includes(q);
          const enDato = (d.dato_oficial || '').toLowerCase().includes(q);
          if (!enCita && !enAfirmacion && !enExplicacion && !enDato) return false;
        }
        return true;
      })
      .sort((a, b) => parseMinutoASegundos(a.contexto_minuto || '') - parseMinutoASegundos(b.contexto_minuto || ''));
  }, [declaraciones, temaFiltro, soloVerificados, busqueda]);

  const saltarAMinuto = (minutoStr: string) => {
    const segs = parseMinutoASegundos(minutoStr);
    setTiempoActual(segs);
    setMinutoActivo(minutoStr);
    setAutoplay(true);

    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const badgeVeredicto = (v?: string) => {
    switch (v) {
      case 'VERDADERO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'FALSO':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'CON MATICES':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'ENGAÑOSO':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
    }
  };

  const color = colorPartido(entrevista.partido);

  return (
    <div className="space-y-8">
      {/* Barra de navegación superior */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 text-sm">
        <Link
          href="/espana/generales/2026/entrevistas"
          className="inline-flex min-h-11 items-center gap-1.5 font-bold text-neutral-700 hover:text-red-900 transition"
        >
          <span>← Volver a la videoteca completa</span>
        </Link>

        <a
          href={entrevista.fuente_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1 break-words font-semibold text-neutral-600 hover:text-neutral-900 underline"
        >
          <span>Ver original en {entrevista.medio}</span>
          <span className="font-mono text-xs">[↗]</span>
        </a>
      </div>

      {/* Cabecera de la Entrevista */}
      <header className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white shadow-2xs"
            style={{ backgroundColor: color }}
          >
            {entrevista.partido}
          </span>
          <span className="text-xs font-semibold text-neutral-500">
            {entrevista.fecha ?? '2026'} · {entrevista.medio}
          </span>
          {analisis?.duracion_aprox && (
            <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-xs font-mono font-semibold text-neutral-700">
              Duración: {analisis.duracion_aprox}
            </span>
          )}
          <span className="text-xs font-semibold text-neutral-500">
            {declaraciones.length === 0 ? 'Sin declaraciones publicadas' : `${declaraciones.length} intervenciones con minutaje`}
          </span>
          {analisis && (
            <span className="rounded-full bg-red-100 border border-red-200 text-red-900 px-2.5 py-0.5 text-xs font-bold">
              Análisis editorial disponible
            </span>
          )}
        </div>

        <h1 className="break-words font-editorial text-2xl sm:text-4xl font-bold text-neutral-950 leading-tight">
          {entrevista.titulo}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
          <span>
            Candidato/a: <strong className="text-neutral-900">{entrevista.persona}</strong>
          </span>
          <span>·</span>
          <span>
            Formato: <strong className="text-neutral-900 capitalize">{entrevista.formato}</strong>
          </span>
        </div>
      </header>

      {/* Grid Principal: Reproductor a la izquierda y Contenido a la derecha */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Columna Izquierda: Reproductor de Vídeo Fijo / Stick */}
        <div ref={playerRef} className="lg:col-span-7 space-y-4 lg:sticky lg:top-4">
          <div className="overflow-hidden rounded-2xl border-2 border-neutral-900 bg-neutral-950 shadow-xl">
            {ytId ? (
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  key={`${ytId}-${tiempoActual}`}
                  src={`https://www.youtube-nocookie.com/embed/${ytId}?start=${tiempoActual}&autoplay=${autoplay ? 1 : 0}&rel=0`}
                  title={entrevista.titulo}
                  className="h-full w-full"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video w-full flex flex-col items-center justify-center p-6 text-center text-white bg-gradient-to-br from-neutral-900 to-neutral-800">
                <p className="font-bold text-base">{entrevista.titulo}</p>
                <p className="text-xs text-neutral-400 mt-1">{entrevista.medio}</p>
                <a
                  href={entrevista.fuente_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500 transition shadow"
                >
                  Abrir audio / fuente original [↗]
                </a>
              </div>
            )}

            {/* Barra de control rápido de minutaje */}
            <div className="p-3 bg-neutral-900 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-300 border-t border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-amber-400 font-bold">
                  {minutoActivo ? `Minuto seleccionado: [${minutoActivo}]` : 'Listo para reproducir'}
                </span>
              </div>

              {ytId && (
                <a
                  href={`https://www.youtube.com/watch?v=${ytId}&t=${tiempoActual}s`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-xs font-semibold text-neutral-400 hover:text-white underline"
                >
                  Abrir en YouTube en este segundo ↗
                </a>
              )}
            </div>
          </div>

          {/* Tarjeta de contexto y síntesis ejecutiva */}
          {analisis ? (
            <div className="rounded-2xl border border-[#dfd9cc] bg-white p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#ece7dc] pb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-red-900">
                  Resumen de la entrevista
                </span>
                <button
                  type="button"
                  onClick={() => setPestaña('analisis')}
                  className="text-xs font-bold text-neutral-900 hover:text-red-900 underline"
                >
                  Leer análisis temático completo →
                </button>
              </div>
              <p className="text-sm leading-relaxed text-neutral-800">
                {analisis.resumen_ejecutivo}
              </p>
              <div className="pt-2 border-t border-[#f0ede6] flex flex-wrap gap-2">
                <span className="text-xs font-bold text-neutral-500">Temas clave:</span>
                {analisis.ejes_tematicos.map((eje) => (
                  <span
                    key={eje.tema}
                    className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700"
                  >
                    {eje.titular}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-t border-[#dfd9cc] pt-3 text-sm text-neutral-700 space-y-1">
              <p className="font-bold text-neutral-900">
                ¿Cómo funciona el minutaje interactivo?
              </p>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Haz clic en cualquiera de los botones de minuto (ej.{' '}
                <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-neutral-300">[20:38]</strong>
                ) en las declaraciones de la derecha para saltar automáticamente el reproductor de vídeo al momento
                exacto en que {entrevista.persona} pronuncia cada frase.
              </p>
            </div>
          )}
        </div>

        {/* Columna Derecha: Selector de Pestañas y Contenido */}
        <div className="lg:col-span-5 space-y-4">
          {/* Navegación por pestañas: Minutaje / Análisis / Verificados */}
          <div className="flex rounded-xl border border-neutral-300 bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => setPestaña('minutaje')}
              aria-pressed={pestaña === 'minutaje'}
              className={`flex-1 min-h-10 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer text-center ${
                pestaña === 'minutaje'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              Citas y minutaje ({declaraciones.length})
            </button>
            <button
              type="button"
              onClick={() => setPestaña('analisis')}
              aria-pressed={pestaña === 'analisis'}
              className={`flex-1 min-h-10 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer text-center ${
                pestaña === 'analisis'
                  ? 'bg-white text-red-950 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              Análisis y claves {analisis ? '•' : ''}
            </button>
            {totalVerificados > 0 && (
              <button
                type="button"
                onClick={() => setPestaña('verificados')}
                aria-pressed={pestaña === 'verificados'}
                className={`flex-1 min-h-10 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer text-center ${
                  pestaña === 'verificados'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                Datos oficiales ({totalVerificados})
              </button>
            )}
          </div>

          {/* ======================================================== */}
          {/* PESTAÑA 1: CITAS Y MINUTAJE CRONOLÓGICO                  */}
          {/* ======================================================== */}
          {pestaña === 'minutaje' && (
            <div className="space-y-4">
              {/* Barra de Búsqueda y Filtros de Tema */}
              <div className="border-t border-[#dfd9cc] pt-4 space-y-3">
                <div>
                  <label htmlFor="buscar-cita" className="block text-sm font-semibold text-neutral-600 mb-1.5">
                    Buscar en las palabras de {entrevista.persona}:
                  </label>
                  <div className="relative">
                    <input
                      id="buscar-cita"
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Ej: alquiler, impuestos, OTAN, sanidad..."
                      className="w-full min-h-11 rounded-xl border border-neutral-300 bg-neutral-50 px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                    {busqueda && (
                      <button
                        type="button"
                        onClick={() => setBusqueda('')}
                        aria-label="Borrar búsqueda"
                        className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center text-base text-neutral-500 hover:text-neutral-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Píldoras de temas */}
                <div>
                  <span className="block text-sm font-semibold text-neutral-500 mb-1.5">
                    Filtrar por asunto:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTemaFiltro('todos')}
                      aria-pressed={temaFiltro === 'todos'}
                      className={`min-h-9 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                        temaFiltro === 'todos'
                          ? 'bg-neutral-900 text-white'
                          : 'border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      Todos ({declaraciones.length})
                    </button>
                    {temasConRecuento.map(([tema, count]) => (
                      <button
                        key={tema}
                        type="button"
                        onClick={() => setTemaFiltro(tema)}
                        aria-pressed={temaFiltro === tema}
                        className={`min-h-9 rounded-lg px-2.5 py-1 text-xs font-bold capitalize transition cursor-pointer ${
                          temaFiltro === tema
                            ? 'bg-red-900 text-white'
                            : 'border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {tema.replace('_', ' ')} ({count})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-neutral-500 pt-2 border-t border-[#ece7dc] flex flex-wrap items-center justify-between gap-2">
                  <span>Mostrando {declaracionesFiltradas.length} de {declaraciones.length} citas</span>
                  <div className="flex items-center gap-2">
                    {totalVerificados > 0 && (
                      <button
                        type="button"
                        onClick={() => setSoloVerificados((v) => !v)}
                        aria-pressed={soloVerificados}
                        className={`min-h-9 rounded-md px-2.5 py-1 font-bold transition cursor-pointer ${
                          soloVerificados
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {soloVerificados ? `Verificadas (${totalVerificados})` : `Solo con dato oficial (${totalVerificados})`}
                      </button>
                    )}
                    {(temaFiltro !== 'todos' || soloVerificados) && (
                      <button
                        onClick={() => {
                          setTemaFiltro('todos');
                          setSoloVerificados(false);
                        }}
                        className="min-h-9 text-red-800 font-semibold hover:underline"
                      >
                        Restablecer
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Listado de Declaraciones con Minutaje */}
              <div className="divide-y divide-[#ece7dc] border-y border-[#ece7dc] max-h-[85vh] overflow-y-auto">
                {declaracionesFiltradas.length === 0 ? (
                  <div className="p-6 text-sm leading-relaxed text-neutral-600">
                    {declaraciones.length === 0
                      ? 'Este vídeo no tiene declaraciones publicadas. Solo se incluyen compromisos, cifras y posiciones sobre medidas que el candidato dice en primera persona, citadas literalmente en su minuto y cuando la transcripción deja claro quién habla. Puedes verlo completo en el reproductor.'
                      : <>No se encontraron declaraciones que coincidan con «{busqueda}».</>}
                  </div>
                ) : (
                  declaracionesFiltradas.map((dec, idx) => {
                    const isActive = minutoActivo === dec.contexto_minuto;
                    return (
                      <article
                        key={dec.id || `${dec.contexto_minuto}-${idx}`}
                        className={`min-w-0 px-2 py-4 transition-colors duration-200 ${
                          isActive ? 'border-l-4 border-red-600 bg-red-50/40' : ''
                        }`}
                      >
                        {/* Cabecera de la declaración: Minuto + Tema + Veredicto */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => saltarAMinuto(dec.contexto_minuto)}
                              className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-neutral-900 hover:bg-red-700 text-white font-mono font-bold text-sm px-3 py-1 transition cursor-pointer"
                              title="Hacer clic para saltar al segundo exacto en el vídeo"
                            >
                              <span>▶</span>
                              <span>[{dec.contexto_minuto}]</span>
                            </button>
                            <span className="text-xs font-semibold text-neutral-500 capitalize">
                              {dec.tema?.replace('_', ' ') || 'General'}
                            </span>
                          </div>

                          {dec.revisado === true && dec.veredicto && dec.veredicto !== 'NO COMPROBADO' ? (
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeVeredicto(
                                dec.veredicto
                              )}`}
                            >
                              Revisado · {dec.veredicto}
                            </span>
                          ) : dec.tipo === 'compromiso' ? (
                            <span className="rounded-full border border-sky-200 bg-sky-50 text-sky-800 px-2.5 py-0.5 text-xs font-bold">
                              Compromiso electoral
                            </span>
                          ) : dec.tipo === 'posicion' ? (
                            <span className="rounded-full border border-neutral-300 bg-neutral-100 text-neutral-700 px-2.5 py-0.5 text-xs font-semibold">
                              Posicionamiento
                            </span>
                          ) : (
                            <span className="rounded-full border border-neutral-300 bg-neutral-100 text-neutral-600 px-2.5 py-0.5 text-xs font-semibold">
                              Cita literal
                            </span>
                          )}
                        </div>

                        {/* Cita literal */}
                        <blockquote className="break-words font-editorial text-base font-semibold text-neutral-950 leading-snug">
                          «{dec.cita_literal}»
                        </blockquote>

                        {/* Cruce con Programa Oficial */}
                        {dec.cruce_programa && (
                          <div className="mt-3 text-sm text-neutral-700">
                            <span className="font-bold text-neutral-900 block mb-0.5">
                              Programa oficial de {entrevista.partido}:
                            </span>
                            <p className="text-neutral-600 leading-relaxed text-sm break-words">
                              {dec.cruce_programa}
                            </p>
                          </div>
                        )}

                        {/* Cruce con Votación en el Congreso */}
                        {dec.cruce_votacion && (
                          <div className="mt-2 text-sm text-neutral-700">
                            <span className="font-bold text-neutral-900 block mb-0.5">
                              Votado en el Congreso (XV Legislatura):
                            </span>
                            <p className="text-neutral-600 leading-relaxed text-sm break-words">
                              {dec.cruce_votacion}
                            </p>
                          </div>
                        )}

                        {/* Contraste con Datos Oficiales */}
                        {dec.revisado === true && dec.dato_oficial && dec.dato_oficial !== 'Pendiente de revisión.' ? (
                          <div className="mt-2.5 bg-neutral-50 p-2.5 text-sm rounded-lg border border-neutral-200">
                            <span className="font-bold text-neutral-900 block mb-0.5">
                              Dato oficial contrastado:
                            </span>
                            <p className="text-neutral-700 leading-relaxed text-sm break-words">
                              {dec.dato_oficial}
                            </p>
                            {dec.fuente_oficial_url && (
                              <a
                                href={dec.fuente_oficial_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-red-900 hover:underline"
                              >
                                <span>Fuente: {dec.fuente_oficial_nombre || 'Organismo oficial'}</span>
                                <span className="font-mono">[↗]</span>
                              </a>
                            )}
                          </div>
                        ) : null}
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PESTAÑA 2: ANÁLISIS EDITORIAL, CLAVES Y CONTRASTES        */}
          {/* ======================================================== */}
          {pestaña === 'analisis' && (
            <div className="space-y-6 pt-2">
              {analisis ? (
                <>
                  {/* Contexto Político */}
                  <div className="rounded-xl border border-[#dfd9cc] bg-white p-5 space-y-2.5 shadow-2xs">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-red-900">
                      Contexto electoral de la entrevista
                    </span>
                    <h3 className="font-editorial text-lg font-bold text-neutral-950">
                      Situación política y estrategia de campaña
                    </h3>
                    <p className="text-sm leading-relaxed text-neutral-700">
                      {analisis.contexto_politico}
                    </p>
                  </div>

                  {/* Desglose de Ejes Temáticos */}
                  <div className="space-y-3">
                    <h3 className="font-editorial text-xl font-bold text-neutral-950">
                      Ejes temáticos analizados
                    </h3>
                    <div className="space-y-3">
                      {analisis.ejes_tematicos.map((eje, i) => (
                        <div
                          key={eje.tema || i}
                          className="rounded-xl border border-[#ece7dc] bg-[#faf9f6] p-4 space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                              {eje.tema.replace('_', ' ')}
                            </span>
                            <div className="flex items-center gap-1">
                              {eje.minutos_clave.map((min) => (
                                <button
                                  key={min}
                                  type="button"
                                  onClick={() => saltarAMinuto(min)}
                                  className="inline-flex items-center gap-1 rounded bg-neutral-900 px-2 py-0.5 font-mono text-xs font-bold text-white hover:bg-red-700 transition"
                                  title="Saltar vídeo a este minuto"
                                >
                                  ▶ [{min}]
                                </button>
                              ))}
                            </div>
                          </div>
                          <h4 className="font-bold text-neutral-950 text-sm">
                            {eje.titular}
                          </h4>
                          <p className="text-xs sm:text-sm leading-relaxed text-neutral-700">
                            {eje.analisis}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Matriz de Contrastes (Vídeo vs Programa vs Votaciones) */}
                  {analisis.contrastes_hechos.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-editorial text-xl font-bold text-neutral-950">
                          Matriz de contrastes y coherencia
                        </h3>
                      </div>
                      <div className="space-y-4">
                        {analisis.contrastes_hechos.map((c, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2.5 shadow-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2">
                              <button
                                type="button"
                                onClick={() => saltarAMinuto(c.minuto)}
                                className="inline-flex items-center gap-1 rounded bg-neutral-900 px-2 py-0.5 font-mono text-xs font-bold text-white hover:bg-red-700"
                              >
                                ▶ [{c.minuto}]
                              </button>
                              <span className="rounded bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-xs font-semibold text-neutral-800">
                                {c.evaluacion}
                              </span>
                            </div>

                            <div>
                              <span className="text-xs font-bold text-neutral-500 block mb-0.5">
                                Declaración en el vídeo:
                              </span>
                              <p className="text-sm font-semibold text-neutral-950 italic">
                                «{c.declaracion}»
                              </p>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2 text-xs pt-2 border-t border-neutral-100">
                              <div className="bg-[#fcfbf9] p-2.5 rounded border border-neutral-200">
                                <span className="font-bold text-neutral-900 block mb-1">
                                  En programa oficial 29-N:
                                </span>
                                <p className="text-neutral-700 leading-relaxed">
                                  {c.en_programa}
                                </p>
                              </div>
                              <div className="bg-[#fcfbf9] p-2.5 rounded border border-neutral-200">
                                <span className="font-bold text-neutral-900 block mb-1">
                                  En el Congreso (XV Leg):
                                </span>
                                <p className="text-neutral-700 leading-relaxed">
                                  {c.en_congreso}
                                </p>
                              </div>
                            </div>

                            {c.nota_editorial && (
                              <p className="text-xs text-neutral-600 bg-amber-50/50 p-2 rounded border border-amber-200/60 leading-relaxed">
                                <strong className="text-amber-950">Nota de verificación: </strong>
                                {c.nota_editorial}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conclusiones clave */}
                  <div className="rounded-xl border border-[#dfd9cc] bg-white p-5 space-y-3 shadow-2xs">
                    <h3 className="font-editorial text-lg font-bold text-neutral-950">
                      Conclusiones del balance editorial
                    </h3>
                    <ul className="space-y-1.5 text-sm text-neutral-700">
                      {analisis.conclusiones.map((con, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-900 font-bold">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center space-y-3">
                  <h3 className="font-editorial text-lg font-bold text-neutral-950">
                    Análisis editorial en preparación
                  </h3>
                  <p className="text-sm text-neutral-600 max-w-md mx-auto">
                    El análisis temático estructurado de este vídeo está en proceso de redacción y auditoría. Puedes
                    consultar todas las declaraciones literales con salto al minuto exacto en la pestaña de minutaje.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPestaña('minutaje')}
                    className="inline-flex min-h-11 items-center rounded-lg bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800"
                  >
                    Ver citas y minutaje →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* PESTAÑA 3: FACT-CHECKING CON DATOS OFICIALES              */}
          {/* ======================================================== */}
          {pestaña === 'verificados' && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <h3 className="font-editorial text-xl font-bold text-neutral-950">
                  Declaraciones comprobadas con organismos oficiales
                </h3>
                <p className="text-xs text-neutral-600">
                  Cifras contrastadas de forma independiente contra series públicas del INE, Banco de España,
                  Seguridad Social o Diario de Sesiones del Congreso.
                </p>
              </div>

              <div className="space-y-3">
                {verificadas.map((dec) => (
                  <article
                    key={dec.id}
                    className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2.5 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => saltarAMinuto(dec.contexto_minuto)}
                        className="inline-flex items-center gap-1 rounded bg-neutral-900 px-2 py-0.5 font-mono text-xs font-bold text-white hover:bg-red-700"
                      >
                        ▶ [{dec.contexto_minuto}]
                      </button>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeVeredicto(dec.veredicto)}`}>
                        {dec.veredicto}
                      </span>
                    </div>

                    <blockquote className="text-sm font-editorial font-bold text-neutral-950 leading-snug">
                      «{dec.cita_literal}»
                    </blockquote>

                    <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs sm:text-sm space-y-1">
                      <span className="font-bold text-neutral-900 block">
                        Dato oficial contrastado:
                      </span>
                      <p className="text-neutral-700 leading-relaxed">
                        {dec.dato_oficial}
                      </p>
                      {dec.fuente_oficial_url && (
                        <div className="pt-1">
                          <a
                            href={dec.fuente_oficial_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-9 items-center gap-1 text-xs font-bold text-red-900 hover:underline"
                          >
                            <span>Fuente oficial: {dec.fuente_oficial_nombre || 'Organismo oficial'}</span>
                            <span className="font-mono">[↗]</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}