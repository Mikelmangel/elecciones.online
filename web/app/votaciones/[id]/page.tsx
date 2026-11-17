import { notFound } from 'next/navigation';
import Link from 'next/link';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import { claseResultado, resultado } from '@/lib/resultado';
import { coherenciaVotaciones, fechaLarga, GRUPOS, votaciones, votacionesClave } from '@/lib/datos';
import { idDesdeSlugVotacion, rutas } from '@/lib/rutas';

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = true;
export const generateStaticParams = () => votaciones().map((v) => ({ id: v.id }));

const suma = (r: { si: number; no: number; abstencion: number; no_vota: number }) =>
  r.si + r.no + r.abstencion + r.no_vota;

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const realId = idDesdeSlugVotacion(id);
  const v = votaciones().find((x) => x.id === realId);
  if (!v) return {};
  const clave = votacionesClave().votaciones.find((c) => c.id === v.id);
  const textoBase = clave?.titulo_llano ?? v.texto_expediente ?? v.titulo;
  return {
    title: `${ (clave?.titulo_llano ?? v.titulo).slice(0, 70) } (${fechaLarga(v.fecha)})`,
    description: `Votación ${v.id} del Congreso (${fechaLarga(v.fecha)}): ${v.totales.si} sí, ${v.totales.no} no, ${v.totales.abstencion} abstenciones.`,
    alternates: { canonical: rutas.votacionCongreso(v.id, textoBase) },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const realId = idDesdeSlugVotacion(id);
  const v = votaciones().find((x) => x.id === realId);
  if (!v) notFound();

  const clave = votacionesClave().votaciones.find((c) => c.id === v.id);
  const casoCoherencia = coherenciaVotaciones().casos.find((c) => c.id_votacion === v.id);
  const grupos = v.por_grupo && Object.entries(v.por_grupo).sort((a, b) => suma(b[1]) - suma(a[1]));
  const totalVotos = Math.max(1, v.totales.si + v.totales.no + v.totales.abstencion);
  const r = resultado(v.totales);
  const urlCanonica = rutas.votacionCongreso(v.id, clave?.titulo_llano ?? v.texto_expediente ?? v.titulo);

  return (
    <article className="space-y-6">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'España', path: rutas.pais() },
          { name: 'Congreso · XV Legislatura', path: rutas.votacionesCongresoHub() },
          { name: `Votación ${v.id}`, path: urlCanonica },
        ]}
      />

      <header className="border-b border-[#e4dfd3] pb-6">
        <div className="flex flex-wrap items-center gap-x-2 text-sm text-neutral-600 mb-2">
          <Link href={rutas.pais()} className="inline-flex min-h-8 items-center underline hover:text-red-900">España</Link>
          <span>/</span>
          <Link href={rutas.votacionesCongresoHub()} className="inline-flex min-h-8 items-center underline hover:text-red-900">
            Congreso · XV Legislatura
          </Link>
          <span>/</span>
          <span className="font-mono text-red-900">Sesión {v.sesion} · Votación #{v.numero}</span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="font-editorial text-2xl sm:text-4xl font-bold text-neutral-950">
              {clave ? clave.titulo_llano : v.titulo}
            </h1>
            {clave && (
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                Denominación formal en acta: {v.titulo}
              </p>
            )}
            {v.texto_expediente && (
              <p className="mt-2 text-sm text-neutral-700 leading-relaxed">{v.texto_expediente}</p>
            )}
            {v.titulo_subgrupo && (
              <p className="mt-1 text-xs italic text-neutral-500">{v.titulo_subgrupo}</p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <span
              className={`inline-block rounded-full px-3.5 py-1 text-xs font-extrabold ${
                claseResultado[r]
              }`}
            >
              {r}
            </span>
            <p className="mt-1 text-xs text-neutral-500">{fechaLarga(v.fecha)}</p>
          </div>
        </div>

        {/* Marcador visual Sí / No / Abstención */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
            <div className="text-xs font-bold text-emerald-900">A favor (Sí)</div>
            <div className="font-mono text-3xl font-extrabold text-emerald-800">{v.totales.si}</div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5">
            <div className="text-xs font-bold text-rose-900">En contra (No)</div>
            <div className="font-mono text-3xl font-extrabold text-rose-800">{v.totales.no}</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
            <div className="text-xs font-bold text-amber-900">Abstenciones</div>
            <div className="font-mono text-3xl font-extrabold text-amber-800">{v.totales.abstencion}</div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5">
            <div className="text-xs font-bold text-neutral-600">No votaron</div>
            <div className="font-mono text-3xl font-extrabold text-neutral-700">{v.totales.no_vota}</div>
          </div>
        </div>

        {/* Barra proporcional apilada */}
        <div className="mt-4 flex h-4 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            style={{ width: `${(v.totales.si / totalVotos) * 100}%` }}
            className="bg-emerald-600"
            title={`${v.totales.si} Sí`}
          />
          <div
            style={{ width: `${(v.totales.no / totalVotos) * 100}%` }}
            className="bg-rose-600"
            title={`${v.totales.no} No`}
          />
          <div
            style={{ width: `${(v.totales.abstencion / totalVotos) * 100}%` }}
            className="bg-amber-400"
            title={`${v.totales.abstencion} Abstenciones`}
          />
        </div>
      </header>

      {/* Auditoría de Coherencia: Promesas previas vs Voto real en el escaño */}
      {casoCoherencia && (
        <section className="rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-600 text-white px-2.5 py-0.5 text-xs font-bold">
              Auditoría de Coherencia
            </span>
            <span className="text-xs font-bold text-amber-950">{casoCoherencia.etiqueta}</span>
          </div>

          <h2 className="font-editorial text-2xl font-bold text-neutral-950">
            ¿Cumplieron lo que prometieron o cambiaron de voto?
          </h2>

          <p className="text-sm text-neutral-700 leading-relaxed max-w-3xl">
            {casoCoherencia.resumen}
          </p>

          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            {casoCoherencia.partidos.map((p) => (
              <div
                key={p.siglas}
                className="rounded-xl border border-amber-200 bg-white p-4 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <span className="font-bold text-neutral-950">{p.siglas}</span>
                  <span className="rounded-md bg-neutral-900 px-2 py-0.5 text-xs font-mono font-bold text-white">
                    Votó: {p.voto_emitido}
                  </span>
                </div>
                <div className="text-xs text-neutral-600">
                  <strong className="text-neutral-900">Promesa de campaña / Posición previa:</strong>{' '}
                  {p.promesa_previa}
                </div>
                <div className="text-xs text-neutral-700 pt-1 border-t border-neutral-100">
                  <strong className="text-neutral-900">Motivo oficial / Concesión:</strong>{' '}
                  {p.motivo_oficial}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Desglose gráfico por grupo parlamentario */}
      <section className="rounded-2xl border border-[#dfd9cc] bg-white p-6 shadow-xs">
        <h2 className="font-editorial text-2xl font-bold text-neutral-950 mb-4">
          Qué votó cada grupo parlamentario
        </h2>

        {grupos ? (
          <div className="space-y-3">
            {grupos.map(([g, r]) => {
              const totG = Math.max(1, suma(r));
              return (
                <div key={g} className="rounded-xl border border-[#ece7dc] bg-[#faf7f2]/70 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div>
                      <span className="font-bold text-neutral-950">{GRUPOS[g] ?? g}</span>
                      <span className="ml-2 font-mono text-xs text-neutral-500">({g})</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-xs sm:text-sm">
                      <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-900">
                        {r.si} Sí
                      </span>
                      <span className="rounded bg-rose-100 px-2 py-0.5 font-bold text-rose-900">
                        {r.no} No
                      </span>
                      <span className="rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-900">
                        {r.abstencion} Abs.
                      </span>
                      {r.no_vota > 0 && (
                        <span className="text-neutral-500">{r.no_vota} no vota</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-200/70">
                    <div style={{ width: `${(r.si / totG) * 100}%` }} className="bg-emerald-600" />
                    <div style={{ width: `${(r.no / totG) * 100}%` }} className="bg-rose-600" />
                    <div style={{ width: `${(r.abstencion / totG) * 100}%` }} className="bg-amber-400" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-neutral-700">
            El registro oficial de esta votación no incluye el desglose por diputado.
          </p>
        )}

        <p className="mt-6 pt-4 border-t border-[#ece7dc] text-xs text-neutral-500">
          Fuente oficial:{' '}
          <a href={v.fuente_url} className="font-semibold text-neutral-800 underline" rel="noopener">
            Datos abiertos del Congreso de los Diputados (JSON oficial) ↗
          </a>
        </p>
      </section>
    </article>
  );
}
