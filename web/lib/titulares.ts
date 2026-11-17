// LOREG art. 69.7: en los 5 días previos a la votación no se puede difundir sondeos. Los titulares de prensa que los
// anuncian se ocultan mientras dure la veda. Esta parte es pura (sin imports) para poder probarla con node:test;
// la decisión de "estamos en veda" la toma lib/titulares-visibles.ts con lib/modo-electoral.ts.
const SONDEO =
  /encuesta|sondeo|bar[oó]metro|estimaci[oó]n(es)? de voto|intenci[oó]n(es)? de voto|\bCIS\b|NC ?Report|40 ?dB|GAD ?3|Sigma ?Dos|simulaci[oó]n(es)? de esca[ñn]os|proyecci[oó]n de esca[ñn]os|dar[ií]a(n)? .{0,20}esca[ñn]os/i;

export const esSondeo = (titulo: string) => SONDEO.test(titulo);

export const sinSondeos = <T extends { titulo: string }>(items: T[], enVeda: boolean): T[] =>
  enVeda ? items.filter((i) => !esSondeo(i.titulo)) : items;
