import Link from 'next/link';
import BuscadorVotaciones, { type VotacionResumenItem } from '@/components/BuscadorVotaciones';
import { coherenciaVotaciones, votaciones, votacionesClave } from '@/lib/datos';
import { rutas } from '@/lib/rutas';

export const metadata = {
  title: 'Las 2.175 Votaciones del Congreso (XV Legislatura) · Auditoría cara al 29-N',
  description:
    'Busca y filtra las 2.175 votaciones nominales del Pleno del Congreso en la XV Legislatura, leyes clave, decretos y sentido de voto de cada grupo parlamentario.',
  alternates: { canonical: '/espana/congreso/xv-legislatura/votaciones' },
};

export default function Page() {
  const todas = votaciones();
  const clavesMap = new Map(votacionesClave().votaciones.map((c) => [c.id, c]));
  const coherenciaMap = new Map(coherenciaVotaciones().casos.map((c) => [c.id_votacion, c]));
  const porAnio = Object.groupBy(todas, (v) => v.fecha.slice(0, 4));

  const items: VotacionResumenItem[] = [...todas]
    .reverse()
    .map((v) => {
      const clave = clavesMap.get(v.id);
      const coherencia = coherenciaMap.get(v.id);
      const textoBase = clave?.titulo_llano ?? v.texto_expediente ?? v.titulo;
      return {
        id: v.id,
        slugUrl: rutas.votacionCongreso(v.id, textoBase),
        fecha: v.fecha,
        titulo: v.titulo,
        expediente: v.texto_expediente ?? '',
        subgrupo: v.titulo_subgrupo ?? '',
        si: v.totales.si,
        no: v.totales.no,
        abs: v.totales.abstencion,
        esClave: Boolean(clave),
        tituloLlano: clave?.titulo_llano ?? null,
        casoCoherencia: coherencia
          ? {
              tipo: coherencia.tipo_coherencia,
              etiqueta: coherencia.etiqueta,
              resumen: coherencia.resumen,
            }
          : null,
      };
    });

  return (
    <div className="space-y-8">
      <header className="border-b border-[#e4dfd3] pb-6">
        <div className="flex flex-wrap items-center gap-x-2 text-sm text-neutral-600 mb-2">
          <Link href={rutas.pais()} className="inline-flex min-h-8 items-center underline hover:text-red-900">
            España
          </Link>
          <span>/</span>
          <span>Congreso de los Diputados</span>
          <span>/</span>
          <span className="text-red-900">XV Legislatura (2023–2026)</span>
        </div>

        <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-neutral-950">
          Explorador completo: las {todas.length.toLocaleString('es-ES')} votaciones de la legislatura
        </h1>
        <p className="mt-2 text-sm sm:text-base text-neutral-600 max-w-3xl">
          Busca en <strong>todas las votaciones celebradas en el Pleno</strong>, consulta la matriz comparativa por grupo parlamentario o inspecciona los Reales Decretos-leyes donde iban varias medidas mezcladas.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <a
            href="#buscador-votaciones"
            className="rounded-xl bg-neutral-900 px-4 py-3 text-xs font-bold text-white hover:bg-neutral-800 transition flex items-center justify-between"
          >
            <span>1. Buscador de las {todas.length.toLocaleString('es-ES')} votaciones</span>
            <span>↓</span>
          </a>
          <Link
            href="/espana/congreso/xv-legislatura/votaciones/clave"
            className="rounded-xl border border-[#dfd9cc] bg-[#faf7f2] px-4 py-3 text-xs font-bold text-neutral-900 hover:bg-neutral-100 transition flex items-center justify-between"
          >
            <span>2. Matriz de 38 votaciones clave (por grupo)</span>
            <span>→</span>
          </Link>
          <Link
            href={rutas.hemeroteca()}
            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-950 hover:bg-amber-100 transition flex items-center justify-between"
          >
            <span>3. Decretos Ómnibus y Hemeroteca</span>
            <span>→</span>
          </Link>
        </div>
      </header>

      {coherenciaVotaciones().casos.length > 0 && (
      <section className="rounded-2xl border border-amber-300 bg-amber-50/60 p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-3">
          <div>
            <span className="inline-block rounded bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-950 mb-1">
              Auditoría Dicho vs. Hecho
            </span>
            <h2 className="font-editorial text-2xl font-bold text-neutral-950">
              Quién cumplió su programa y quién cambió de voto en el Congreso
            </h2>
          </div>
          <Link
            href={rutas.hemeroteca()}
            className="text-xs font-bold text-amber-950 hover:underline"
          >
            Ver informe completo en Hemeroteca →
          </Link>
        </div>

        <p className="text-sm text-neutral-700 max-w-3xl leading-relaxed">
          Comprobamos si lo que votaron los diputados en el hemiciclo coincide con lo que prometieron en campaña o si cambiaron de posición respecto a su programa electoral.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coherenciaVotaciones().casos.map((caso) => (
            <div
              key={caso.id_votacion}
              className="rounded-xl border border-amber-300 bg-white p-4 space-y-2.5 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="rounded bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-xs font-mono font-bold">
                    Votación #{caso.id_votacion}
                  </span>
                  <span className="text-xs font-bold text-neutral-500">
                    {caso.etiqueta}
                  </span>
                </div>
                <h3 className="mt-2 font-bold text-sm text-neutral-900 leading-snug">
                  {caso.titulo_llano}
                </h3>
                <p className="mt-1 text-xs text-neutral-600 leading-relaxed line-clamp-3">
                  {caso.resumen}
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {caso.partidos.map((p) => (
                    <span
                      key={p.siglas}
                      className="rounded px-1.5 py-0.2 text-xs font-bold bg-neutral-100 text-neutral-800"
                    >
                      {p.siglas}: {p.voto_emitido.split(' ')[0]}
                    </span>
                  ))}
                </div>
                <Link
                  href={rutas.votacionCongreso(caso.id_votacion, caso.titulo_llano)}
                  className="text-xs font-bold text-red-900 hover:underline"
                >
                  Ver acta →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      <div id="buscador-votaciones">
        <BuscadorVotaciones items={items} />
      </div>

      <section className="rounded-2xl border border-[#dfd9cc] bg-white p-6">
        <h2 className="font-editorial text-xl font-bold text-neutral-950 mb-3">
          Archivo completo por año
        </h2>
        <ul className="grid gap-3 sm:grid-cols-4">
          {Object.entries(porAnio)
            .sort()
            .reverse()
            .map(([anio, lista]) => (
              <li key={anio} className="rounded-xl border border-[#ece7dc] bg-[#faf7f2] p-4">
                <Link href={`/espana/congreso/xv-legislatura/votaciones/anio/${anio}`} className="font-editorial text-2xl font-bold text-neutral-950 hover:text-red-900 hover:underline">
                  {anio}
                </Link>
                <p className="text-xs text-neutral-600 mt-1">{lista!.length} votaciones nominales</p>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
