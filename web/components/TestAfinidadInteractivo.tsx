'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AfinidadData } from '@/lib/datos';
import CompartirViralModal from './CompartirViralModal';

type Camino = 'seleccion' | 'partidos' | 'ideologia';

const ESCALA = [
  { val: -2, label: 'Muy en desacuerdo' },
  { val: -1, label: 'En desacuerdo' },
  { val: 0, label: 'Sin opinión' },
  { val: 1, label: 'De acuerdo' },
  { val: 2, label: 'Muy de acuerdo' },
];

const FILTROS_TERRITORIO = [
  { id: 'todos', label: 'Todos los partidos' },
  { id: 'estatal', label: 'Solo ámbito estatal' },
  { id: 'cat', label: 'Cataluña' },
  { id: 'eus', label: 'País Vasco / Navarra' },
] as const;

const PROVINCIAS_FILTRO: Record<string, string[]> = {
  cat: ['08', '17', '25', '43'],
  eus: ['01', '20', '48', '31'],
};

const COLORES_FALLBACK: Record<string, string> = {
  PP: '#0056a8',
  PSOE: '#e30613',
  VOX: '#5cb811',
  Sumar: '#e51c55',
  ERC: '#f2a900',
  Junts: '#00a7a0',
  'EH Bildu': '#6aa84f',
  'EAJ-PNV': '#008000',
};

function etiquetaIdeologica(x: number, y: number): { titulo: string; resumen: string } {
  if (Math.abs(x) < 0.35 && Math.abs(y) < 0.35) {
    return {
      titulo: 'Centro moderado',
      resumen: 'Equilibrio entre iniciativa privada y red pública, sin posiciones extremas en lo territorial.',
    };
  }
  if (x <= -0.35 && y <= -0.35) {
    return {
      titulo: x < -1.1 ? 'Izquierda progresista' : 'Centro-izquierda progresista',
      resumen: 'Priorizas la intervención pública en vivienda, fiscalidad progresiva y ampliación de derechos civiles.',
    };
  }
  if (x >= 0.35 && y <= -0.35) {
    return {
      titulo: 'Liberal / Autonomista de mercado',
      resumen: 'Combinas rebaja de impuestos y menor regulación económica con defensa del autogobierno y libertades civiles.',
    };
  }
  if (x >= 0.35 && y >= 0.35) {
    return {
      titulo: x > 1.1 && y > 1.1 ? 'Derecha conservadora' : 'Centro-derecha',
      resumen: 'Apuestas por rebajas fiscales, seguridad jurídica y firmeza penal e institucional.',
    };
  }
  if (x <= -0.35 && y >= 0.35) {
    return {
      titulo: 'Estatismo conservador',
      resumen: 'Defiendes intervención económica y protección social combinadas con posiciones tradicionales en valores y orden.',
    };
  }
  if (x < 0) {
    return {
      titulo: 'Centro-izquierda',
      resumen: 'Inclinación hacia políticas sociales e impositivas progresivas manteniendo moderación institucional.',
    };
  }
  return {
    titulo: 'Centro-derecha',
    resumen: 'Inclinación hacia menor presión fiscal y estímulo de mercado con moderación institucional.',
  };
}

export default function TestAfinidadInteractivo({ data }: { data: AfinidadData }) {
  const [camino, setCamino] = useState<Camino>('seleccion');
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [estrellas, setEstrellas] = useState<Record<string, boolean>>({});
  const [finalizado, setFinalizado] = useState(false);
  const [filtroTerritorio, setFiltroTerritorio] = useState<(typeof FILTROS_TERRITORIO)[number]['id']>('todos');
  const [partidoAbierto, setPartidoAbierto] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [retoCopiado, setRetoCopiado] = useState(false);
  const [retoAmigo, setRetoAmigo] = useState<{ x: number; y: number; tag: string; partido: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const rx = Number(sp.get('reto_x'));
    const ry = Number(sp.get('reto_y'));
    const rtag = sp.get('reto_tag');
    const rp = sp.get('reto_p');
    if (rtag && !Number.isNaN(rx) && !Number.isNaN(ry)) {
      setRetoAmigo({ x: rx, y: ry, tag: rtag, partido: rp || '' });
    }
  }, []);

  const preguntas = data.afirmaciones;
  const actual = preguntas[indice];

  const contestadasValidas = useMemo(
    () => Object.values(respuestas).filter((v) => v !== 0).length,
    [respuestas]
  );

  const todasLasSiglas = useMemo(() => {
    const metaMap = new Map(data.partidos_ideologia.map((p) => [p.siglas, p]));
    const set = new Set<string>();
    for (const af of preguntas) {
      for (const s of Object.keys(af.posiciones)) set.add(s);
    }
    return Array.from(set).map((siglas) => {
      const m = metaMap.get(siglas);
      return {
        siglas,
        nombre: m?.nombre ?? siglas,
        color: m?.color ?? COLORES_FALLBACK[siglas] ?? '#525252',
        ambito: m?.ambito ?? 'estatal',
        provincia: m?.provincia,
      };
    });
  }, [data.partidos_ideologia, preguntas]);

  const ranking = useMemo(() => {
    const minRequeridas = Math.max(4, Math.ceil(contestadasValidas * 0.5));
    const resultados = todasLasSiglas.map((partido) => {
      let sumaDist = 0;
      let sumaMax = 0;
      let comparadas = 0;
      let mayorCoincidencia: string | null = null;
      let mayorChoque: string | null = null;
      let mejorScore = -1;
      let peorScore = -1;

      for (const af of preguntas) {
        const resp = respuestas[af.id];
        const pos = af.posiciones[partido.siglas];
        if (resp === undefined || resp === 0 || !pos) continue;
        const peso = estrellas[af.id] ? data.metodologia.ponderacion_estrella : 1;
        const dist = Math.abs(resp - pos.valor);
        sumaDist += dist * peso;
        sumaMax += 4 * peso;
        comparadas += 1;

        if (dist <= 1 && (4 - dist) * peso > mejorScore) {
          mejorScore = (4 - dist) * peso;
          mayorCoincidencia = af.texto;
        }
        if (dist >= 2 && dist * peso > peorScore) {
          peorScore = dist * peso;
          mayorChoque = af.texto;
        }
      }

      const porcentaje = sumaMax > 0 ? Math.round((1 - sumaDist / sumaMax) * 100) : 0;
      return {
        ...partido,
        porcentaje,
        comparadas,
        mayorCoincidencia,
        mayorChoque,
      };
    });

    return resultados
      .filter((r) => r.comparadas >= minRequeridas)
      .filter((r) => {
        if (filtroTerritorio === 'todos') return true;
        if (filtroTerritorio === 'estatal') return r.ambito === 'estatal';
        if (r.ambito === 'estatal') return true;
        const provs = PROVINCIAS_FILTRO[filtroTerritorio] ?? [];
        if (r.provincia) return r.provincia.some((pr) => provs.includes(pr));
        return false;
      })
      .sort((a, b) => b.porcentaje - a.porcentaje || b.comparadas - a.comparadas);
  }, [todasLasSiglas, preguntas, respuestas, estrellas, data.metodologia.ponderacion_estrella, filtroTerritorio, contestadasValidas]);

  const coordsUsuario = useMemo(() => {
    let sumEco = 0;
    let pesoEco = 0;
    let sumSoc = 0;
    let pesoSoc = 0;

    for (const af of preguntas) {
      const resp = respuestas[af.id];
      if (resp === undefined || resp === 0) continue;
      const peso = estrellas[af.id] ? data.metodologia.ponderacion_estrella : 1;
      const valNorm = (resp / 2) * af.eje.direccion;
      if (af.eje.dimension === 'economia') {
        sumEco += valNorm * peso;
        pesoEco += peso;
      } else {
        sumSoc += valNorm * peso;
        pesoSoc += peso;
      }
    }

    const x = pesoEco > 0 ? Number(((sumEco / pesoEco) * 1.8).toFixed(2)) : 0;
    const y = pesoSoc > 0 ? Number(((sumSoc / pesoSoc) * 1.8).toFixed(2)) : 0;
    const perfil = etiquetaIdeologica(x, y);
    return { x, y, etiqueta: perfil.titulo, resumen: perfil.resumen };
  }, [preguntas, respuestas, estrellas, data.metodologia.ponderacion_estrella]);

  const elegirRespuesta = (val: number) => {
    const nuevas = { ...respuestas, [actual.id]: val };
    setRespuestas(nuevas);
    if (indice + 1 < preguntas.length) {
      setIndice((i) => i + 1);
    } else {
      setFinalizado(true);
    }
  };

  const toggleEstrella = () => {
    setEstrellas((prev) => ({ ...prev, [actual.id]: !prev[actual.id] }));
  };

  const reiniciar = () => {
    setCamino('seleccion');
    setIndice(0);
    setRespuestas({});
    setEstrellas({});
    setFinalizado(false);
    setPartidoAbierto(null);
  };

  const getUrlReto = () => {
    if (typeof window === 'undefined') return 'https://elecciones.online/tests/afinidad';
    const base = `${window.location.origin}/tests/afinidad`;
    const ganador = ranking[0];
    const params = new URLSearchParams({
      reto_x: String(coordsUsuario.x),
      reto_y: String(coordsUsuario.y),
      reto_tag: coordsUsuario.etiqueta,
      reto_p: ganador ? `${ganador.siglas} (${ganador.porcentaje}%)` : '',
    });
    return `${base}?${params.toString()}`;
  };

  const copiarReto = async () => {
    try {
      await navigator.clipboard.writeText(getUrlReto());
      setRetoCopiado(true);
      setTimeout(() => setRetoCopiado(false), 2500);
    } catch {
      // noop
    }
  };

  const bannerReto = retoAmigo && (
    <div className="rounded-2xl border-2 border-red-900 bg-red-50/70 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <span className="text-xs font-extrabold text-red-900">
          Duelo de afinidad política
        </span>
        <p className="text-sm font-bold text-neutral-950">
          Te han retado desde el perfil «{retoAmigo.tag}»
          {retoAmigo.partido ? ` (1.º: ${retoAmigo.partido})` : ''}. Completa el test para comparar vuestros resultados cara a cara.
        </p>
      </div>
    </div>
  );

  if (camino === 'seleccion') {
    return (
      <div className="space-y-8">
        {bannerReto}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#dfd9cc] bg-white p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs">
            <div className="space-y-3">
              <span className="inline-block rounded-full bg-red-900/10 px-3 py-1 text-xs font-bold text-red-900">
                Camino 1 · Afinidad con candidaturas
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-neutral-950">
                ¿Con qué partido coincides?
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Compara tus respuestas con los votos reales en el Congreso (XV Legislatura) y programas 2026. Al terminar obtienes tu podio de afinidad, tu mayor punto de choque y la brújula 2D completa.
              </p>
            </div>
            <div className="pt-4 border-t border-[#ece7dc] flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-500">
                {preguntas.length} afirmaciones · 4 min
              </span>
              <button
                type="button"
                onClick={() => setCamino('partidos')}
                className="rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-900 transition cursor-pointer"
              >
                Empezar test →
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#dfd9cc] bg-white p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs">
            <div className="space-y-3">
              <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                Camino 2 · Brújula política 2D
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-neutral-950">
                ¿Cuál es tu ideología?
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Ubícate en el plano de dos ejes (Economía frente a Sociedad y Territorio), descubre tu perfil ideológico y compáralo con los 8 grupos del Congreso o reta a tus amigos.
              </p>
            </div>
            <div className="pt-4 border-t border-[#ece7dc] flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-500">
                {preguntas.length} afirmaciones · 4 min
              </span>
              <button
                type="button"
                onClick={() => setCamino('ideologia')}
                className="rounded-xl bg-red-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-neutral-950 transition cursor-pointer"
              >
                Ver mi brújula →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (finalizado) {
    const ganador = ranking[0];
    const segundo = ranking[1];
    const tercero = ranking[2];
    const esBrujula = camino === 'ideologia';

    return (
      <div className="space-y-8">
        {bannerReto}

        {/* Tarjeta resumen dual: Podio + Brújula siempre visibles */}
        <div className="rounded-2xl border-2 border-neutral-900 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ece7dc] pb-4">
            <div>
              <span className="text-xs font-bold text-red-900">
                Tu diagnóstico político completo ({contestadasValidas} de {preguntas.length} respondidas)
              </span>
              <h2 className="mt-1 font-editorial text-3xl sm:text-4xl font-bold text-neutral-950">
                {coordsUsuario.etiqueta}
                {ganador ? ` · ${ganador.porcentaje} % con ${ganador.siglas}` : ''}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={copiarReto}
                className="rounded-xl border-2 border-neutral-900 bg-white px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-neutral-100 transition cursor-pointer"
              >
                {retoCopiado ? 'Enlace de duelo copiado' : 'Retar a un amigo'}
              </button>
              <button
                type="button"
                onClick={() => setModalAbierto(true)}
                className="rounded-xl bg-red-900 px-4 py-2 text-xs font-bold text-white hover:bg-red-800 transition cursor-pointer"
              >
                Descargar tarjeta PNG
              </button>
              <button
                type="button"
                onClick={reiniciar}
                className="rounded-xl border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
              >
                Repetir
              </button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] items-center">
            <div className="space-y-5">
              <p className="text-sm text-neutral-700 leading-relaxed">
                {coordsUsuario.resumen}
              </p>

              {/* Podio Top 3 */}
              {ganador && (
                <div className="grid gap-3 sm:grid-cols-3">
                  {[ganador, segundo, tercero].filter(Boolean).map((p, idx) => (
                    <div
                      key={p.siglas}
                      className="rounded-xl border border-[#dfd9cc] bg-[#faf7f2] p-3.5 space-y-1"
                    >
                      <span className="text-xs font-extrabold text-neutral-500">
                        {idx + 1}.º puesto
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="font-bold text-sm text-neutral-950">{p.siglas}</span>
                      </div>
                      <span className="font-mono text-2xl font-extrabold text-neutral-950 block">
                        {p.porcentaje} %
                      </span>
                      <span className="text-xs text-neutral-500 block">
                        Sobre {p.comparadas} votos/citas
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Mayor coincidencia y mayor choque */}
              {ganador && (
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  {ganador.mayorCoincidencia && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                      <span className="font-bold text-xs text-emerald-900 block mb-1">
                        Mayor coincidencia con {ganador.siglas}
                      </span>
                      <p className="text-neutral-800 leading-snug">{ganador.mayorCoincidencia}</p>
                    </div>
                  )}
                  {ganador.mayorChoque && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5">
                      <span className="font-bold text-xs text-rose-900 block mb-1">
                        Principal punto de choque con {ganador.siglas}
                      </span>
                      <p className="text-neutral-800 leading-snug">{ganador.mayorChoque}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Brújula 2D siempre visible */}
            <div className="rounded-2xl border border-[#dfd9cc] bg-[#faf7f2] p-4">
              <svg viewBox="0 0 360 360" className="w-full max-w-[360px] mx-auto" role="img" aria-label="Brújula ideológica en 2 dimensiones">
                <rect x="20" y="20" width="160" height="160" fill="#fef2f2" opacity="0.7" />
                <rect x="180" y="20" width="160" height="160" fill="#eff6ff" opacity="0.7" />
                <rect x="20" y="180" width="160" height="160" fill="#fffbeb" opacity="0.7" />
                <rect x="180" y="180" width="160" height="160" fill="#f0fdf4" opacity="0.7" />

                <line x1="20" y1="180" x2="340" y2="180" stroke="#737373" strokeWidth="1.5" />
                <line x1="180" y1="20" x2="180" y2="340" stroke="#737373" strokeWidth="1.5" />

                <text x="180" y="14" textAnchor="middle" fontSize="9" fontWeight="700" fill="#525252">CONSERVADOR / TRADICIÓN</text>
                <text x="180" y="354" textAnchor="middle" fontSize="9" fontWeight="700" fill="#525252">PROGRESISTA / AUTOGOBIERNO</text>
                <text x="24" y="174" fontSize="8" fontWeight="700" fill="#525252">MÁS ESTADO</text>
                <text x="336" y="174" textAnchor="end" fontSize="8" fontWeight="700" fill="#525252">MÁS MERCADO</text>

                {data.partidos_ideologia.map((p, i) => {
                  const px = 180 + (p.x / 2) * 150;
                  const py = 180 - (p.y / 2) * 150;
                  const dyLabel = i % 2 === 0 ? -9 : 14;
                  return (
                    <g key={p.siglas}>
                      <circle cx={px} cy={py} r="6" fill={p.color} stroke="#fff" strokeWidth="1.5" />
                      <text x={px} y={py + dyLabel} textAnchor="middle" fontSize="9" fontWeight="700" fill="#171717">
                        {p.siglas}
                      </text>
                    </g>
                  );
                })}

                {retoAmigo && (
                  <g>
                    <circle
                      cx={180 + (retoAmigo.x / 2) * 150}
                      cy={180 - (retoAmigo.y / 2) * 150}
                      r="7"
                      fill="#1d4ed8"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={180 + (retoAmigo.x / 2) * 150}
                      y={180 - (retoAmigo.y / 2) * 150 + 16}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="800"
                      fill="#1d4ed8"
                    >
                      AMIGO
                    </text>
                  </g>
                )}

                <circle
                  cx={180 + (coordsUsuario.x / 2) * 150}
                  cy={180 - (coordsUsuario.y / 2) * 150}
                  r="8"
                  fill="#991b1b"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />
                <text
                  x={180 + (coordsUsuario.x / 2) * 150}
                  y={180 - (coordsUsuario.y / 2) * 150 - 12}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  fill="#991b1b"
                >
                  TÚ
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Ranking completo y desglose verificable */}
        <div className="rounded-2xl border border-[#dfd9cc] bg-white p-6 space-y-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-editorial text-xl font-bold text-neutral-950">
                Desglose completo y auditoría por partido
              </h3>
              <p className="text-xs text-neutral-500">
                Pulsa cualquier candidatura para revisar cada votación del Congreso y cita de programa en la que coincide o discrepa contigo.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FILTROS_TERRITORIO.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltroTerritorio(f.id)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
                    filtroTerritorio === f.id
                      ? 'bg-neutral-900 text-white'
                      : 'border border-neutral-300 bg-[#faf7f2] text-neutral-700 hover:bg-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {ranking.map((r) => {
              const abierto = partidoAbierto === r.siglas;
              return (
                <div key={r.siglas} className="rounded-xl border border-[#e4dfd3] bg-[#faf7f2]/60 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPartidoAbierto(abierto ? null : r.siglas)}
                    className="w-full p-4 text-left flex flex-col gap-2 hover:bg-white transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                        <span className="font-bold text-sm sm:text-base text-neutral-950">{r.nombre}</span>
                        <span className="text-xs text-neutral-500">({r.comparadas} fuentes comparadas)</span>
                      </div>
                      <span className="font-mono text-base font-extrabold text-neutral-950">
                        {r.porcentaje} % {abierto ? '▲' : '▼'}
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-neutral-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${r.porcentaje}%`, backgroundColor: r.color }}
                      />
                    </div>
                  </button>

                  {abierto && (
                    <div className="border-t border-[#e4dfd3] bg-white p-4 space-y-3 text-xs">
                      <div className="space-y-2">
                        {preguntas.map((af) => {
                          const pos = af.posiciones[r.siglas];
                          const respUser = respuestas[af.id];
                          if (!pos || respUser === undefined || respUser === 0) return null;
                          return (
                            <div key={af.id} className="rounded-lg border border-neutral-200 bg-[#faf7f2] p-3 space-y-1">
                              <p className="font-semibold text-neutral-900">{af.texto}</p>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600">
                                <span>Tu postura: <strong>{ESCALA.find((e) => e.val === respUser)?.label}</strong></span>
                                <span>·</span>
                                <span>{r.siglas}: <strong>{pos.valor > 0 ? 'A favor' : pos.valor < 0 ? 'En contra' : 'Abstención'}</strong></span>
                              </div>
                              <p className="text-neutral-700">{pos.nota}</p>
                              <a
                                href={pos.fuente_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block font-bold text-red-900 underline"
                              >
                                {pos.fuente} [↗]
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <CompartirViralModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          titulo="Test de Afinidad Política e Ideología (29-N)"
          subtitulo={`${coordsUsuario.etiqueta} · Comparado con votos del Congreso`}
          resultadoPrincipal={
            esBrujula
              ? coordsUsuario.etiqueta
              : `${ganador?.nombre ?? 'Resultado'} (${ganador?.porcentaje ?? 0} %)`
          }
          etiquetaBadge="elecciones.online · Test de Afinidad"
          colorPrincipal={esBrujula ? '#991b1b' : (ganador?.color ?? '#991b1b')}
          urlDestino={getUrlReto()}
          tipoGrafico={esBrujula ? 'brujula_2d' : 'barras_afinidad'}
          brujulaData={{
            x: coordsUsuario.x,
            y: coordsUsuario.y,
            etiqueta: coordsUsuario.etiqueta,
            partidos: data.partidos_ideologia.map((p) => ({
              siglas: p.siglas,
              nombre: p.nombre,
              x: p.x,
              y: p.y,
              color: p.color,
            })),
          }}
          afinidadData={ranking.slice(0, 6).map((r) => ({
            siglas: r.siglas,
            nombre: r.nombre,
            porcentaje: r.porcentaje,
            color: r.color,
          }))}
          detalles={ranking.slice(0, 3).map((r) => ({
            etiqueta: r.siglas,
            valor: `${r.porcentaje} %`,
          }))}
        />
      </div>
    );
  }

  const progreso = Math.round(((indice + 1) / preguntas.length) * 100);
  const tieneEstrella = Boolean(estrellas[actual.id]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {bannerReto}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
          <span>Afirmación {indice + 1} de {preguntas.length}</span>
          <span>{progreso} %</span>
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
          <div className="h-full bg-red-900 transition-all duration-300" style={{ width: `${progreso}%` }} />
        </div>
      </div>

      <div className="rounded-2xl border border-[#dfd9cc] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-[#faf7f2] border border-[#e4dfd3] px-3 py-1 text-xs font-bold text-neutral-700">
            Área: {actual.area.replace('_', ' ')}
          </span>
          <button
            type="button"
            onClick={toggleEstrella}
            className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
              tieneEstrella
                ? 'bg-amber-100 text-amber-950 border border-amber-400'
                : 'border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {tieneEstrella ? 'Prioridad doble activada (x2)' : 'Marcar tema muy importante (x2)'}
          </button>
        </div>

        <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-neutral-950 leading-snug">
          {actual.texto}
        </h2>

        <div className="grid gap-2.5">
          {ESCALA.map((op) => {
            const seleccionada = respuestas[actual.id] === op.val;
            return (
              <button
                key={op.val}
                type="button"
                onClick={() => elegirRespuesta(op.val)}
                className={`w-full rounded-xl border px-4 py-3.5 text-left text-sm font-bold transition cursor-pointer flex items-center justify-between ${
                  seleccionada
                    ? 'border-red-900 bg-red-50 text-red-950'
                    : 'border-[#e4dfd3] bg-[#faf7f2] text-neutral-800 hover:border-neutral-400 hover:bg-white'
                }`}
              >
                <span>{op.label}</span>
                <span className="font-mono text-xs text-neutral-500">
                  {op.val > 0 ? `+${op.val}` : op.val}
                </span>
              </button>
            );
          })}
        </div>

        <div className="pt-4 border-t border-[#ece7dc] flex items-center justify-between text-xs">
          <button
            type="button"
            disabled={indice === 0}
            onClick={() => setIndice((i) => Math.max(0, i - 1))}
            className="font-bold text-neutral-600 hover:text-neutral-950 disabled:opacity-40 cursor-pointer"
          >
            ← Anterior
          </button>
          {contestadasValidas >= 5 ? (
            <button
              type="button"
              onClick={() => setFinalizado(true)}
              className="font-bold text-red-900 underline cursor-pointer"
            >
              Ver resultado ({contestadasValidas} respondidas)
            </button>
          ) : (
            <span className="text-neutral-400">
              Responde al menos {5 - contestadasValidas} más para calcular afinidad fiable
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
