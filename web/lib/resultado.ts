/** Resultado de una votación según el acta. Un empate se muestra como empate: el acta descargada no trae la votación de desempate. */
export type Resultado = 'Aprobada' | 'Rechazada' | 'Empate';

export const resultado = ({ si, no }: { si: number; no: number }): Resultado =>
  si > no ? 'Aprobada' : si < no ? 'Rechazada' : 'Empate';

export const claseResultado: Record<Resultado, string> = {
  Aprobada: 'bg-emerald-100 text-emerald-900',
  Rechazada: 'bg-rose-100 text-rose-900',
  Empate: 'bg-amber-100 text-amber-900',
};
