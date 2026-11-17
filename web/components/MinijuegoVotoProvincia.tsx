'use client';

import { barajar } from '@/lib/barajar';
import { useMemo, useState } from 'react';
import type { VotoProvinciaQuizData } from '@/lib/datos';
import CompartirViralModal from './CompartirViralModal';

export default function MinijuegoVotoProvincia({ data }: { data: VotoProvinciaQuizData }) {
  const [indice, setIndice] = useState(0);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const [codigoProv, setCodigoProv] = useState<string>('28'); // Madrid por defecto
  const [modalAbierto, setModalAbierto] = useState(false);

  const preguntas = data.preguntas;
  const actual = preguntas[indice];

  const provActual = useMemo(
    () => data.provincias.find((p) => p.codigo === codigoProv) ?? data.provincias[0],
    [data.provincias, codigoProv]
  );

  const elegir = (opcion: string) => {
    if (seleccion) return;
    setSeleccion(opcion);
    if (opcion === actual.respuesta_correcta) {
      setAciertos((a) => a + 1);
    }
  };

  const siguiente = () => {
    if (indice + 1 < preguntas.length) {
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
    setFinalizado(false);
  };

  return (
    <div className="space-y-10">
      {/* BUSCADOR DE TU PROVINCIA (VIRAL POR CIRCUNSCRIPCIÓN) */}
      <section className="rounded-2xl border-2 border-neutral-900 bg-white p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-red-900">
              Elige tu provincia
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-neutral-950 mt-1">
              ¿Por cuántos votos se decidió el último escaño en tu provincia?
            </h2>
          </div>

          <select
            value={codigoProv}
            onChange={(e) => setCodigoProv(e.target.value)}
            aria-label="Selecciona tu provincia"
            className="rounded-xl border border-neutral-300 bg-[#faf7f2] px-4 py-2.5 text-sm font-bold text-neutral-950"
          >
            {data.provincias.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nombre} ({p.escanos_2026} escaños)
              </option>
            ))}
          </select>
        </div>

        {provActual && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e4dfd3] bg-[#faf7f2] p-4">
              <span className="text-xs font-bold text-neutral-500 block">
                Último escaño en 2023
              </span>
              <span className="font-editorial text-2xl font-bold text-neutral-950 block mt-1">
                {provActual.ultimo_escanio_partido}
                {provActual.siguiente_partido ? ` frente a ${provActual.siguiente_partido}` : ''}
              </span>
              <span className="text-xs text-neutral-600 block mt-1">
                {provActual.votos_validos.toLocaleString('es-ES')} votos válidos totales
              </span>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
              <span className="text-xs font-bold text-red-900 block">
                Diferencia exacta
              </span>
              <span className="font-mono text-2xl font-extrabold text-red-950 block mt-1">
                {provActual.margen_votos.toLocaleString('es-ES')} votos
              </span>
              <span className="text-xs text-red-900 block mt-1">
                Solo el {provActual.porcentaje_margen} % de los votos válidos
              </span>
            </div>

            <div className="rounded-xl border border-[#e4dfd3] bg-[#faf7f2] p-4">
              <span className="text-xs font-bold text-neutral-500 block">
                Escaños el 29-N (2026)
              </span>
              <span className="font-mono text-2xl font-extrabold text-neutral-950 block mt-1">
                {provActual.escanos_2026} diputados
              </span>
              <span className="text-xs text-neutral-600 block mt-1">
                {provActual.escanos_2026 !== provActual.escanos_2023
                  ? `Cambia respecto a 2023 (${provActual.escanos_2023} → ${provActual.escanos_2026})`
                  : `Mantiene los ${provActual.escanos_2023} de 2023`}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* TRIVIA DE MÁRGENES HISTÓRICOS */}
      {!finalizado ? (
        <section className="rounded-2xl border border-[#dfd9cc] bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
            <span>Pregunta {indice + 1} de {preguntas.length}</span>
            <span>Aciertos: <strong className="text-neutral-950">{aciertos}</strong></span>
          </div>

          <h3 className="font-editorial text-2xl font-bold text-neutral-950 leading-snug">
            {actual.pregunta}
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            {barajar(actual.opciones, actual.id).map((op) => {
              const elegida = seleccion === op;
              const esCorrecta = op === actual.respuesta_correcta;
              let estilo = 'border-[#e4dfd3] bg-[#faf7f2] hover:border-neutral-900 hover:bg-white';
              if (seleccion) {
                if (esCorrecta) estilo = 'border-emerald-600 bg-emerald-50 text-emerald-950';
                else if (elegida) estilo = 'border-rose-600 bg-rose-50 text-rose-950';
                else estilo = 'border-neutral-200 bg-neutral-50 opacity-75';
              }
              return (
                <button
                  key={op}
                  type="button"
                  disabled={Boolean(seleccion)}
                  onClick={() => elegir(op)}
                  className={`rounded-xl border-2 px-4 py-3.5 text-left text-sm font-bold transition cursor-pointer ${estilo}`}
                >
                  {op}
                </button>
              );
            })}
          </div>

          {seleccion && (
            <div className="rounded-xl border border-neutral-200 bg-[#faf7f2] p-4 space-y-3">
              <p className="text-sm text-neutral-800 leading-relaxed">
                <strong>Dato oficial:</strong> {actual.explicacion}
              </p>
              <button
                type="button"
                onClick={siguiente}
                className="rounded-xl bg-neutral-950 px-5 py-2 text-xs font-bold text-white hover:bg-red-900 transition cursor-pointer"
              >
                {indice + 1 < preguntas.length ? 'Siguiente pregunta →' : 'Ver puntuación final →'}
              </button>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-2xl border-2 border-neutral-900 bg-white p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-editorial text-3xl font-bold text-neutral-950">
              Puntuación final: {aciertos} / {preguntas.length}
            </h3>
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
                Repetir quiz
              </button>
            </div>
          </div>
          <p className="text-sm text-neutral-600">
            Consulta abajo el ranking de las 10 provincias donde el último diputado se decidió por menos votos en 2023.
          </p>
        </section>
      )}

      {/* TOP 10 PROVINCIAS MÁS REÑIDAS */}
      <section className="rounded-2xl border border-[#dfd9cc] bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="font-editorial text-xl font-bold text-neutral-950">
          Las 10 provincias con el último escaño más reñido en 2023
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.mas_renidas.map((p, idx) => (
            <div key={p.codigo} className="rounded-xl border border-[#e4dfd3] bg-[#faf7f2] p-3.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-neutral-950">
                  {idx + 1}. {p.nombre} ({p.escanos_2026} esc.)
                </span>
                <span className="block text-neutral-600 mt-0.5">
                  {p.ultimo_escanio_partido} vs {p.siguiente_partido}
                </span>
              </div>
              <span className="font-mono font-extrabold text-red-900 text-sm">
                {p.margen_votos.toLocaleString('es-ES')} votos
              </span>
            </div>
          ))}
        </div>
      </section>

      <CompartirViralModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        titulo="¿Cuánto vale un escaño en tu provincia? (29-N)"
        subtitulo={provActual ? `${provActual.nombre}: último escaño por ${provActual.margen_votos.toLocaleString('es-ES')} votos` : undefined}
        resultadoPrincipal={`${aciertos}/${preguntas.length} aciertos`}
        etiquetaBadge="elecciones.online · Tu provincia"
        colorPrincipal="#991b1b"
        detalles={[
          { etiqueta: 'Quiz', valor: `${aciertos}/${preguntas.length}` },
          ...(provActual ? [{ etiqueta: provActual.nombre, valor: `${provActual.margen_votos.toLocaleString('es-ES')} votos` }] : []),
        ]}
      />
    </div>
  );
}
