import Link from 'next/link';
import resumenesDoc from '../../../../data/resumenes_programas.json';
import { BookOpen, Briefcase, Ellipsis, Globe, GraduationCap, HeartHandshake, House, Landmark, Map as MapIcon, PiggyBank, Receipt, Scale, Shield, Stethoscope, Tractor, TrainFront, TrendingUp, Zap, type LucideIcon } from 'lucide-react';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import ComparadorAvanzado from '@/components/ComparadorAvanzado';
import {
  AREAS,
  type Area,
  coherenciaVotaciones,
  factcheckingEntrevistas,
  programas,
  votaciones,
  votacionesClave,
} from '@/lib/datos';
import { PARTIDOS } from '@/lib/partidos';
import { rutas } from '@/lib/rutas';

type Props = { params: Promise<{ area: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(AREAS).map((area) => ({ area }));

const ICONOS_AREAS: Record<Area, { icono: LucideIcon; corto: string }> = {
  empleo: { icono: Briefcase, corto: 'Paro y Empleo' },
  impuestos: { icono: Receipt, corto: 'Impuestos' },
  economia: { icono: TrendingUp, corto: 'Economía' },
  sanidad: { icono: Stethoscope, corto: 'Sanidad' },
  educacion: { icono: GraduationCap, corto: 'Educación' },
  vivienda: { icono: House, corto: 'Vivienda' },
  pensiones: { icono: PiggyBank, corto: 'Pensiones' },
  social: { icono: HeartHandshake, corto: 'Políticas sociales' },
  rural: { icono: Tractor, corto: 'Campo y Agua' },
  energia_clima: { icono: Zap, corto: 'Energía y Clima' },
  infraestructuras: { icono: TrainFront, corto: 'Movilidad y Trenes' },
  inmigracion: { icono: Globe, corto: 'Inmigración' },
  seguridad_justicia: { icono: Scale, corto: 'Justicia y Seguridad' },
  defensa_exterior: { icono: Shield, corto: 'Exterior y Defensa' },
  territorial: { icono: MapIcon, corto: 'Modelo de Estado' },
  instituciones: { icono: Landmark, corto: 'Democracia' },
  cultura: { icono: BookOpen, corto: 'Cultura y Lenguas' },
  otros: { icono: Ellipsis, corto: 'Otros temas' },
};

export async function generateMetadata({ params }: Props) {
  const { area } = await params;
  const nombre = AREAS[area as Area];
  return {
    title: `${nombre}: qué propone cada partido para el 29-N · Comparador Elecciones Generales 2026`,
    description: `Comparativa interactiva de programas electorales del 29-N sobre ${nombre.toLowerCase()}: compara hasta 4 partidos en paralelo, explicación para personas normales, verificación con cita y página oficial y contraste con votaciones en el Congreso.`,
    alternates: { canonical: `/espana/generales/2026/comparador/${area}` },
  };
}

export default async function Page({ params }: Props) {
  const area = (await params).area as Area;
  const ps = programas();
  const claveArea = votacionesClave().votaciones.filter((v) => v.tema === area);
  const todasVot = votaciones();
  const verificaciones = factcheckingEntrevistas().verificaciones.filter((v) => v.tema === area);
  const casosCoherencia = coherenciaVotaciones().casos;

  const votacionesEnriquecidas = claveArea.map((c) => {
    const vReal = todasVot.find((x) => x.id === c.id);
    return {
      id: c.id,
      tema: c.tema,
      categoria: c.categoria,
      titulo_llano: c.titulo_llano,
      fecha: vReal?.fecha,
      por_grupo: vReal?.por_grupo ?? null,
    };
  });

  return (
    <div className="space-y-8">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'España', path: rutas.pais() },
          { name: 'Generales 2026', path: rutas.eleccion() },
          { name: 'Comparador', path: rutas.comparador('vivienda') },
          { name: AREAS[area], path: rutas.comparador(area) },
        ]}
      />

      <header className="space-y-5">
        <div>
          <h1 className="font-editorial text-3xl font-bold leading-tight text-neutral-950 sm:text-5xl">
            {AREAS[area]}: qué propone cada partido
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-neutral-700">
            Compara hasta 4 partidos. Cada medida lleva su cita literal y la página del programa.
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-900">Tema</p>

          <nav
            aria-label="Temas del comparador"
            className="grid grid-cols-2 gap-1.5 sm:grid-cols-6 sm:gap-2 lg:grid-cols-9"
          >
            {(Object.entries(AREAS) as [Area, string][]).map(([k, nombreCompleto]) => {
              const activo = k === area;
              const info = ICONOS_AREAS[k];
              const Icono = info.icono;
              return (
                <Link
                  key={k}
                  href={rutas.comparador(k)}
                  aria-current={activo ? 'page' : undefined}
                  className={`group flex min-h-11 items-center gap-2 rounded-lg border px-2.5 transition-colors sm:flex-col sm:justify-center sm:gap-1.5 sm:p-2.5 sm:text-center ${
                    activo
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-[#e4dfd3] bg-white text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <Icono className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" strokeWidth={1.75} aria-hidden />
                  <span
                    className={`text-xs font-bold leading-tight line-clamp-2 ${
                      activo ? 'text-white' : 'text-neutral-800 group-hover:text-red-900'
                    }`}
                  >
                    {info.corto}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      
      <ComparadorAvanzado
        area={area}
        nombreArea={AREAS[area]}
        programas={ps}
        partidos={PARTIDOS}
        votaciones={votacionesEnriquecidas}
        verificaciones={verificaciones}
        coherenciaCasos={casosCoherencia}
        // regla 8: solo resúmenes con revisado=true puesto por una persona
        resumenes={Object.fromEntries(resumenesDoc.resumenes.filter((r) => r.revisado === true && r.area === area).map((r) => [r.siglas, r]))}
      />
    </div>
  );
}
