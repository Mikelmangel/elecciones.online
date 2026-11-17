import type { Metadata } from 'next';
import Link from 'next/link';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import CalendarioElectoral from '@/components/CalendarioElectoral';
import { AREAS, calendarioElectoral } from '@/lib/datos';
import { rutas } from '@/lib/rutas';

export const metadata: Metadata = {
  title: 'Calendario electoral del 29-N: campaña, debates, veda de sondeos y votación',
  description:
    'Fechas de las elecciones generales del 29 de noviembre de 2026: debates televisados, inicio de la veda de sondeos, jornada de reflexión y votación, con su fuente.',
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
          { name: 'Calendario electoral', path: '/espana/generales/2026/calendario' },
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
          Calendario electoral 2026
        </h1>
        <p className="mt-2 text-sm sm:text-base text-neutral-600 max-w-3xl leading-relaxed">
          Fechas de las elecciones generales del <strong>29 de noviembre de 2026</strong>: campaña, debates, veda de sondeos, jornada de reflexión y votación. Cada fecha lleva su fuente (BOE, LOREG o el medio que la anuncia).
        </p>
      </header>

      <CalendarioElectoral eventos={calendarioElectoral().eventos} areas={AREAS} />
    </article>
  );
}
