import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import EntrevistaDetallePlayer from '@/components/EntrevistaDetallePlayer';
import {
  entrevistas,
  obtenerAnalisisEntrevista,
  obtenerEntrevistaPorSlug,
  obtenerVerificacionesEntrevista,
} from '@/lib/datos';

interface Props {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  const data = entrevistas();
  const setIds = new Set<string>();
  for (const e of data.entrevistas) {
    if (e.slug) setIds.add(e.slug);
    if (e.id) setIds.add(e.id);
  }
  return Array.from(setIds).map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const entrevista = obtenerEntrevistaPorSlug(id);
  if (!entrevista) return { title: 'Entrevista no encontrada' };

  return {
    title: `${entrevista.persona} (${entrevista.partido}): ${entrevista.titulo}`,
    description: `Vídeo y análisis de ${entrevista.persona} (${entrevista.partido}) en ${entrevista.medio} con cada declaración citada en su minuto exacto y contrastes oficiales.`,
    alternates: {
      canonical: `/espana/generales/2026/entrevistas/${entrevista.slug || id}`,
    },
  };
}

export default async function EntrevistaDetallePage({ params }: Props) {
  const { id } = await params;
  const entrevista = obtenerEntrevistaPorSlug(id);
  if (!entrevista) notFound();

  const declaraciones = obtenerVerificacionesEntrevista(
    entrevista.fuente_url,
    entrevista.persona
  );

  const analisis = obtenerAnalisisEntrevista(
    entrevista.slug || entrevista.id || id
  ) ?? null;

  const ytMatch = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(entrevista.fuente_url);
  const ytId = ytMatch ? ytMatch[1] : null;
  const videoJsonLd = ytId
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: `${entrevista.persona} (${entrevista.partido}): ${entrevista.titulo}`,
        description: `Entrevista a ${entrevista.persona} (${entrevista.partido}) en ${entrevista.medio}, con cada declaración citada en su minuto.`,
        thumbnailUrl: [`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`],
        uploadDate: entrevista.fecha ? `${entrevista.fecha}T12:00:00+01:00` : '2026-11-01T12:00:00+01:00',
        contentUrl: entrevista.fuente_url,
        embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}`,
      }
    : null;

  return (
    <article className="space-y-6 max-w-7xl mx-auto">
      {videoJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
        />
      )}
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'Entrevistas y debates', path: '/espana/generales/2026/entrevistas' },
          { name: `${entrevista.persona} (${entrevista.medio})`, path: `/espana/generales/2026/entrevistas/${entrevista.slug || id}` },
        ]}
      />

      <EntrevistaDetallePlayer
        entrevista={entrevista}
        declaraciones={declaraciones}
        analisis={analisis}
      />
    </article>
  );
}
