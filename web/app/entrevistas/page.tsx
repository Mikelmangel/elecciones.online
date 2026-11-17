import type { Metadata } from 'next';
import Link from 'next/link';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import GaleriaEntrevistas from '@/components/GaleriaEntrevistas';
import { colorPartido } from '@/lib/colores';
import { analisisEntrevistas, entrevistas, factcheckingEntrevistas, fechaLarga } from '@/lib/datos';

export const metadata: Metadata = {
  title: 'Entrevistas en The Wild Project (Jordi Wild), La Revuelta, TV, Radio y Debates (29-N 2026)',
  description:
    'Vídeos y enlaces verificados a las entrevistas de los candidatos en The Wild Project (Jordi Wild), La Revuelta, RTVE, laSexta, radio y debates electorales del 29-N con fact-checking de datos.',
  alternates: { canonical: '/entrevistas' },
};

export default function EntrevistasPage() {
  const data = entrevistas();
  const analisisDoc = analisisEntrevistas();
  const slugsConAnalisis = analisisDoc.analisis.map((a) => a.slug);
  const factchecks = factcheckingEntrevistas().verificaciones.filter(
    (v) => v.revisado === true && v.veredicto !== 'NO COMPROBADO'
  );

  const badgeVeredicto = (v: string) => {
    switch (v) {
      case 'VERDADERO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'FALSO':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'CON MATICES':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };

  return (
    <article className="space-y-10">
      <BreadcrumbJsonLd items={[{ name: 'Inicio', path: '/' }, { name: 'Entrevistas y debates', path: '/entrevistas' }]} />

      <header className="max-w-3xl">
        <h1 className="font-editorial text-3xl font-bold leading-tight text-neutral-950 sm:text-5xl">
          Entrevistas y debates
        </h1>
        <p className="mt-3 text-base leading-relaxed text-neutral-700">
          Entrevistas íntegras a los candidatos en podcasts, televisión y radio, y los debates electorales, con análisis editorial objetivo, contraste con los programas del 29-N y enlace a la fuente original en su minuto exacto.
        </p>
      </header>

      {/* Sección Destacada: Análisis Editoriales de Campaña */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-red-900">
              Especial 29-N · Análisis en profundidad
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-neutral-950">
              Grandes entrevistas analizadas
            </h2>
          </div>
          <span className="text-xs font-semibold text-neutral-500">
            {analisisDoc.analisis.length} entrevistas con análisis temático y contrastes
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {analisisDoc.analisis.slice(0, 6).map((item) => {
            const color = colorPartido(item.partido);
            return (
              <div
                key={item.slug}
                className="flex flex-col justify-between rounded-xl border border-[#dfd9cc] bg-white p-5 shadow-2xs space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ece7dc] pb-2">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow-2xs"
                      style={{ backgroundColor: color }}
                    >
                      {item.partido}
                    </span>
                    <span className="text-xs font-semibold text-neutral-500">
                      {item.fecha ?? '2026'} · {item.duracion_aprox}
                    </span>
                  </div>
                  <h3 className="font-editorial text-lg font-bold text-neutral-950 leading-snug">
                    {item.persona}
                  </h3>
                  <p className="text-xs font-semibold text-neutral-600">
                    {item.medio}
                  </p>
                  <p className="line-clamp-3 text-xs leading-relaxed text-neutral-700">
                    {item.resumen_ejecutivo}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#ece7dc]">
                  <Link
                    href={`/espana/generales/2026/entrevistas/${item.slug}`}
                    className="inline-flex min-h-9 items-center gap-1 text-xs font-bold text-red-900 hover:underline"
                  >
                    <span>Ver análisis, claves y minutaje →</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {factchecks.length > 0 && (
        <p className="text-sm">
          <a href="#verificadas" className="font-semibold text-red-900 underline underline-offset-2">
            {factchecks.length} declaraciones comprobadas con datos oficiales
          </a>
        </p>
      )}

      <section>
        <h2 className="font-editorial text-2xl font-bold text-neutral-950">Debates electorales</h2>
        <ul className="mt-3 divide-y divide-[#e4dfd3] border-y border-[#e4dfd3]">
          {data.debates.map((d) => (
            <li key={d.fuente_url} className="py-3">
              <p className="text-sm text-neutral-600">
                <span className="font-semibold text-neutral-900">{d.fecha ? fechaLarga(d.fecha) : 'Fecha por confirmar'}</span> · {d.medio}
              </p>
              <a href={d.fuente_url} target="_blank" rel="noopener noreferrer" className="mt-0.5 block font-semibold text-neutral-950 hover:text-red-900 hover:underline">
                {d.titulo}
              </a>
              <p className="mt-0.5 text-sm text-neutral-600">{d.participantes.join(' · ')}</p>
              {d.nota && <p className="mt-0.5 text-sm text-neutral-500">{d.nota}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-editorial text-2xl font-bold text-neutral-950">Todas las entrevistas</h2>
        <GaleriaEntrevistas data={data} slugsConAnalisis={slugsConAnalisis} />
      </section>

      {/* Sección Fact-checking y Crosscheck de Afirmaciones */}
      {factchecks.length > 0 && (
      <section id="verificadas" className="scroll-mt-24 space-y-6 border-t border-[#dfd9cc] pt-8">
        <div className="max-w-3xl">
          <h2 className="font-editorial text-2xl font-bold text-neutral-950 sm:text-3xl">
            Declaraciones comprobadas
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            Comprobación automática: solo aparecen las declaraciones cuya prueba es una votación del Congreso o una serie estadística oficial que tenemos descargada y que confirma o desmiente lo dicho. El resto se muestran como cita, sin veredicto.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {factchecks.map((fc) => (
            <div
              key={fc.id}
              className="flex min-w-0 flex-col justify-between space-y-4 rounded-xl border border-[#dfd9cc] bg-white p-4 sm:p-5"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ece7dc] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: colorPartido(fc.partido) }}
                    />
                    <span className="font-bold text-sm text-neutral-950">{fc.persona}</span>
                    <span className="text-xs text-neutral-500">({fc.partido})</span>
                  </div>
                  {fc.revisado && (
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider ${badgeVeredicto(
                      fc.veredicto
                    )}`}
                  >
                    {fc.veredicto}
                  </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-neutral-500 font-medium">
                    {fc.medio}
                  </span>
                  {fc.entrevista_url ? (
                    <a
                      href={fc.entrevista_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 font-mono text-xs font-bold text-neutral-800 transition"
                      title="Abrir momento de la entrevista"
                    >
                      <span>Minuto {fc.contexto_minuto}</span>
                      <span className="text-red-800 font-sans">[↗]</span>
                    </a>
                  ) : (
                    <span className="font-mono text-xs text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                      Minuto {fc.contexto_minuto}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 rounded-lg bg-[#faf7f2] p-3 text-sm leading-relaxed text-neutral-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-xs font-semibold text-neutral-600">
                      Cita literal, minuto {fc.contexto_minuto}
                    </strong>
                    <span className="font-mono text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded" title={`Fichero raw: ${fc.raw_file} · SHA-256: ${fc.sha256}`}>
                      raw/{fc.raw_file} · sha256:{fc.sha256.slice(0, 8)}
                    </span>
                  </div>
                  <p className="font-editorial text-base italic text-neutral-900">&ldquo;{fc.cita_literal}&rdquo;</p>
                  <p className="text-xs text-neutral-600 pt-1 border-t border-neutral-200/70">
                    <strong>Tesis contrastada:</strong> {fc.afirmacion}
                  </p>
                </div>

                {(fc.cruce_programa || fc.cruce_votacion) && (
                  <div className="rounded-xl border border-[#e4dfd3] bg-white p-3 text-xs space-y-1.5 text-neutral-800">
                    {fc.cruce_programa && (
                      <p>
                        <strong className="text-neutral-950">En su programa / web: </strong>
                        {fc.cruce_programa}
                      </p>
                    )}
                    {fc.cruce_votacion && (
                      <p>
                        <strong className="text-neutral-950">En el Congreso: </strong>
                        {fc.cruce_votacion}
                      </p>
                    )}
                  </div>
                )}

                {fc.revisado && (
                <>
                <div className="rounded-lg bg-blue-50 p-3 text-sm leading-relaxed text-blue-950">
                  <strong className="mb-1 block text-xs font-semibold text-blue-900">
                    Dato oficial
                  </strong>
                  {fc.dato_oficial}
                </div>

                <p className="text-sm leading-relaxed text-neutral-700">
                  <strong>Evaluación:</strong> {fc.explicacion}
                </p>
                </>
                )}
              </div>

              <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                {fc.entrevista_url ? (
                  <a
                    href={fc.entrevista_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded-lg transition"
                  >
                    <span>Ver entrevista</span>
                    <span className="font-mono text-xs text-red-800">[↗]</span>
                  </a>
                ) : (
                  <span className="text-neutral-500 truncate max-w-[200px]">
                    {fc.fuente_oficial_nombre}
                  </span>
                )}
                <a
                  href={fc.fuente_oficial_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-red-900 underline hover:text-red-700 ml-auto"
                >
                  Ver dato en fuente oficial ({fc.fuente_oficial_nombre.split('·')[0].trim()}) ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}
    </article>
  );
}
