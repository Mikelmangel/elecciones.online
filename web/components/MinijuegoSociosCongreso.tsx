'use client';

import { useMemo, useState } from 'react';
import type { SociosQuizData } from '@/lib/datos';
import CompartirViralModal from './CompartirViralModal';

export default function MinijuegoSociosCongreso({ data }: { data: SociosQuizData }) {
  const [indice, setIndice] = useState(0);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [racha, setRacha] = useState(0);
  const [mejorRacha, setMejorRacha] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const [partidoMatrix, setPartidoMatrix] = useState<string>(data.partidos[0] ?? 'PSOE');
  const [modalAbierto, setModalAbierto] = useState(false);

  const duelos = data.duelos;
  const actual = duelos[indice];

  const parejasPartido = useMemo(() => {
    return data.pares
      .filter((p) => p.a === partidoMatrix || p.b === partidoMatrix)
      .map((p) => ({
        otro: p.a === partidoMatrix ? p.b : p.a,
        ...p,
      }))
      .sort((a, b) => b.porcentaje - a.porcentaje);
  }, [data.pares, partidoMatrix]);

  const elegir = (etiqueta: string) => {
    if (seleccion) return;
    setSeleccion(etiqueta);
    if (etiqueta === actual.ganadora) {
      setAciertos((a) => a + 1);
      const nr = racha + 1;
      setRacha(nr);
      if (nr > mejorRacha) setMejorRacha(nr);
    } else {
      setRacha(0);
    }
  };

  const siguiente = () => {
    if (indice + 1 < duelos.length) {
      setIndice((i) => i + 1);
      setSeleccion(null);
    } else {
      setFinalizado(true);
    }
  };

  const reiniciar = () => {
    setIndice(0);
    setSeleccion(null);
    setAciertos(0);
    setRacha(0);
    setFinalizado(false);
  };

  const rango =
    aciertos >= 7
      ? 'Conoces muy bien el Congreso'
      : aciertos >= 5
        ? 'Buen ojo'
        : 'Las alianzas sorprenden';

  return (
    <div className="space-y-10">
      {/* JUEGO DUELO */}
      {!finalizado ? (
        <div className="rounded-2xl border border-[#dfd9cc] bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-neutral-500">
            <span>Duelo {indice + 1} de {duelos.length}</span>
            <div className="flex items-center gap-3">
              <span>Aciertos: <strong className="text-neutral-950">{aciertos}</strong></span>
              <span>Racha: <strong className="text-red-900">{racha}</strong></span>
            </div>
          </div>

          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-neutral-950 leading-snug">
            {actual.pregunta}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {[actual.opcion_a, actual.opcion_b].map((op) => {
              const elegida = seleccion === op.etiqueta;
              const esCorrecta = actual.ganadora === op.etiqueta;
              let estilo = 'border-[#e4dfd3] bg-[#faf7f2] hover:border-neutral-900 hover:bg-white';
              if (seleccion) {
                if (esCorrecta) estilo = 'border-emerald-600 bg-emerald-50 text-emerald-950';
                else if (elegida) estilo = 'border-rose-600 bg-rose-50 text-rose-950';
                else estilo = 'border-neutral-200 bg-neutral-50 opacity-75';
              }

              return (
                <button
                  key={op.etiqueta}
                  type="button"
                  disabled={Boolean(seleccion)}
                  onClick={() => elegir(op.etiqueta)}
                  className={`rounded-2xl border-2 p-5 text-left transition cursor-pointer space-y-2 ${estilo}`}
                >
                  <span className="font-editorial text-xl font-bold block">{op.etiqueta}</span>
                  {seleccion ? (
                    <div className="space-y-1 pt-1">
                      <span className="font-mono text-2xl font-extrabold block">
                        {op.porcentaje} % de coincidencia
                      </span>
                      <span className="text-xs text-neutral-600 block">
                        {op.iguales} votos iguales de {op.total} ({op.si_si} Sí+Sí · {op.no_no} No+No)
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-500 font-semibold block">
                      Pulsa para apostar por esta pareja →
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {seleccion && (
            <div className="pt-4 border-t border-[#ece7dc] flex items-center justify-between">
              <span className="text-sm font-bold text-neutral-800">
                {seleccion === actual.ganadora ? 'Correcto.' : `Ganó ${actual.ganadora}.`}
              </span>
              <button
                type="button"
                onClick={siguiente}
                className="rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-900 transition cursor-pointer"
              >
                {indice + 1 < duelos.length ? 'Siguiente duelo →' : 'Ver resultado final →'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-neutral-900 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-red-900/10 px-3 py-1 text-xs font-bold text-red-900">
              Resultado final · {data.total_votaciones} actas del Congreso
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalAbierto(true)}
                className="rounded-xl bg-red-900 px-4 py-2 text-xs font-bold text-white hover:bg-red-800 transition cursor-pointer"
              >
                Compartir tarjeta PNG
              </button>
              <button
                type="button"
                onClick={reiniciar}
                className="rounded-xl border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
              >
                Jugar de nuevo
              </button>
            </div>
          </div>

          <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-neutral-950">
            {aciertos} / {duelos.length} aciertos · {rango}
          </h2>
          <p className="text-sm text-neutral-600">
            Mejor racha seguida: <strong>{mejorRacha}</strong>. Abajo puedes ver todas las parejas de partidos.
          </p>
        </div>
      )}

      {/* EXPLORADOR COMPLETO DE LA MATRIZ REAL */}
      <section className="rounded-2xl border border-[#dfd9cc] bg-white p-6 sm:p-8 shadow-xs space-y-5">
        <div>
          <span className="text-xs font-bold text-neutral-500">
            Todas las parejas · {data.total_votaciones} votaciones reales
          </span>
          <h3 className="font-editorial text-2xl font-bold text-neutral-950 mt-1">
            ¿Cuánto vota igual cada partido con el resto?
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {data.partidos.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPartidoMatrix(p)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                partidoMatrix === p
                  ? 'bg-neutral-950 text-white'
                  : 'border border-[#e4dfd3] bg-[#faf7f2] text-neutral-800 hover:bg-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {parejasPartido.map((par) => (
            <div key={par.otro} className="rounded-xl border border-[#e4dfd3] bg-[#faf7f2] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-neutral-950">
                  {partidoMatrix} + {par.otro}
                </span>
                <span className="font-mono text-lg font-extrabold text-red-900">
                  {par.porcentaje} %
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
                <div className="h-full bg-red-900 rounded-full" style={{ width: `${par.porcentaje}%` }} />
              </div>
              <p className="text-xs text-neutral-600">
                {par.iguales} iguales de {par.total} ({par.si_si} Sí · {par.no_no} No)
              </p>
            </div>
          ))}
        </div>
      </section>

      <CompartirViralModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        titulo="Socios en el Congreso: ¿Quién vota con quién?"
        subtitulo={`${aciertos} de ${duelos.length} duelos acertados`}
        resultadoPrincipal={`${aciertos}/${duelos.length} · ${rango}`}
        etiquetaBadge="elecciones.online · Actas del Congreso"
        colorPrincipal="#991b1b"
        detalles={[
          { etiqueta: 'Aciertos', valor: `${aciertos}/${duelos.length}` },
          { etiqueta: 'Mejor racha', valor: String(mejorRacha) },
          { etiqueta: 'Base', valor: `${data.total_votaciones} votaciones` },
        ]}
      />
    </div>
  );
}
