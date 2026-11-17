import type { Metadata } from 'next';
import { ChevronDown } from 'lucide-react';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import { colorPartido } from '@/lib/colores';
import { actualidad, eleccionActiva, type ActualidadItem } from '@/lib/datos';
import { titularesVisibles } from '@/lib/titulares-visibles';

export const metadata: Metadata = {
  title: 'Actualidad de la campaña: qué publica cada partido',
  description: 'Últimas publicaciones de los canales oficiales de cada partido y titulares de prensa sobre las elecciones del 29 de noviembre de 2026, con enlace a la fuente.',
  alternates: { canonical: '/actualidad' },
};

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' });

function Lista({ items }: { items: ActualidadItem[] }) {
  return (
    <ul className="divide-y divide-[#e4dfd3] border-y border-[#e4dfd3]">
      {items.map((i) => (
        <li key={i.url} className="py-3">
          <a href={i.url} rel="noopener nofollow" target="_blank" className="break-words font-medium text-neutral-950 hover:text-red-900 hover:underline">
            {i.titulo}
          </a>
          <p className="mt-0.5 text-sm text-neutral-600">
            {i.canal} · <time dateTime={i.fecha}>{fecha(i.fecha)}</time>
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function ActualidadPage() {
  const { items: todos, fetched_at, fuentes } = actualidad();
  const items = titularesVisibles(todos, eleccionActiva().fecha_eleccion);
  const propios = items.filter((i) => i.clase === 'partido');
  const partidos = [...new Set(propios.flatMap((i) => i.partidos))].sort((a, b) => a.localeCompare(b, 'es'));
  const prensa = items.filter((i) => i.clase === 'medio' || i.clase === 'institucion').slice(0, 60);

  return (
    <article className="max-w-3xl">
      <BreadcrumbJsonLd items={[{ name: 'Inicio', path: '/' }, { name: 'Actualidad', path: '/actualidad' }]} />
      <h1 className="font-editorial text-3xl font-bold leading-tight text-neutral-950 sm:text-5xl">Actualidad de la campaña</h1>
      <p className="mt-3 text-base leading-relaxed text-neutral-700">
        Titulares tal como los publica cada fuente, con enlace al original. elecciones.online no los redacta ni los valora.
        Actualizado el {fecha(fetched_at)}.
      </p>

      <h2 className="mt-10 font-editorial text-2xl font-bold text-neutral-950">Lo que publica cada partido</h2>
      <div className="mt-3 divide-y divide-[#e4dfd3] border-y border-[#e4dfd3]">
        {partidos.map((p) => (
          <details key={p} className="group">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between font-semibold text-neutral-950 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorPartido(p) }} aria-hidden />
                {p}
              </span>
              <ChevronDown className="h-5 w-5 text-neutral-500 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="pb-4"><Lista items={propios.filter((i) => i.partidos.includes(p)).slice(0, 15)} /></div>
          </details>
        ))}
      </div>

      <h2 className="mt-10 font-editorial text-2xl font-bold text-neutral-950">Prensa e instituciones</h2>
      <div className="mt-3"><Lista items={prensa} /></div>

      <h2 className="mt-10 font-editorial text-2xl font-bold text-neutral-950">Fuentes que consultamos</h2>
      <p className="mt-2 text-neutral-700">
        {fuentes.length} fuentes, revisadas cada hora: canales y webs de los partidos, instituciones y medios. No se elige entre ellas ni se filtra por línea editorial; solo se descartan, durante la veda electoral, los titulares de sondeos (LOREG, art. 69.7).
      </p>
      {(['partido', 'institucion', 'medio', 'programa'] as const).map((clase) => {
        const lista = fuentes.filter((f) => f.clase === clase);
        if (!lista.length) return null;
        const nombre = { partido: 'Partidos', institucion: 'Instituciones', medio: 'Medios', programa: 'Programas de entrevistas' }[clase];
        return (
          <div key={clase} className="mt-4">
            <h3 className="font-semibold text-neutral-950">{nombre}</h3>
            <ul className="mt-1 divide-y divide-[#ece7dc] border-y border-[#ece7dc]">
              {lista.map((f) => (
                <li key={f.id} className="py-2">
                  <a href={f.fuente_url} target="_blank" rel="noopener noreferrer" className="break-words text-neutral-800 underline underline-offset-2 hover:text-red-900">
                    {f.canal}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </article>
  );
}
