import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { NextRequest, NextResponse } from 'next/server';
import { CANDIDATURAS } from '@/content/candidaturas';
import { fase } from '@/lib/modo-electoral';
import { hashIpIrreversible, LimiteTresSemanas, validar, VENTANA_BLOQUEO_MS } from '@/lib/termometro';

export const dynamic = 'force-dynamic';

const PROVINCIAS = Array.from({ length: 52 }, (_, i) => String(i + 1).padStart(2, '0'));
const SAL_TERMOMETRO = process.env.TERMOMETRO_SALT ?? randomBytes(32).toString('hex');
const limite = new LimiteTresSemanas(SAL_TERMOMETRO);

// ponytail: SQLite en un fichero, un solo proceso. Postgres si algún día hay varias instancias.
let _db: DatabaseSync | undefined;
function db(): DatabaseSync {
  if (!_db) {
    const ruta = process.env.TERMOMETRO_DB ?? path.join(process.cwd(), 'var', 'termometro.sqlite');
    mkdirSync(path.dirname(ruta), { recursive: true });
    _db = new DatabaseSync(ruta);
    // Sin IP, sin identificador y sin hora junto al apoyo: solo el día.
    _db.exec('CREATE TABLE IF NOT EXISTS apoyos (candidatura TEXT NOT NULL, provincia TEXT NOT NULL, dia TEXT NOT NULL)');
    // Tabla separada de bloqueos por hash irreversible durante 3 semanas (21 días), sin vínculo con el voto emitido.
    _db.exec('CREATE TABLE IF NOT EXISTS bloqueos_voto (hash TEXT PRIMARY KEY, expira_en INTEGER NOT NULL)');
  }
  return _db;
}

const cerrado = () =>
  NextResponse.json(
    { error: 'El termómetro está cerrado durante los cinco días anteriores a la votación (art. 69.7 LOREG).' },
    { status: 403 }
  );

const MAX_BODY_BYTES = 4096;
const MAX_TOKEN_LEN = 2048;

async function turnstileValido(token: unknown, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || typeof token !== 'string' || !token || token.length > MAX_TOKEN_LEN) return false; // sin clave configurada no se acepta nada
  const params = new URLSearchParams({ secret, response: token });
  if (ip) params.set('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: params,
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);
  return Boolean(r && r.ok && (await r.json()).success === true);
}

export async function GET() {
  if (fase() === 'veda') return cerrado();
  const filas = db().prepare('SELECT candidatura, provincia, COUNT(*) AS n FROM apoyos GROUP BY candidatura, provincia').all();
  return NextResponse.json({ apoyos: filas }, { headers: { 'Cache-Control': 'public, max-age=60' } });
}

export async function POST(req: NextRequest) {
  if (fase() === 'veda') return cerrado();
  const contentLength = Number(req.headers.get('content-length') ?? '0');
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Petición demasiado grande.' }, { status: 413 });
  }
  const raw = await req.text().catch(() => '');
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Petición demasiado grande.' }, { status: 413 });
  }
  let cuerpo: unknown = null;
  try {
    cuerpo = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Datos no válidos.' }, { status: 400 });
  }
  const apoyo = validar(cuerpo, CANDIDATURAS.map((c) => c.siglas), PROVINCIAS);
  if (!apoyo) return NextResponse.json({ error: 'Datos no válidos.' }, { status: 400 });

  // Detrás de Cloudflare; el origen solo debe aceptar tráfico de Cloudflare (ver infra/README).
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null;
  if (!(await turnstileValido((cuerpo as { token?: unknown }).token, ip)))
    return NextResponse.json({ error: 'No se ha podido verificar que eres una persona.' }, { status: 403 });

  const ahora = Date.now();
  const claveIp = ip ?? '__sin_ip__';
  const hashIp = hashIpIrreversible(claveIp, SAL_TERMOMETRO);
  const bloqueoDb = db()
    .prepare('SELECT expira_en FROM bloqueos_voto WHERE hash = ?')
    .get(hashIp) as { expira_en: number } | undefined;

  if ((bloqueoDb && bloqueoDb.expira_en > ahora) || !limite.permitir(claveIp, ahora)) {
    return NextResponse.json(
      { error: 'Ya has expresado tu opinión de voto. Para evitar duplicidades, el mismo acceso queda bloqueado durante 3 semanas (21 días) sin guardar tu IP.' },
      { status: 429 }
    );
  }

  db().prepare('DELETE FROM bloqueos_voto WHERE expira_en <= ?').run(ahora); // no conservar huellas caducadas
  const dia = new Date(ahora).toISOString().slice(0, 10);
  db()
    .prepare('INSERT OR REPLACE INTO bloqueos_voto (hash, expira_en) VALUES (?, ?)')
    .run(hashIp, ahora + VENTANA_BLOQUEO_MS);
  db().prepare('INSERT INTO apoyos (candidatura, provincia, dia) VALUES (?, ?, ?)').run(apoyo.candidatura, apoyo.provincia, dia);
  return NextResponse.json({ ok: true });
}
