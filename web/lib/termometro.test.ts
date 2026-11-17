import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LimiteDiario, LimiteTresSemanas, VENTANA_BLOQUEO_MS, validar } from './termometro.ts';

const C = ['PP', 'PSOE'];
const P = ['28', '08'];

test('validar acepta solo candidaturas y provincias conocidas', () => {
  assert.deepEqual(validar({ candidatura: 'PP', provincia: '28', extra: 1 }, C, P), { candidatura: 'PP', provincia: '28' });
  assert.equal(validar({ candidatura: 'XX', provincia: '28' }, C, P), null);
  assert.equal(validar({ candidatura: 'PP', provincia: '99' }, C, P), null);
  assert.equal(validar({ candidatura: ['PP'], provincia: '28' }, C, P), null);
  assert.equal(validar(null, C, P), null);
  assert.equal(validar('PP', C, P), null);
});

test('un apoyo por IP y día', () => {
  const l = new LimiteDiario();
  assert.equal(l.permitir('1.1.1.1', '2026-11-16'), true);
  assert.equal(l.permitir('1.1.1.1', '2026-11-16'), false);
  assert.equal(l.permitir('2.2.2.2', '2026-11-16'), true);
  assert.equal(l.permitir('1.1.1.1', '2026-11-17'), true); // día nuevo, sal nueva
});

test('bloqueo anónimo de 3 semanas (21 días) sin guardar la IP', () => {
  const l = new LimiteTresSemanas('sal-test');
  const t0 = 1_794_700_000_000;
  assert.equal(l.permitir('1.2.3.4', t0), true);
  assert.equal(l.permitir('1.2.3.4', t0 + 1000 * 60 * 60 * 24 * 7), false); // 1 semana después: bloqueado
  assert.equal(l.permitir('1.2.3.4', t0 + 1000 * 60 * 60 * 24 * 20), false); // 20 días después: bloqueado
  assert.equal(l.permitir('5.6.7.8', t0 + 1000), true); // otra IP: permitido
  assert.equal(l.permitir('1.2.3.4', t0 + VENTANA_BLOQUEO_MS + 1), true); // pasadas 3 semanas: permitido
  assert.notEqual(l.hash('1.2.3.4'), '1.2.3.4');
});
