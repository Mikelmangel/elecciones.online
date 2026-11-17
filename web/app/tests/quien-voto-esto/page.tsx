import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import MinijuegoVotaciones from '@/components/MinijuegoVotaciones';
import { testsVotaciones } from '@/lib/datos';

export const metadata: Metadata = {
  title: '¿Quién votó qué en el Congreso? Adivina el voto de cada partido',
  description:
    'Adivina qué votó cada partido en votaciones importantes de esta legislatura. Las respuestas salen del registro oficial del Congreso.',
  alternates: { canonical: '/tests/quien-voto-esto' },
};

export default function QuienVotoEstoPage() {
  const datos = testsVotaciones();

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'Tests', path: '/tests' },
          { name: '¿Quién votó qué en el Congreso?', path: '/tests/quien-voto-esto' },
        ]}
      />

      <header className="space-y-2 text-center sm:text-left border-b border-neutral-200 pb-6">
        <h1 className="text-3xl sm:text-4xl font-bold font-editorial text-neutral-950">
          ¿Quién votó esto en el Congreso de los Diputados?
        </h1>
        <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl">
          Te contamos de qué trataba cada votación y tú adivinas qué votó un partido. Cada respuesta enlaza al registro oficial del Congreso. Un «decreto» es una norma que aprueba el Gobierno con urgencia y que el Congreso tiene que ratificar.
        </p>
      </header>

      <MinijuegoVotaciones datos={datos} />
    </div>
  );
}
