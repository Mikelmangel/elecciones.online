import { slug, slugProvincia } from './slug';

/**
 * Arquitectura de Silos Jerárquicos y Escalables:
 *   /[pais]/[eleccion]/[anio]/[recurso]/...
 *
 * Ejemplos:
 *   - /espana/generales/2026/partidos/pp
 *   - /espana/generales/2026/partidos/pp/vivienda
 *   - /espana/generales/2026/comparador/vivienda
 *   - /espana/generales/2026/candidaturas/alava
 *   - /espana/generales/2026/hemeroteca
 *   - /espana/generales/2026/termometro
 *   - /espana/generales/2026/pactometro
 *   - /espana/generales/2023
 *   - /espana/generales/2023/alava
 *   - /espana/congreso/xv-legislatura/votaciones/78-2-...
 */

export function slugVotacion(id: string, texto: string): string {
  const limpio = slug(texto)
    .split('-')
    .filter((w) => w.length > 0)
    .slice(0, 8)
    .join('-');
  return limpio ? `${id}-${limpio}` : id;
}

export function idDesdeSlugVotacion(param: string): string {
  const m = /^(\d+-\d+)(?:-|$)/.exec(param);
  return m ? m[1] : param;
}

export const rutas = {
  pais: (pais = 'espana') => `/${pais}`,
  eleccion: (pais = 'espana', eleccion = 'generales', anio = '2026') =>
    `/${pais}/${eleccion}/${anio}`,
  partidos: (pais = 'espana', eleccion = 'generales', anio = '2026') =>
    `/${pais}/${eleccion}/${anio}/partidos`,
  partido: (partidoSlug: string, pais = 'espana', eleccion = 'generales', anio = '2026') =>
    `/${pais}/${eleccion}/${anio}/partidos/${partidoSlug}`,
  partidoArea: (partidoSlug: string, area: string, pais = 'espana', eleccion = 'generales', anio = '2026') =>
    `/${pais}/${eleccion}/${anio}/partidos/${partidoSlug}/${area}`,
  comparador: (area = 'vivienda', pais = 'espana', eleccion = 'generales', anio = '2026') =>
    `/${pais}/${eleccion}/${anio}/comparador/${area}`,
  candidaturas: (pais = 'espana', eleccion = 'generales', anio = '2026') =>
    `/${pais}/${eleccion}/${anio}/candidaturas`,
  candidaturaProvincia: (codigo: string, nombre = '', pais = 'espana', eleccion = 'generales', anio = '2026') =>
    `/${pais}/${eleccion}/${anio}/candidaturas/${slugProvincia(codigo, nombre)}`,
  calendario: (pais = 'espana', eleccion = 'generales', anio = '2026') =>
    `/${pais}/${eleccion}/${anio}/calendario`,
  historico: (pais = 'espana') =>
    `/${pais}/generales/historico`,
  hemeroteca: (pais = 'espana', eleccion = 'generales', anio = '2026') =>
    `/${pais}/${eleccion}/${anio}/hemeroteca`,
  termometro: (pais = 'espana', eleccion = 'generales', anio = '2026') =>
    `/${pais}/${eleccion}/${anio}/termometro`,
  pactometro: (pais = 'espana', eleccion = 'generales', anio = '2026') =>
    `/${pais}/${eleccion}/${anio}/pactometro`,
  entrevistas: (pais = 'espana', eleccion = 'generales', anio = '2026') =>
    `/${pais}/${eleccion}/${anio}/entrevistas`,
  cumplimiento: (pais = 'espana', eleccion = 'generales', anio = '2026') =>
    `/${pais}/${eleccion}/${anio}/cumplimiento`,
  simulador: (pais = 'espana', eleccion = 'generales', anio = '2026') =>
    `/${pais}/${eleccion}/${anio}/simulador`,
  guias: (pais = 'espana', eleccion = 'generales', anio = '2026') =>
    `/${pais}/${eleccion}/${anio}/guias`,
  guia: (slugGuia: string, pais = 'espana', eleccion = 'generales', anio = '2026') =>
    `/${pais}/${eleccion}/${anio}/guias/${slugGuia}`,
  programas: (pais = 'espana', eleccion = 'generales', anio = '2026') =>
    `/${pais}/${eleccion}/${anio}/programas`,
  resultados2023Hub: (pais = 'espana') =>
    `/${pais}/generales/2023`,
  resultados2023Provincia: (codigo: string, nombre = '', pais = 'espana') =>
    `/${pais}/generales/2023/${slugProvincia(codigo, nombre)}`,
  votacionesCongresoHub: (pais = 'espana') =>
    `/${pais}/congreso/xv-legislatura/votaciones`,
  votacionCongreso: (id: string, texto = '', pais = 'espana') =>
    `/${pais}/congreso/xv-legislatura/votaciones/${slugVotacion(id, texto)}`,
};
