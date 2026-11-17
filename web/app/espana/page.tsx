import type { Metadata } from 'next';
import Link from 'next/link';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import { MapaEspana } from '@/components/MapaEspana';
import { construirDatosMapa } from '@/lib/mapa';
import { rutas } from '@/lib/rutas';

export const metadata: Metadata = {
  title: 'España: Elecciones Generales, Congreso y Circunscripciones',
  description:
    'Índice general de procesos electorales y actividad parlamentaria en España: Elecciones Generales 2026, Resultados 2023, Congreso XV Legislatura y 52 circunscripciones.',
  alternates: { canonical: '/espana' },
};

const SECCIONES = [
  {
    titulo: 'Elecciones generales del 29 de noviembre de 2026',
    descripcion: 'Programas con cita y página, candidaturas por provincia, entrevistas y pactómetro.',
    href: '/espana/generales/2026',
  },
  {
    titulo: 'Votaciones del Congreso, XV Legislatura',
    descripcion: 'Las 2.175 votaciones del Pleno con el voto de cada grupo parlamentario.',
    href: '/espana/congreso/xv-legislatura/votaciones',
  },
  {
    titulo: 'Resultados de las generales de 2023',
    descripcion: 'Votos, participación y reparto de escaños en las 52 circunscripciones.',
    href: '/espana/generales/2023',
  },
  {
    titulo: 'Hemeroteca',
    descripcion: 'Qué incluía cada decreto ómnibus y qué votó cada partido.',
    href: '/espana/generales/2026/hemeroteca',
  },
];

export default function EspanaPage() {
  const provincias = construirDatosMapa();

  return (
    <div className="space-y-10">
      <BreadcrumbJsonLd items={[{ name: 'Inicio', path: '/' }, { name: 'España', path: '/espana' }]} />

      <header>
        <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-neutral-950">
          Elecciones y Congreso en España
        </h1>
        <p className="mt-2 text-base text-neutral-600 max-w-3xl">
          Elecciones generales, votaciones del Congreso y resultados por provincia.
        </p>
      </header>

      <ul className="divide-y divide-[#ece7dc] border-y border-[#ece7dc] md:grid md:grid-cols-2 md:gap-x-8 md:divide-y-0">
        {SECCIONES.map((s) => (
          <li key={s.href} className="py-4 md:border-b md:border-[#ece7dc]">
            <h2 className="font-editorial text-xl font-bold text-neutral-950">
              <Link href={s.href} className="hover:text-red-900 hover:underline">
                {s.titulo}
              </Link>
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">{s.descripcion}</p>
          </li>
        ))}
      </ul>

      <MapaEspana provincias={provincias} />

      <section>
        <h2 className="font-editorial text-2xl font-bold text-neutral-950 mb-1">
          Las 52 circunscripciones
        </h2>
        <p className="text-sm text-neutral-600 mb-4">
          Listas de 2026 y resultados de 2023 de cada provincia.
        </p>
        <div className="grid border-t border-[#ece7dc] sm:grid-cols-2 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {provincias.map((p) => {
            return (
              <div key={p.codigo} className="border-b border-[#ece7dc] py-2.5 text-sm">
                <div className="font-bold text-sm text-neutral-950">{p.nombre}</div>
                <div className="text-xs text-neutral-600">
                  {p.escanos2026} escaños · {p.candidaturasCount} listas
                </div>
                <div className="flex items-center gap-4 font-semibold">
                  <Link href={rutas.candidaturaProvincia(p.codigo, p.nombre)} className="inline-flex min-h-9 items-center text-red-900 underline">
                    Listas 2026
                  </Link>
                  <Link href={rutas.resultados2023Provincia(p.codigo, p.nombre)} className="inline-flex min-h-9 items-center text-neutral-700 underline">
                    Resultados 2023
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
