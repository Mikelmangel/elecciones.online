import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import HistoricoElectoralRTVE from '@/components/HistoricoElectoralRTVE';
import { rutas } from '@/lib/rutas';

export const metadata: Metadata = {
  title: 'Mapa electoral de España y evolución del voto desde 1977',
  description:
    'Explora el mapa de resultados por provincias con opciones de partido ganador, segundo más votado y bloques, junto al gráfico histórico de evolución del voto en elecciones generales desde 1977.',
  alternates: { canonical: '/espana/generales/historico' },
};

function cargarDatos() {
  const raiz = path.resolve(process.cwd(), '..');
  const mapaProvincias = JSON.parse(
    fs.readFileSync(path.join(raiz, 'data', 'mapa_espana.json'), 'utf-8')
  );
  const resultados2023 = JSON.parse(
    fs.readFileSync(path.join(raiz, 'data', 'resultados_generales_2023.json'), 'utf-8')
  );
  const historicoData = JSON.parse(
    fs.readFileSync(path.join(raiz, 'data', 'historico_elecciones_1977_2023.json'), 'utf-8')
  );

  return { mapaProvincias, resultados2023, historicoData };
}

export default function Page() {
  const { mapaProvincias, resultados2023, historicoData } = cargarDatos();

  return (
    <article className="space-y-6">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'España', path: rutas.pais() },
          { name: 'Generales', path: rutas.eleccion() },
          { name: 'Mapa Electoral e Histórico 1977–2023', path: '/espana/generales/historico' },
        ]}
      />

      <header className="border-b border-[#e4dfd3] pb-6">
        <div className="flex flex-wrap items-center gap-x-2 text-sm text-neutral-600 mb-2">
          <Link href={rutas.pais()} className="inline-flex min-h-8 items-center underline hover:text-red-900">
            España
          </Link>
          <span>/</span>
          <Link href={rutas.resultados2023Hub()} className="inline-flex min-h-8 items-center underline hover:text-red-900">
            Resultados Oficiales
          </Link>
          <span>/</span>
          <span className="text-red-900">Mapa Cartográfico e Histórico desde 1977</span>
        </div>

        <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-neutral-950">
          Mapa de España y evolución del voto en generales (1977–2023)
        </h1>
        <p className="mt-2 text-sm sm:text-base text-neutral-600 max-w-3xl leading-relaxed">
          Consulta la distribución territorial del voto en las 52 provincias con las herramientas cartográficas interactivas inspiradas en RTVE Datos y el Ministerio del Interior.
        </p>
      </header>

      <HistoricoElectoralRTVE
        mapaProvincias={mapaProvincias}
        resultados2023={resultados2023}
        historicoData={historicoData}
      />
    </article>
  );
}
