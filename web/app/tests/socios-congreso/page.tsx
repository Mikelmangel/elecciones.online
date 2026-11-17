import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import MinijuegoSociosCongreso from '@/components/MinijuegoSociosCongreso';
import { testsSocios } from '@/lib/datos';

export const metadata: Metadata = {
  title: 'Socios en el Congreso: ¿Quién vota con quién? (XV Legislatura)',
  description:
    'Juego de duelos y matriz exacta de coincidencia de voto calculada sobre las votaciones del Pleno de la XV Legislatura con desglose por grupo.',
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
          Socios en el Congreso: ¿Quién vota igual que quién?
        </h1>
        <p className="text-base text-neutral-600 max-w-3xl leading-relaxed">
          Más allá de los titulares, comprueba qué porcentaje exacto de veces votaron en el mismo sentido los 8 grupos parlamentarios en las {data.total_votaciones} votaciones del Pleno con desglose por grupo.
        </p>
        {data.metodologia && <p className="max-w-3xl text-sm text-neutral-600">{data.metodologia}</p>}
      </header>

      <MinijuegoSociosCongreso data={data} />
    </div>
  );
}
