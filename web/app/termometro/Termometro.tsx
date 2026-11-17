'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { colorPartido } from '@/lib/colores';

interface Fila {
  candidatura: string;
  provincia: string;
  n: number;
}

interface Props {
  candidaturas: { siglas: string; nombre: string }[];
  provincias: { codigo: string; nombre: string }[];
  siteKey: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, o: { sitekey: string; callback: (t: string) => void }) => void;
      reset: () => void;
    };
  }
}

const CLAVE_PRUEBA_CF = '1x00000000000000000000AA';

export default function Termometro({ candidaturas, provincias, siteKey }: Props) {
  const usaTurnstileReal = Boolean(siteKey && siteKey !== CLAVE_PRUEBA_CF);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [provincia, setProvincia] = useState('');
  const [filtroVistaProvincia, setFiltroVistaProvincia] = useState('');
  const [candidatura, setCandidatura] = useState('');
  const [token, setToken] = useState(usaTurnstileReal ? '' : 'XXXX.DUMMY.TOKEN.XXXX');
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState<{ ok: boolean; texto: string } | null>(null);
  const caja = useRef<HTMLDivElement>(null);

  const cargar = () =>
    fetch('/api/termometro')
      .then((r) => (r.ok ? r.json() : { apoyos: [] }))
      .then((d) => setFilas(d.apoyos ?? []))
      .catch(() => null);

  useEffect(() => {
    cargar();
  }, []);

  const pintarWidget = () => {
    if (usaTurnstileReal && caja.current && window.turnstile && !caja.current.hasChildNodes()) {
      window.turnstile.render(caja.current, { sitekey: siteKey, callback: setToken });
    }
  };
  useEffect(pintarWidget);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!provincia || !candidatura) return;
    setEnviando(true);
    setEstado(null);
    try {
      const r = await fetch('/api/termometro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidatura, provincia, token }),
      });
      if (r.ok) {
        setEstado({
          ok: true,
          texto: 'Tu opinión de voto se ha registrado de forma anónima. Este acceso queda bloqueado durante 3 semanas (21 días).',
        });
        setFiltroVistaProvincia(provincia);
        cargar();
      } else {
        const err = await r.json().catch(() => ({ error: 'No se pudo registrar el apoyo.' }));
        setEstado({ ok: false, texto: err.error ?? 'No se pudo registrar el apoyo.' });
      }
      if (usaTurnstileReal) {
        window.turnstile?.reset();
        setToken('');
      }
    } finally {
      setEnviando(false);
    }
  }

  const visibles = filtroVistaProvincia
    ? filas.filter((f) => f.provincia === filtroVistaProvincia)
    : filas;

  const totales = candidaturas
    .map((c) => ({
      ...c,
      n: visibles.filter((f) => f.candidatura === c.siglas).reduce((a, f) => a + f.n, 0),
    }))
    .sort((a, b) => b.n - a.n || a.nombre.localeCompare(b.nombre, 'es'));

  const total = totales.reduce((a, c) => a + c.n, 0);
  const maxVotos = Math.max(1, ...totales.map((c) => c.n));
  const provinciasConParticipacion = new Set(filas.map((f) => f.provincia)).size;

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      {usaTurnstileReal && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          onReady={pintarWidget}
        />
      )}

      {/* Columna izquierda: Formulario de emisión de opinión */}
      <form
        onSubmit={enviar}
        className="min-w-0 space-y-5 rounded-2xl border border-[#dfd9cc] bg-white p-5 sm:p-6 lg:col-span-5"
      >
        <div>
          <h2 className="font-editorial text-2xl font-bold text-neutral-950">
            Registra tu preferencia
          </h2>
        </div>

        <div>
          <label htmlFor="select-provincia" className="mb-1.5 block text-sm font-semibold text-neutral-900">
            1. Tu provincia
          </label>
          <select
            id="select-provincia"
            required
            value={provincia}
            onChange={(e) => setProvincia(e.target.value)}
            className="min-h-12 w-full min-w-0 rounded-lg border border-[#c9c1b0] bg-[#faf7f2] px-3.5 text-base font-semibold text-neutral-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            <option value="">Selecciona tu provincia…</option>
            {provincias.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold text-neutral-900">
            2. Candidatura a la que darías tu apoyo
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {candidaturas.map((c) => {
              const activa = candidatura === c.siglas;
              const color = colorPartido(c.siglas);
              return (
                <button
                  key={c.siglas}
                  type="button"
                  onClick={() => setCandidatura(c.siglas)}
                  aria-pressed={activa}
                  className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 text-left text-sm font-semibold transition-colors ${
                    activa
                      ? 'border-neutral-950 bg-neutral-950 text-white shadow-xs'
                      : 'border-[#e4dfd3] bg-[#faf7f2] text-neutral-900 hover:bg-white hover:border-neutral-400'
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate">{c.siglas === 'OTRA' ? 'Otra lista' : c.siglas}</span>
                </button>
              );
            })}
          </div>
          {candidatura && (
            <p className="mt-2 text-xs text-neutral-600">
              Seleccionada:{' '}
              <strong className="text-neutral-950">
                {candidaturas.find((c) => c.siglas === candidatura)?.nombre}
              </strong>
            </p>
          )}
        </div>

        {usaTurnstileReal && <div ref={caja} className="pt-1" />}

        <button
          type="submit"
          disabled={!token || !provincia || !candidatura || enviando}
          className="min-h-12 w-full rounded-lg bg-neutral-950 px-5 text-base font-semibold text-white transition-colors hover:bg-red-900 disabled:bg-neutral-300 disabled:text-neutral-600"
        >
          {enviando
            ? 'Registrando…'
            : provincia && candidatura
              ? `Registrar apoyo a ${candidatura === 'OTRA' ? 'otra lista' : candidatura} en ${provincias.find((p) => p.codigo === provincia)?.nombre}`
              : 'Elige provincia y candidatura'}
        </button>

        {estado && (
          <div
            role="status"
            className={`rounded-lg border p-3.5 text-sm leading-relaxed ${
              estado.ok
                ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                : 'border-red-300 bg-red-50 text-red-950'
            }`}
          >
            {estado.texto}
          </div>
        )}
      </form>

      {/* Columna derecha: Resultados agregados en vivo */}
      <section className="min-w-0 space-y-5 rounded-2xl border border-[#dfd9cc] bg-white p-5 sm:p-6 lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ece7dc] pb-4">
          <div>
            <h2 className="font-editorial text-2xl font-bold text-neutral-950">
              {filtroVistaProvincia
                ? `${provincias.find((p) => p.codigo === filtroVistaProvincia)?.nombre ?? 'Provincia'}`
                : 'Toda España'}{' '}
              <span className="text-neutral-500 font-normal text-lg">
                ({total} {total === 1 ? 'apoyo registrado' : 'apoyos registrados'})
              </span>
            </h2>
          </div>

          <div className="w-full sm:w-auto">
            <select
              aria-label="Filtrar resultados por provincia"
              value={filtroVistaProvincia}
              onChange={(e) => setFiltroVistaProvincia(e.target.value)}
              className="min-h-11 w-full min-w-0 rounded-lg border border-[#c9c1b0] bg-[#faf7f2] px-3 text-sm font-semibold text-neutral-900 sm:w-auto"
            >
              <option value="">Toda España ({provinciasConParticipacion} {provinciasConParticipacion === 1 ? 'provincia' : 'provincias'} con datos)</option>
              {provincias.map((p) => (
                <option key={p.codigo} value={p.codigo}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ul className="space-y-2.5">
          {totales.filter((c) => c.n > 0).map((c) => {
            const pct = total > 0 ? (c.n / total) * 100 : 0;
            const anchoBarra = total > 0 ? Math.max(c.n > 0 ? 3 : 0, (c.n / maxVotos) * 100) : 0;
            const color = colorPartido(c.siglas);
            return (
              <li
                key={c.siglas}
                className="space-y-1.5 border-b border-[#ece7dc] pb-2.5"
              >
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-bold text-neutral-950 truncate">{c.nombre}</span>
                    
                  </div>
                  <div className="flex shrink-0 items-center gap-2 tabular-nums">
                    <span className="font-bold text-neutral-900">{pct.toFixed(1)}%</span>
                    <span className="text-neutral-500">({c.n})</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-neutral-200/80 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${anchoBarra}%`, backgroundColor: color }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        {total === 0 && <p className="text-sm text-neutral-600">Todavía no hay apoyos registrados aquí.</p>}
      </section>
    </div>
  );
}
