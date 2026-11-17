import type { Metadata } from 'next';
import Link from 'next/link';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import { AREAS, fechaLarga, votaciones, votacionesClave } from '@/lib/datos';

export const metadata: Metadata = {
  title: 'Votaciones clave del Congreso (XV Legislatura)',
  description: 'Qué votó cada grupo parlamentario en 38 votaciones clave de la XV Legislatura, con enlace al detalle y al registro oficial del Congreso.',
  alternates: { canonical: '/votaciones/clave' },
};

const COLS = [
  ['GS', 'PSOE'],
  ['GP', 'PP'],
  ['GVOX', 'VOX'],
  ['GSUMAR', 'SUMAR'],
  ['GR', 'ERC'],
  ['GJxCAT', 'JxCat'],
  ['GEH Bildu', 'EH Bildu'],
  ['GV (EAJ-PNV)', 'PNV'],
  ['GMx', 'Mixto'],
] as const;

type Recuento = { si: number; no: number; abstencion: number; no_vota: number };

function sentidoGrupo(r: Recuento | undefined): { texto: string; clase: string } {
  if (!r) return { texto: '—', clase: 'text-gray-400' };
  const max = Math.max(r.si, r.no, r.abstencion);
  if (max === 0) return { texto: '—', clase: 'text-gray-400' };
  if (r.si === max && r.si > r.no && r.si > r.abstencion) return { texto: 'Sí', clase: 'bg-emerald-50 text-emerald-800 font-semibold' };
  if (r.no === max && r.no > r.si && r.no > r.abstencion) return { texto: 'No', clase: 'bg-rose-50 text-rose-800 font-semibold' };
  if (r.abstencion === max) return { texto: 'Abs.', clase: 'bg-amber-50 text-amber-800 font-semibold' };
  return { texto: 'Div.', clase: 'bg-gray-100 text-gray-700' };
}

export default function VotacionesClavePage() {
  const mapa = new Map(votaciones().map((v) => [v.id, v]));
  const clave = votacionesClave();

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Inicio', path: '/' }, { name: 'Votaciones', path: '/votaciones' }, { name: 'Votaciones clave', path: '/votaciones/clave' }]} />
      <h1 className="text-3xl font-bold mb-2">Votaciones clave de la XV Legislatura</h1>
      <p className="text-gray-600 mb-3 max-w-3xl">{clave.criterio}</p>
      <p className="text-sm text-gray-600 mb-6 max-w-3xl">
        Se muestra el sentido mayoritario de cada <strong>grupo parlamentario</strong> (los grupos <code>GSUMAR</code> y <code>GMx</code> reúnen a varios partidos). Faltan las sesiones 5, 6, 8, 17 y 203 porque el fichero oficial del Congreso no incluye desglose por grupo en esas fechas.
      </p>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50 text-left">
              <th scope="col" className="p-2.5 min-w-[220px]">Votación</th>
              {COLS.map(([grupo, etiqueta]) => (
                <th key={grupo} scope="col" className="p-2 text-center whitespace-nowrap" title={grupo}>
                  {etiqueta}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clave.votaciones.map((item) => {
              const v = mapa.get(item.id);
              if (!v) return null;
              return (
                <tr key={item.id} className="border-b border-gray-100 align-top">
                  <th scope="row" className="p-2.5 text-left font-normal">
                    <div className="text-xs text-gray-500">
                      {fechaLarga(v.fecha)} · {item.categoria} ·{' '}
                      <Link href={`/espana/generales/2026/comparador/${item.tema}`} className="underline">{AREAS[item.tema]}</Link>
                    </div>
                    <Link href={`/espana/congreso/xv-legislatura/votaciones/${v.id}`} className="font-medium hover:underline">
                      {item.titulo_llano}
                    </Link>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Total: {v.totales.si} sí / {v.totales.no} no / {v.totales.abstencion} abs. ·{' '}
                      <a href={v.fuente_url} className="underline" rel="noopener">Fuente oficial</a>
                    </div>
                  </th>
                  {COLS.map(([grupo]) => {
                    const s = sentidoGrupo(v.por_grupo?.[grupo]);
                    return (
                      <td key={grupo} className={`p-2 text-center align-middle whitespace-nowrap ${s.clase}`}>
                        {s.texto}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
