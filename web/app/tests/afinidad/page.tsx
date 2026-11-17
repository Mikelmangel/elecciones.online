import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import TestAfinidadInteractivo from '@/components/TestAfinidadInteractivo';
import { testsAfinidad } from '@/lib/datos';

export const metadata: Metadata = {
  title: '¿Con qué partido coincides? Test para las elecciones del 29-N',
  description:
    'Di si estás de acuerdo con medidas reales y descubre con qué partido coincides más, según cómo votaron en el Congreso y lo que proponen en sus programas.',
  alternates: { canonical: '/tests/afinidad' },
};

export default function TestAfinidadPage() {
  const data = testsAfinidad();

  return (
    <div className="space-y-8">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'Tests', path: '/tests' },
          { name: 'Afinidad política e ideología', path: '/tests/afinidad' },
        ]}
      />

      <header className="space-y-2 border-b border-neutral-200 pb-6">
        <span className="inline-block rounded-full bg-red-900/10 px-3 py-1 text-xs font-bold text-red-900">
          Votaciones reales del Congreso y Programas 2026
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold font-editorial text-neutral-950">
          Afinidad política: test de partidos e ideología
        </h1>
        <p className="text-base text-neutral-600 max-w-3xl leading-relaxed">
          {data.metodologia.descripcion}
        </p>
      </header>

      <TestAfinidadInteractivo data={data} />

      <footer className="border-t border-[#dfd9cc] pt-6 text-xs text-neutral-500 leading-relaxed">
        <strong>Metodología y privacidad:</strong> {data.metodologia.disclaimer}
      </footer>
    </div>
  );
}
