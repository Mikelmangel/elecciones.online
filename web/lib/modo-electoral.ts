// Fases según LOREG art. 69.7: prohibido difundir sondeos los 5 días anteriores a la votación.
// Ver .claude/skills/modo-electoral/SKILL.md

export type Fase = 'normal' | 'veda' | 'despues';

// Hora peninsular a la que cierran los colegios en Canarias (20:00 hora canaria).
const CIERRE = '21:00';

function ahoraEnMadrid(ahora: Date): string {
  // 'sv-SE' da "YYYY-MM-DD HH:mm", comparable como texto
  return ahora
    .toLocaleString('sv-SE', { timeZone: 'Europe/Madrid', hour12: false })
    .slice(0, 16);
}

function restarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

export function fase(
  ahora: Date = new Date(),
  fechaEleccion: string | undefined = process.env.FECHA_ELECCION
): Fase {
  if (!fechaEleccion) return 'normal';
  const t = ahoraEnMadrid(ahora);
  if (t < `${restarDias(fechaEleccion, 5)} 00:00`) return 'normal';
  if (t < `${fechaEleccion} ${CIERRE}`) return 'veda';
  return 'despues';
}

export const sondeosVisibles = (ahora?: Date, fecha?: string) => fase(ahora, fecha) !== 'veda';
