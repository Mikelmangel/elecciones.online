import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { coherenciaVotaciones, factcheckingEntrevistas } from './datos.ts';

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u;

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkTsFiles(full));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

test('no hay emojis en web/app, web/components ni web/content', () => {
  const webDir = path.resolve(import.meta.dirname, '..');
  const files = [
    ...walkTsFiles(path.join(webDir, 'app')),
    ...walkTsFiles(path.join(webDir, 'components')),
    ...walkTsFiles(path.join(webDir, 'content')),
  ];
  const conEmoji: string[] = [];
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    if (EMOJI_RE.test(txt)) {
      conEmoji.push(path.relative(webDir, f));
    }
  }
  assert.deepEqual(conEmoji, [], `Archivos con emojis residuales: ${conEmoji.join(', ')}`);
});

test('solo se publican veredictos y casos de coherencia con prueba comprobable', () => {
  // regla 8: `revisado` lo pone la verificación automática; nada exige un mínimo de veredictos.
  for (const c of coherenciaVotaciones().casos) assert.equal(c.revisado, true);
  const publicados = factcheckingEntrevistas().verificaciones.filter((v) => v.veredicto !== 'NO COMPROBADO');
  for (const v of publicados) {
    assert.equal(v.revisado, true);
    const serieOficial = /^https:\/\/(www\.bde\.es|servicios\.ine\.es)\/.+\.(csv|json)|DATOS_SERIE/.test(v.fuente_oficial_url ?? '');
    assert.ok(v.cruce_votacion || serieOficial, `${v.id}: veredicto sin votación ni serie oficial descargada que lo pruebe`);
  }
});
