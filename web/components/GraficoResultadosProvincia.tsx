import Link from 'next/link';
import { color } from '@/content/colores';
import { miles, pct } from '@/lib/datos';
import { rutas } from '@/lib/rutas';

interface CandidaturaResultado {
  siglas: string;
  nombre: string;
  votos: number;
  escanos: number;
}

interface Props {
  codigo: string;
  nombre: string;
  escanos2023: number;
  escanos2026: number;
  censo: number;
  votantes: number;
  votosValidos: number;
  votosBlanco: number;
  votosNulos: number;
  candidaturas: CandidaturaResultado[];
  boeId: string;
  fuenteUrl: string;
}

export default function GraficoResultadosProvincia({
  codigo,
  nombre,
  escanos2023,
  escanos2026,
  censo,
  votantes,
  votosValidos,
  votosBlanco,
  votosNulos,
  candidaturas,
  boeId,
  fuenteUrl,
}: Props) {
  const participacionPct = censo > 0 ? (votantes / censo) * 100 : 0;
  const abstencion = Math.max(0, censo - votantes);
  const maxVotos = Math.max(1, ...candidaturas.map((c) => c.votos));
  const conEscanos = candidaturas.filter((c) => c.escanos > 0);
  const diffEscanos = escanos2026 - escanos2023;

  return (
    <div className="space-y-6">
      {/* Cabecera del silo: País > Elección > Circunscripción */}
      <div className="border-b border-[#e4dfd3] pb-6">
        <div className="flex flex-wrap items-center gap-x-2 text-sm text-neutral-600 mb-2">
          <Link href={rutas.pais()} className="inline-flex min-h-8 items-center underline hover:text-red-900">
            España
          </Link>
          <span>/</span>
          <Link href={rutas.resultados2023Hub()} className="inline-flex min-h-8 items-center underline hover:text-red-900">
            Elecciones Generales 2023
          </Link>
          <span>/</span>
          <span className="text-red-900">{nombre}</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-neutral-950">
              Resultados Generales 2023 en {nombre}
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Circunscripción oficial (código INE {codigo}) · Datos definitivos proclamados por la Junta Electoral Central.
            </p>
          </div>
          <Link
            href={rutas.candidaturaProvincia(codigo, nombre)}
            className="rounded-xl bg-neutral-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-900 transition"
          >
            Ver listas y candidatos 2026 en {nombre} →
          </Link>
        </div>

        {/* KPI Cards + Barra visual de participación */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#e4dfd3] bg-[#faf7f2] p-4">
            <div className="text-xs font-semibold text-neutral-500">Escaños en el Congreso</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-neutral-950">{escanos2023}</span>
              <span className="text-xs text-neutral-600">en 2023</span>
            </div>
            {diffEscanos !== 0 ? (
              <div
                className={`mt-1.5 inline-block rounded px-2 py-0.5 text-xs font-bold ${
                  diffEscanos > 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                }`}
              >
                En 2026: {escanos2026} escaños ({diffEscanos > 0 ? `+${diffEscanos}` : diffEscanos})
              </div>
            ) : (
              <div className="mt-1.5 text-xs text-neutral-500">
                Se mantienen {escanos2026} escaños en 2026
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#e4dfd3] bg-[#faf7f2] p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
              <span>Participación</span>
              <span className="font-mono font-bold text-neutral-900">{pct(votantes, censo)}</span>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${Math.min(100, participacionPct)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-neutral-600">
              <span>Votaron: {miles(votantes)}</span>
              <span>Abst.: {miles(abstencion)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-[#e4dfd3] bg-[#faf7f2] p-4">
            <div className="text-xs font-semibold text-neutral-500">Censo electoral</div>
            <div className="mt-1 font-mono text-2xl font-extrabold text-neutral-950">{miles(censo)}</div>
            <div className="mt-1 text-xs text-neutral-500">
              Votos válidos: {miles(votosValidos)}
            </div>
          </div>

          <div className="rounded-xl border border-[#e4dfd3] bg-[#faf7f2] p-4">
            <div className="text-xs font-semibold text-neutral-500">Blanco y nulos</div>
            <div className="mt-1 font-mono text-lg font-bold text-neutral-950">
              {miles(votosBlanco)} blanco · {miles(votosNulos)} nulos
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              Barrera legal D’Hondt: 3 % ({miles(Math.ceil(votosValidos * 0.03))} votos)
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICO 1: REPARTO VISUAL DE ESCAÑOS */}
      <section className="rounded-2xl border border-[#dfd9cc] bg-white p-6 shadow-xs">
        <h2 className="font-editorial text-xl font-bold text-neutral-950">
          Reparto de los {escanos2023} diputados elegidos en {nombre}
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5 mb-4">
          Cada bloque representa la proporción de escaños conseguidos mediante la ley D’Hondt:
        </p>

        {/* Barra apilada de escaños */}
        <div className="flex h-11 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
          {conEscanos.map((c) => {
            const w = (c.escanos / escanos2023) * 100;
            const col = color(c.siglas);
            return (
              <div
                key={c.siglas}
                style={{ width: `${w}%`, backgroundColor: col }}
                className="flex items-center justify-center border-r border-white/30 px-2 text-xs font-extrabold text-white last:border-r-0"
                title={`${c.siglas}: ${c.escanos} escaños`}
              >
                {w >= 10 ? `${c.siglas} (${c.escanos})` : c.escanos}
              </div>
            );
          })}
        </div>

        {/* Fichas de partidos con representación */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {conEscanos.map((c) => {
            const col = color(c.siglas);
            return (
              <div
                key={c.siglas}
                className="flex items-center justify-between rounded-xl border border-[#e4dfd3] bg-[#faf7f2]/70 p-3"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: col }} />
                  <div>
                    <div className="font-bold text-sm text-neutral-950">{c.siglas}</div>
                    <div className="text-xs text-neutral-500">{pct(c.votos, votosValidos)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(c.escanos, 8) }).map((_, idx) => (
                    <span
                      key={idx}
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: col }}
                    />
                  ))}
                  <span className="ml-1 font-mono text-lg font-extrabold text-neutral-950">
                    {c.escanos}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* GRÁFICO 2: BARRAS HORIZONTALES DE VOTOS Y PORCENTAJE */}
      <section className="rounded-2xl border border-[#dfd9cc] bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <h2 className="font-editorial text-xl font-bold text-neutral-950">
            Gráfico de votos y porcentaje por candidatura ({candidaturas.length} listas)
          </h2>
          <span className="text-xs text-neutral-500">
            Ordenado de mayor a menor número de votos
          </span>
        </div>

        <div className="space-y-3">
          {candidaturas.map((c, idx) => {
            const barraPct = (c.votos / maxVotos) * 100;
            const porcentajeReal = votosValidos > 0 ? (c.votos / votosValidos) * 100 : 0;
            const superaBarrera = porcentajeReal >= 3;
            const col = color(c.siglas);

            return (
              <div
                key={c.siglas}
                className={`rounded-xl border p-3.5 transition ${
                  c.escanos > 0
                    ? 'border-[#d5cfc0] bg-[#faf7f2]/70'
                    : 'border-neutral-100 bg-white opacity-85'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-xs text-neutral-400 w-5">{idx + 1}.</span>
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: col }}
                    />
                    <span className="font-bold text-neutral-950">{c.siglas}</span>
                    <span className="truncate text-xs text-neutral-500 hidden sm:inline">
                      · {c.nombre}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs sm:text-sm shrink-0">
                    <span className="text-neutral-700 font-semibold">{miles(c.votos)} votos</span>
                    <span className="w-16 text-right font-bold text-neutral-950">
                      {pct(c.votos, votosValidos)}
                    </span>
                    {c.escanos > 0 ? (
                      <span
                        className="rounded-md px-2 py-0.5 text-xs font-extrabold text-white"
                        style={{ backgroundColor: col }}
                      >
                        {c.escanos} {c.escanos === 1 ? 'escaño' : 'escaños'}
                      </span>
                    ) : (
                      <span className="w-20 text-right text-xs text-neutral-400">
                        {superaBarrera ? '0 escaños' : '< 3 %'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Barra gráfica proporcional */}
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(barraPct, 0.8)}%`,
                      backgroundColor: col,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 pt-4 border-t border-[#ece7dc] text-xs text-neutral-500">
          Fuente oficial: Junta Electoral Central,{' '}
          <a className="font-semibold text-neutral-800 underline" href={fuenteUrl} rel="noopener">
            {boeId}
          </a>
          .
        </p>
      </section>
    </div>
  );
}
