import type { Metadata } from 'next';
import Link from 'next/link';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import { AREAS, eleccionActiva, fechaLarga, votaciones, votacionesClave } from '@/lib/datos';
import { resultado } from '@/lib/resultado';

export const metadata: Metadata = {
  title: 'Seguimiento legislativo y cumplimiento de compromisos',
  description: 'Balance objetivo de las votaciones clave de la XV Legislatura en el Congreso: qué salió aprobado, qué fue rechazado y qué votó cada bloque.',
  alternates: { canonical: '/cumplimiento' },
};

export default function CumplimientoPage() {
  const eleccion = eleccionActiva();
  const clave = votacionesClave();
  const mapa = new Map(votaciones().map((v) => [v.id, v]));

  const items = clave.votaciones
    .map((item) => ({ ...item, v: mapa.get(item.id) }))
    .filter((x): x is typeof x & { v: NonNullable<typeof x.v> } => Boolean(x.v));

  const aprobadas = items.filter((x) => x.v.totales.si > x.v.totales.no);
  const rechazadas = items.filter((x) => x.v.totales.no > x.v.totales.si);
  const empates = items.length - aprobadas.length - rechazadas.length;

  return (
    <article className="max-w-4xl">
      <BreadcrumbJsonLd items={[{ name: 'Inicio', path: '/' }, { name: 'Seguimiento y cumplimiento', path: '/cumplimiento' }]} />
      <h1 className="text-3xl font-bold mb-2">Seguimiento legislativo y cumplimiento</h1>
      <p className="text-gray-600 mb-6 max-w-3xl">
        Para comprobar si un Gobierno cumple lo que promete sin valoraciones subjetivas, aquí se cruza el programa con los resultados reales del Pleno del Congreso en la {eleccion.legislatura} Legislatura. Tras las elecciones del {fechaLarga(eleccion.fecha_eleccion)}, esta sección seguirá las votaciones de los compromisos del nuevo Ejecutivo.
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold">{items.length}</div>
          <div className="text-sm text-gray-600">Votaciones clave analizadas</div>
        </div>
        <div className="border border-emerald-200 bg-emerald-50/40 rounded-lg p-4">
          <div className="text-2xl font-bold text-emerald-800">{aprobadas.length}</div>
          <div className="text-sm text-emerald-900">Aprobadas en el Congreso</div>
        </div>
        <div className="border border-rose-200 bg-rose-50/40 rounded-lg p-4">
          <div className="text-2xl font-bold text-rose-800">{rechazadas.length}</div>
          <div className="text-sm text-rose-900">Rechazadas{empates > 0 && ` (y ${empates} ${empates === 1 ? 'empate' : 'empates'})`}</div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-3">Qué salió adelante y qué cayó en la {eleccion.legislatura} Legislatura</h2>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50 text-left">
              <th scope="col" className="p-2.5">Fecha</th>
              <th scope="col" className="p-2.5">Iniciativa / Norma</th>
              <th scope="col" className="p-2.5">Tema</th>
              <th scope="col" className="p-2.5">Resultado</th>
              <th scope="col" className="p-2.5">Voto bloque Gobierno (GS / SUMAR)</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ id, tema, categoria, titulo_llano, v }) => {
              const r = resultado(v.totales);
              const gs = v.por_grupo?.['GS'];
              const sum = v.por_grupo?.['GSUMAR'];
              return (
                <tr key={id} className="border-b border-gray-100 align-top">
                  <td className="p-2.5 whitespace-nowrap text-gray-600">{v.fecha}</td>
                  <th scope="row" className="p-2.5 text-left font-normal">
                    <Link href={`/espana/congreso/xv-legislatura/votaciones/${id}`} className="font-medium underline">{titulo_llano}</Link>
                    <div className="text-xs text-gray-500">
                      {categoria} · {v.totales.si} sí / {v.totales.no} no / {v.totales.abstencion} abs. ·{' '}
                      <a href={v.fuente_url} className="underline" rel="noopener">Congreso</a>
                    </div>
                  </th>
                  <td className="p-2.5 whitespace-nowrap">
                    <Link href={`/espana/generales/2026/comparador/${tema}`} className="underline">{AREAS[tema]}</Link>
                  </td>
                  <td className={`p-2.5 whitespace-nowrap font-semibold ${r === 'Aprobada' ? 'text-emerald-800' : r === 'Rechazada' ? 'text-rose-800' : 'text-amber-800'}`}>
                    {r}
                  </td>
                  <td className="p-2.5 text-xs text-gray-700 whitespace-nowrap">
                    GS: {gs ? `${gs.si} sí / ${gs.no} no` : '—'} · SUMAR: {sum ? `${sum.si} sí / ${sum.no} no` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
