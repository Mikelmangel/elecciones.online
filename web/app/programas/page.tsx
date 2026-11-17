import Link from 'next/link';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import { colorPartido } from '@/lib/colores';
import { AREAS, programas, slug } from '@/lib/datos';
import { PARTIDOS } from '@/lib/partidos';
import { rutas } from '@/lib/rutas';

export const metadata = {
  title: 'Programas electorales del 29-N (2026): qué propone cada partido',
  description:
    'Todos los partidos que se presentan a las elecciones generales del 29-N (29 de noviembre de 2026), divididos entre ámbito nacional y regional, con enlace a su programa oficial en PDF, votaciones del Congreso y entrevistas.',
  alternates: { canonical: '/espana/generales/2026/programas' },
};

export default function Page() {
  const ps = programas();
  const conPrograma = new Set(ps.map((p) => slug(p.siglas)));
  const nacionales = PARTIDOS.filter((p) => p.ambito !== 'regional');
  const regionales = PARTIDOS.filter((p) => p.ambito === 'regional');

  return (
    <div className="space-y-8">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'España', path: rutas.pais() },
          { name: 'Generales 2026', path: rutas.eleccion() },
          { name: 'Partidos y programas', path: rutas.programas() },
        ]}
      />

      <header>
        <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-neutral-950">
          Partidos que se presentan a las elecciones generales 2026
        </h1>
        <p className="mt-2 text-base text-neutral-600 max-w-3xl">
          Las medidas concretas de cada programa, con la frase literal y la página del documento oficial. Cuando un partido aún no ha publicado su PDF de 2026, su ficha muestra el histórico de votaciones en el Congreso y sus entrevistas públicas verificadas.
        </p>
      </header>

      {/* Partidos Nacionales */}
      <section className="border-t border-[#dfd9cc] pt-6 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#ece7dc] pb-3">
          <div>
            <h2 className="font-editorial text-2xl font-bold text-neutral-950">
              Partidos nacionales ({nacionales.length})
            </h2>
            <p className="text-sm text-neutral-500">
              Formaciones que presentan candidatura en la práctica totalidad de las circunscripciones de España
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#ece7dc] border-y border-[#ece7dc] sm:grid sm:grid-cols-2 sm:gap-3.5 sm:divide-y-0 sm:border-y-0 md:grid-cols-4">
          {nacionales.map((p) => {
            const color = colorPartido(p.siglas);
            const tiene = conPrograma.has(p.programaSlug ?? p.slug);
            return (
              <Link
                key={p.slug}
                href={rutas.partido(p.slug)}
                className="group flex min-h-11 min-w-0 flex-col justify-between py-3 pl-3 transition hover:bg-white sm:rounded-xl sm:border sm:border-[#e4dfd3] sm:bg-[#faf7f2]/70 sm:p-4"
                style={{ borderLeftColor: color, borderLeftWidth: 4 }}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-editorial text-xl font-bold group-hover:underline" style={{ color }}>
                      {p.siglas}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                        tiene ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {tiene ? 'Programa 2026' : 'Votos / Entrevistas'}
                    </span>
                  </div>
                  <p className="mt-1 break-words text-sm font-medium text-neutral-700 leading-snug">{p.nombre}</p>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-neutral-500">
                    Nacional
                  </span>
                  <span className="shrink-0 text-sm font-bold text-red-900 group-hover:underline">Entrar →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Partidos Regionales */}
      <section className="border-t border-[#dfd9cc] pt-6 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#ece7dc] pb-3">
          <div>
            <h2 className="font-editorial text-2xl font-bold text-neutral-950">
              Partidos regionales y autonómicos ({regionales.length})
            </h2>
            <p className="text-sm text-neutral-500">
              Formaciones que concurren en circunscripciones de una comunidad autónoma o ámbito territorial específico
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#ece7dc] border-y border-[#ece7dc] sm:grid sm:grid-cols-2 sm:gap-3.5 sm:divide-y-0 sm:border-y-0 md:grid-cols-4">
          {regionales.map((p) => {
            const color = colorPartido(p.siglas);
            const tiene = conPrograma.has(p.programaSlug ?? p.slug);
            return (
              <Link
                key={p.slug}
                href={rutas.partido(p.slug)}
                className="group flex min-h-11 min-w-0 flex-col justify-between py-3 pl-3 transition hover:bg-white sm:rounded-xl sm:border sm:border-[#e4dfd3] sm:bg-[#faf7f2]/70 sm:p-4"
                style={{ borderLeftColor: color, borderLeftWidth: 4 }}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-editorial text-xl font-bold group-hover:underline" style={{ color }}>
                      {p.siglas}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                        tiene ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {tiene ? 'Programa 2026' : 'Votos / Entrevistas'}
                    </span>
                  </div>
                  <p className="mt-1 break-words text-sm font-medium text-neutral-700 leading-snug">{p.nombre}</p>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-xs font-semibold text-neutral-500">
                    Regional {p.territorio ? `· ${p.territorio}` : ''}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-red-900 group-hover:underline">Entrar →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Comparar por tema */}
      <section className="border-t border-[#dfd9cc] pt-6">
        <h2 className="font-editorial text-2xl font-bold text-neutral-950 mb-1">
          Comparar programas lado a lado por tema (18 áreas)
        </h2>
        <p className="text-sm text-neutral-600 mb-4">
          Selecciona un bloque para abrir el comparador interactivo con hasta 4 partidos en paralelo, explicación ciudadana y verificación de datos:
        </p>
        <ul className="divide-y divide-[#ece7dc] border-y border-[#ece7dc] sm:grid sm:grid-cols-2 sm:gap-2.5 sm:divide-y-0 sm:border-y-0 md:grid-cols-3 lg:grid-cols-4">
          {Object.entries(AREAS).map(([k, v]) => (
            <li key={k}>
              <Link
                href={rutas.comparador(k)}
                className="flex min-h-11 items-center break-words py-2 text-sm font-semibold text-neutral-900 hover:text-red-900 transition sm:rounded-xl sm:border sm:border-[#e4dfd3] sm:bg-[#faf7f2] sm:px-3.5 sm:hover:border-neutral-400 sm:hover:bg-white"
              >
                {v} →
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
