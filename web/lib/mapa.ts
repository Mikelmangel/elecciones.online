import type { ProvinciaMapaInfo } from '@/components/MapaEspana';
import {
  candidaturas2026,
  convocatoria,
  mapaEspana,
  resultados2023,
} from './datos';

export function construirDatosMapa(): ProvinciaMapaInfo[] {
  const geo = mapaEspana();
  const conv = convocatoria();
  const res23 = resultados2023();
  const cand26 = candidaturas2026();

  const convPorCod = new Map(conv.circunscripciones.map((c) => [c.codigo, c]));
  const resPorCod = new Map(res23.provincias.map((c) => [c.codigo, c]));
  const candPorCod = new Map(cand26.circunscripciones.map((c) => [c.codigo, c]));

  return geo.map((g) => {
    const c26 = convPorCod.get(g.codigo);
    const r23 = resPorCod.get(g.codigo);
    const l26 = candPorCod.get(g.codigo);
    const ordenadas = [...(r23?.candidaturas ?? [])].sort((a, b) => b.votos - a.votos);
    const ganadora = ordenadas[0];
    const reparto2023 = ordenadas
      .filter((c) => c.escanos > 0)
      .map((c) => ({ siglas: c.siglas, escanos: c.escanos }));

    return {
      codigo: g.codigo,
      nombre: c26?.nombre ?? g.nombre,
      d: g.d,
      cx: g.cx,
      cy: g.cy,
      escanos2026: c26?.diputados ?? 0,
      escanos2023: r23?.escanos ?? 0,
      candidaturasCount: l26?.candidaturas.length ?? 0,
      ganador2023: ganadora?.siglas ?? '—',
      ganadorVotos2023: ganadora?.votos ?? 0,
      reparto2023,
    };
  });
}
