import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import MinijuegoSociosCongreso from '@/components/MinijuegoSociosCongreso';
import { testsSocios } from '@/lib/datos';

export const metadata: Metadata = {
  title: '¿Qué partidos votan igual en el Congreso?',
  description:
    'Juego para adivinar qué parejas de partidos votan igual con más frecuencia en el Congreso, con el porcentaje real de cada pareja.',
  alternates: { canonical: '/tests/socios-congreso' },
};

export default function SociosCongresoPage() {
  const data = testsSocios();

  return (
    <div className="space-y-8">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'Tests', path: '/tests' },
          { name: 'Socios en el Congreso', path: '/tests/socios-congreso' },
        ]}
      />

      <header className="space-y-2 border-b border-neutral-200 pb-6">
                <h1 className="text-3xl sm:text-5xl font-bold font-editorial text-neutral-950">
          ¿Qué partidos votan igual en el Congreso?
        </h1>
        <p className="text-base text-neutral-600 max-w-3xl leading-relaxed">
          Comprueba en qué porcentaje de votaciones votaron lo mismo dos partidos. Hemos contado las {data.total_votaciones} votaciones del Congreso de esta legislatura en las que se conoce el voto de cada partido.
        </p>
        {data.metodologia && <p className="max-w-3xl text-sm text-neutral-600">{data.metodologia}</p>}
      </header>

      <MinijuegoSociosCongreso data={data} />
    </div>
  );
}
