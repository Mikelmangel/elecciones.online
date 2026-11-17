import { notFound } from 'next/navigation';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import Propuesta from '@/components/Propuesta';
import { AREAS, type Area, programas, slug } from '@/lib/datos';

type Props = { params: Promise<{ siglas: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => programas().map((p) => ({ siglas: slug(p.siglas) }));

export async function generateMetadata({ params }: Props) {
  const { siglas } = await params;
  const p = programas().find((x) => slug(x.siglas) === siglas);
  return p
    ? {
        title: `Programa electoral de ${p.siglas} para 2026`,
        description: `Las medidas del programa de ${p.nombre} para las elecciones generales de 2026, con cita y página.`,
        alternates: { canonical: `/programas/${siglas}` },
      }
    : {};
}

export default async function Page({ params }: Props) {
  const { siglas } = await params;
  const p = programas().find((x) => slug(x.siglas) === siglas);
  if (!p) notFound();
  return (
    <article className="max-w-3xl">
      <BreadcrumbJsonLd items={[{ name: 'Inicio', path: '/' }, { name: 'Programas', path: '/programas' }, { name: p.siglas, path: `/programas/${siglas}` }]} />
      <h1 className="text-3xl font-bold mb-2">Programa electoral de {p.nombre}</h1>
      <p className="text-sm text-gray-600 mb-6">
        Fuente: <a href={p.fuente_url} className="underline" rel="noopener">programa oficial en PDF</a>.
      </p>
      {(Object.keys(AREAS) as Area[]).map((a) => {
        const lista = p.propuestas.filter((x) => x.area === a);
        return lista.length ? (
          <details key={a} className="group border-b border-[#e4dfd3]">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-2 [&::-webkit-details-marker]:hidden">
              <h2 className="text-lg font-semibold sm:text-xl">{AREAS[a]}</h2>
              <span className="shrink-0 text-sm text-neutral-600">
                {lista.length} {lista.length === 1 ? 'medida' : 'medidas'}
                <span aria-hidden className="ml-2 inline-block transition-transform group-open:rotate-180">▾</span>
              </span>
            </summary>
            <ul className="space-y-3 pb-6 pt-2">{lista.map((x) => <Propuesta key={x.pagina + x.cita} p={x} pdf={p.fuente_url} />)}</ul>
          </details>
        ) : null;
      })}
    </article>
  );
}
