import { test } from 'node:test';
import assert from 'node:assert/strict';
import { barajar } from './barajar.ts';

test('mismo resultado con la misma semilla y no pierde ni repite opciones', () => {
  const o = ['a', 'b', 'c', 'd'];
  assert.deepEqual(barajar(o, 'prep-1'), barajar(o, 'prep-1'));
  assert.deepEqual([...barajar(o, 'prep-1')].sort(), o);
});

test('la primera opción deja de ser siempre la primera', () => {
  const o = ['correcta', 'x', 'y', 'z'];
  const primeras = new Set(Array.from({ length: 15 }, (_, i) => barajar(o, `prep-${i + 1}`)[0]));
  assert.ok(primeras.size > 1);
  // no debe caer siempre en la misma posición
  const posiciones = new Set(Array.from({ length: 15 }, (_, i) => barajar(o, `prep-${i + 1}`).indexOf('correcta')));
  assert.ok(posiciones.size >= 3, `posiciones de la correcta: ${[...posiciones]}`);
});
