import { fase } from './modo-electoral';
import { sinSondeos } from './titulares';

/** Titulares aptos para publicar hoy: en veda electoral se quitan los de sondeos (la fecha sale de data/eleccion_activa.json). */
export const titularesVisibles = <T extends { titulo: string }>(items: T[], fechaEleccion: string, ahora: Date = new Date()): T[] =>
  sinSondeos(items, fase(ahora, fechaEleccion) === 'veda');
