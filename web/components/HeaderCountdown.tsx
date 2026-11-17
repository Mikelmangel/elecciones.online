'use client';

import { useEffect, useState } from 'react';

// Cuenta atrás hasta la apertura de colegios (09:00, hora peninsular).
export default function HeaderCountdown({ fechaEleccion = '2026-11-29' }: { fechaEleccion?: string }) {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const objetivo = Date.parse(`${fechaEleccion}T09:00:00+01:00`);
    const tick = () => setMs(objetivo - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [fechaEleccion]);

  if (ms !== null && ms <= 0) {
    return <p className="text-sm font-semibold text-white">{ms > -11 * 3_600_000 ? 'Hoy se vota · colegios abiertos de 9:00 a 20:00' : 'Elecciones celebradas el 29 de noviembre'}</p>;
  }
  const n = (div: number, mod: number) => (ms === null ? '--' : String(Math.floor(ms / div) % mod).padStart(2, '0'));
  const partes: [string, string][] = [
    [ms === null ? '--' : String(Math.floor(ms / 86_400_000)), 'días'],
    [n(3_600_000, 24), 'h'],
    [n(60_000, 60), 'min'],
    [n(1000, 60), 's'],
  ];
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-neutral-300" role="timer" aria-label="Tiempo hasta la apertura de colegios el 29 de noviembre">
      <span><span className="hidden sm:inline">Elecciones Generales del </span>29-N<span className="hidden sm:inline">, en</span></span>
      <span className="flex items-baseline gap-2 font-semibold text-white tabular-nums" aria-hidden>
        {partes.map(([v, u]) => (
          <span key={u}>
            <span className="text-base">{v}</span> <span className="text-xs font-normal text-neutral-400">{u}</span>
          </span>
        ))}
      </span>
    </p>
  );
}
