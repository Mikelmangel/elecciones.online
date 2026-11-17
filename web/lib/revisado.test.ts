import test from 'node:test';
import assert from 'node:assert/strict';
import { soloCita, factcheckingEntrevistas, coherenciaVotaciones } from './datos.ts';

test('sin revisado no hay veredicto ni paráfrasis', () => {
  const v = { cita_literal: 'c', afirmacion: 'a', veredicto: 'FALSO', dato_oficial: 'd', explicacion: 'e', cruce_votacion: 'x' } as never;
  const r = soloCita(v);
  assert.equal(r.veredicto, 'NO COMPROBADO');
  assert.equal(r.afirmacion, 'c');
  assert.equal(r.cruce_votacion, undefined);
  assert.equal(soloCita({ ...(v as object), revisado: true } as never).veredicto, 'FALSO');
});

test('datos publicados: nada sin revisar lleva veredicto', () => {
  for (const v of factcheckingEntrevistas().verificaciones)
    assert.ok(v.revisado === true || v.veredicto === 'NO COMPROBADO', v.id);
  for (const c of coherenciaVotaciones().casos) assert.equal(c.revisado, true);
});
