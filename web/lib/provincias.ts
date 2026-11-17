import { candidaturas2026, convocatoria, resultados2023 } from './datos';
import { slug, slugProvincia } from './slug';

export { slugProvincia };

export function codigoDesdeParam(param: string): string | null {
  if (/^\d{2}$/.test(param)) return param;
  const norm = slug(param);
  const r23 = resultados2023();
  for (const p of r23.provincias) {
    if (slugProvincia(p.codigo, p.nombre) === norm || slug(p.nombre) === norm) {
      return p.codigo;
    }
  }
  return null;
}

export function todosLosParamsProvincia(): { codigo: string }[] {
  const r23 = resultados2023();
  const params: { codigo: string }[] = [];
  for (const p of r23.provincias) {
    params.push({ codigo: p.codigo });
    const s = slugProvincia(p.codigo, p.nombre);
    if (s !== p.codigo) {
      params.push({ codigo: s });
    }
  }
  return params;
}

export function infoProvinciaCompleta(param: string) {
  const cod = codigoDesdeParam(param);
  if (!cod) return null;
  const r23 = resultados2023().provincias.find((p) => p.codigo === cod);
  const c26 = convocatoria().circunscripciones.find((c) => c.codigo === cod);
  const l26 = candidaturas2026().circunscripciones.find((c) => c.codigo === cod);
  if (!r23 || !c26 || !l26) return null;
  return {
    codigo: cod,
    slug: slugProvincia(cod, r23.nombre),
    nombre: r23.nombre,
    res2023: r23,
    escanos2026: c26.diputados,
    candidaturas2026: l26.candidaturas,
  };
}
