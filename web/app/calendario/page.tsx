import type { Metadata } from 'next';
import Link from 'next/link';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import CalendarioElectoral from '@/components/CalendarioElectoral';
import { rutas } from '@/lib/rutas';

export const metadata: Metadata = {
  title: 'Calendario Electoral y Diario de Campaña (2026–2029) — 29-N, debates, veda y próximas citas',
  description:
    'Sigue el día a día de la campaña electoral de las generales del 29 de noviembre de 2026: fechas de debates en TVE, último día legal de sondeos, veda, jornada de reflexión y calendario de autonómicas y municipales 2027.',
  alternates: { canonical: '/espana/generales/2026/calendario' },
};

export default function Page() {
  return (
    <article className="space-y-6">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'España', path: rutas.pais() },
          { name: 'Generales 2026', path: rutas.eleccion() },
          { name: 'Calendario Electoral y Diario', path: '/espana/generales/2026/calendario' },
        ]}
      />

      <header className="border-b border-[#e4dfd3] pb-6">
        <div className="flex flex-wrap items-center gap-x-2 text-sm text-neutral-600 mb-2">
          <Link href={rutas.pais()} className="inline-flex min-h-8 items-center underline hover:text-red-900">
            España
          </Link>
          <span>/</span>
          <Link href={rutas.eleccion()} className="inline-flex min-h-8 items-center underline hover:text-red-900">
            Generales 2026
          </Link>
          <span>/</span>
          <span className="text-red-900">Calendario Oficial</span>
        </div>

        <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-neutral-950">
          Calendario Electoral y Diario de Campaña 2026
        </h1>
        <p className="mt-2 text-sm sm:text-base text-neutral-600 max-w-3xl leading-relaxed">
          Todo el cronograma oficial de las Elecciones Generales del <strong>29 de noviembre de 2026</strong>: debates electorales, fecha límite de sondeos, veda informativa conforme a la LOREG y las próximas convocatorias municipales y autonómicas de 2027.
        </p>
      </header>

      <CalendarioElectoral />
    </article>
  );
}
