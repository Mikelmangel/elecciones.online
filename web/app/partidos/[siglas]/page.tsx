import { notFound } from 'next/navigation';
import Link from 'next/link';
import { colorPartido } from '@/lib/colores';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import { AREAS, type Area, entrevistas, fechaLarga, GRUPOS, programas, slug, votaciones, votacionesClave } from '@/lib/datos';
import { PARTIDOS, partidoPorSlug } from '@/lib/partidos';
import { rutas } from '@/lib/rutas';
import IndicePagina from '@/components/IndicePagina';

type Props = { params: Promise<{ siglas: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => PARTIDOS.map((p) => ({ siglas: p.slug }));

export async function generateMetadata({ params }: Props) {
  const { siglas } = await params;
  const p = partidoPorSlug(siglas);
  return p
    ? {
        title: `Programa electoral ${p.siglas} — Elecciones Generales 29-N`,
        description: `Programa electoral de ${p.nombre} (${p.siglas}) para las elecciones generales del 29-N: medidas oficiales extraídas del PDF con cita y página, votaciones en el Congreso y entrevistas.`,
        alternates: { canonical: rutas.partido(siglas) },
      }
    : {};
}

const TEMAS_DIA_A_DIA: { area: Area; icono: string; etiqueta: string }[] = [
  { area: 'vivienda', icono: '', etiqueta: 'Vivienda y alquiler' },
  { area: 'impuestos', icono: '', etiqueta: 'Bolsillo e impuestos' },
  { area: 'empleo', icono: '', etiqueta: 'Trabajo y salarios' },
  { area: 'pensiones', icono: '', etiqueta: 'Pensiones' },
  { area: 'sanidad', icono: '', etiqueta: 'Sanidad' },
  { area: 'educacion', icono: '', etiqueta: 'Educación' },
  { area: 'energia_clima', icono: '', etiqueta: 'Luz y energía' },
  { area: 'seguridad_justicia', icono: '', etiqueta: 'Justicia y seguridad' },
];

function sentidoVoto(r: { si: number; no: number; abstencion: number; no_vota: number } | undefined) {
  if (!r) return { texto: 'Sin datos', clase: 'bg-neutral-100 text-neutral-600 border-neutral-200' };
  const max = Math.max(r.si, r.no, r.abstencion);
  if (max === 0) return { texto: 'Sin datos', clase: 'bg-neutral-100 text-neutral-600 border-neutral-200' };
  if (r.si === max && r.si > r.no && r.si > r.abstencion) {
    return { texto: `Votó SÍ (${r.si})`, clase: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
  }
  if (r.no === max && r.no > r.si && r.no > r.abstencion) {
    return { texto: `Votó NO (${r.no})`, clase: 'bg-rose-100 text-rose-900 border-rose-300' };
  }
  if (r.abstencion === max) {
    return { texto: `Abstención (${r.abstencion})`, clase: 'bg-amber-100 text-amber-900 border-amber-300' };
  }
  return { texto: 'Voto dividido', clase: 'bg-neutral-100 text-neutral-700 border-neutral-300' };
}

export default async function PartidoPage({ params }: Props) {
  const { siglas } = await params;
  const partido = partidoPorSlug(siglas);
  if (!partido) notFound();

  const prog = programas().find((x) => slug(x.siglas) === (partido.programaSlug ?? partido.slug));
  const entr = entrevistas().entrevistas.filter((e) => e.partido === partido.entrevistaKey);
  const mapaVot = new Map(votaciones().map((v) => [v.id, v]));
  const claves = votacionesClave().votaciones;

  return (
    <article className="space-y-10">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'España', path: rutas.pais() },
          { name: 'Generales 2026', path: rutas.eleccion() },
          { name: 'Partidos', path: rutas.partidos() },
          { name: partido.siglas, path: rutas.partido(partido.slug) },
        ]}
      />

      <header className="max-w-3xl">
        <p className="flex items-center gap-2 text-sm text-neutral-600">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colorPartido(partido.siglas) }} aria-hidden />
          {partido.nombre}
          {partido.grupoCongreso && <> · Grupo {GRUPOS[partido.grupoCongreso] ?? partido.grupoCongreso} en el Congreso</>}
        </p>
        <h1 className="mt-2 font-editorial text-3xl font-bold leading-tight text-neutral-950 sm:text-5xl">
          Programa de {partido.siglas} para el 29-N
        </h1>
        <p className="mt-3 text-base leading-relaxed text-neutral-700">
          {prog ? (
            <>
              <strong>{prog.propuestas.length} medidas</strong> de su programa, cada una con su cita y su página, y lo que ha votado su grupo en el Congreso.
            </>
          ) : (
            <>
              Su programa para el 29-N no se ha publicado en PDF. Mientras tanto, aquí está <strong>lo que ha votado su grupo en el Congreso</strong> y sus entrevistas.
            </>
          )}
        </p>
        {prog && (
          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href={`/espana/generales/2026/programas/${slug(prog.siglas)}`} className="font-semibold text-red-900 underline underline-offset-2">
              Todas las medidas
            </Link>
            <a href={prog.fuente_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-red-900 underline underline-offset-2">
              Programa oficial (PDF)
            </a>
          </p>
        )}
      </header>

      <IndicePagina
        secciones={[
          ['temas', 'Por temas'],
          ...(partido.grupoCongreso ? ([['votaciones-congreso', 'Votaciones']] as const) : []),
          ['entrevistas-verificadas', 'Entrevistas'],
        ]}
      />

      <section id="temas" className="scroll-mt-28">
        <h2 className="font-editorial text-2xl font-bold text-neutral-950 sm:text-3xl">Qué propone, por temas</h2>
        <div className="mt-4 grid grid-cols-1 gap-x-10 md:grid-cols-2">
          {TEMAS_DIA_A_DIA.map(({ area, etiqueta }) => {
            const delTema = prog ? prog.propuestas.filter((p) => p.area === area) : [];
            return (
              <div key={area} className="border-t border-[#e4dfd3] py-5">
                <h3 className="flex items-baseline justify-between gap-3 font-editorial text-xl font-bold text-neutral-950">
                  {etiqueta}
                  {prog && <span className="font-sans text-sm font-normal text-neutral-500 tabular-nums">{delTema.length} medidas</span>}
                </h3>
                {delTema.length > 0 ? (
                  <ul className="mt-3 space-y-2.5">
                    {delTema.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="text-sm leading-relaxed text-neutral-800">
                        &ldquo;{item.cita}&rdquo; <span className="whitespace-nowrap text-neutral-500">(pág. {item.pagina})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-neutral-600">
                    {prog ? 'Sin medidas específicas en su programa.' : 'Pendiente del programa en PDF.'}
                  </p>
                )}
                <Link href={rutas.partidoArea(partido.slug, area)} className="mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-red-900 underline underline-offset-2">
                  {delTema.length > 3 ? `Ver las ${delTema.length} medidas y sus votaciones` : 'Ver medidas y votaciones'}
                </Link>
              </div>
            );
          })}
        </div>
        <details className="mt-2 border-t border-[#e4dfd3]">
          <summary className="flex min-h-12 cursor-pointer items-center text-sm font-semibold text-neutral-950">Los 18 temas</summary>
          <ul className="grid grid-cols-1 pb-4 sm:grid-cols-2 md:grid-cols-3">
            {(Object.entries(AREAS) as [Area, string][]).map(([area, nombre]) => {
              const n = prog ? prog.propuestas.filter((x) => x.area === area).length : 0;
              return (
                <li key={area}>
                  <Link href={rutas.partidoArea(partido.slug, area)} className="flex min-h-11 items-center justify-between gap-3 border-b border-[#ece7dc] pr-4 text-sm text-neutral-900 hover:text-red-900">
                    {nombre}
                    {prog && <span className="text-neutral-500 tabular-nums">{n}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </details>
      </section>

      {partido.grupoCongreso && (
        <section id="votaciones-congreso" className="scroll-mt-28">
          <h2 className="font-editorial text-2xl font-bold text-neutral-950 sm:text-3xl">Qué ha votado en el Congreso</h2>
          <p className="mt-2 max-w-3xl text-sm text-neutral-600">
            Voto del Grupo {GRUPOS[partido.grupoCongreso] ?? partido.grupoCongreso} en la XV Legislatura.
            {partido.grupoEsCoalicion && ' Este grupo reúne a varios partidos: su voto no es necesariamente el de cada uno.'}
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-x-10 border-t border-[#e4dfd3] sm:grid-cols-2">
            {claves.slice(0, 14).map((c) => {
              const v = mapaVot.get(c.id);
              if (!v) return null;
              const s = sentidoVoto(v.por_grupo?.[partido.grupoCongreso!]);
              return (
                <li key={c.id} className="flex items-center justify-between gap-3 border-b border-[#e4dfd3] py-3">
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-500">{AREAS[c.tema]} · {v.fecha}</p>
                    <Link href={`/espana/congreso/xv-legislatura/votaciones/${v.id}`} className="text-sm font-semibold text-neutral-900 hover:text-red-900 hover:underline">
                      {c.titulo_llano}
                    </Link>
                  </div>
                  <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-bold ${s.clase}`}>{s.texto}</span>
                </li>
              );
            })}
          </ul>
          <Link href="/espana/congreso/xv-legislatura/votaciones/clave" className="mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-red-900 underline underline-offset-2">
            Comparar con el resto de partidos
          </Link>
        </section>
      )}

      <section id="entrevistas-verificadas" className="scroll-mt-28">
        <h2 className="font-editorial text-2xl font-bold text-neutral-950 sm:text-3xl">Entrevistas</h2>
        {entr.length ? (
          <ul className="mt-4 divide-y divide-[#e4dfd3] border-y border-[#e4dfd3]">
            {entr.map((e) => (
              <li key={e.fuente_url} className="py-3">
                <a href={e.fuente_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-neutral-950 hover:text-red-900 hover:underline">
                  {e.titulo}
                </a>
                <p className="mt-0.5 text-sm text-neutral-600">
                  {e.persona} · {e.medio}{e.fecha ? ` · ${fechaLarga(e.fecha)}` : ''}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-neutral-600">Sin entrevistas registradas todavía.</p>
        )}
      </section>
    </article>
  );
}
