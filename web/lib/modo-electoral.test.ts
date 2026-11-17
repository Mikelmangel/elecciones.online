import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fase } from './modo-electoral.ts';

const F = '2026-11-29';
const en = (iso: string) => fase(new Date(iso), F);

test('fases alrededor de la fecha electoral (hora de Madrid, UTC+1 en noviembre)', () => {
  assert.equal(en('2026-11-23T22:59:00Z'), 'normal'); // 23:59 del día -6
  assert.equal(en('2026-11-23T23:00:00Z'), 'veda'); // 00:00 del día -5
  assert.equal(en('2026-11-29T19:59:00Z'), 'veda'); // 20:59 de la jornada
  assert.equal(en('2026-11-29T20:00:00Z'), 'despues'); // 21:00
});

test('sin fecha configurada no hay veda', () => {
  assert.equal(fase(new Date(), undefined), 'normal');
});
