import Link from 'next/link';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import { CANDIDATURAS } from '@/content/candidaturas';
import { convocatoria } from '@/lib/datos';
import { fase } from '@/lib/modo-electoral';
import { rutas } from '@/lib/rutas';
import Termometro from './Termometro';

export const dynamic = 'force-dynamic'; // la veda depende de la fecha de la visita, no de la del build

export const metadata = {
  title: 'Expresa tu opinión de voto · Termómetro ciudadano 29-N',
  description:
    'Expresa tu opinión de voto de forma anónima por provincia. Participación voluntaria limitada a un apoyo cada 3 semanas mediante hash SHA-256 sin guardar tu IP.',
  alternates: { canonical: '/espana/generales/2026/termometro' },
};

export default function Page() {
  const provincias = [...convocatoria().circunscripciones]
    .map(({ codigo, nombre }) => ({ codigo, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  return (
    <article className="space-y-8">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'Generales 2026', path: rutas.eleccion() },
          { name: 'Tu opinión de voto', path: '/espana/generales/2026/termometro' },
        ]}
      />

      <header className="max-w-3xl space-y-4">
        <h1 className="font-editorial text-3xl font-bold leading-tight text-neutral-950 sm:text-5xl">
          Expresa tu opinión de voto
        </h1>
        <p className="text-base leading-relaxed text-neutral-700">
          Indica tu provincia y la candidatura a la que darías tu apoyo hoy. Los resultados se suman en tiempo real por provincia y para toda España.
        </p>
        <p className="border-l-2 border-amber-500 pl-3 text-sm leading-relaxed text-neutral-700">
          <strong className="text-neutral-950">No es una encuesta.</strong> Solo cuenta los apoyos que dejan los lectores de esta web, sin muestra ni ponderación (art. 69 LOREG).
          Para evitar apoyos repetidos se guarda 21 días una huella cifrada de tu IP, en una tabla aparte que no se relaciona con tu apoyo.
        </p>
        <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <Link href={rutas.simulador()} className="font-semibold text-red-900 underline underline-offset-2">Simulador de escaños</Link>
          <Link href={rutas.pactometro()} className="font-semibold text-red-900 underline underline-offset-2">Pactómetro</Link>
        </p>
      </header>

      {fase() === 'veda' ? (
        <div className="rounded-2xl border border-[#dfd9cc] bg-white p-8 text-base text-neutral-800 shadow-xs">
          El termómetro ciudadano permanece cerrado durante los cinco días anteriores a la votación, conforme al artículo 69.7 de la Ley Orgánica del Régimen Electoral General (LOREG). Volverá a estar disponible tras el cierre de los colegios electorales.
        </div>
      ) : (
        <Termometro
          candidaturas={CANDIDATURAS}
          provincias={provincias}
          siteKey={process.env.TURNSTILE_SITE_KEY ?? ''}
        />
      )}
    </article>
  );
}
