'use client';

import { useEffect, useState } from 'react';

interface Props {
  fechaEleccion: string;
  apertura: string;
  cierre: string;
}

function calcular(fechaEleccion: string, apertura: string, cierre: string) {
  const ahora = new Date();
  const hoyMadrid = ahora.toLocaleString('sv-SE', { timeZone: 'Europe/Madrid', hour12: false }).slice(0, 10);
  const horaMadrid = ahora.toLocaleString('sv-SE', { timeZone: 'Europe/Madrid', hour12: false }).slice(11, 16);

  if (hoyMadrid === fechaEleccion) {
    if (horaMadrid < apertura) return { estado: 'hoy_antes', texto: `Hoy se vota · colegios abiertos de ${apertura} a ${cierre}` };
    if (horaMadrid < cierre) return { estado: 'hoy_abierto', texto: `Jornada electoral en curso · urnas abiertas hasta las ${cierre}` };
    return { estado: 'post', texto: 'Urnas cerradas · escrutinio y resultados' };
  }
  if (hoyMadrid > fechaEleccion) {
    return { estado: 'post', texto: 'Elecciones celebradas' };
  }

  // En noviembre en España peninsular es UTC+1
  const objetivo = new Date(`${fechaEleccion}T${apertura}:00+01:00`).getTime();
  const diff = Math.max(0, objetivo - ahora.getTime());
  const dias = Math.floor(diff / 86_400_000);
  const horas = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return {
    estado: 'cuenta',
    texto: `Faltan ${dias} ${dias === 1 ? 'día' : 'días'}, ${horas} h y ${mins} min para abrir los colegios`,
  };
}

export default function CuentaAtras({ fechaEleccion, apertura, cierre }: Props) {
  const [info, setInfo] = useState<{ estado: string; texto: string } | null>(null);

  useEffect(() => {
    const actualizar = () => setInfo(calcular(fechaEleccion, apertura, cierre));
    actualizar();
    const id = setInterval(actualizar, 60_000);
    return () => clearInterval(id);
  }, [fechaEleccion, apertura, cierre]);

  return (
    <p className="text-sm font-semibold text-slate-800" aria-live="polite">
      {info ? info.texto : `Elecciones convocadas para el ${fechaEleccion}`}
    </p>
  );
}
