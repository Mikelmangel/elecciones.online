'use client';

import { barajar } from '@/lib/barajar';
import { useState } from 'react';
import Link from 'next/link';
import type { PreparadoQuizData } from '@/lib/datos';
import CompartirViralModal from './CompartirViralModal';

interface Props {
  datos: PreparadoQuizData;
}

export default function TestPreparadoVotar({ datos }: Props) {
  const [indice, setIndice] = useState(0);
  const [aciertos, setAciertos] = useState(0);
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [haRespondido, setHaRespondido] = useState(false);
  const [juegoTerminado, setJuegoTerminado] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const pregunta = datos.preguntas[indice];
  const total = datos.preguntas.length;

  const responder = (opcion: string) => {
    if (haRespondido) return;
    setSeleccionada(opcion);
    setHaRespondido(true);

    if (opcion === pregunta.respuesta_correcta) {
      setAciertos((a) => a + 1);
    }
  };

  const siguiente = () => {
    if (indice < total - 1) {
      setIndice((i) => i + 1);
      setSeleccionada(null);
      setHaRespondido(false);
    } else {
      setJuegoTerminado(true);
    }
  };

  const reiniciar = () => {
    setIndice(0);
    setAciertos(0);
    setSeleccionada(null);
    setHaRespondido(false);
    setJuegoTerminado(false);
  };

  const nivelBadge = () => {
    if (aciertos >= 14) return 'Experto en Derecho Electoral ';
    if (aciertos >= 11) return 'Votante 100% Preparado ';
    if (aciertos >= 7) return 'Conocimiento Cívico Básico ';
    return 'Necesitas repasar las guías electorales ';
  };

  return (
    <div className="space-y-8">
      {!juegoTerminado ? (
        <div>
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-neutral-100 text-sm font-semibold text-neutral-600">
            <span>
              Pregunta {indice + 1} de {total}
            </span>
            <span className="font-mono bg-neutral-100 px-2.5 py-1 rounded-full text-neutral-900">
              Aciertos: {aciertos} / {indice}
            </span>
          </div>

          {pregunta && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold font-editorial text-neutral-950 leading-snug">
                  {pregunta.pregunta}
                </h3>
              </div>

              <div className="grid gap-2.5 pt-1">
                {barajar(pregunta.opciones, pregunta.id).map((op, i) => {
                  let estilo = 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100 text-neutral-800';

                  if (haRespondido) {
                    if (op === pregunta.respuesta_correcta) {
                      estilo = 'border-emerald-600 bg-emerald-100 text-emerald-950 font-bold ring-2 ring-emerald-500';
                    } else if (op === seleccionada) {
                      estilo = 'border-rose-600 bg-rose-100 text-rose-950 font-bold';
                    } else {
                      estilo = 'border-neutral-200 bg-neutral-50 text-neutral-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => responder(op)}
                      disabled={haRespondido}
                      className={`min-h-11 min-w-0 p-3.5 rounded-xl border text-sm font-medium transition text-left cursor-pointer flex items-start gap-3 ${estilo}`}
                    >
                      <span className="font-mono font-bold shrink-0">{String.fromCharCode(65 + i)})</span>
                      <span className="min-w-0 break-words">{op}</span>
                    </button>
                  );
                })}
              </div>

              {haRespondido && (
                <div
                  className={`rounded-xl border p-4 space-y-2.5 animate-in fade-in duration-200 ${
                    seleccionada === pregunta.respuesta_correcta
                      ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950'
                      : 'border-rose-300 bg-rose-50/70 text-rose-950'
                  }`}
                >
                  <p className="font-bold text-sm">
                    {seleccionada === pregunta.respuesta_correcta
                      ? '¡Correcto!'
                      : 'Respuesta incorrecta'}
                  </p>

                  <p className="text-sm leading-relaxed text-neutral-800">
                    {pregunta.explicacion}
                  </p>

                  <div className="flex justify-end pt-2 border-t border-neutral-200/60">
                    <button
                      onClick={siguiente}
                      className="min-h-11 px-4 py-1.5 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800 text-sm transition"
                    >
                      {indice < total - 1 ? 'Siguiente pregunta →' : 'Ver resultado final →'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="text-center space-y-6">

            <div>
              <h2 className="text-4xl sm:text-5xl font-bold font-editorial text-neutral-950 font-mono">
                {aciertos} / {total}
              </h2>
              <p className="text-lg font-bold text-neutral-800 mt-2">{nivelBadge()}</p>
              <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
                Has demostrado tu grado de conocimiento sobre cómo se eligen los 350 diputados, el funcionamiento del Senado y las normas de la jornada electoral del 29-N.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-semibold py-3 px-6 text-sm shadow transition cursor-pointer"
              >
                Compartir mi resultado (Stories / Instagram / LinkedIn)
              </button>
            </div>

            <div className="pt-4 border-t border-[#ece7dc] flex flex-wrap justify-center gap-4 text-sm font-semibold">
              <button
                onClick={reiniciar}
                className="min-h-11 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
              >
                Repetir test
              </button>
              <Link
                href="/espana/generales/2026/guias"
                className="inline-flex min-h-11 items-center px-4 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800"
              >
                Leer las guías oficiales para el 29-N →
              </Link>
            </div>
          </div>

          <CompartirViralModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            titulo="¿Estás preparado para votar el 29-N?"
            subtitulo="Test de cultura cívica y sistema electoral"
            resultadoPrincipal={`${aciertos}/${total} aciertos`}
            etiquetaBadge={nivelBadge()}
            colorPrincipal="#15803d"
            detalles={[
              { etiqueta: 'Puntuación', valor: `${aciertos} de ${total}` },
              { etiqueta: 'Nivel', valor: nivelBadge() },
            ]}
          />
        </div>
      )}
    </div>
  );
}
