import { notFound } from 'next/navigation';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import { votaciones } from '@/lib/datos';
import Tabla from './Tabla';

type Props = { params: Promise<{ anio: string }> };

export const dynamicParams = false;
export const generateStaticParams = () =>
  [...new Set(votaciones().map((v) => v.fecha.slice(0, 4)))].map((anio) => ({ anio }));

export async function generateMetadata({ params }: Props) {
  const { anio } = await params;
  return {
    title: `Votaciones del Congreso en ${anio}`,
    description: `Listado de votaciones del Pleno del Congreso de los Diputados en ${anio}, con enlace al detalle por grupo parlamentario.`,
    alternates: { canonical: `/votaciones/anio/${anio}` },
  };
}

export default async function Page({ params }: Props) {
  const { anio } = await params;
  const lista = votaciones().filter((v) => v.fecha.startsWith(anio)).reverse();
  if (!lista.length) notFound();
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Inicio', path: '/' }, { name: 'Votaciones', path: '/votaciones' }, { name: anio, path: `/votaciones/anio/${anio}` }]} />
      <h1 className="text-3xl font-bold mb-6">Votaciones del Congreso en {anio}</h1>
      <Tabla
        filas={lista.map((v) => ({
          id: v.id,
          fecha: v.fecha,
          texto: (v.texto_expediente || v.titulo).slice(0, 220),
          si: v.totales.si,
          no: v.totales.no,
          abs: v.totales.abstencion,
        }))}
      />
    </>
  );
}
