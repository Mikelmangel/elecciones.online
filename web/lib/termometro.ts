// Lógica pura del termómetro: validación y límite de un apoyo por IP y día.
// Privacidad: junto al apoyo solo se guardan candidatura, provincia y día. La IP se usa
// únicamente aquí, convertida en hash con una sal que cambia cada día y vive en memoria.
import { createHash, randomBytes } from 'node:crypto';

export interface Apoyo {
  candidatura: string;
  provincia: string;
}

export function validar(cuerpo: unknown, candidaturas: readonly string[], provincias: readonly string[]): Apoyo | null {
  if (typeof cuerpo !== 'object' || cuerpo === null) return null;
  const { candidatura, provincia } = cuerpo as Record<string, unknown>;
  if (typeof candidatura !== 'string' || !candidaturas.includes(candidatura)) return null;
  if (typeof provincia !== 'string' || !provincias.includes(provincia)) return null;
  return { candidatura, provincia };
}

// ponytail: en memoria y por proceso; se vacía al reiniciar. Pasar a Redis si hay más de una instancia.
export class LimiteDiario {
  private dia = '';
  private sal = '';
  private vistos = new Set<string>();

  /** true la primera vez que esa IP aparece ese día; false las siguientes. */
  permitir(ip: string, dia: string): boolean {
    if (dia !== this.dia) {
      this.dia = dia;
      this.sal = randomBytes(16).toString('hex');
      this.vistos.clear();
    }
    const h = createHash('sha256').update(this.sal + ip).digest('hex');
    if (this.vistos.has(h)) return false;
    this.vistos.add(h);
    return true;
  }
}

export const VENTANA_BLOQUEO_MS = 21 * 24 * 60 * 60 * 1000; // 3 semanas

/** Genera un hash irreversible de la IP sin almacenar la IP original. */
export function hashIpIrreversible(ip: string, salSecreta: string): string {
  return createHash('sha256').update(`${salSecreta}:${ip}`).digest('hex');
}

/** Control de límite por IP anónima durante 3 semanas (21 días). */
export class LimiteTresSemanas {
  private readonly sal: string;
  private readonly registros = new Map<string, number>();

  constructor(sal?: string) {
    this.sal = sal ?? randomBytes(32).toString('hex');
  }

  hash(ip: string): string {
    return hashIpIrreversible(ip, this.sal);
  }

  permitir(ip: string, ahoraMs = Date.now()): boolean {
    const h = this.hash(ip);
    const expira = this.registros.get(h);
    if (expira && expira > ahoraMs) return false;
    this.registros.set(h, ahoraMs + VENTANA_BLOQUEO_MS);
    return true;
  }
}
