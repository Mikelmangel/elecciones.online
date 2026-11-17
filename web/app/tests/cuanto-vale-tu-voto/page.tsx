import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import MinijuegoVotoProvincia from '@/components/MinijuegoVotoProvincia';
import { testsVotoProvincia } from '@/lib/datos';

export const metadata: Metadata = {
  title: '¿Cuánto vale un escaño en tu provincia? Ley D\'Hondt y márgenes 2023–2026',
  description:
    'Descubre por cuántos votos se decidió el último diputado en tu provincia en 2023 y juega a adivinar las circunscripciones más reñidas de cara al 29-N.',
  alternates: { canonical: '/tests/cuanto-vale-tu-voto' },
};

export default function CuantoValeTuVotoPage() {
  const data = testsVotoProvincia();

  return (
    <div className="space-y-8">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'Tests', path: '/tests' },
          { name: '¿Cuánto vale un escaño en tu provincia?', path: '/tests/cuanto-vale-tu-voto' },
        ]}
      />

      <header className="space-y-2 border-b border-neutral-200 pb-6">
        <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
          52 circunscripciones · Escrutinio oficial BOE
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold font-editorial text-neutral-950">
          ¿Cuánto vale un escaño en tu provincia?
        </h1>
        <p className="text-base text-neutral-600 max-w-3xl leading-relaxed">
          En algunas provincias el último diputado se decide por apenas cientos de papeletas. Elige tu circunscripción para ver el margen real del último escaño y pon a prueba tu intuición electoral.
        </p>
      </header>

      <MinijuegoVotoProvincia data={data} />
    </div>
  );
}
