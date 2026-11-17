import type { Metadata } from 'next';
import Link from 'next/link';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';

export const metadata: Metadata = {
  title: 'Tests y minijuegos: propuestas, votaciones y cómo votar (29-N 2026)',
  description:
    'Minijuegos con propuestas literales de los programas, votaciones reales del Congreso y un test sobre cómo votar el 29-N.',
  alternates: { canonical: '/tests' },
};

const TESTS = [
  {
    href: '/tests/afinidad',
    titulo: 'Afinidad política: partidos y brújula 2D',
    subtitulo: '20 afirmaciones con votos del Congreso y programas 2026',
    descripcion:
      'Compara tus opiniones con lo que han votado los grupos en el Congreso y con sus propuestas oficiales, o ubícate en la brújula de dos ejes.',
    preguntas: '20 afirmaciones verificadas',
    tiempo: '4 min',
    badge: 'Test de afinidad',
    color: '#991b1b',
  },
  {
    href: '/tests/socios-congreso',
    titulo: 'Socios en el Congreso: ¿Quién vota con quién?',
    subtitulo: 'Duelos y matriz de coincidencia de voto entre los grupos del Congreso',
    descripcion:
      'Apuesta qué pareja votó igual más veces en la XV Legislatura (PP+PSOE, PSOE+Junts, PP+VOX...) y explora los porcentajes exactos.',
    preguntas: '8 duelos · matriz 8×8',
    tiempo: '2 min',
    badge: 'Juego de actas',
    color: '#b91c1c',
  },
  {
    href: '/tests/cuanto-vale-tu-voto',
    titulo: '¿Cuánto vale un escaño en tu provincia?',
    subtitulo: 'Márgenes reales D\'Hondt en las 52 circunscripciones',
    descripcion:
      'Consulta por cuántos votos se decidió el último diputado en tu provincia en 2023 y juega al trivia de los escaños más reñidos.',
    preguntas: '8 preguntas · 52 provincias',
    tiempo: '2 min',
    badge: 'Tu circunscripción',
    color: '#92400e',
  },
  {
    href: '/tests/de-quien-es-la-propuesta',
    titulo: '¿De quién es esta propuesta?',
    subtitulo: '16 medidas con cita y página de los programas oficiales',
    descripcion:
      'Lee una medida y adivina de qué partido es. Al responder ves la cita literal y la página del programa.',
    preguntas: '16 propuestas con cita y página oficial',
    tiempo: '3 min',
    badge: 'Quiz interactivo',
    color: '#d97706',
  },
  {
    href: '/tests/quien-voto-esto',
    titulo: '¿Quién votó qué en el Congreso?',
    subtitulo: 'Votaciones clave de la XV Legislatura',
    descripcion:
      'Adivina qué votó cada grupo. La respuesta sale del acta oficial del Congreso.',
    preguntas: '13 votaciones clave',
    tiempo: '2 min',
    badge: 'Diario de Sesiones',
    color: '#0284c7',
  },
  {
    href: '/tests/preparado-para-votar',
    titulo: '¿Estás preparado para votar el 29-N?',
    subtitulo: 'Test de cultura cívica y sistema electoral',
    descripcion:
      'D\'Hondt, el umbral del 3%, listas abiertas del Senado, voto nulo vs blanco y plazos del voto por correo: todo lo que necesitas saber antes de depositar tu papeleta en la urna.',
    preguntas: '15 preguntas pedagógicas',
    tiempo: '3 min',
    badge: 'Guía ciudadana',
    color: '#15803d',
  },
];

export default function TestsHubPage() {
  return (
    <div className="space-y-10">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'Tests electorales y minijuegos', path: '/tests' },
        ]}
      />

      {/* Cabecera editorial */}
      <header className="space-y-3 border-b border-neutral-200 pb-8">
        <h1 className="text-3xl sm:text-5xl font-bold font-editorial text-neutral-950 tracking-tight">
          Tests y minijuegos
        </h1>
        <p className="text-base text-neutral-600 max-w-3xl leading-relaxed">
          Descubre con qué candidatura coincides de cara a las generales del 29 de noviembre de 2026, ubícate en el plano ideológico sin sesgos, pon a prueba tus conocimientos sobre los programas oficiales y comparte tus resultados con tarjetas descargables para Instagram, Stories y LinkedIn.
        </p>
      </header>

      {/* Grid de Tests */}
      <div className="divide-y divide-[#ece7dc] border-y border-[#ece7dc] md:grid md:grid-cols-2 md:gap-x-8 md:divide-y-0 md:border-y-0">
        {TESTS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group relative flex min-w-0 flex-col justify-between py-6 md:border-b md:border-[#ece7dc]"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-neutral-700 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                  {t.badge}
                </span>
                <span className="text-xs font-mono text-neutral-500 font-medium">
                  {t.tiempo}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold font-editorial text-neutral-950 group-hover:text-red-900 transition-colors">
                {t.titulo}
              </h2>
              <p className="text-sm font-semibold text-neutral-600 mt-1">
                {t.subtitulo}
              </p>
              <p className="text-sm text-neutral-600 mt-3 leading-relaxed">
                {t.descripcion}
              </p>
            </div>

            <div className="mt-4 flex min-h-11 flex-wrap items-center justify-between gap-x-4 text-xs font-semibold">
              <span className="text-neutral-500 font-mono">{t.preguntas}</span>
              <span className="text-red-900 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Empezar test →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Bloque de Transparencia, Metodología Pública y Privacidad */}
      <div className="border-t border-[#dfd9cc] pt-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold font-editorial text-neutral-950">
            Metodología pública, neutralidad algorítmica y privacidad garantizada
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 text-sm leading-relaxed text-neutral-700">
          <div>
            <p className="font-bold text-neutral-900 mb-1">1. Citas y fuentes primarias</p>
            <p className="text-neutral-600">
              Cada posición y propuesta procede directamente de los programas oficiales registrados para las elecciones del 29-N y de las actas oficiales de votación del Congreso de los Diputados. Cero opiniones inventadas.
            </p>
          </div>

          <div>
            <p className="font-bold text-neutral-900 mb-1">2. 100% privado en tu navegador</p>
            <p className="text-neutral-600">
              Todo el procesamiento se realiza exclusivamente en tu cliente. No recopilamos tus respuestas, no guardamos cookies invasivas ni enviamos ningún dato a servidores externos.
            </p>
          </div>

          <div>
            <p className="font-bold text-neutral-900 mb-1">3. Sin recomendación de voto</p>
            <p className="text-neutral-600">
              Estas herramientas tienen finalidad exclusivamente cívica y pedagógica para fomentar la lectura informada de los programas. En la decisión del voto intervienen también candidatos, pactos y balance de gestión.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
