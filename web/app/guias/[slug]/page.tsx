import { notFound } from 'next/navigation';
import Link from 'next/link';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import { GUIAS } from '@/content/guias';
import { convocatoria, fechaLarga } from '@/lib/datos';
import { rutas } from '@/lib/rutas';

const restar = (iso: string, dias: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
};

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => GUIAS.map((g) => ({ slug: g.slug }));

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const g = GUIAS.find((x) => x.slug === slug);
  return g
    ? {
        title: g.titulo,
        description: g.descripcion,
        alternates: { canonical: rutas.guia(slug) },
      }
    : {};
}

export default async function GuiaPage({ params }: Props) {
  const { slug } = await params;
  const g = GUIAS.find((x) => x.slug === slug);
  if (!g) notFound();
  const fechaElec = convocatoria().fecha_eleccion;

  return (
    <article className="max-w-4xl space-y-8">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'Guías para votar', path: rutas.guias() },
          { name: g.titulo, path: rutas.guia(slug) },
        ]}
      />

      <header className="min-w-0">
        <Link
          href={rutas.guias()}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-neutral-600 hover:text-neutral-950 underline"
        >
          ← Todas las guías para votar
        </Link>

        <h1 className="mt-1 break-words font-editorial text-3xl sm:text-4xl font-bold text-neutral-950">
          {g.titulo}
        </h1>
        <p className="mt-2 text-base text-neutral-600 leading-relaxed">{g.descripcion}</p>

        <p className="mt-4 border-l-4 border-amber-500 bg-amber-50/80 p-3.5 text-sm text-amber-950 leading-relaxed">
          Estos son los plazos y procedimientos generales de la Ley Orgánica del Régimen Electoral General (LOREG). Las fechas exactas e instrucciones de cada convocatoria las publican el BOE y la Junta Electoral Central: compruébalas siempre en las fuentes oficiales enlazadas abajo.
        </p>
      </header>

      {g.herramientaExterna && (
        <section className="rounded-2xl bg-neutral-950 text-white p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <h2 className="font-editorial text-xl sm:text-2xl font-bold text-amber-300">
                {g.herramientaExterna.titulo}
              </h2>
              <p className="text-sm text-neutral-300 leading-relaxed">
                {g.herramientaExterna.descripcion}
              </p>
            </div>
            <a
              href={g.herramientaExterna.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-extrabold text-neutral-950 hover:bg-amber-300 transition text-center"
            >
              {g.herramientaExterna.boton}
            </a>
          </div>
        </section>
      )}

      {g.plazos && (
        <section className="border-t border-[#dfd9cc] pt-6">
          <h2 className="font-editorial text-xl font-bold text-neutral-950 mb-3">
            Calendario oficial para las elecciones del {fechaLarga(fechaElec)}
          </h2>
          <ul className="divide-y divide-[#ece7dc] border-y border-[#ece7dc] sm:grid sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0 sm:border-y-0">
            {g.plazos.map((p) => (
              <li
                key={p.texto}
                className="flex flex-col justify-between py-3 text-sm sm:border-b sm:border-[#ece7dc]"
              >
                <span className="text-neutral-600">{p.texto}</span>
                <strong className="mt-1 break-words font-editorial text-base font-bold text-red-900">
                  {fechaLarga(restar(fechaElec, p.diasAntes))}
                </strong>
              </li>
            ))}
          </ul>
          <p className="text-xs text-neutral-500 mt-3">
            Fechas calculadas con los plazos legales de la LOREG. La Junta Electoral Central puede acordar ampliaciones.
          </p>
        </section>
      )}

      <div className="space-y-6">
        {g.secciones.map((s) => (
          <section
            key={s.titulo}
            className="border-t border-[#dfd9cc] pt-6"
          >
            <h2 className="font-editorial text-xl font-bold text-neutral-950 mb-3">
              {s.titulo}
            </h2>
            <ul className="space-y-2 text-sm text-neutral-700 leading-relaxed">
              {s.puntos.map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <span className="text-red-900 font-bold shrink-0 mt-0.5">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="border-t border-[#dfd9cc] pt-6">
        <h2 className="font-editorial text-lg font-bold text-neutral-950 mb-2">
          Fuentes oficiales verificadas
        </h2>
        <ul className="text-sm">
          {g.fuentes.map((f) => (
            <li key={f.url}>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center break-words font-semibold text-red-900 hover:underline"
              >
                {f.nombre} ↗
              </a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
