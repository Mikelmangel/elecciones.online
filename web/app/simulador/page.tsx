import Simulador from './Simulador';
import { convocatoria, resultados2023 } from '@/lib/datos';

export const metadata = {
  title: 'Simulador D’Hondt',
  description: 'Calcula el reparto de escaños de una provincia con la fórmula D’Hondt y la barrera del 3 %.',
};

export default function Page() {
  const conv = convocatoria();
  const res = resultados2023();
  const circunscripciones = res.provincias
    .map((p) => ({
      codigo: p.codigo,
      nombre: p.nombre,
      diputados: conv.circunscripciones.find((c) => c.codigo === p.codigo)!.diputados,
      blanco: p.votos_blanco,
      // las candidaturas por debajo del 1 % no cambian el reparto y alargan la tabla
      candidaturas: p.candidaturas.filter((c) => c.votos >= p.votos_validos * 0.01).map((c) => ({ siglas: c.siglas, votos: c.votos })),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  return (
    <>
      <h1 className="text-3xl font-bold mb-2">Simulador D’Hondt</h1>
      <p className="text-gray-600 mb-6 max-w-3xl">
        Elige una provincia para cargar sus votos de 2023 con los escaños que reparte el 29 de noviembre de 2026, y cambia los números para ver cómo se mueve el reparto. Quedan fuera las candidaturas con menos del 3 % de los votos válidos, contando los votos en blanco.
      </p>
      <Simulador circunscripciones={circunscripciones} />
      <p className="text-sm text-gray-600 mt-6">
        Fuentes: votos de 2023, <a className="underline" href={res.fuente_url} rel="noopener">{res.boe_id}</a>; escaños de 2026, <a className="underline" href={conv.fuente_url} rel="noopener">Real Decreto 806/2026</a>. Al cargar una provincia se omiten las candidaturas con menos del 1 % de los votos.
      </p>
    </>
  );
}
