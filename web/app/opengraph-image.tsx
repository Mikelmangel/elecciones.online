import { ImageResponse } from 'next/og';

export const alt = 'elecciones.online — Información electoral con fuentes';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, color: '#94a3b8', letterSpacing: 1 }}>
          elecciones.online
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>
            Información electoral con fuentes
          </div>
          <div style={{ fontSize: 30, color: '#cbd5e1', lineHeight: 1.35 }}>
            Elecciones Generales del 29-N · 29 de noviembre de 2026
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: '#94a3b8' }}>
          Programas con cita y página · Votaciones del Congreso · Resultados oficiales · Simulador D’Hondt
        </div>
      </div>
    ),
    { ...size },
  );
}
