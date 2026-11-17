import { notFound } from 'next/navigation';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import GraficoResultadosProvincia from '@/components/GraficoResultadosProvincia';
import { resultados2023 } from '@/lib/datos';
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
        title: `Elecciones Generales 2023 en ${info.nombre}: gráficos, votos y escaños`,
        description: `Gráficos de votos, porcentaje y reparto de los ${info.res2023.escanos} escaños al Congreso en ${info.nombre} en las elecciones generales de 2023.`,
        alternates: { canonical: rutas.resultados2023Provincia(info.codigo, info.nombre) },
      }
    : {};
}

export default async function Page({ params }: Props) {
  const { codigo } = await params;
  const info = infoProvinciaCompleta(codigo);
  if (!info) notFound();
  const r = resultados2023();
  const p = info.res2023;

  return (
    <article>
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'España', path: rutas.pais() },
          { name: 'Generales 2023', path: rutas.resultados2023Hub() },
          { name: p.nombre, path: rutas.resultados2023Provincia(info.codigo, p.nombre) },
        ]}
      />
      <GraficoResultadosProvincia
        codigo={info.codigo}
        nombre={p.nombre}
        escanos2023={p.escanos}
        escanos2026={info.escanos2026}
        censo={p.censo}
        votantes={p.votantes}
        votosValidos={p.votos_validos}
        votosBlanco={p.votos_blanco}
        votosNulos={p.votos_nulos}
        candidaturas={p.candidaturas}
        boeId={r.boe_id}
        fuenteUrl={r.fuente_url}
      />
    </article>
  );
}
