import { COLORES, color } from '@/content/colores';

export const PARTIDO_COLORES: Record<string, string> = {
  ...COLORES,
  PP: '#1d5fa8',
  PSOE: '#e30613',
  PSC: '#c8102e',
  VOX: '#5aa02c',
  SUMAR: '#d6336c',
  'Frente Amplio': '#d6336c',
  PODEMOS: '#673ab7',
  Podemos: '#673ab7',
  ERC: '#f2a900',
  JUNTS: '#00a7a0',
  Junts: '#00a7a0',
  'EH Bildu': '#6aa84f',
  'EH BILDU': '#6aa84f',
  'EAJ-PNV': '#2e7d32',
  PNV: '#2e7d32',
  BNG: '#5b9bd5',
  CCa: '#c9a400',
  CC: '#c9a400',
  UPN: '#0b3d91',
  PACMA: '#38a169',
  SALF: '#78716c',
  D21: '#2563eb',
  'Sumar / FA': '#d6336c',
  COMPROMIS: '#ea580c',
  'Compromís': '#ea580c',
  'M+J': '#009688',
  IE: '#475569',
  'MJ': '#009688',
  'MUNDO+JUSTO': '#009688',
};

export function colorPartido(siglas: string): string {
  if (PARTIDO_COLORES[siglas]) return PARTIDO_COLORES[siglas];
  const upper = siglas.toUpperCase();
  for (const [k, v] of Object.entries(PARTIDO_COLORES)) {
    if (k.toUpperCase() === upper) return v;
  }
  return color(siglas);
}
