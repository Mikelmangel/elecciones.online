import { notFound } from 'next/navigation';
import Link from 'next/link';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import Propuesta from '@/components/Propuesta';
import { colorPartido } from '@/lib/colores';
import resumenesDoc from '../../../../../data/resumenes_programas.json';
import {
  AREAS,
  type Area,
  entrevistas,
  factcheckingEntrevistas,
  fechaLarga,
  GRUPOS,
  programas,
  slug,
  votaciones,
  votacionesClave,
} from '@/lib/datos';
import { PARTIDOS, partidoPorSlug } from '@/lib/partidos';
import { rutas } from '@/lib/rutas';

type Props = { params: Promise<{ siglas: string; area: string }> };

export const dynamicParams = false;
export const generateStaticParams = () =>
  PARTIDOS.flatMap((p) => Object.keys(AREAS).map((area) => ({ siglas: p.slug, area })));

export async function generateMetadata({ params }: Props) {
  const { siglas, area } = await params;
  const p = partidoPorSlug(siglas);
  const nombreArea = AREAS[area as Area];
  return p && nombreArea
    ? {
        title: `Medidas ${nombreArea.toLowerCase()} - ${p.siglas} elecciones generales 29-N`,
        description: `Medidas y propuestas de ${nombreArea.toLowerCase()} en el programa electoral de ${p.nombre} (${p.siglas}) para las elecciones generales del 29-N: propuestas oficiales en PDF, votaciones en el Congreso y declaraciones verificadas.`,
        alternates: { canonical: rutas.partidoArea(siglas, area) },
      }
    : {};
}

function resumenVoto(r: { si: number; no: number; abstencion: number; no_vota: number } | undefined): string {
  if (!r) return 'Sin datos';
  const partes: string[] = [];
  if (r.si) partes.push(`${r.si} sí`);
  if (r.no) partes.push(`${r.no} no`);
  if (r.abstencion) partes.push(`${r.abstencion} abs.`);
  if (r.no_vota) partes.push(`${r.no_vota} no vota`);
  return partes.join(', ') || 'Sin datos';
}

export default async function PartidoAreaPage({ params }: Props) {
  const { siglas, area } = await params;
  const partido = partidoPorSlug(siglas);
  const nombreArea = AREAS[area as Area];
  if (!partido || !nombreArea) notFound();

  const prog = programas().find((x) => slug(x.siglas) === (partido.programaSlug ?? partido.slug));
  const medidas = prog ? prog.propuestas.filter((x) => x.area === area) : [];

  const mapaVot = new Map(votaciones().map((v) => [v.id, v]));
  const claveArea = votacionesClave().votaciones.filter((v) => v.tema === area);
  const entr = entrevistas().entrevistas.filter((e) => e.partido === partido.entrevistaKey);
  const factchecks = factcheckingEntrevistas().verificaciones.filter(
    (fc) => fc.revisado === true && fc.veredicto !== 'NO COMPROBADO' && (fc.partido === partido.siglas || fc.tema === area)
  );

  const resumenItem = (resumenesDoc.resumenes as Array<{
    siglas: string;
    area: string;
    resumen: string;
    a_quien_afecta: string;
    revisado?: boolean;
  }>).find(
    (r) => r.siglas.toUpperCase() === partido.siglas.toUpperCase() && r.area === area && r.revisado === true
  );

  return (
    <article className="space-y-10">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'España', path: rutas.pais() },
          { name: 'Generales 2026', path: rutas.eleccion() },
          { name: 'Partidos', path: rutas.partidos() },
          { name: partido.siglas, path: rutas.partido(partido.slug) },
          { name: nombreArea, path: rutas.partidoArea(partido.slug, area) },
        ]}
      />

      {/* Cabecera del área temática */}
      <header className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="h-3.5 w-3.5 rounded-full shrink-0"
              style={{ backgroundColor: colorPartido(partido.siglas) }}
            />
            <span className="min-w-0 break-words text-sm font-semibold text-neutral-500">
              {partido.nombre}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href={rutas.partido(partido.slug)}
              className="inline-flex min-h-11 items-center rounded-lg border border-neutral-300 bg-[#faf7f2] px-3 font-semibold text-neutral-800 hover:bg-neutral-900 hover:text-white transition"
            >
              ← Todos los temas de {partido.siglas}
            </Link>
            <Link
              href={rutas.comparador(area)}
              className="inline-flex min-h-11 items-center rounded-lg bg-red-900 px-3 font-bold text-white hover:bg-red-800 transition"
            >
              Comparar con otros partidos →
            </Link>
          </div>
        </div>

        <h1 className="break-words font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-950">
          Medidas {nombreArea.toLowerCase()} — {partido.siglas} elecciones generales 29-N
        </h1>

        <p className="mt-3 text-base text-neutral-600 max-w-3xl leading-relaxed">
          {prog ? (
            <>
              Todas las <strong>{medidas.length} propuestas literales</strong> extraídas de su{' '}
              <a href={prog.fuente_url} className="font-semibold text-neutral-900 underline" rel="noopener">
                programa oficial en PDF
              </a>
              , junto con lo que votaron sus diputados en el Congreso y sus declaraciones verificadas.
            </>
          ) : (
            <>
              {partido.nombre} no ha publicado todavía su programa oficial en PDF para 2026. Aquí recogemos las votaciones reales de su grupo parlamentario en el Congreso y sus entrevistas verificadas en esta materia.
            </>
          )}
        </p>
      </header>

      {/* MÓDULO 1: RESUMEN VERIFICADO EN ESTA ÁREA */}
      <section className="border-t border-[#dfd9cc] pt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-editorial text-xl sm:text-2xl font-bold text-neutral-950">
              Resumen de medidas de {nombreArea.toLowerCase()} ({partido.siglas}) para el 29-N
            </h2>
            <p className="text-sm text-neutral-600">
              {medidas.length} medidas registradas. Cada propuesta incluye la cita literal y la página exacta del programa oficial, sin valoraciones subjetivas.
            </p>
          </div>
          <Link
            href={rutas.comparador(area)}
            className="inline-flex min-h-11 items-center rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-900 transition sm:shrink-0"
          >
            Comparar {partido.siglas} con otros partidos en {nombreArea} →
          </Link>
        </div>

        {resumenItem && (
          <div className="bg-[#faf7f2] p-4 text-sm text-neutral-800">
            <p className="leading-relaxed">{resumenItem.resumen}</p>
            <p className="mt-2.5">
              <strong className="font-semibold text-neutral-950">A quién afecta:</strong> {resumenItem.a_quien_afecta}
            </p>
            <p className="mt-2 text-xs text-neutral-600">
              Resumen de elecciones.online a partir de las medidas de abajo. No es una cita del programa.
            </p>
          </div>
        )}
      </section>

      {/* MÓDULO 2: TODAS LAS PROPUESTAS OFICIALES DEL PROGRAMA */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-neutral-950">
              Propuestas de {nombreArea.toLowerCase()} en el programa electoral de {partido.siglas} (29-N)
            </h2>
          </div>
          {prog && (
            <a
              href={prog.fuente_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center text-sm font-bold text-red-900 underline"
            >
              Abrir programa original en PDF ↗
            </a>
          )}
        </div>

        {!prog ? (
          <div className="border-t border-[#dfd9cc] pt-4 text-sm text-neutral-600">
            Programa oficial de 2026 no publicado todavía en PDF. En cuanto se registre ante la Junta Electoral Central se incorporarán las medidas literales.
          </div>
        ) : medidas.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {medidas.map((x) => (
              <Propuesta key={x.pagina + x.cita} p={x} pdf={prog.fuente_url} />
            ))}
          </ul>
        ) : (
          <div className="border-t border-[#dfd9cc] pt-4 text-sm text-neutral-600">
            Su programa de 2026 no incluye medidas concretas clasificadas en {nombreArea.toLowerCase()}.
          </div>
        )}
      </section>

      {/* MÓDULO 3: QUÉ HA VOTADO DE VERDAD EN EL CONGRESO EN ESTE TEMA */}
      <section className="space-y-4">
        <div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-neutral-950">
            Qué votó {partido.siglas} en {nombreArea.toLowerCase()} en la XV Legislatura
          </h2>
          {partido.grupoCongreso && (
            <p className="text-sm text-neutral-600 mt-1">
              Registro oficial de votos del Grupo <strong>{GRUPOS[partido.grupoCongreso] ?? partido.grupoCongreso}</strong> (<code>{partido.grupoCongreso}</code>).
            </p>
          )}
        </div>

        {claveArea.length && partido.grupoCongreso ? (
          <div className="divide-y divide-[#ece7dc] border-y border-[#ece7dc] sm:grid sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0 sm:border-y-0">
            {claveArea.map((item) => {
              const v = mapaVot.get(item.id);
              if (!v) return null;
              const voto = v.por_grupo?.[partido.grupoCongreso!];
              const resumen = resumenVoto(voto);
              const urlVot = rutas.votacionCongreso(item.id, item.titulo_llano);

              return (
                <div
                  key={item.id}
                  className="flex min-w-0 flex-col justify-between space-y-2 py-4 text-sm sm:border-b sm:border-[#ece7dc]"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                      <span>Votación {item.id}</span>
                      <span>{fechaLarga(v.fecha)}</span>
                    </div>
                    <Link
                      href={urlVot}
                      className="font-editorial text-base font-bold text-neutral-950 hover:text-red-900 hover:underline block break-words"
                    >
                      {item.titulo_llano} →
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-neutral-600">Sentido de voto:</span>
                    <strong className="rounded bg-neutral-100 px-2 py-0.5 font-bold text-neutral-900">
                      {resumen}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border-t border-[#dfd9cc] pt-4 text-sm text-neutral-600">
            No constan votaciones clave catalogadas bajo este tema en la base de datos de la XV Legislatura.{' '}
            <Link href="/espana/congreso/xv-legislatura/votaciones/clave" className="font-bold text-red-900 underline">
              Ver las 38 votaciones clave generales →
            </Link>
          </div>
        )}
      </section>

      {/* MÓDULO 4: FACT-CHECKING Y ENTREVISTAS EN ESTE TEMA */}
      {(factchecks.length > 0 || entr.length > 0) && (
        <section className="space-y-4 pt-4 border-t border-[#dfd9cc]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-editorial text-2xl font-bold text-neutral-950">
                Declaraciones y fact-checking sobre {nombreArea.toLowerCase()} ({partido.siglas})
              </h2>
            </div>
            <Link
              href={rutas.entrevistas()}
              className="inline-flex min-h-11 items-center text-sm font-bold text-red-900 underline"
            >
              Ver todas las entrevistas →
            </Link>
          </div>

          {factchecks.length > 0 ? (
            <div className="divide-y divide-[#ece7dc] border-y border-[#ece7dc] md:grid md:grid-cols-2 md:gap-x-6 md:divide-y-0 md:border-y-0">
              {factchecks.map((fc) => (
                <div
                  key={fc.id}
                  className="min-w-0 space-y-2 py-4 text-sm md:border-b md:border-[#ece7dc]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-neutral-900">{fc.persona} ({fc.partido})</span>
                    <span className="rounded bg-emerald-100 text-emerald-900 px-2 py-0.5 text-xs font-bold">
                      {fc.veredicto}
                    </span>
                  </div>
                  <p className="break-words italic text-neutral-800">&ldquo;{fc.afirmacion}&rdquo;</p>
                  <p className="text-neutral-600"><strong>Dato oficial:</strong> {fc.dato_oficial}</p>
                  <div className="flex flex-wrap items-center justify-between gap-x-3 text-xs">
                    <span>{fc.medio}</span>
                    {fc.entrevista_url && (
                      <Link
                        href={`/espana/generales/2026/entrevistas/${fc.entrevista_id}`}
                        className="inline-flex min-h-11 items-center font-bold text-red-900 underline"
                      >
                        Minuto {fc.contexto_minuto} →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {entr.slice(0, 4).map((e) => (
                <div
                  key={e.fuente_url}
                  className="rounded-xl border border-[#ece7dc] bg-[#faf9f6] p-4 flex flex-col justify-between space-y-2"
                >
                  <div>
                    <span className="text-xs font-semibold text-neutral-500">
                      {e.fecha ?? '2026'} · {e.medio}
                    </span>
                    <h3 className="font-editorial text-base font-bold text-neutral-950 mt-1">
                      {e.titulo}
                    </h3>
                  </div>
                  <Link
                    href={`/espana/generales/2026/entrevistas/${e.slug || e.id}`}
                    className="inline-flex min-h-9 items-center gap-1 text-xs font-bold text-red-900 hover:underline"
                  >
                    Ver vídeo y declaraciones con minutaje →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </article>
  );
}
