import type { TemaCiudadano, VotoRealSimple } from '@/components/ResumenCiudadano';
import { type Area, programas, slug, votaciones, votacionesClave } from './datos';
import { PARTIDOS } from './partidos';

const COLORES_PARTIDO: Record<string, string> = {
  pp: '#0056a8',
  psoe: '#e30613',
  psc: '#c8102e',
  vox: '#5cb811',
  'frente-amplio': '#e51c55',
  podemos: '#6b21a8',
  erc: '#f2a900',
  junts: '#00a7a0',
  'eh-bildu': '#65a30d',
  'eaj-pnv': '#15803d',
  bng: '#0284c7',
  cc: '#ca8a04',
  upn: '#1e3a8a',
};

const TEMAS_DEF: {
  id: string;
  areaPrincipal: Area;
  areas: Area[];
  icono: string;
  titulo: string;
  preguntaCiudadana: string;
}[] = [
  {
    id: 'vivienda',
    areaPrincipal: 'vivienda',
    areas: ['vivienda'],
    icono: '',
    titulo: 'Vivienda y alquiler',
    preguntaCiudadana: '¿Qué proponen sobre el precio del alquiler, hipotecas, vivienda pública y desahucios?',
  },
  {
    id: 'bolsillo',
    areaPrincipal: 'impuestos',
    areas: ['impuestos', 'economia'],
    icono: '',
    titulo: 'Bolsillo e impuestos',
    preguntaCiudadana: '¿Quién quiere bajar o subir IRPF, IVA, cuota de autónomos o impuestos a grandes fortunas?',
  },
  {
    id: 'empleo_pensiones',
    areaPrincipal: 'empleo',
    areas: ['empleo', 'pensiones'],
    icono: '',
    titulo: 'Sueldos, trabajo y pensiones',
    preguntaCiudadana: '¿Qué plantean sobre salario mínimo, jornada laboral, paro y revalorización de las pensiones?',
  },
  {
    id: 'sanidad_educacion',
    areaPrincipal: 'sanidad',
    areas: ['sanidad', 'educacion'],
    icono: '',
    titulo: 'Sanidad y educación',
    preguntaCiudadana: '¿Cómo quieren reducir listas de espera, financiar la atención primaria, becas y universidad?',
  },
  {
    id: 'energia_transporte',
    areaPrincipal: 'energia_clima',
    areas: ['energia_clima', 'infraestructuras'],
    icono: '',
    titulo: 'Luz, transporte y trenes',
    preguntaCiudadana: '¿Qué harán con la factura eléctrica, las nucleares, renovables, Cercanías y abonos de transporte?',
  },
  {
    id: 'seguridad_inmigracion',
    areaPrincipal: 'seguridad_justicia',
    areas: ['seguridad_justicia', 'inmigracion'],
    icono: '',
    titulo: 'Justicia, seguridad e inmigración',
    preguntaCiudadana: '¿Qué proponen sobre ocupación, multirreincidencia, fronteras, regularizaciones y Poder Judicial?',
  },
];

function sentidoDe(r: { si: number; no: number; abstencion: number; no_vota: number } | undefined): VotoRealSimple['sentido'] {
  if (!r) return 'Sin datos';
  const max = Math.max(r.si, r.no, r.abstencion);
  if (max === 0) return 'Sin datos';
  if (r.si === max && r.si > r.no && r.si > r.abstencion) return 'Sí';
  if (r.no === max && r.no > r.si && r.no > r.abstencion) return 'No';
  if (r.abstencion === max) return 'Abstención';
  return 'Dividido';
}

export function construirTemasCiudadanos(): TemaCiudadano[] {
  const progs = programas();
  const mapaVot = new Map(votaciones().map((v) => [v.id, v]));
  const claves = votacionesClave().votaciones;

  return TEMAS_DEF.map((def) => {
    const areasSet = new Set<Area>(def.areas);
    const clavesTema = claves.filter((c) => areasSet.has(c.tema));

    const partidos = PARTIDOS.map((partido) => {
      const prog = progs.find(
        (x) => slug(x.siglas) === (partido.programaSlug ?? partido.slug)
      );
      const medidasTema = prog
        ? prog.propuestas.filter((m) => areasSet.has(m.area))
        : [];

      const destacadas = medidasTema.slice(0, 2).map((m) => ({
        titular: m.titular,
        enTuDiaADia: m.en_tu_dia_a_dia,
        situacionActual: m.situacion_actual,
        pagina: m.pagina,
        pdfUrl: prog!.fuente_url,
      }));

      const votosReales: VotoRealSimple[] = [];
      if (partido.grupoCongreso) {
        for (const c of clavesTema.slice(0, 3)) {
          const v = mapaVot.get(c.id);
          if (!v) continue;
          votosReales.push({
            id: c.id,
            titulo: c.titulo_llano,
            fecha: v.fecha,
            sentido: sentidoDe(v.por_grupo?.[partido.grupoCongreso]),
          });
        }
      }

      return {
        slug: partido.slug,
        siglas: partido.siglas,
        nombre: partido.nombre,
        color: COLORES_PARTIDO[partido.slug] ?? '#475569',
        tienePrograma: Boolean(prog),
        totalMedidasTema: medidasTema.length,
        medidasDestacadas: destacadas,
        votosReales,
      };
    });

    return {
      id: def.id,
      areaPrincipal: def.areaPrincipal,
      icono: def.icono,
      titulo: def.titulo,
      preguntaCiudadana: def.preguntaCiudadana,
      partidos,
    };
  });
}
