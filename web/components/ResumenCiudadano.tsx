'use client';

import Link from 'next/link';
import { useState } from 'react';

export interface MedidaSimple {
  titular: string;
  enTuDiaADia: string | null;
  situacionActual: string | null;
  pagina: number;
  pdfUrl: string;
}

export interface VotoRealSimple {
  id: string;
  titulo: string;
  fecha: string;
  sentido: 'Sí' | 'No' | 'Abstención' | 'Dividido' | 'Sin datos';
}

export interface PartidoResumenTema {
  slug: string;
  siglas: string;
  nombre: string;
  color: string;
  tienePrograma: boolean;
  totalMedidasTema: number;
  medidasDestacadas: MedidaSimple[];
  votosReales: VotoRealSimple[];
}

export interface TemaCiudadano {
  id: string;
  areaPrincipal: string;
  icono: string;
  titulo: string;
  preguntaCiudadana: string;
  partidos: PartidoResumenTema[];
}

function badgeVoto(sentido: VotoRealSimple['sentido']) {
  if (sentido === 'Sí') {
    return 'bg-emerald-100 text-emerald-900 border-emerald-300';
  }
  if (sentido === 'No') {
    return 'bg-rose-100 text-rose-900 border-rose-300';
  }
  if (sentido === 'Abstención') {
    return 'bg-amber-100 text-amber-900 border-amber-300';
  }
  return 'bg-neutral-100 text-neutral-600 border-neutral-200';
}

export default function ResumenCiudadano({ temas }: { temas: TemaCiudadano[] }) {
  const [temaId, setTemaId] = useState<string>(temas[0]?.id ?? 'vivienda');
  const [filtroAmbito, setFiltroAmbito] = useState<'todos' | 'catalunya' | 'estatales'>('todos');

  const temaActivo = temas.find((t) => t.id === temaId) ?? temas[0];
  if (!temaActivo) return null;

  const ESTATALES = new Set(['pp', 'psoe', 'vox', 'frente-amplio', 'podemos']);
  const CATALUNYA = new Set(['psc', 'erc', 'junts', 'frente-amplio', 'pp', 'vox']);

  const partidosVisibles =
    filtroAmbito === 'estatales'
      ? temaActivo.partidos.filter((p) => ESTATALES.has(p.slug))
      : filtroAmbito === 'catalunya'
        ? temaActivo.partidos.filter((p) => CATALUNYA.has(p.slug))
        : temaActivo.partidos;

  const conPrograma = partidosVisibles.filter((p) => p.tienePrograma);
  const sinPrograma = partidosVisibles.filter((p) => !p.tienePrograma);
  const pestana = (activo: boolean) =>
    `min-h-11 shrink-0 border-b-2 px-3 text-sm font-medium transition-colors ${
      activo ? 'border-red-800 text-neutral-950' : 'border-transparent text-neutral-600 hover:text-neutral-950'
    }`;

  return (
    <section aria-labelledby="resumen-titulo">
      <h2 id="resumen-titulo" className="font-editorial text-2xl sm:text-3xl font-bold text-neutral-950">
        Qué propone cada partido y qué votó en el Congreso
      </h2>
      <p className="mt-2 max-w-[65ch] text-neutral-700">
        Elige un tema. A la izquierda, lo que dice su programa, con la página del PDF. A la derecha, lo que votó su grupo.
      </p>

      <div className="mt-5 -mx-4 flex overflow-x-auto border-b border-[#e4dfd3] px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Temas">
        {temas.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={t.id === temaActivo.id} onClick={() => setTemaId(t.id)} className={pestana(t.id === temaActivo.id)}>
            {t.titulo}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2 text-neutral-700">
          Mostrar
          <select
            value={filtroAmbito}
            onChange={(e) => setFiltroAmbito(e.target.value as typeof filtroAmbito)}
            className="min-h-11 rounded-md border border-[#c9c1b0] bg-white px-3 text-sm text-neutral-950"
          >
            <option value="todos">todos los partidos</option>
            <option value="estatales">los de ámbito estatal</option>
            <option value="catalunya">los que se presentan en Cataluña</option>
          </select>
        </label>
        <Link href={`/espana/generales/2026/comparador/${temaActivo.areaPrincipal}`} className="font-semibold text-red-900 underline hover:text-red-700">
          Todas las propuestas de {temaActivo.titulo.toLowerCase()}
        </Link>
      </div>

      <div className="mt-4 hidden border-b border-neutral-900 pb-2 text-sm font-semibold text-neutral-950 md:grid md:grid-cols-[9rem_1fr_1fr] md:gap-6">
        <span>Partido</span>
        <span>Propone en su programa</span>
        <span>Votó en el Congreso</span>
      </div>
      <ul>
        {conPrograma.map((p) => (
          <li key={p.slug} className="grid gap-3 border-b border-[#e4dfd3] py-5 md:grid-cols-[9rem_1fr_1fr] md:gap-6">
            <div>
              <Link href={`/espana/generales/2026/partidos/${p.slug}/${temaActivo.areaPrincipal}`} className="inline-flex items-center gap-2 font-bold text-neutral-950 hover:underline">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
                {p.siglas}
              </Link>
              <p className="mt-0.5 text-sm text-neutral-600">{p.totalMedidasTema} propuestas</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-600 md:hidden">Propone</p>
              {p.medidasDestacadas.length > 0 ? (
                <ul className="space-y-2.5">
                  {p.medidasDestacadas.map((m, i) => (
                    <li key={i} className="text-neutral-900">
                      {m.titular}{' '}
                      <a href={`${m.pdfUrl}#page=${m.pagina}`} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-sm text-red-900 underline hover:text-red-700">
                        pág. {m.pagina}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-neutral-600">Su programa no incluye medidas en este apartado.</p>
              )}
            </div>
            <Votos votos={p.votosReales} />
          </li>
        ))}
      </ul>

      {sinPrograma.length > 0 && (
        <div className="py-5">
          <p className="text-neutral-700">
            <strong className="font-semibold text-neutral-950">Sin programa publicado todavía:</strong>{' '}
            {sinPrograma.map((p, i) => (
              <span key={p.slug}>
                {i > 0 && ', '}
                <Link href={`/espana/generales/2026/partidos/${p.slug}`} className="underline hover:text-red-900">{p.siglas}</Link>
              </span>
            ))}
            . En su ficha está lo que ha votado cada uno.
          </p>
        </div>
      )}
    </section>
  );
}

function Votos({ votos }: { votos: VotoRealSimple[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-neutral-600 md:hidden">Votó</p>
      {votos.length > 0 ? (
        <ul className="space-y-2">
          {votos.map((v) => (
            <li key={v.id} className="flex items-start justify-between gap-3 text-sm">
              <Link href={`/espana/congreso/xv-legislatura/votaciones/${v.id}`} className="text-neutral-800 hover:underline">{v.titulo}</Link>
              <span className={`shrink-0 rounded border px-2 py-0.5 text-xs font-semibold ${badgeVoto(v.sentido)}`}>{v.sentido}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-600">Sin votaciones registradas en este tema.</p>
      )}
    </div>
  );
}
