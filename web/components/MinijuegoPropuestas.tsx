'use client';

import { useState } from 'react';
import type { PropuestasQuizData } from '@/lib/datos';
import CompartirViralModal from './CompartirViralModal';

interface Props {
  datos: PropuestasQuizData;
}

export default function MinijuegoPropuestas({ datos }: Props) {
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

    if (opcion === pregunta.partido_correcto) {
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
    if (aciertos >= 15) return 'Auditor Supremo del BOE ';
    if (aciertos >= 12) return 'Votante de Ojo Crítico ';
    if (aciertos >= 8) return 'Ciudadano Promedio Atento ';
    return 'Víctima de los titulares de campaña ';
  };

  return (
    <div className="space-y-8">
      {!juegoTerminado ? (
        <div>
          {/* Marcador superior */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-neutral-100 text-sm font-semibold text-neutral-600">
            <span>
              Propuesta {indice + 1} de {total}
            </span>
            <span className="font-mono bg-neutral-100 px-2.5 py-1 rounded-full text-neutral-900">
              Aciertos: {aciertos} / {indice}
            </span>
          </div>

          {/* Enunciado de la propuesta real */}
          {pregunta && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold font-editorial text-neutral-950 leading-snug">
                  «{pregunta.propuesta}»
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                  ¿De qué partido crees que es esta medida?
                </p>
              </div>

              {/* Botones de opciones */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {pregunta.opciones.map((op) => {
                  let estilo = 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100 text-neutral-800';

                  if (haRespondido) {
                    if (op === pregunta.partido_correcto) {
                      estilo = 'border-emerald-600 bg-emerald-100 text-emerald-950 font-bold ring-2 ring-emerald-500';
                    } else if (op === seleccionada) {
                      estilo = 'border-rose-600 bg-rose-100 text-rose-950 font-bold';
                    } else {
                      estilo = 'border-neutral-200 bg-neutral-50 text-neutral-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={op}
                      onClick={() => responder(op)}
                      disabled={haRespondido}
                      className={`min-h-11 min-w-0 break-words p-4 rounded-xl border text-sm font-bold transition text-center cursor-pointer ${estilo}`}
                    >
                      {op}
                    </button>
                  );
                })}
              </div>

              {/* Feedback y cita literal tras responder */}
              {haRespondido && (
                <div
                  className={`rounded-xl border p-4 space-y-2.5 animate-in fade-in duration-200 ${
                    seleccionada === pregunta.partido_correcto
                      ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950'
                      : 'border-rose-300 bg-rose-50/70 text-rose-950'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {seleccionada === pregunta.partido_correcto ? (
                      <>
                        <span>¡Correcto! Es una propuesta del {pregunta.partido_correcto}.</span>
                      </>
                    ) : (
                      <>
                        <span>
                          ¡No! Es una propuesta del <strong>{pregunta.partido_correcto}</strong>.
                        </span>
                      </>
                    )}
                  </div>

                  <p className="break-words text-sm italic text-neutral-800 leading-relaxed">
                    «{pregunta.cita}»
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200/60 text-sm text-neutral-600">
                    <span>
                      Página {pregunta.pagina} del {pregunta.fuente}
                    </span>
                    <button
                      onClick={siguiente}
                      className="min-h-11 px-4 py-1.5 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800 text-sm transition"
                    >
                      {indice < total - 1 ? 'Siguiente propuesta →' : 'Ver puntuación final →'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Pantalla de puntuación final */
        <div className="space-y-8">
          <div className="text-center space-y-6">

            <div>
              <h2 className="text-4xl sm:text-5xl font-bold font-editorial text-neutral-950 font-mono">
                {aciertos} / {total}
              </h2>
              <p className="text-lg font-bold text-neutral-800 mt-2">
                {nivelBadge()}
              </p>
              <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
                Has identificado correctamente el {Math.round((aciertos / total) * 100)}% de las propuestas, todas con cita literal de los programas oficiales.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-semibold py-3 px-6 text-sm shadow transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Compartir mi puntuación (Stories / Instagram / LinkedIn)
              </button>
            </div>

            <div className="pt-4 border-t border-[#ece7dc] flex justify-center gap-4">
              <button
                onClick={reiniciar}
                className="min-h-11 px-4 py-2 rounded-lg border border-neutral-300 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Jugar otra vez
              </button>
            </div>
          </div>

          <CompartirViralModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            titulo="¿De quién es esta propuesta?"
            subtitulo="Minijuego de programas electorales 2026"
            resultadoPrincipal={`${aciertos}/${total} aciertos`}
            etiquetaBadge={nivelBadge()}
            colorPrincipal="#b91c1c"
            detalles={[
              { etiqueta: 'Aciertos', valor: `${aciertos} de ${total}` },
              { etiqueta: 'Efectividad', valor: `${Math.round((aciertos / total) * 100)}%` },
              { etiqueta: 'Nivel', valor: nivelBadge() },
            ]}
          />
        </div>
      )}
    </div>
  );
}
