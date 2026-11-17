import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esSondeo, sinSondeos } from './titulares.ts';

const items = [
  { titulo: 'Una encuesta da cuatro escaños a un partido nuevo' },
  { titulo: 'El CIS sitúa al PSOE por delante' },
  { titulo: 'Vox se frena y cede terreno al PP, según un sondeo' },
  { titulo: 'El Congreso convalida el decreto de vivienda' },
];

test('en veda se ocultan los titulares de sondeos y no los demás', () => {
  const v = sinSondeos(items, true);
  assert.deepEqual(v.map((i) => i.titulo), ['El Congreso convalida el decreto de vivienda']);
});

test('fuera de veda (antes o después) se muestran todos', () => {
  assert.equal(sinSondeos(items, false).length, 4);
});

test('el titular real que aparece hoy en portada se reconoce como sondeo solo si lo es', () => {
  assert.equal(esSondeo('Abascal evita revelar en campaña cuál es su plan para las pensiones'), false);
  assert.equal(esSondeo('Feijóo: «no hay que hacer caso a las encuestas»'), true); // conservador: prefiere ocultar de más
});
