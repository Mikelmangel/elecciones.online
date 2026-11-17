'use client';

import Link from 'next/link';
import { useState } from 'react';

export interface Fila { id: string; fecha: string; texto: string; si: number; no: number; abs: number }

const POR_PAGINA = 60;

const plano = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

export default function Tabla({ filas }: { filas: Fila[] }) {
  const [q, setQ] = useState('');
  const [limite, setLimite] = useState(POR_PAGINA);
  const visibles = q.length < 2 ? filas : filas.filter((f) => plano(f.texto).includes(plano(q)));
  return (
    <>
      <label className="block text-sm mb-4">
        Buscar en el asunto
        <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setLimite(POR_PAGINA); }} placeholder="vivienda, pensiones, amnistía…"
          className="block mt-1 border border-gray-300 rounded px-3 min-h-11 text-base w-full max-w-md" />
      </label>
      <p className="text-sm text-gray-600 mb-2" role="status">{visibles.length} votaciones</p>
      <table className="w-full text-sm table-fixed">
        <colgroup><col className="w-14" /><col /><col className="w-11" /><col className="w-11" /><col className="w-11" /></colgroup>
        <thead>
          <tr className="text-left border-b border-gray-300">
            <th scope="col" className="py-2 pr-3">Fecha</th>
            <th scope="col">Asunto</th>
            <th scope="col" className="px-2 text-right">Sí</th>
            <th scope="col" className="px-2 text-right">No</th>
            <th scope="col" className="px-2 text-right">Abs.</th>
          </tr>
        </thead>
        <tbody>
          {visibles.slice(0, limite).map((f) => (
            <tr key={f.id} className="border-b border-gray-100 align-top">
              <td className="py-2 pr-3 whitespace-nowrap"><time dateTime={f.fecha}>{f.fecha.slice(8)}/{f.fecha.slice(5, 7)}</time></td>
              <td className="py-2 break-words"><Link href={`/espana/congreso/xv-legislatura/votaciones/${f.id}`} className="line-clamp-3 hover:underline sm:line-clamp-none">{f.texto}</Link></td>
              <td className="px-2 text-right">{f.si}</td>
              <td className="px-2 text-right">{f.no}</td>
              <td className="px-2 text-right">{f.abs}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {visibles.length > limite && (
        <button type="button" onClick={() => setLimite((l) => l + POR_PAGINA)}
          className="mt-4 min-h-11 rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-red-900">
          Ver {Math.min(POR_PAGINA, visibles.length - limite)} más (quedan {visibles.length - limite})
        </button>
      )}
    </>
  );
}
