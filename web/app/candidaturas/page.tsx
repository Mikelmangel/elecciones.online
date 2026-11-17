import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import BuscadorCandidaturas from '@/components/BuscadorCandidaturas';
import { MapaEspana } from '@/components/MapaEspana';
import { candidaturas2026 } from '@/lib/datos';
import { construirDatosMapa } from '@/lib/mapa';
import { rutas } from '@/lib/rutas';

export const metadata: Metadata = {
  title: 'Candidaturas proclamadas del 29-N por provincia · Elecciones Generales 2026',
  description:
    'Busca candidatos, partidos y listas proclamadas al Congreso de los Diputados en las 52 circunscripciones para las Elecciones Generales del 29-N (29 de noviembre de 2026, BOE).',
  alternates: { canonical: rutas.candidaturas() },
};

export default function CandidaturasPage() {
  const data = candidaturas2026();
  const total = data.circunscripciones.reduce((acc, c) => acc + c.candidaturas.length, 0);

  return (
    <div className="space-y-8">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'Candidaturas 2026', path: rutas.candidaturas() },
        ]}
      />
      <header className="rounded-2xl border border-[#dfd9cc] bg-white p-6 sm:p-8 shadow-xs">
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-neutral-950 mb-2">
          Candidaturas proclamadas (29-N 2026)
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 max-w-3xl leading-relaxed">
          {total} listas proclamadas al Congreso de los Diputados en las 52 circunscripciones, con su denominación literal y cabeza de lista según el{' '}
          <a href={data.fuente_url} className="font-semibold text-red-900 underline" rel="noopener noreferrer" target="_blank">
            BOE oficial
          </a>{' '}
          (incluye la corrección de errores BOE-A-2026-23383).
        </p>
      </header>

      <BuscadorCandidaturas circunscripciones={data.circunscripciones} />

      <section>
        <MapaEspana provincias={construirDatosMapa()} />
      </section>
    </div>
  );
}
