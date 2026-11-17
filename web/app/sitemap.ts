import type { MetadataRoute } from 'next';
import { GUIAS } from '@/content/guias';
import {
  AREAS,
  candidaturas2026,
  entrevistas,
  programas,
  resultados2023,
  slug,
  votaciones,
} from '@/lib/datos';
import { PARTIDOS } from '@/lib/partidos';
import { rutas } from '@/lib/rutas';

const BASE = 'https://elecciones.online';

export default function sitemap(): MetadataRoute.Sitemap {
  const urls = new Set<string>([
    '',
    '/espana',
    '/espana/generales/2026',
    '/espana/generales/historico',
    '/tests',
    '/tests/afinidad',
    '/tests/socios-congreso',
    '/tests/cuanto-vale-tu-voto',
    '/tests/de-quien-es-la-propuesta',
    '/tests/quien-voto-esto',
    '/tests/preparado-para-votar',
    rutas.simulador(),
    rutas.guias(),
    rutas.programas(),
    rutas.candidaturas(),
    rutas.entrevistas(),
    '/espana/generales/2026/calendario',
    rutas.hemeroteca(),
    '/actualidad',
    rutas.votacionesCongresoHub(),
    '/espana/congreso/xv-legislatura/votaciones/clave',
    rutas.cumplimiento(),
    rutas.pactometro(),
    rutas.resultados2023Hub(),
    rutas.termometro(),
    ...programas().map((p) => `${rutas.programas()}/${slug(p.siglas)}`),
    ...PARTIDOS.map((p) => rutas.partido(p.slug)),
    ...PARTIDOS.flatMap((p) => Object.keys(AREAS).map((a) => rutas.partidoArea(p.slug, a))),
    ...Object.keys(AREAS).map((a) => rutas.comparador(a)),
    ...candidaturas2026().circunscripciones.map((c) => rutas.candidaturaProvincia(c.codigo, c.nombre)),
    ...resultados2023().provincias.map((p) => rutas.resultados2023Provincia(p.codigo)),
    ...entrevistas().entrevistas.map((e) => `${rutas.entrevistas()}/${e.slug || e.id}`),
    ...votaciones().map((v) => rutas.votacionCongreso(v.id, v.texto_expediente ?? v.titulo)),
    ...GUIAS.map((g) => rutas.guia(g.slug)),
  ]);

  const fechaMod = new Date('2026-11-15T20:00:00Z');
  return Array.from(urls).map((p) => {
    const esPortada = p === '' || p === '/espana/generales/2026';
    const esHub = !esPortada && p.split('/').length <= 5 && !p.includes('/votaciones/2');
    return {
      url: BASE + p,
      lastModified: fechaMod,
      changeFrequency: esPortada ? 'hourly' : esHub ? 'daily' : 'weekly',
      priority: esPortada ? 1.0 : esHub ? 0.85 : 0.65,
    };
  });
}
