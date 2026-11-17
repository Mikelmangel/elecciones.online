import { notFound } from 'next/navigation';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import { LEGAL } from '@/content/legal';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => LEGAL.map((l) => ({ slug: l.slug }));

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const l = LEGAL.find((x) => x.slug === slug);
  return l
    ? {
        title: l.titulo,
        description: `${l.titulo} de elecciones.online.`,
        alternates: { canonical: `/legal/${slug}` },
      }
    : {};
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const l = LEGAL.find((x) => x.slug === slug);
  if (!l) notFound();
  return (
    <article className="max-w-3xl">
      <BreadcrumbJsonLd items={[{ name: 'Inicio', path: '/' }, { name: l.titulo, path: `/legal/${slug}` }]} />
      <h1 className="text-3xl font-bold mb-6">{l.titulo}</h1>
      {l.secciones.map((s) => (
        <section key={s.titulo} className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{s.titulo}</h2>
          {s.parrafos.map((p) => <p key={p} className="mb-2">{p}</p>)}
        </section>
      ))}
    </article>
  );
}
