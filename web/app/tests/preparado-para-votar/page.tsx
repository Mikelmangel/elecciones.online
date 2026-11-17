import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import TestPreparadoVotar from '@/components/TestPreparadoVotar';
import { testsPreparado } from '@/lib/datos';

export const metadata: Metadata = {
  title: '¿Estás preparado para votar el 29-N? 15 preguntas clave sobre el sistema electoral',
  description:
    '15 preguntas para entender qué votas el 29-N y por qué: cómo se elige al presidente, el reparto de escaños con D\'Hondt, las listas abiertas del Senado y los plazos del voto por correo.',
  alternates: { canonical: '/tests/preparado-para-votar' },
};

export default function PreparadoParaVotarPage() {
  const datos = testsPreparado();

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'Tests', path: '/tests' },
          { name: '¿Estás preparado para votar el 29-N?', path: '/tests/preparado-para-votar' },
        ]}
      />

      <header className="space-y-2 text-center sm:text-left border-b border-neutral-200 pb-6">
        <h1 className="text-3xl sm:text-4xl font-bold font-editorial text-neutral-950">
          ¿Estás preparado para votar el 29 de noviembre?
        </h1>
        <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl">
          15 preguntas prácticas para entender qué votas de verdad el 29-N: cómo se reparte el poder en el Congreso, qué hace el Senado, qué ocurre con el voto en blanco y cómo asegurarte de que tu voto sea válido.
        </p>
      </header>

      <TestPreparadoVotar datos={datos} />
    </div>
  );
}
