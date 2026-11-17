import { notFound } from 'next/navigation';
import Link from 'next/link';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import { candidaturas2026 } from '@/lib/datos';
import { infoProvinciaCompleta, todosLosParamsProvincia } from '@/lib/provincias';
import { rutas } from '@/lib/rutas';

type Props = { params: Promise<{ codigo: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => todosLosParamsProvincia();

export async function generateMetadata({ params }: Props) {
  const { codigo } = await params;
  const info = infoProvinciaCompleta(codigo);
  return info
    ? {
        title: `Candidaturas 2026 en ${info.nombre}: listas y cabezas de lista al Congreso`,
        description: `Las ${info.candidaturas2026.length} listas proclamadas al Congreso de los Diputados en ${info.nombre} para el 29 de noviembre de 2026 y sus cabezas de lista (BOE).`,
        alternates: { canonical: rutas.candidaturaProvincia(info.codigo, info.nombre) },
      }
    : {};
}

export default async function CandidaturasProvinciaPage({ params }: Props) {
  const { codigo } = await params;
  const info = infoProvinciaCompleta(codigo);
  if (!info) notFound();
  const data = candidaturas2026();
  const diff = info.escanos2026 - info.res2023.escanos;

  return (
    <article className="space-y-6">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'España', path: rutas.pais() },
          { name: 'Generales 2026', path: rutas.eleccion() },
          { name: info.nombre, path: rutas.candidaturaProvincia(info.codigo, info.nombre) },
        ]}
      />

      <header className="border-b border-[#e4dfd3] pb-6">
        <div className="flex flex-wrap items-center gap-x-2 text-sm text-neutral-600 mb-2">
          <Link href={rutas.pais()} className="inline-flex min-h-8 items-center underline hover:text-red-900">
            España
          </Link>
          <span>/</span>
          <Link href={rutas.eleccion()} className="inline-flex min-h-8 items-center underline hover:text-red-900">
            Elecciones Generales 2026
          </Link>
          <span>/</span>
          <span className="text-red-900">{info.nombre}</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-neutral-950">
              Candidaturas y cabezas de lista 2026 en {info.nombre}
            </h1>
            <p className="mt-1.5 text-sm text-neutral-600">
              <strong>{info.candidaturas2026.length} listas oficiales</strong> proclamadas en el BOE para elegir{' '}
              <strong>{info.escanos2026} diputados</strong>
              {diff !== 0 && ` (${diff > 0 ? `+${diff}` : diff} respecto a 2023)`}.
            </p>
          </div>
          <Link
            href={rutas.resultados2023Provincia(info.codigo, info.nombre)}
            className="rounded-xl bg-neutral-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-900 transition"
          >
            Ver gráficos de resultados 2023 en {info.nombre} →
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-[#dfd9cc] bg-white p-6 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-2">
          {info.candidaturas2026.map((cand, i) => (
            <div
              key={`${cand.siglas}-${i}`}
              className="flex flex-col justify-between rounded-xl border border-[#ece7dc] bg-[#faf7f2]/70 p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-neutral-900 px-2 py-0.5 font-mono text-xs font-bold text-white">
                    {cand.siglas}
                  </span>
                  <span className="font-mono text-xs text-neutral-400">Lista #{i + 1}</span>
                </div>
                <p className="mt-2 text-xs text-neutral-600">{cand.denominacion}</p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#e4dfd3] text-xs">
                <span className="text-neutral-500">Cabeza de lista (n.º 1): </span>
                <strong className="text-neutral-950">{cand.cabeza_de_lista}</strong>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-neutral-500 mt-6 pt-4 border-t border-[#ece7dc]">
          Fuente oficial: <a href={data.fuente_url} className="font-semibold text-neutral-800 underline" rel="noopener">BOE-A-2026-23103</a> (con corrección de errores BOE-A-2026-23383).
        </p>
      </section>
    </article>
  );
}
