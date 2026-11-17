'use client';

import { useState } from 'react';
import { calcularDHondtProvincia } from '@/lib/dhondt';

interface Fila { siglas: string; votos: number }
export interface Circ { codigo: string; nombre: string; diputados: number; blanco: number; candidaturas: Fila[] }

const INICIAL: Fila[] = [
  { siglas: 'Partido A', votos: 340000 },
  { siglas: 'Partido B', votos: 280000 },
  { siglas: 'Partido C', votos: 160000 },
  { siglas: 'Partido D', votos: 60000 },
];

const num = (v: string) => Math.max(0, Math.floor(Number(v)) || 0);

export default function Simulador({ circunscripciones }: { circunscripciones: Circ[] }) {
  const [filas, setFilas] = useState(INICIAL);
  const [escanos, setEscanos] = useState(7);
  const [blanco, setBlanco] = useState(0);

  const resultado = calcularDHondtProvincia(
    filas.map((f) => ({ ...f, color: '' })),
    escanos,
    blanco
  );
  const editar = (i: number, cambio: Partial<Fila>) =>
    setFilas(filas.map((f, j) => (j === i ? { ...f, ...cambio } : f)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <label className="text-sm">
          Cargar una provincia
          <select defaultValue="" onChange={(e) => {
              const c = circunscripciones.find((x) => x.codigo === e.target.value);
              if (!c) return;
              setEscanos(c.diputados);
              setBlanco(c.blanco);
              setFilas(c.candidaturas);
            }}
            className="block mt-1 border border-gray-300 rounded px-2 py-1">
            <option value="">Elegir…</option>
            {circunscripciones.map((c) => (
              <option key={c.codigo} value={c.codigo}>{c.nombre}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Escaños a repartir
          <input type="number" min={1} max={40} value={escanos} onChange={(e) => setEscanos(num(e.target.value))}
            className="block mt-1 border border-gray-300 rounded px-2 py-1 w-28" />
        </label>
        <label className="text-sm">
          Votos en blanco
          <input type="number" min={0} value={blanco} onChange={(e) => setBlanco(num(e.target.value))}
            className="block mt-1 border border-gray-300 rounded px-2 py-1 w-36" />
        </label>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-gray-300">
            <th scope="col" className="py-2">Candidatura</th>
            <th scope="col">Votos</th>
            <th scope="col">% válidos</th>
            <th scope="col">Escaños</th>
            <th scope="col"><span className="sr-only">Quitar</span></th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-1">
                <input aria-label="Nombre de la candidatura" value={f.siglas} onChange={(e) => editar(i, { siglas: e.target.value })}
                  className="border border-gray-300 rounded px-2 py-1 w-full max-w-48" />
              </td>
              <td>
                <input aria-label={`Votos de ${f.siglas}`} type="number" min={0} value={f.votos}
                  onChange={(e) => editar(i, { votos: num(e.target.value) })}
                  className="border border-gray-300 rounded px-2 py-1 w-32" />
              </td>
              <td>{resultado[i]?.porcentaje ?? 0} %</td>
              <td className="font-bold text-lg">{resultado[i]?.escanos ?? 0}</td>
              <td>
                <button onClick={() => setFilas(filas.filter((_, j) => j !== i))} aria-label={`Quitar ${f.siglas}`}
                  className="px-2 text-gray-500 hover:text-red-600">×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => setFilas([...filas, { siglas: `Partido ${filas.length + 1}`, votos: 0 }])}
        className="border border-gray-300 rounded px-3 py-1.5 text-sm hover:bg-gray-50">
        Añadir candidatura
      </button>
    </div>
  );
}
