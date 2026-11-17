import Pactometro from '@/components/Pactometro';
import { color } from '@/content/colores';
import { resultados2023 } from '@/lib/datos';

export const metadata = {
  title: 'Pactómetro',
  description: 'Suma partidos y comprueba si alcanzan los 176 escaños de la mayoría absoluta, con los resultados oficiales de 2023.',
};

export default function Page() {
  const r = resultados2023();
  const partidos = r.nacional.filter((p) => p.escanos > 0).map((p) => ({ siglas: p.siglas, escanos: p.escanos, color: color(p.siglas) }));
  return (
    <>
      <h1 className="text-3xl font-bold mb-2">Pactómetro</h1>
      <p className="text-gray-600 mb-6 max-w-3xl">
        Pulsa en los partidos para sumar sus escaños. Los datos son los resultados oficiales de las elecciones generales del 23 de julio de 2023, tal como los proclamó la Junta Electoral Central. La investidura sale en primera votación con 176 votos; en la segunda basta con más síes que noes.
      </p>
      <Pactometro partidos={partidos} />
      <p className="text-sm text-gray-600 mt-6">
        Fuente: <a className="underline" href={r.fuente_url} rel="noopener">{r.boe_id}</a>. PSOE y PSC figuran por separado porque así constan en la proclamación oficial.
      </p>
    </>
  );
}
