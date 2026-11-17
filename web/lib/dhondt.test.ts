import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularDHondtProvincia } from './dhondt.ts';

const c = (siglas: string, votos: number) => ({ siglas, votos, color: '#000' });
const escanos = (r: { siglas: string; escanos: number }[]) =>
  Object.fromEntries(r.map((x) => [x.siglas, x.escanos]));

test('ejemplo clásico de 7 escaños', () => {
  const r = calcularDHondtProvincia(
    [c('A', 340000), c('B', 280000), c('C', 160000), c('D', 60000), c('E', 15000)],
    7
  );
  assert.deepEqual(escanos(r), { A: 3, B: 3, C: 1, D: 0, E: 0 });
});

test('barrera del 3 % cuenta los votos en blanco', () => {
  // B tiene 3,06 % de votos a candidaturas pero 2,97 % de válidos: fuera.
  const con = calcularDHondtProvincia([c('A', 9500), c('B', 300)], 40, 300);
  assert.equal(escanos(con).B, 0);
  const sin = calcularDHondtProvincia([c('A', 9500), c('B', 300)], 40, 0);
  assert.equal(escanos(sin).B, 1);
});

test('empate de cocientes: gana quien tiene más votos', () => {
  // 6000/2 = 3000/1 para el último escaño
  const r = calcularDHondtProvincia([c('A', 6000), c('B', 3000)], 2);
  assert.deepEqual(escanos(r), { A: 2, B: 0 });
});
