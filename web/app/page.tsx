import type { Metadata } from 'next';
import Link from 'next/link';
import { DONACION_URL } from '@/content/legal';
import { MapaEspana } from '@/components/MapaEspana';
import ResumenCiudadano from '@/components/ResumenCiudadano';
import { colorPartido } from '@/lib/colores';
import {
  boeElectoral,
  candidaturas2026,
  convocatoria,
  eleccionActiva,
  entrevistas,
  fechaLarga,
  miles,
  resultados2023,
  actualidad,
} from '@/lib/datos';
import { construirDatosMapa } from '@/lib/mapa';
import { fase } from '@/lib/modo-electoral';
import { titularesVisibles } from '@/lib/titulares-visibles';
import { construirTemasCiudadanos } from '@/lib/resumen-ciudadano';
import { rutas } from '@/lib/rutas';
import IndicePagina from '@/components/IndicePagina';

const INDICE = [
  ['ultima-hora', 'Última hora'],
  ['votar', 'Votar'],
  ['temas', 'Qué propone cada partido'],
  ['entrevistas', 'Entrevistas'],
  ['mapa', 'Mapa'],
  ['apoya', 'Apoyar'],
] as const;

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const GUIAS_RAPIDAS = [
  ['Busca tu colegio electoral', 'Buscador oficial del INE por provincia, municipio y calle.', 'https://sede.ine.gob.es/ce-mesas/?lang=es_ES'],
  ['Cómo votar y voto por correo', 'Plazos, documentos y voto desde el extranjero.', rutas.guia('como-votar')],
  ['Cuál es tu colegio electoral', 'Mesa, sección y local: cómo se asignan.', rutas.guia('colegio-electoral')],
  ['Si te ha tocado mesa electoral', 'Sorteo, notificación, excusas en 7 días y dietas.', rutas.guia('mesa-electoral')],
] as const;

export default function Home() {
  const eleccion = eleccionActiva();
  const faseActual = fase(new Date(), eleccion.fecha_eleccion);
  const conv = convocatoria();
  const res23 = resultados2023();
  const cands26 = candidaturas2026();
  const dataEntrevistas = entrevistas();
  const entrevistasRecientes = dataEntrevistas.entrevistas.slice(0, 6);

  const mapa23 = new Map(res23.provincias.map((p) => [p.codigo, p.escanos]));
  const cambiosEscanos = conv.circunscripciones
    .map((c) => ({ nombre: c.nombre, antes: mapa23.get(c.codigo) ?? 0, ahora: c.diputados, diff: c.diputados - (mapa23.get(c.codigo) ?? 0) }))
    .filter((x) => x.diff !== 0);

  const totalListas26 = cands26.circunscripciones.reduce((acc, c) => acc + c.candidaturas.length, 0);
  const censoTotal23 = res23.provincias.reduce((acc, p) => acc + p.censo, 0);
  const provinciasMapa = construirDatosMapa();
  const temasCiudadanos = construirTemasCiudadanos();
  const boeReciente = boeElectoral().disposiciones.slice(0, 4);


  const h2 = 'font-editorial text-2xl sm:text-3xl font-bold text-neutral-950';
  const enlace = 'font-semibold text-red-900 underline hover:text-red-700';
  const seccion = 'scroll-mt-28 border-t border-[#dfd9cc] pt-10';

  // titulares más recientes de todas las fuentes, sin selección editorial: solo orden por fecha
  const { items: titulares, fetched_at: titularesAt } = actualidad();
  const ultimaHora = titularesVisibles([...titulares], eleccion.fecha_eleccion).sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 8);
  const hora = (iso: string) =>
    new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });

  return (
    <div className="space-y-12">
      <section className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-12">
        <div>
          <p className="mb-3 text-sm font-semibold text-red-900">Elecciones generales · 29 de noviembre de 2026</p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold leading-[1.1] text-neutral-950">
            Qué propone cada partido y qué ha votado en el Congreso
          </h1>
          <p className="mt-4 max-w-[60ch] text-lg text-neutral-700">
            Guía ciudadana para las elecciones generales del 29-N ({fechaLarga(eleccion.fecha_eleccion)}). Cada propuesta lleva la cita y la página de su programa; cada voto, el enlace a la votación del Congreso.
          </p>
          {faseActual === 'veda' && (
            <p className="mt-4 max-w-[60ch] rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-950">
              Periodo de prohibición de difusión de sondeos (art. 69.7 LOREG). El termómetro está cerrado hasta el cierre de urnas.
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href={rutas.comparador('vivienda')} className="inline-flex min-h-12 items-center rounded-md bg-neutral-950 px-5 font-semibold text-white transition-colors hover:bg-red-900">
              Comparar programas por tema
            </Link>
            {faseActual !== 'veda' && (
              <Link href="/espana/generales/2026/termometro" className="inline-flex min-h-12 items-center rounded-md border border-neutral-950 px-5 font-semibold text-neutral-950 transition-colors hover:bg-neutral-950 hover:text-white">
                Expresa tu opinión de voto
              </Link>
            )}
            <Link href="/espana/congreso/xv-legislatura/votaciones/clave" className={enlace}>Votaciones clave</Link>
            <Link href={rutas.candidaturas()} className={enlace}>Quién se presenta en tu provincia</Link>
          </div>
        </div>

        <div className="text-neutral-700 lg:border-l lg:border-[#dfd9cc] lg:pl-8">
          <h2 className="font-semibold text-neutral-950">Qué se elige</h2>
          <p className="mt-2">
            {eleccion.escanos_totales} diputados en 52 circunscripciones, con reparto D’Hondt y barrera del 3 %. La mayoría absoluta son {eleccion.mayoria_absoluta} escaños. Hay {totalListas26} listas proclamadas en el BOE.
          </p>
          {cambiosEscanos.length > 0 && (
            <p className="mt-3">
              Respecto a 2023:{' '}
              {cambiosEscanos.map((c) => `${c.nombre} pasa de ${c.antes} a ${c.ahora} escaños`).join(' y ')}.
            </p>
          )}
          <p className="mt-3 text-sm text-neutral-600">Censo en las generales de 2023: {miles(censoTotal23)} electores.</p>
          <p className="mt-3">
            <Link href="/espana/generales/2026/pactometro" className={enlace}>Probar pactos de investidura</Link>
          </p>
        </div>
      </section>

      <IndicePagina secciones={INDICE} />

      <section id="ultima-hora" className={seccion}>
        <h2 className={h2}>Última hora de la campaña</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Titulares más recientes de partidos, instituciones y medios, ordenados por fecha y sin selección editorial. Actualizado el {hora(titularesAt)}.
        </p>
        <ul className="mt-4 divide-y divide-[#e4dfd3] border-y border-[#e4dfd3]">
          {ultimaHora.map((n) => (
            <li key={n.url} className="py-3">
              <a href={n.url} target="_blank" rel="noopener nofollow" className="break-words font-medium text-neutral-950 hover:text-red-900 hover:underline">
                {n.titulo}
              </a>
              <p className="mt-0.5 text-sm text-neutral-600">
                {n.canal} · <time dateTime={n.fecha}>{hora(n.fecha)}</time>
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4"><Link href="/actualidad" className={enlace}>Todos los titulares</Link></p>
      </section>

      <section id="votar" className={seccion}>
        <h2 className={h2}>Para ir a votar</h2>
        <ul className="mt-5 grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {GUIAS_RAPIDAS.map(([titulo, texto, href]) => (
            <li key={href}>
              {href.startsWith('http') ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-neutral-950 underline decoration-[#c9c1b0] hover:decoration-red-800">
                  {titulo} (web del INE)
                </a>
              ) : (
                <Link href={href} className="text-lg font-semibold text-neutral-950 underline decoration-[#c9c1b0] hover:decoration-red-800">
                  {titulo}
                </Link>
              )}
              <p className="mt-1 text-neutral-700">{texto}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5"><Link href={rutas.guias()} className={enlace}>Todas las guías</Link></p>
      </section>

      <div id="temas" className={seccion}>
        <ResumenCiudadano temas={temasCiudadanos} />
      </div>

      <section id="entrevistas" className={`${seccion} grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-12`}>
        <div>
          <h2 className={h2}>Entrevistas recientes</h2>
          <ul className="mt-4">
            {entrevistasRecientes.map((e) => (
              <li key={e.fuente_url} className="border-b border-[#e4dfd3] py-3">
                <Link href={`/espana/generales/2026/entrevistas/${e.slug || e.id}`} className="group block">
                  <span className="flex items-center gap-2 font-semibold text-neutral-950 group-hover:text-red-900">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorPartido(e.partido) }} aria-hidden />
                    {e.persona} <span className="font-normal text-neutral-600">({e.partido})</span>
                  </span>
                  <span className="mt-0.5 block text-sm text-neutral-600">
                    {e.medio}{e.fecha ? ` · ${fechaLarga(e.fecha)}` : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4">
            <Link href="/espana/generales/2026/entrevistas" className={enlace}>
              Las {dataEntrevistas.entrevistas.length} entrevistas
            </Link>
          </p>
        </div>

        <div>
          <h2 className={h2}>Termómetro</h2>
          {faseActual === 'veda' ? (
            <p className="mt-4 text-neutral-700">Cerrado durante los cinco días previos a la votación (art. 69.7 LOREG).</p>
          ) : (
            <>
              <p className="mt-4 text-neutral-700">
                Indica a qué candidatura apoyarías en tu provincia. No es una encuesta: cuenta solo a quien participa aquí. Un apoyo por conexión cada 21 días.
              </p>
              <p className="mt-4"><Link href="/espana/generales/2026/termometro" className={enlace}>Participar en el termómetro</Link></p>
            </>
          )}
        </div>
      </section>

      <section id="mapa" className={seccion}>
        <MapaEspana provincias={provinciasMapa} />
      </section>

      {boeReciente.length > 0 && (
        <section id="boe" className={seccion}>
          <h2 className={h2}>Últimas resoluciones electorales en el BOE</h2>
          <ul className="mt-4">
            {boeReciente.map((d) => (
              <li key={d.identificador} className="border-b border-[#e4dfd3] py-3">
                <a href={d.url_html} target="_blank" rel="noopener noreferrer" className="text-neutral-950 hover:text-red-900 hover:underline">
                  {d.titulo}
                </a>
                <p className="mt-0.5 text-sm text-neutral-600">{d.identificador} · {fechaLarga(d.fecha)} · {d.departamento}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {DONACION_URL && (
        <section className={seccion} id="apoya">
          <h2 className={h2}>Apoya este proyecto</h2>
          <p className="mt-3 max-w-2xl text-neutral-700">
            elecciones.online no recibe dinero de partidos, candidatos, fundaciones ni administraciones.
            Si te resulta útil, puedes ayudar a pagar el servidor y el trabajo de descargar y comprobar cada dato.
          </p>
          <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              href={DONACION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center rounded-md bg-neutral-950 px-5 font-semibold text-white transition-colors hover:bg-red-900"
            >
              Hacer una aportación en Ko-fi
            </a>
            <Link href="/legal/transparencia" className="text-sm text-neutral-700 underline underline-offset-2 hover:text-neutral-950">
              En qué se gasta: transparencia
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}
