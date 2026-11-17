'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { EventoCalendarioItem } from '@/lib/datos';
import { rutas } from '@/lib/rutas';

const TIPO: Record<EventoCalendarioItem['tipo'], { etiqueta: string; punto: string }> = {
  campana: { etiqueta: 'Campaña', punto: 'bg-neutral-500' },
  debate: { etiqueta: 'Debate', punto: 'bg-red-800' },
  veda: { etiqueta: 'Veda de sondeos', punto: 'bg-amber-600' },
  reflexion: { etiqueta: 'Reflexión', punto: 'bg-amber-600' },
  votacion: { etiqueta: 'Votación', punto: 'bg-emerald-700' },
};

// la fecha se formatea en UTC sobre mediodía: el mismo texto en servidor y navegador
const dia = (f: string) => new Date(`${f}T12:00:00Z`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const hoyMadrid = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });

function Bloques({ e, areas: nombres }: { e: EventoCalendarioItem; areas: Record<string, string> }) {
  if (!e.bloques?.length) return null;
  const qs = e.comparar ? `?partidos=${encodeURIComponent(e.comparar.join(','))}` : '';
  return (
    <div className="mt-3">
      <p className="text-sm font-semibold text-neutral-900">Temas del debate{e.comparar ? ` · qué propone cada uno (${e.comparar.join(' y ')})` : ''}</p>
      <ul className="mt-1 divide-y divide-[#ece7dc] border-y border-[#ece7dc]">
        {e.bloques.map((b) => {
          const areas = b.areas.filter((a) => a in nombres);
          return (
            <li key={b.titulo} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1.5 text-sm">
              <span className="text-neutral-800">{b.titulo}</span>
              <span className="flex flex-wrap gap-x-3">
                {areas.map((a) => (
                  <Link key={a} href={`${rutas.comparador(a)}${qs}`} className="inline-flex min-h-9 items-center font-semibold text-red-900 underline underline-offset-2">
                    {nombres[a]}
                  </Link>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function CalendarioElectoral({ eventos, areas }: { eventos: EventoCalendarioItem[]; areas: Record<string, string> }) {
  const [hoy, setHoy] = useState<string | null>(null);
  useEffect(() => setHoy(hoyMadrid()), []);
  const ordenados = [...eventos].sort((a, b) => (a.fecha + (a.hora ?? '')).localeCompare(b.fecha + (b.hora ?? '')));

  return (
    <ol className="divide-y divide-[#e4dfd3] border-y border-[#e4dfd3]">
      {ordenados.map((e) => {
        const pasado = hoy !== null && e.fecha < hoy;
        const esHoy = hoy === e.fecha;
        return (
          <li key={e.id} id={e.id} className={`scroll-mt-28 py-5 sm:grid sm:grid-cols-[11rem_1fr] sm:gap-6 ${pasado ? 'opacity-60' : ''}`}>
            <div>
              <p className="font-semibold text-neutral-950 first-letter:uppercase">{dia(e.fecha)}</p>
              <p className="text-sm text-neutral-600">{e.hora ? `${e.hora} h` : 'Hora por concretar'}</p>
              {esHoy && <p className="mt-1 inline-block rounded bg-red-900 px-2 py-0.5 text-xs font-semibold text-white">Hoy</p>}
            </div>
            <div className="mt-2 min-w-0 sm:mt-0">
              <p className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                <span className={`h-2.5 w-2.5 rounded-full ${TIPO[e.tipo].punto}`} aria-hidden />
                {TIPO[e.tipo].etiqueta}
                {e.estado === 'por_confirmar' && <span className="font-semibold text-amber-800">· Por confirmar</span>}
              </p>
              <h2 className="mt-1 font-editorial text-xl font-bold leading-snug text-neutral-950">{e.titulo}</h2>
              {e.descripcion && <p className="mt-1 text-neutral-700">{e.descripcion}</p>}
              {e.moderador && <p className="mt-2 text-sm text-neutral-700"><strong className="font-semibold text-neutral-950">Modera:</strong> {e.moderador}</p>}
              {e.participantes && (
                <p className="mt-1 text-sm text-neutral-700"><strong className="font-semibold text-neutral-950">Participan:</strong> {e.participantes.join(' · ')}</p>
              )}
              {e.emite && <p className="mt-1 text-sm text-neutral-700"><strong className="font-semibold text-neutral-950">Dónde verlo:</strong> {e.emite.join(', ')}</p>}
              <Bloques e={e} areas={areas} />
              <p className="mt-3 text-sm text-neutral-600">
                Fuente:{' '}
                {e.fuentes.map((f, i) => (
                  <span key={f.url}>
                    {i > 0 && ' · '}
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-red-900">{f.nombre}</a>
                  </span>
                ))}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
