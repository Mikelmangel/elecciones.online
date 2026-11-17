// Color de identificación de cada candidatura en gráficos. Decisión editorial, sin fuente oficial.
export const COLORES: Record<string, string> = {
  PP: '#1d5fa8',
  PSOE: '#e30613',
  PSC: '#c8102e',
  VOX: '#5aa02c',
  SUMAR: '#d6336c',
  ERC: '#f2a900',
  JUNTS: '#00a7a0',
  'EH Bildu': '#6aa84f',
  'EAJ-PNV': '#2e7d32',
  BNG: '#5b9bd5',
  CCa: '#c9a400',
  UPN: '#0b3d91',
};
export const color = (siglas: string) => COLORES[siglas] ?? '#6b7280';
