import { type PartidoFicha, partidosData } from './datos';

export type { PartidoFicha };
export const PARTIDOS: readonly PartidoFicha[] = partidosData();

export function partidoPorSlug(s: string): PartidoFicha | undefined {
  return PARTIDOS.find((p) => p.slug === s);
}
