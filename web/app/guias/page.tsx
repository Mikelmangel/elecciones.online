import Link from 'next/link';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import { GUIAS } from '@/content/guias';
import { rutas } from '@/lib/rutas';

export const metadata = {
  title: 'Guías prácticas para votar el 29-N: Colegio electoral, voto por correo y mesas',
  description:
    'Buscador oficial de tu colegio electoral en el INE, plazos del voto por correo, voto desde el extranjero, excusas y dietas de mesa electoral, paso a paso y con enlace al BOE.',
  alternates: { canonical: '/espana/generales/2026/guias' },
};

export default function Guias() {
  return (
    <div className="space-y-8">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'España', path: rutas.pais() },
          { name: 'Generales 2026', path: rutas.eleccion() },
          { name: 'Guías para votar', path: rutas.guias() },
        ]}
      />

      <header>
        <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-neutral-950">
          Todo lo que necesitas saber para ir a votar el 29 de noviembre
        </h1>
        <p className="mt-2 text-base text-neutral-600 max-w-3xl">
          Consulta dónde te toca votar en el buscador oficial del INE, comprueba los plazos del voto por correo y qué hacer si te designan miembro de una mesa electoral.
        </p>
      </header>

      {/* Tarjeta destacada: Buscador oficial del INE */}
      <section className="rounded-2xl bg-neutral-950 text-white p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold">
              Busca tu colegio y mesa electoral (Sede del INE)
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Buscador oficial del INE: introduce tu provincia, municipio, calle, número e inicial de tu primer apellido para saber al instante en qué local, sección y mesa te corresponde votar (sin necesidad de certificado digital).
            </p>
          </div>
          <div className="shrink-0 flex flex-wrap gap-3">
            <a
              href="https://sede.ine.gob.es/ce-mesas/?lang=es_ES"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-neutral-950 hover:bg-amber-300 transition shadow-xs"
            >
              Buscar mi colegio en el INE ↗
            </a>
            <Link
              href={rutas.guia('colegio-electoral')}
              className="inline-flex min-h-11 items-center rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-semibold text-neutral-200 hover:bg-neutral-800 transition"
            >
              Cómo se asignan →
            </Link>
          </div>
        </div>
      </section>

      {/* Grid de todas las guías */}
      <section>
        <h2 className="font-editorial text-2xl font-bold text-neutral-950 mb-4">
          Guías paso a paso con fuente oficial
        </h2>
        <ul className="divide-y divide-[#ece7dc] border-y border-[#ece7dc] sm:grid sm:grid-cols-2 sm:gap-x-8 sm:divide-y-0 sm:border-y-0 lg:grid-cols-3">
          {GUIAS.map((g) => (
            <li
              key={g.slug}
              className="group flex min-w-0 flex-col justify-between py-5 sm:border-b sm:border-[#ece7dc]"
            >
              <div>
                <p className="mb-1 text-xs font-semibold text-neutral-500">{g.etiqueta}</p>
                <Link
                  href={rutas.guia(g.slug)}
                  className="font-editorial text-xl font-bold text-neutral-950 group-hover:text-red-900 transition-colors block leading-snug break-words"
                >
                  {g.titulo}
                </Link>
                <p className="text-sm leading-relaxed text-neutral-600 mt-2">
                  {g.descripcion}
                </p>
              </div>
              <div className="mt-2">
                <Link
                  href={rutas.guia(g.slug)}
                  className="inline-flex min-h-11 items-center text-sm font-bold text-red-900 group-hover:underline"
                >
                  Leer guía completa →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
