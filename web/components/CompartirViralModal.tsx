'use client';

import { useEffect, useRef, useState } from 'react';

export interface PartidoBrujulaCanvas {
  siglas: string;
  nombre: string;
  x: number;
  y: number;
  color: string;
  dx?: number;
  dy?: number;
  anchor?: 'start' | 'middle' | 'end';
}

export interface BarraAfinidadCanvas {
  siglas: string;
  nombre: string;
  porcentaje: number;
  color: string;
}

export interface CompartirViralProps {
  titulo: string;
  subtitulo?: string;
  resultadoPrincipal: string;
  etiquetaBadge?: string;
  colorPrincipal?: string;
  detalles?: { etiqueta: string; valor: string }[];
  urlDestino?: string;
  isOpen: boolean;
  onClose: () => void;
  tipoGrafico?: 'general' | 'brujula_2d' | 'barras_afinidad';
  brujulaData?: {
    x: number;
    y: number;
    etiqueta: string;
    partidos: PartidoBrujulaCanvas[];
  };
  afinidadData?: BarraAfinidadCanvas[];
}

export default function CompartirViralModal({
  titulo,
  subtitulo,
  resultadoPrincipal,
  etiquetaBadge = 'Resultado elecciones.online',
  colorPrincipal = '#b91c1c',
  detalles = [],
  urlDestino,
  isOpen,
  onClose,
  tipoGrafico = 'general',
  brujulaData,
  afinidadData,
}: CompartirViralProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [imagenCopiada, setImagenCopiada] = useState(false);
  const [imagenDataUrl, setImagenDataUrl] = useState<string | null>(null);

  const getShareUrl = () => {
    if (typeof window === 'undefined') return 'https://elecciones.online';
    return urlDestino || window.location.href;
  };

  // Generación de tarjeta gráfica en Canvas de alta resolución (1080x1080)
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 1080;
    canvas.width = W;
    canvas.height = H;

    // Fondo editorial elegante con textura suave
    const gradFondo = ctx.createLinearGradient(0, 0, 0, H);
    gradFondo.addColorStop(0, '#faf7f2');
    gradFondo.addColorStop(1, '#f1ede4');
    ctx.fillStyle = gradFondo;
    ctx.fillRect(0, 0, W, H);

    // Borde exterior editorial
    ctx.strokeStyle = '#e4dfd3';
    ctx.lineWidth = 14;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Marco interior fino
    ctx.strokeStyle = '#d5cebf';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, W - 72, H - 72);

    // Cabecera superior: Logo
    ctx.fillStyle = '#171717';
    ctx.font = 'bold 44px serif';
    ctx.fillText('elecciones', 70, 105);
    const anchoElec = ctx.measureText('elecciones').width;
    ctx.fillStyle = '#991b1b';
    ctx.fillText('.online', 70 + anchoElec, 105);

    // Badge superior derecho
    ctx.fillStyle = colorPrincipal;
    ctx.beginPath();
    ctx.roundRect(W - 380, 68, 310, 48, 24);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(etiquetaBadge.toUpperCase(), W - 380 + 155, 100);
    ctx.textAlign = 'left';

    // Línea separadora
    ctx.strokeStyle = '#e2ded5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(70, 140);
    ctx.lineTo(W - 70, 140);
    ctx.stroke();

    // ==========================================
    // MODO 1: BRÚJULA POLÍTICA 2D EN CANVAS REAL
    // ==========================================
    if (tipoGrafico === 'brujula_2d' && brujulaData) {
      const { x: userX, y: userY, etiqueta, partidos } = brujulaData;

      // Título
      ctx.fillStyle = '#525252';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('BRÚJULA POLÍTICA 2D · ELECCIONES GENERALES 2026', 70, 180);

      // Etiqueta del usuario
      ctx.fillStyle = '#171717';
      ctx.font = 'bold 46px serif';
      ctx.fillText(`Tu posición: ${etiqueta}`, 70, 235);

      ctx.fillStyle = '#737373';
      ctx.font = '600 22px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`Coordenadas: (${userX.toFixed(2)}, ${userY.toFixed(2)})`, W - 70, 235);
      ctx.textAlign = 'left';

      // Dimensiones del Plano Cartesiano en el Canvas
      const boxSize = 580;
      const boxX = (W - boxSize) / 2;
      const boxY = 265;
      const centerX = boxX + boxSize / 2;
      const centerY = boxY + boxSize / 2;
      const scale = (boxSize / 2) / 2.5; // rango -2.5 a +2.5

      // Fondo del plano
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxSize, boxSize, 20);
      ctx.fill();
      ctx.strokeStyle = '#d4d4d4';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Cuadrantes con color suave
      // Cuadrante 1: Sup-Izq (x < 0, y < 0) -> Izquierda Progresista
      ctx.fillStyle = 'rgba(225, 29, 72, 0.08)';
      ctx.fillRect(boxX, boxY, boxSize / 2, boxSize / 2);
      // Cuadrante 2: Sup-Der (x > 0, y < 0) -> Liberal / Progresista
      ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
      ctx.fillRect(centerX, boxY, boxSize / 2, boxSize / 2);
      // Cuadrante 3: Inf-Izq (x < 0, y > 0) -> Izquierda Conservadora / Estatista
      ctx.fillStyle = 'rgba(249, 115, 22, 0.08)';
      ctx.fillRect(boxX, centerY, boxSize / 2, boxSize / 2);
      // Cuadrante 4: Inf-Der (x > 0, y > 0) -> Derecha Conservadora
      ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
      ctx.fillRect(centerX, centerY, boxSize / 2, boxSize / 2);

      // Ejes principales punteados
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = '#a3a3a3';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(boxX + 10, centerY);
      ctx.lineTo(boxX + boxSize - 10, centerY);
      ctx.moveTo(centerX, boxY + 10);
      ctx.lineTo(centerX, boxY + boxSize - 10);
      ctx.stroke();
      ctx.setLineDash([]); // reset dash

      // Rótulos de los ejes
      ctx.fillStyle = '#737373';
      ctx.font = 'bold 19px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('← MÁS ESTADO', boxX + 16, centerY - 10);
      ctx.textAlign = 'right';
      ctx.fillText('MÁS MERCADO →', boxX + boxSize - 16, centerY - 10);
      ctx.textAlign = 'center';
      ctx.fillText('↑ PROGRESISTA', centerX, boxY + 28);
      ctx.fillText('↓ CONSERVADOR', centerX, boxY + boxSize - 16);

      // Mapear función de coordenadas (x, y) a canvas (px, py)
      const toCanvas = (cx: number, cy: number) => ({
        px: centerX + cx * scale,
        py: centerY + cy * scale,
      });

      // Dibujar partidos
      partidos.forEach((p) => {
        const { px, py } = toCanvas(p.x, p.y);

        // Círculo del partido
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Texto del partido con offset
        ctx.fillStyle = '#171717';
        ctx.font = 'bold 18px sans-serif';
        const dx = (p.dx ?? 0) * scale;
        const dy = (p.dy ?? (p.y > 0 ? 0.28 : -0.22)) * scale;
        const canvasAnchor: CanvasTextAlign = p.anchor === 'middle' ? 'center' : (p.anchor ?? 'center');
        ctx.textAlign = canvasAnchor;
        ctx.fillText(p.siglas, px + dx, py + dy);
      });

      // Dibujar la posición del usuario "TÚ"
      const userCanvas = toCanvas(userX, userY);

      // Anillos concéntricos de pulso / brillo
      ctx.fillStyle = 'rgba(220, 38, 38, 0.25)';
      ctx.beginPath();
      ctx.arc(userCanvas.px, userCanvas.py, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(220, 38, 38, 0.45)';
      ctx.beginPath();
      ctx.arc(userCanvas.px, userCanvas.py, 19, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(userCanvas.px, userCanvas.py, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Badge flotante "TÚ"
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.roundRect(userCanvas.px - 34, userCanvas.py - 48, 68, 30, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TÚ', userCanvas.px, userCanvas.py - 27);

      // Partidos más cercanos (ranking de proximidad euclídea)
      const distancias = partidos
        .map((p) => ({
          siglas: p.siglas,
          nombre: p.nombre,
          dist: Math.hypot(p.x - userX, p.y - userY),
          color: p.color,
        }))
        .sort((a, b) => a.dist - b.dist);

      const top3 = distancias.slice(0, 3);

      // Caja inferior con los más cercanos
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(70, 865, W - 140, 72, 14);
      ctx.fill();
      ctx.strokeStyle = '#e2ded5';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#404040';
      ctx.font = '600 20px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Partidos más próximos a tu posición:', 95, 908);

      let xOffset = 475;
      top3.forEach((p, idx) => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(xOffset, 902, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#171717';
        ctx.font = 'bold 21px sans-serif';
        ctx.fillText(`${idx + 1}. ${p.siglas}`, xOffset + 16, 909);
        xOffset += 165;
      });

      // Pie con llamada a la acción y fecha
      ctx.fillStyle = '#171717';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('¿Dónde te sitúas tú? Haz el test en: elecciones.online/tests/afinidad', 70, 985);

      ctx.fillStyle = '#737373';
      ctx.font = '500 21px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Generales 29-N', W - 70, 985);
      ctx.textAlign = 'left';
    }
    // ==========================================
    // MODO 2: AFINIDAD POR PARTIDOS EN CANVAS REAL
    // ==========================================
    else if (tipoGrafico === 'barras_afinidad' && afinidadData && afinidadData.length > 0) {
      // Título
      ctx.fillStyle = '#525252';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('TEST DE AFINIDAD PROGRAMÁTICA · ELECCIONES GENERALES 2026', 70, 180);

      // Tarjeta cabecera de afinidad
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(70, 210, W - 140, 680, 24);
      ctx.fill();
      ctx.strokeStyle = '#e4dfd3';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Destacado partido ganador
      const ganador = afinidadData[0];
      ctx.fillStyle = ganador.color;
      ctx.beginPath();
      ctx.roundRect(70, 210, 16, 680, [24, 0, 0, 24]);
      ctx.fill();

      ctx.fillStyle = '#737373';
      ctx.font = '600 22px sans-serif';
      ctx.fillText('MAYOR AFINIDAD PROGRAMÁTICA CON:', 115, 260);

      ctx.fillStyle = '#171717';
      ctx.font = 'bold 44px serif';
      ctx.fillText(ganador.nombre, 115, 315);

      ctx.fillStyle = ganador.color;
      ctx.font = 'bold 50px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${ganador.porcentaje}%`, W - 110, 315);
      ctx.textAlign = 'left';

      // Línea divisoria
      ctx.strokeStyle = '#ece7dc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(115, 350);
      ctx.lineTo(W - 110, 350);
      ctx.stroke();

      // Dibujar top 6 partidos con barras
      const topPartidos = afinidadData.slice(0, 6);
      let yBarra = 405;

      topPartidos.forEach((p) => {
        // Círculo de color
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(125, yBarra - 8, 9, 0, Math.PI * 2);
        ctx.fill();

        // Nombre y siglas
        ctx.fillStyle = '#171717';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(`${p.nombre} (${p.siglas})`, 146, yBarra);

        // Porcentaje
        ctx.fillStyle = '#171717';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${p.porcentaje}%`, W - 115, yBarra);
        ctx.textAlign = 'left';

        // Barra de progreso
        const barWidth = W - 230;
        ctx.fillStyle = '#e5e5e5';
        ctx.beginPath();
        ctx.roundRect(115, yBarra + 12, barWidth, 14, 7);
        ctx.fill();

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.roundRect(115, yBarra + 12, Math.max(16, (barWidth * p.porcentaje) / 100), 14, 7);
        ctx.fill();

        yBarra += 76;
      });

      // Pie con llamada a la acción y fecha
      ctx.fillStyle = '#171717';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Descubre tu afinidad completa en: elecciones.online/tests/afinidad', 70, 955);

      ctx.fillStyle = '#737373';
      ctx.font = '500 21px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('25 preguntas verificadas · 29-N', W - 70, 955);
      ctx.textAlign = 'left';
    }
    // ==========================================
    // MODO 3: GENERAL / TEXTO (COMPATIBLE)
    // ==========================================
    else {
      ctx.fillStyle = '#525252';
      ctx.font = '600 28px sans-serif';
      ctx.fillText(titulo.toUpperCase(), 70, 205);

      // Tarjeta central destacada
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(70, 235, W - 140, 430, 28);
      ctx.fill();
      ctx.strokeStyle = '#eae6dc';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = colorPrincipal;
      ctx.beginPath();
      ctx.roundRect(70, 235, 16, 430, [28, 0, 0, 28]);
      ctx.fill();

      if (subtitulo) {
        ctx.fillStyle = '#737373';
        ctx.font = '500 24px sans-serif';
        ctx.fillText(subtitulo, 120, 290);
      }

      ctx.fillStyle = '#0a0a0a';
      ctx.font = 'bold 56px sans-serif';
      ctx.fillText(resultadoPrincipal, 120, 360);

      // Detalles
      if (detalles && detalles.length > 0) {
        let yDet = 480;
        detalles.slice(0, 3).forEach((d) => {
          ctx.fillStyle = '#404040';
          ctx.font = '600 24px sans-serif';
          ctx.fillText(d.etiqueta, 120, yDet);

          ctx.fillStyle = '#171717';
          ctx.font = 'bold 26px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(d.valor, W - 120, yDet);
          ctx.textAlign = 'left';

          yDet += 46;
        });
      }

      // Cuadro de transparencia
      ctx.fillStyle = '#f8f6f0';
      ctx.beginPath();
      ctx.roundRect(70, 695, W - 140, 220, 20);
      ctx.fill();
      ctx.strokeStyle = '#e2ded5';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#171717';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('CRITERIOS 100% PÚBLICOS Y TRANSPARENTES', 105, 745);

      ctx.fillStyle = '#525252';
      ctx.font = '400 20px sans-serif';
      ctx.fillText('• Basado en citas literales de programas electorales y actas oficiales.', 105, 785);
      ctx.fillText('• Privacidad absoluta: procesado en tu navegador sin almacenar datos.', 105, 820);
      ctx.fillText('• Herramienta pedagógica y cívica sin sesgo partidista ni patrocinio.', 105, 855);
      ctx.fillText('• Comprueba las fuentes completas en elecciones.online', 105, 890);

      ctx.fillStyle = '#171717';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('Haz el test en: elecciones.online/tests', 70, 975);

      ctx.fillStyle = '#737373';
      ctx.font = '500 22px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Generales 29-N 2026', W - 70, 975);
      ctx.textAlign = 'left';
    }

    // Generar DataURL para previsualización y descarga directa
    try {
      const data = canvas.toDataURL('image/png');
      setImagenDataUrl(data);
    } catch {
      // Ignorar fallo de canvas en entornos sin soporte
    }
  }, [isOpen, titulo, subtitulo, resultadoPrincipal, etiquetaBadge, colorPrincipal, detalles, tipoGrafico, brujulaData, afinidadData]);

  if (!isOpen) return null;

  const urlParaCompartir = getShareUrl();
  const textoParaCompartir =
    tipoGrafico === 'brujula_2d' && brujulaData
      ? `Mi brújula política 2D en las Elecciones Generales 29-N es: ${brujulaData.etiqueta} (${brujulaData.x > 0 ? '+' : ''}${brujulaData.x}, ${brujulaData.y > 0 ? '+' : ''}${brujulaData.y}). ¿Dónde te sitúas tú frente a los partidos? Descúbrelo aquí:`
      : `He hecho el test «${titulo}» en elecciones.online y mi resultado es: ${resultadoPrincipal}. ¡Comprueba tu afinidad electoral!`;

  // Descargar imagen directamente en el dispositivo
  const handleDescargarImagen = () => {
    if (!imagenDataUrl) return;
    const a = document.createElement('a');
    a.href = imagenDataUrl;
    const slug = tipoGrafico === 'brujula_2d' ? 'mi-brujula-politica-29N' : `resultado-${titulo.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    a.download = `${slug}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Compartir nativo (Web Share API) con archivo de imagen real
  const handleCompartirNativo = async () => {
    if (!imagenDataUrl) {
      handleCopiarEnlace();
      return;
    }

    try {
      const res = await fetch(imagenDataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'mi-brujula-politica-29N.png', { type: 'image/png' });

      // Si el navegador soporta compartir archivos (iOS Safari, Android Chrome, etc.)
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Mi brújula política 29-N',
          text: textoParaCompartir,
          files: [file],
          url: urlParaCompartir,
        });
        return;
      }

      // Si solo soporta compartir texto y URL
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'Mi brújula política 29-N',
          text: textoParaCompartir,
          url: urlParaCompartir,
        });
        return;
      }
    } catch {
      // El usuario canceló el diálogo nativo o no hay soporte
    }

    // Fallback: copiar enlace
    handleCopiarEnlace();
  };

  // Copiar imagen directamente al portapapeles
  const handleCopiarImagen = async () => {
    if (!imagenDataUrl) return;
    try {
      const res = await fetch(imagenDataUrl);
      const blob = await res.blob();
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setImagenCopiada(true);
        setTimeout(() => setImagenCopiada(false), 2500);
        return;
      }
    } catch {
      // Fallback a descarga si el portapapeles no admite blobs
    }
    handleDescargarImagen();
  };

  const handleCopiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(urlParaCompartir);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Fallback
    }
  };

  const shareWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${textoParaCompartir} ${urlParaCompartir}`
  )}`;

  const shareTwitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    textoParaCompartir
  )}&url=${encodeURIComponent(urlParaCompartir)}&hashtags=Elecciones2026,29N,BrujulaPolitica`;

  const shareTelegram = `https://t.me/share/url?url=${encodeURIComponent(urlParaCompartir)}&text=${encodeURIComponent(
    textoParaCompartir
  )}`;

  const shareLinkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlParaCompartir)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[94vh] overflow-y-auto rounded-2xl bg-white border border-neutral-200 shadow-2xl p-5 sm:p-7 text-neutral-900">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 inline-flex h-11 w-11 items-center justify-center text-neutral-500 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition"
          aria-label="Cerrar modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Título modal */}
        <div className="mb-4 pr-8">
          <h3 className="text-xl font-bold font-editorial text-neutral-950 sm:text-2xl leading-snug">
            {tipoGrafico === 'brujula_2d' ? 'Comparte tu brújula en redes' : '¡Comparte tu resultado!'}
          </h3>
          <p className="text-sm text-neutral-600 mt-0.5">
            Descarga tu tarjeta gráfica con el gráfico real para Instagram, X y WhatsApp o comparte tu enlace directo.
          </p>
        </div>

        {/* Vista previa de la tarjeta gráfica Canvas */}
        <div className="mb-5 overflow-hidden rounded-xl border border-neutral-300 bg-neutral-100 shadow-inner">
          <div className="relative aspect-square w-full max-w-[340px] mx-auto my-2">
            <canvas ref={canvasRef} className="w-full h-full object-contain rounded-lg shadow-sm" />
          </div>
        </div>

        {/* Botones de acción directa */}
        <div className="space-y-2.5 mb-6">
          {/* Botón 1: Compartir nativo (dispositivos móviles) o Descarga */}
          <button
            onClick={handleCompartirNativo}
            className="w-full min-h-11 flex items-center justify-center gap-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-4 shadow-sm transition text-sm cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Compartir imagen en redes (WhatsApp / Insta / X)
          </button>

          {/* Fila de acciones secundarias: Descargar PNG + Copiar imagen */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDescargarImagen}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-2.5 px-3 transition text-sm cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar PNG (1080x1080)
            </button>

            <button
              onClick={handleCopiarImagen}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 font-semibold py-2.5 px-3 transition text-sm cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              {imagenCopiada ? '¡Imagen copiada!' : 'Copiar imagen'}
            </button>
          </div>

          {/* Redes sociales con botones rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <a
              href={shareWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold py-2 px-2 text-sm transition"
            >
              <span>WhatsApp</span>
            </a>

            <a
              href={shareTwitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-900 font-semibold py-2 px-2 text-sm transition"
            >
              <span>X (Twitter)</span>
            </a>

            <a
              href={shareTelegram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-900 font-semibold py-2 px-2 text-sm transition"
            >
              <span>Telegram</span>
            </a>

            <a
              href={shareLinkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold py-2 px-2 text-sm transition"
            >
              <span>LinkedIn</span>
            </a>
          </div>

          {/* Copiar enlace */}
          <button
            onClick={handleCopiarEnlace}
            className="w-full min-h-11 flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 font-medium py-2 px-3 text-sm transition cursor-pointer"
          >
            <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copiado ? '¡Enlace directo copiado al portapapeles!' : 'Copiar enlace con mi resultado'}
          </button>
        </div>

        {/* Disclaimer y Transparencia Pública */}
        <div className="border-t border-[#ece7dc] pt-3 text-xs leading-relaxed text-neutral-600">
          <p className="font-semibold text-neutral-800 mb-0.5">
            Criterios públicos y privacidad estricta
          </p>
          <p>
            Cálculo 100% en tu navegador a partir de citas oficiales de programas y votaciones del Congreso. Sin almacenamiento de respuestas en servidor ni perfiles comerciales.
          </p>
        </div>
      </div>
    </div>
  );
}
