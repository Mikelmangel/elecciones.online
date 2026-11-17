import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import MinijuegoPropuestas from '@/components/MinijuegoPropuestas';
import { testsPropuestas } from '@/lib/datos';

export const metadata: Metadata = {
  title: '¿De quién es esta propuesta? 16 medidas reales de programas electorales 2026',
  description:
    '16 propuestas con cita literal y página de los programas electorales oficiales. ¿De qué partido es cada una?',
  alternates: { canonical: '/tests/de-quien-es-la-propuesta' },
};

export default function DeQuienEsLaPropuestaPage() {
  const datos = testsPropuestas();

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'Tests', path: '/tests' },
          { name: '¿De quién es esta propuesta?', path: '/tests/de-quien-es-la-propuesta' },
        ]}
      />

      <header className="space-y-2 text-center sm:text-left border-b border-neutral-200 pb-6">
        <h1 className="text-3xl sm:text-4xl font-bold font-editorial text-neutral-950">
          ¿De quién es esta propuesta?
        </h1>
        <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl">
          16 propuestas de los programas electorales oficiales. Adivina de qué partido es cada una; al responder ves la cita literal y la página.
        </p>
      </header>

      <MinijuegoPropuestas datos={datos} />
    </div>
  );
}
