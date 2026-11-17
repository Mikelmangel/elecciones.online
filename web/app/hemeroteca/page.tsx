import type { Metadata } from 'next';
import Link from 'next/link';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import {
  actualidad,
  boeElectoral,
  coherenciaVotaciones,
  entrevistas,
  factcheckingEntrevistas,
  votaciones,
  votacionesClave,
  eleccionActiva,
} from '@/lib/datos';
import { titularesVisibles } from '@/lib/titulares-visibles';
import { colorPartido } from '@/lib/colores';
import { rutas } from '@/lib/rutas';
import IndicePagina from '@/components/IndicePagina';

export const metadata: Metadata = {
  title: 'Hemeroteca: declaraciones comprobadas, decretos y BOE electoral',
  description:
    'Declaraciones de candidatos comprobadas con datos oficiales, decretos convalidados en una sola votación y resoluciones electorales del BOE.',
  alternates: { canonical: rutas.hemeroteca() },
};

// ponytail: solo lo que prueba data/congreso_votaciones.json (regla 8). Las crónicas, citas y
// "qué iba dentro" escritos a mano se retiraron el 16-nov: enlaces 404 y cifras que no casaban.
const DECRETOS_OMNIBUS = ['15-1', '15-3', '15-4', '46-24'];

export default function HemerotecaPage() {
  const todas = votaciones();
  const mapaVot = new Map(todas.map((v) => [v.id, v]));
  const llano = new Map(votacionesClave().votaciones.map((c) => [c.id, c.titulo_llano]));
  const verificadas = factcheckingEntrevistas().verificaciones.filter(
    (v) => v.revisado === true && v.veredicto !== 'NO COMPROBADO'
  );
  const coherencia = coherenciaVotaciones().casos;
  const boe = boeElectoral().disposiciones.slice(0, 6);
  const noticiasActualidad = titularesVisibles(actualidad().items, eleccionActiva().fecha_eleccion).slice(0, 8);
  const mapaUrlsAEntrevista = new Map(entrevistas().entrevistas.map((e) => [e.fuente_url, e.slug || e.id]));

  return (
    <div className="space-y-10">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'España', path: rutas.pais() },
          { name: 'Generales 2026', path: rutas.eleccion() },
          { name: 'Hemeroteca', path: rutas.hemeroteca() },
        ]}
      />

      <header className="space-y-5">
        <div>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-neutral-950">
            Hemeroteca
          </h1>
          <p className="mt-3 text-base text-neutral-600 max-w-3xl leading-relaxed">
            Declaraciones de entrevistas comprobadas con datos oficiales, decretos que se votaron como un único paquete y resoluciones electorales del BOE.
          </p>
        </div>

        {/* Barra superior de salto rápido */}
      </header>

      <IndicePagina
        className="lg:hidden"
        secciones={[
          ['declaraciones-verificadas', 'Declaraciones'],
          ['decretos-omnibus', 'Decretos ómnibus'],
          ['resoluciones-jec', 'BOE y prensa'],
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Navegador lateral fijo en escritorio */}
        <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-36 rounded-2xl border border-[#dfd9cc] bg-white p-5 shadow-xs space-y-4">
          <div>
            <span className="text-xs font-extrabold text-red-900 block">
              Índice de navegación
            </span>
            <h2 className="font-editorial text-lg font-bold text-neutral-950">
              En esta página
            </h2>
          </div>
          <ul className="space-y-2 text-xs">
            <li>
              <a
                href="#declaraciones-verificadas"
                className="flex items-center justify-between rounded-lg bg-red-50/80 border border-red-200 px-3 py-2 font-bold text-red-950 hover:bg-red-900 hover:text-white transition"
              >
                <span>1. Declaraciones en vídeo</span>
                <span className="font-mono text-xs">{verificadas.length}</span>
              </a>
            </li>
            <li>
              <a
                href="#decretos-omnibus"
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-[#faf7f2] px-3 py-2 font-semibold text-neutral-800 hover:bg-neutral-900 hover:text-white transition"
              >
                <span>2. Decretos Ómnibus</span>
                <span className="font-mono text-xs">{DECRETOS_OMNIBUS.length}</span>
              </a>
            </li>
            <li>
              <a
                href="#resoluciones-jec"
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-[#faf7f2] px-3 py-2 font-semibold text-neutral-800 hover:bg-neutral-900 hover:text-white transition"
              >
                <span>5. Resoluciones JEC y BOE</span>
                <span className="font-mono text-xs">{boe.length}</span>
              </a>
            </li>
          </ul>
          <div className="pt-3 border-t border-[#ece7dc] space-y-2 text-xs">
            <Link
              href="/espana/generales/2026/entrevistas"
              className="block font-bold text-red-900 hover:underline"
            >
              Ir a la videoteca completa →
            </Link>
            <Link
              href="/espana/congreso/xv-legislatura/votaciones"
              className="block font-semibold text-neutral-700 hover:underline"
            >
              Buscador de 2.175 votaciones →
            </Link>
          </div>
        </aside>

        <div className="lg:col-span-9 space-y-12">
          {/* SECCIÓN 1 (ARRIBA): DECLARACIONES VERIFICADAS EN ENTREVISTAS */}
          <section id="declaraciones-verificadas" className="scroll-mt-28 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="text-xs font-extrabold text-red-900">
                  1 · Cruce de cifras en vídeo con minutaje
                </span>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-neutral-950">
                  Declaraciones verificadas en entrevistas ({verificadas.length})
                </h2>
              </div>
              <Link href="/espana/generales/2026/entrevistas" className="text-xs font-bold text-red-900 underline">
                Ver galería completa de entrevistas →
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {verificadas.map((v) => (
                <article
                  key={v.id}
                  className="rounded-2xl border border-[#dfd9cc] bg-white p-5 shadow-2xs space-y-2.5"
                  style={{ borderLeftWidth: 4, borderLeftColor: colorPartido(v.partido) }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-neutral-900">
                      {v.persona} ({v.partido}) · {v.medio}
                    </span>
                    <span className="rounded bg-neutral-900 px-2 py-0.5 text-xs font-bold text-white">
                      {v.veredicto}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-neutral-950 leading-snug">{v.afirmacion}</p>
                  <blockquote className="border-l-2 border-neutral-300 pl-2.5 text-xs text-neutral-600 italic">
                    &ldquo;{v.cita_literal}&rdquo;
                  </blockquote>
                  <p className="text-xs text-neutral-800">
                    <strong>Dato oficial:</strong> {v.dato_oficial}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 text-xs">
                    <a
                      href={v.fuente_oficial_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-red-900 underline"
                    >
                      {v.fuente_oficial_nombre}
                    </a>
                    <Link
                      href={`/espana/generales/2026/entrevistas/${(v.entrevista_url ? mapaUrlsAEntrevista.get(v.entrevista_url) : null) || v.entrevista_id}`}
                      className="font-bold text-neutral-900 hover:underline"
                    >
                      Ver vídeo en el minuto {v.contexto_minuto} →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* SECCIÓN 2: DECRETOS ÓMNIBUS Y MEDIDAS MEZCLADAS */}
          <section id="decretos-omnibus" className="scroll-mt-28 space-y-4">
            <div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-neutral-950">
                Decretos con varias medidas en una sola votación
              </h2>
              <p className="mt-2 text-sm text-neutral-600 max-w-3xl">
                Cuando el Gobierno aprueba un decreto con urgencia, el Congreso tiene que ratificarlo y vota sí o no al texto completo, sin poder cambiar una parte. Estos son algunos de esta legislatura, con el resultado del registro oficial.
              </p>
            </div>
            <ul className="divide-y divide-[#ece7dc] border-y border-[#ece7dc]">
              {DECRETOS_OMNIBUS.map((id) => mapaVot.get(id)).filter((v) => v !== undefined).map((v) => {
                const { si, no } = v.totales;
                const resultado = si > no ? 'Convalidado' : si < no ? 'Derogado' : 'Empate';
                return (
                  <li key={v.id} className="py-4">
                    <p className="text-xs text-neutral-500">Votación {v.id} · {v.fecha}</p>
                    <h3 className="mt-1 font-semibold leading-snug text-neutral-950">
                      <Link href={rutas.votacionCongreso(v.id, v.titulo)} className="hover:text-red-900 hover:underline">
                        {llano.get(v.id) ?? v.texto_expediente ?? v.titulo}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-neutral-700">
                      {resultado}: {si} sí, {no} no, {v.totales.abstencion} abstenciones.{' '}
                      <a href={v.fuente_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center underline">
                        Acta oficial
                      </a>
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* SECCIÓN 5: COHERENCIA EN EL CONGRESO + BOE ELECTORAL + ACTUALIDAD */}
          <section id="resoluciones-jec" className="scroll-mt-28 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#dfd9cc] bg-white p-6 space-y-4">
          <h2 className="font-editorial text-xl font-bold text-neutral-950">
            Resoluciones de la Junta Electoral Central (BOE)
          </h2>
          <ul className="divide-y divide-neutral-200 text-xs">
            {boe.map((b) => (
              <li key={b.identificador} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between font-mono text-xs text-neutral-500">
                  <span>{b.identificador}</span>
                  <span>{b.fecha}</span>
                </div>
                <a
                  href={b.url_html}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-neutral-900 hover:text-red-900 hover:underline block"
                >
                  {b.titulo}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[#dfd9cc] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-xl font-bold text-neutral-950">
              Archivo reciente de actualidad ({coherencia.length} casos de voto)
            </h2>
            <Link href="/actualidad" className="text-xs font-bold text-red-900 underline">
              Ver todo →
            </Link>
          </div>
          <ul className="divide-y divide-neutral-200 text-xs">
            {noticiasActualidad.map((n) => (
              <li key={n.url} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="font-bold text-neutral-700">{n.fuente}</span>
                  <span>{n.fecha.slice(0, 10)}</span>
                </div>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-neutral-900 hover:text-red-900 hover:underline block"
                >
                  {n.titulo}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
        </div>
      </div>
    </div>
  );
}
