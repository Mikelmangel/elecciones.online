'use client';

import { useState } from 'react';
import type { VotacionesQuizData } from '@/lib/datos';
import CompartirViralModal from './CompartirViralModal';

interface Props {
  datos: VotacionesQuizData;
}

export default function MinijuegoVotaciones({ datos }: Props) {
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
    if (aciertos === total) return 'Lo sabes todo del Congreso';
    if (aciertos >= total * 0.7) return 'Sigues muy bien la política';
    if (aciertos >= total * 0.4) return 'Seguidor Casual del Hemiciclo ';
    return 'Desconectado del Diario de Sesiones ';
  };

  return (
    <div className="space-y-8">
      {!juegoTerminado ? (
        <div>
          {/* Marcador superior */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-neutral-100 text-sm font-semibold text-neutral-600">
            <span>
              Votación {indice + 1} de {total}
            </span>
            <span className="font-mono bg-neutral-100 px-2.5 py-1 rounded-full text-neutral-900">
              Aciertos: {aciertos} / {indice}
            </span>
          </div>

          {pregunta && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-semibold text-neutral-500">Sesión {pregunta.sesion}</span>
                <h3 className="text-lg sm:text-xl font-bold font-editorial text-neutral-900 mt-1 break-words">
                  {pregunta.titulo}
                </h3>
                <p className="text-base sm:text-lg font-bold text-neutral-950 mt-1">
                  {pregunta.pregunta}
                </p>
              </div>

              {/* Opciones */}
              <div className="grid gap-2.5 pt-1">
                {pregunta.opciones.map((op, i) => {
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

              {/* Feedback y explicación */}
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
                      ? '¡Exacto!'
                      : 'Respuesta incorrecta'}
                  </p>

                  <p className="text-sm leading-relaxed text-neutral-800">
                    {pregunta.explicacion}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200/60 text-sm text-neutral-600">
                    <span>
                      Fecha oficial de votación: {pregunta.fecha} · Congreso de los Diputados
                    </span>
                    <button
                      onClick={siguiente}
                      className="min-h-11 px-4 py-1.5 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800 text-sm transition"
                    >
                      {indice < total - 1 ? 'Siguiente votación →' : 'Ver resultado final →'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Pantalla final */
        <div className="space-y-8">
          <div className="text-center space-y-6">

            <div>
              <h2 className="text-4xl sm:text-5xl font-bold font-editorial text-neutral-950 font-mono">
                {aciertos} / {total}
              </h2>
              <p className="text-lg font-bold text-neutral-800 mt-2">{nivelBadge()}</p>
              <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
                Has acertado qué votaron los partidos en votaciones importantes de esta legislatura.
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

            <div className="pt-4 border-t border-[#ece7dc] flex justify-center gap-4">
              <button
                onClick={reiniciar}
                className="min-h-11 px-4 py-2 rounded-lg border border-neutral-300 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Repetir el juego
              </button>
            </div>
          </div>

          <CompartirViralModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            titulo="¿Quién votó qué en el Congreso?"
            subtitulo="Votaciones del Congreso de los Diputados"
            resultadoPrincipal={`${aciertos}/${total} votaciones acertadas`}
            etiquetaBadge={nivelBadge()}
            colorPrincipal="#0056a8"
            detalles={[
              { etiqueta: 'Aciertos', valor: `${aciertos} de ${total}` },
              { etiqueta: 'Nivel', valor: nivelBadge() },
            ]}
          />
        </div>
      )}
    </div>
  );
}
