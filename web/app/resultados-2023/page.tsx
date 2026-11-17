import Link from 'next/link';
import { color } from '@/content/colores';
import { miles, pct, resultados2023 } from '@/lib/datos';
import { slugProvincia } from '@/lib/provincias';
import { rutas } from '@/lib/rutas';

export const metadata = {
  title: 'Resultados de las elecciones generales de 2023 en España (gráficos y provincias)',
  description: 'Gráficos de votos y escaños oficiales de las elecciones al Congreso del 23 de julio de 2023, total estatal y por circunscripción.',
  alternates: { canonical: '/espana/generales-2023' },
};

export default function Page() {
  const r = resultados2023();
  const conEscanos = r.nacional.filter((p) => p.escanos > 0);
  const maxVotos = Math.max(1, ...conEscanos.map((p) => p.votos));
  const totalVotosValidos = r.provincias.reduce((acc, p) => acc + p.votos_validos, 0);

  return (
    <div className="space-y-8">
      <header className="border-b border-[#e4dfd3] pb-6">
        <div className="flex flex-wrap items-center gap-x-2 text-sm text-neutral-600 mb-2">
          <Link href={rutas.pais()} className="inline-flex min-h-8 items-center underline hover:text-red-900">España</Link>
          <span>/</span>
          <span className="text-red-900">Elecciones Generales 2023</span>
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-neutral-950">
          Resultados de las elecciones generales de 2023
        </h1>
        <p className="mt-2 text-sm text-neutral-600 max-w-3xl">
          Reparto oficial de los 350 diputados del Congreso y resultados visuales provincia por provincia (23 de julio de 2023).
        </p>

        {/* Barra apilada de los 350 escaños */}
        <div className="mt-5">
          <div className="flex justify-between text-xs font-semibold text-neutral-600 mb-1.5">
            <span>Reparto de los 350 escaños del Congreso</span>
            <span>Mayoría absoluta: 176 escaños</span>
          </div>
          <div className="flex h-10 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
            {conEscanos.map((p) => {
              const w = (p.escanos / 350) * 100;
              return (
                <div
                  key={p.siglas}
                  style={{ width: `${w}%`, backgroundColor: color(p.siglas) }}
                  className="flex items-center justify-center border-r border-white/25 text-xs font-extrabold text-white last:border-r-0"
                  title={`${p.siglas}: ${p.escanos} escaños`}
                >
                  {p.escanos >= 14 ? `${p.siglas} ${p.escanos}` : ''}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        {/* Barras visuales nacionales */}
        <section className="rounded-2xl border border-[#dfd9cc] bg-white p-6 shadow-xs">
          <h2 className="font-editorial text-2xl font-bold text-neutral-950 mb-4">
            Votos y escaños en toda España
          </h2>
          <div className="space-y-3">
            {conEscanos.map((p) => {
              const col = color(p.siglas);
              const w = (p.votos / maxVotos) * 100;
              return (
                <div key={p.siglas} className="rounded-xl border border-[#ece7dc] bg-[#faf7f2]/70 p-3.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: col }} />
                      <span className="font-bold text-neutral-950">{p.siglas}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-xs sm:text-sm">
                      <span className="text-neutral-600">{miles(p.votos)} votos</span>
                      <span className="font-semibold text-neutral-800">{pct(p.votos, totalVotosValidos)}</span>
                      <span
                        className="rounded-md px-2 py-0.5 text-xs font-extrabold text-white"
                        style={{ backgroundColor: col }}
                      >
                        {p.escanos} esc.
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-neutral-200/70">
                    <div className="h-full rounded-full" style={{ width: `${w}%`, backgroundColor: col }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Navegador por circunscripción con URL semántica /espana/generales-2023/alava */}
        <nav aria-label="Provincias" className="rounded-2xl border border-[#dfd9cc] bg-white p-6 shadow-xs self-start">
          <h2 className="font-editorial text-2xl font-bold text-neutral-950 mb-1">
            Resultados por provincia (52)
          </h2>
          <p className="text-xs text-neutral-500 mb-4">
            Entra en cualquier provincia para ver sus gráficos de barras, participación y escaños:
          </p>
          <ul className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
            {[...r.provincias]
              .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
              .map((p) => {
                const ganadora = [...p.candidaturas].sort((a, b) => b.votos - a.votos)[0];
                const slugProv = slugProvincia(p.codigo, p.nombre);
                return (
                  <li key={p.codigo}>
                    <Link
                      href={`/espana/generales-2023/${slugProv}`}
                      className="flex items-center justify-between gap-1.5 rounded-lg border border-[#ece7dc] bg-[#faf7f2]/60 px-2.5 py-2 hover:border-neutral-400 hover:bg-white transition"
                    >
                      <span className="font-semibold text-neutral-900 truncate">{p.nombre}</span>
                      <span className="flex items-center gap-1 shrink-0 font-mono text-xs text-neutral-500">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: color(ganadora?.siglas ?? '') }}
                        />
                        {p.escanos}
                      </span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </nav>
      </div>

      <p className="text-xs text-neutral-500">
        Fuente oficial: Junta Electoral Central,{' '}
        <a className="underline font-semibold text-neutral-800" href={r.fuente_url} rel="noopener">
          {r.boe_id}
        </a>
        .
      </p>
    </div>
  );
}
