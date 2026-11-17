import test from 'node:test';
import assert from 'node:assert/strict';
import {
  testsAfinidad,
  testsSocios,
  testsVotoProvincia,
  testsPropuestas,
  testsVotaciones,
  testsPreparado,
} from './datos.ts';

test('carga de test de afinidad: 18 afirmaciones y cobertura mínima >= 10 por partido', () => {
  const data = testsAfinidad();
  assert.equal(data.afirmaciones.length, 18);
  assert.equal(data.partidos_ideologia.length, 8);
  const conteos: Record<string, number> = {};
  for (const af of data.afirmaciones) {
    for (const [s, pos] of Object.entries(af.posiciones)) {
      assert.ok(pos.fuente_url.startsWith('https://'), `${af.id} ${s} sin URL`);
      conteos[s] = (conteos[s] ?? 0) + 1;
    }
  }
  for (const p of data.partidos_ideologia) {
    assert.ok((conteos[p.siglas] ?? 0) >= 10, `${p.siglas} tiene cobertura baja (${conteos[p.siglas]})`);
  }
});

test('carga de socios en el Congreso y voto por provincia', () => {
  const s = testsSocios();
  assert.equal(s.duelos.length, 8);
  assert.equal(s.pares.length, 28);
  const vp = testsVotoProvincia();
  assert.equal(vp.provincias.length, 52);
  assert.equal(vp.preguntas.length, 8);
});

test('carga de minijuego de 16 propuestas reales', () => {
  const data = testsPropuestas();
  assert.equal(data.preguntas.length, 16);
  for (const p of data.preguntas) {
    assert.ok(p.cita.length > 10);
    assert.ok(p.pagina > 0);
  }
});

test('carga de test de votaciones y preparado para votar', () => {
  const v = testsVotaciones();
  assert.ok(v.preguntas.length >= 6);
  const p = testsPreparado();
  assert.equal(p.preguntas.length, 15);
});
