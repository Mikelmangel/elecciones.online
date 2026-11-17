import type { Programa } from '@/lib/datos';

export default function Propuesta({ p, pdf }: { p: Programa['propuestas'][number]; pdf: string }) {
  return (
    <li className="rounded-xl border border-[#e4dfd3] bg-white p-4 shadow-2xs transition hover:border-[#c9c1b0]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold leading-snug text-neutral-950">{p.titular}</h3>
        <a
          href={`${pdf}#page=${p.pagina}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-xs font-medium text-neutral-700 hover:bg-neutral-900 hover:text-white transition-colors"
          title="Abrir página exacta del PDF oficial"
        >
          PDF pág. {p.pagina} ↗
        </a>
      </div>

      {/* Explicación llana primero para cualquier ciudadano */}
      {p.en_tu_dia_a_dia && (
        <div className="mt-2.5 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-sm text-neutral-900">
          <span className="font-bold text-amber-950">En tu día a día: </span>
          <span>{p.en_tu_dia_a_dia}</span>
        </div>
      )}

      {(p.situacion_actual || p.ley_afectada) && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
          {p.situacion_actual && (
            <div>
              <span className="font-semibold text-neutral-800">Qué pasa hoy: </span>
              <span>{p.situacion_actual}</span>
            </div>
          )}
          {p.ley_afectada && (
            <div>
              <span className="font-semibold text-neutral-800">Norma que toca: </span>
              <span className="font-mono text-xs">{p.ley_afectada}</span>
            </div>
          )}
        </div>
      )}

      {/* Cita literal verificada como respaldo documental */}
      <blockquote className="mt-3 border-l-2 border-neutral-300 pl-3 text-xs italic leading-relaxed text-neutral-600">
        «{p.cita}»
      </blockquote>
    </li>
  );
}
