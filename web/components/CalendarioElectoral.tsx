'use client';

import { useState } from 'react';
import Link from 'next/link';

interface DiaCampana {
  dia: number;
  fechaCompleta: string;
  esHoy?: boolean;
  hito: string;
  tipo: 'inicio' | 'debate' | 'encuestas' | 'veda' | 'cierre' | 'reflexion' | 'urnas' | 'general';
  titulo: string;
  descripcion: string;
  detalleNormativo?: string;
  detalles: string[];
}

const DIAS_CAMPANA: DiaCampana[] = [
  {
    dia: 14,
    fechaCompleta: 'Viernes, 14 de noviembre de 2026',
    hito: 'DÍA 1: ARRANQUE DE CAMPAÑA',
    tipo: 'inicio',
    titulo: 'Pegada de carteles y apertura formal de la campaña electoral',
    descripcion: 'A las 00:00 h comienza legalmente la campaña electoral para las elecciones generales del 29-N. Los líderes celebran los actos inaugurales y las tradicionales pegadas de carteles en Madrid, Barcelona, Sevilla y Valencia.',
    detalleNormativo: 'Art. 51 de la LOREG: La campaña electoral dura 15 días y termina a las cero horas del día inmediatamente anterior a la votación.',
    detalles: [
      '00:00 h: Inicio legal de petición expresa del voto.',
      'Pegadas de carteles simultáneas en las 52 circunscripciones.',
      'Distribución de propaganda electoral por correo postal a los domicilios censados.'
    ]
  },
  {
    dia: 15,
    fechaCompleta: 'Sábado, 15 de noviembre de 2026',
    hito: 'DÍA 2: PRIMER FIN DE SEMANA',
    tipo: 'general',
    titulo: 'Grandes actos de apertura territorial de campaña',
    descripcion: 'Los candidatos a la presidencia del Gobierno recorren las circunscripciones decisivas de tamaño medio (Castilla y León, Andalucía, Galicia y Comunidad Valenciana) donde se disputan los últimos escaños clave.',
    detalles: [
      'Caravanas electorales en las capitales de provincia.',
      'Publicación de los primeros sondeos de seguimiento diario de campaña.'
    ]
  },
  {
    dia: 16,
    fechaCompleta: 'Domingo, 16 de noviembre de 2026',
    hito: 'DÍA 3: MITINES CENTRALES',
    tipo: 'general',
    titulo: 'Movilización masiva del voto indeciso',
    descripcion: 'Mítines multitudinarios centrados en economía, alquiler, vivienda y pensiones, los principales ejes temáticos que marcan la contienda ciudadana.',
    detalles: [
      'Presentación de compromisos específicos en servicios públicos y fiscalidad.',
      'Llamamientos al voto útil en circunscripciones de menos de 5 escaños.'
    ]
  },
  {
    dia: 17,
    fechaCompleta: 'Lunes, 17 de noviembre de 2026',
    hito: 'DÍA 4: PRIMER DEBATE TELEVISADO',
    tipo: 'debate',
    titulo: 'Gran debate electoral en RTVE',
    descripcion: 'Debate a múltiples fuerzas retransmitido en horario de máxima audiencia por La 1, Canal 24h, RNE y RTVE Play. Se estructuran bloques temáticos de economía, políticas sociales, pactos y modelo de Estado.',
    detalleNormativo: 'Instrucción 4/2011 de la Junta Electoral Central sobre debates de medios públicos bajo principios de neutralidad, igualdad y proporcionalidad.',
    detalles: [
      'Bloque 1: Economía, fiscalidad, empleo e inflación.',
      'Bloque 2: Vivienda, sanidad, educación y servicios esenciales.',
      'Bloque 3: Modelo territorial y pactos de gobernabilidad.'
    ]
  },
  {
    dia: 18,
    fechaCompleta: 'Martes, 18 de noviembre de 2026',
    hito: 'DÍA 5: REACCIÓN AL DEBATE',
    tipo: 'general',
    titulo: 'Evaluación del debate y propuestas en territorio',
    descripcion: 'Los equipos de campaña centran sus mensajes en el contraste de los datos expuestos durante el debate y en la aclaración de las cifras económicas discutidas.',
    detalles: [
      'Verificación independiente de afirmaciones y cifras dadas en plató.',
      'Focos de campaña en las cuencas industriales y zonas agrarias.'
    ]
  },
  {
    dia: 19,
    fechaCompleta: 'Miércoles, 19 de noviembre de 2026',
    hito: 'DÍA 6: VOTO POR CORREO',
    tipo: 'general',
    titulo: 'Intensificación de la solicitud y depósito del voto por correo',
    descripcion: 'Correos amplía horarios en sus oficinas principales para facilitar el voto postal de los ciudadanos que estarán ausentes de su municipio el 29-N.',
    detalles: [
      'Obligatoriedad de presentar DNI o documento identificativo oficial tanto en la solicitud como en el depósito del voto.',
      'Custodia y trazabilidad de los sobres bajo supervisión de la Junta Electoral.'
    ]
  },
  {
    dia: 20,
    fechaCompleta: 'Jueves, 20 de noviembre de 2026',
    hito: 'DÍA 7: ECUADOR DE LA CAMPAÑA',
    tipo: 'debate',
    titulo: 'Debate económico especializado en televisión',
    descripcion: 'Encuentro cara a cara de los responsables de programas económicos de los partidos sobre deuda pública, reglas fiscales de la UE, autónomos y sistema de pensiones.',
    detalles: [
      'Choque entre el modelo de consolidación fiscal y el de gasto social expansivo.',
      'Propuestas sobre la tarifa plana de autónomos e impuesto de sociedades.'
    ]
  },
  {
    dia: 21,
    fechaCompleta: 'Viernes, 21 de noviembre de 2026',
    hito: 'DÍA 8: SEGUNDA SEMANA DE CAMPAÑA',
    tipo: 'general',
    titulo: 'Llamamiento al voto de los residentes en el extranjero (CERA)',
    descripcion: 'Últimas jornadas para el depósito del voto en urna en los consulados de España en Europa, América y el resto del mundo tras la supresión del voto rogado.',
    detalles: [
      'Votación presencial en embajadas y consulados habilitados.',
      'Los votos exteriores se custodian para el escrutinio general del quinto día posterior a las elecciones.'
    ]
  },
  {
    dia: 22,
    fechaCompleta: 'Sábado, 22 de noviembre de 2026',
    hito: 'DÍA 9: FIN DE SEMANA PREVIO',
    tipo: 'general',
    titulo: 'Últimos mítines masivos en plazas centrales',
    descripcion: 'Despliegue simultáneo de los candidatos en los grandes feudos electorales: Madrid, Barcelona, Valencia, Zaragoza y Bilbao.',
    detalles: [
      'Mensajes enfocados a indecisos que deciden su voto en la última semana.',
      'Publicación de los últimos sondeos con intención de voto desglosada.'
    ]
  },
  {
    dia: 23,
    fechaCompleta: 'Lunes, 23 de noviembre de 2026',
    hito: 'DÍA 10: ÚLTIMO DÍA LEGAL DE SONDEOS',
    tipo: 'encuestas',
    titulo: 'Fecha límite legal para publicar o difundir encuestas en España',
    descripcion: 'A las 23:59 h concluye el plazo legal para publicar, difundir o reproducir sondeos electorales por cualquier medio de comunicación en España. A partir de la medianoche entra en vigor la veda.',
    detalleNormativo: 'Art. 69.7 de la LOREG: Durante los cinco días anteriores al de la votación queda prohibida la publicación y difusión o reproducción de sondeos electorales por cualquier medio de comunicación.',
    detalles: [
      'Aluvión final de encuestas con estimación de escaños y mayorías.',
      'En elecciones.online se activa el protocolo automático de veda electoral conforme a la ley.'
    ]
  },
  {
    dia: 24,
    fechaCompleta: 'Martes, 24 de noviembre de 2026',
    hito: 'DÍA 11: INICIO DE LA VEDA DE SONDEOS',
    tipo: 'veda',
    titulo: 'Veda legal de encuestas y últimos debates cara a cara',
    descripcion: 'Rige la prohibición de publicar encuestas en territorio español. La campaña se focaliza en los actos directos con los ciudadanos y en los mensajes finales de programa.',
    detalles: [
      'Prohibición estricta de publicación de pronósticos electorales.',
      'Los partidos orientan sus recursos a la movilización puerta a puerta y digital.'
    ]
  },
  {
    dia: 25,
    fechaCompleta: 'Miércoles, 25 de noviembre de 2026',
    hito: 'DÍA 12: RECTA FINAL DE CAMPAÑA',
    tipo: 'general',
    titulo: 'Último plazo para entrega del voto por correo',
    descripcion: 'Correos finaliza el plazo reglamentario para que los electores depositen sus sobres con las papeletas en las oficinas postales de toda España.',
    detalles: [
      'Correos traslada las sacas con el voto postal a las mesas electorales correspondientes.',
      'Cierre del plazo a la hora habitual de cierre de oficinas postales.'
    ]
  },
  {
    dia: 26,
    fechaCompleta: 'Jueves, 26 de noviembre de 2026',
    hito: 'DÍA 13: PENÚLTIMO DÍA DE CAMPAÑA',
    tipo: 'general',
    titulo: 'Aclaración final de posibles pactos de investidura',
    descripcion: 'Los candidatos fijan sus líneas rojas para la sesión de investidura: pactos de coalición, apoyos parlamentarios y condiciones irrenunciables.',
    detalles: [
      'Uso del Pactómetro ciudadano para evaluar escenarios matemáticos de 176 escaños.',
      'Declaraciones finales sobre la política de alianzas tras el 29-N.'
    ]
  },
  {
    dia: 27,
    fechaCompleta: 'Viernes, 27 de noviembre de 2026',
    hito: 'DÍA 14: CIERRE DE CAMPAÑA',
    tipo: 'cierre',
    titulo: 'Cierre de la campaña electoral a las 24:00 h',
    descripcion: 'Mítines multitudinarios de fin de campaña de todos los candidatos para echar el resto. A las 23:59 h termina oficialmente el periodo de propaganda electoral y de petición de voto.',
    detalleNormativo: 'Art. 51 LOREG: Finalización de todos los actos electorales públicos de campaña.',
    detalles: [
      'Actos multitudinarios de clausura en Madrid y capitales autonómicas.',
      'A medianoche queda prohibido emitir cuñas publicitarias o pedir el voto.'
    ]
  },
  {
    dia: 28,
    fechaCompleta: 'Sábado, 28 de noviembre de 2026',
    hito: 'JORNADA DE REFLEXIÓN',
    tipo: 'reflexion',
    titulo: 'Día de reflexión ciudadana sin propaganda electoral',
    descripcion: 'Jornada reservada a la reflexión personal de los votantes. La ley prohíbe terminantemente cualquier acto de propaganda política o difusión de consignas de voto por parte de partidos o candidatos.',
    detalleNormativo: 'Art. 54.1 LOREG: No puede difundirse propaganda electoral ni realizarse acto alguno de campaña electoral.',
    detalles: [
      'Día sin mítines, declaraciones políticas ni cuñas electorales.',
      'Constitución previa y revisión logística de los 22.000 colegios electorales.',
      'Recepción de credenciales de interventores y apoderados.'
    ]
  },
  {
    dia: 29,
    fechaCompleta: 'Domingo, 29 de noviembre de 2026',
    hito: 'JORNADA ELECTORAL (29-N)',
    tipo: 'urnas',
    titulo: 'Apertura de urnas: Elecciones Generales al Congreso y Senado',
    descripcion: 'Más de 37 millones de ciudadanos llamados a las urnas para elegir a los 350 diputados del Congreso y 208 senadores de designación directa.',
    detalleNormativo: 'Art. 80 a 102 LOREG: Votación de 09:00 a 20:00 h, seguida del escrutinio público e inmediato en cada mesa electoral.',
    detalles: [
      '08:00 h: Constitución de mesas electorales con presidente y dos vocales.',
      '09:00 h: Apertura de colegios y comienzo de la votación.',
      '14:00 h: Primer avance oficial de participación ciudadana.',
      '18:00 h: Segundo avance oficial de participación.',
      '20:00 h: Cierre de colegios electorales y comienzo del escrutinio público en cada mesa.',
      '21:00 h: Publicación de los primeros resultados oficiales con el cierre de colegios en Canarias.'
    ]
  }
];

const PROXIMAS_ELECCIONES = [
  {
    titulo: 'Elecciones Generales de España 2026',
    fecha: '29 de noviembre de 2026',
    tipo: 'Nacional · Congreso y Senado',
    ambito: '350 diputados y 208 senadores',
    estado: 'Convocadas y en curso',
    color: 'bg-red-900 text-white',
    enlace: '/espana/generales/2026'
  },
  {
    titulo: 'Elecciones Municipales 2027',
    fecha: '23 de mayo de 2027',
    tipo: 'Local · 8.131 municipios',
    ambito: 'Alcaldías y concejales de toda España',
    estado: 'Reglamentarias (cada 4 años)',
    color: 'bg-blue-900 text-white',
    enlace: null
  },
  {
    titulo: 'Elecciones Autonómicas 2027',
    fecha: '23 de mayo de 2027',
    tipo: 'Autonómico · 12 CCAA + Ceuta y Melilla',
    ambito: 'Madrid, C. Valenciana, Castilla-La Mancha, Baleares, Asturias, etc.',
    estado: 'Reglamentarias',
    color: 'bg-amber-900 text-white',
    enlace: null
  },
  {
    titulo: 'Elecciones Autonómicas (Históricas)',
    fecha: 'Fechas según disolución anticipada',
    tipo: 'Autonómico · Cataluña, País Vasco y Galicia',
    ambito: 'Parlament, Parlamento Vasco y Parlamento de Galicia',
    estado: 'Calendario singular por estatuto',
    color: 'bg-neutral-800 text-white',
    enlace: null
  },
  {
    titulo: 'Elecciones al Parlamento Europeo 2029',
    fecha: 'Junio de 2029 (estimada)',
    tipo: 'Supranacional · Unión Europea',
    ambito: 'Circunscripción única de España (61 eurodiputados)',
    estado: 'Ciclo europeo de 5 años',
    color: 'bg-indigo-900 text-white',
    enlace: null
  }
];

export default function CalendarioElectoral() {
  const [diaSeleccionado, setDiaSeleccionado] = useState<number>(14);
  const eventoActivo = DIAS_CAMPANA.find((d) => d.dia === diaSeleccionado) ?? DIAS_CAMPANA[0];

  const estiloHito = (tipo: DiaCampana['tipo']) => {
    switch (tipo) {
      case 'inicio':
        return 'bg-emerald-100 text-emerald-950 border-emerald-300';
      case 'debate':
        return 'bg-purple-100 text-purple-950 border-purple-300';
      case 'encuestas':
        return 'bg-orange-100 text-orange-950 border-orange-300';
      case 'veda':
        return 'bg-neutral-200 text-neutral-900 border-neutral-300';
      case 'cierre':
        return 'bg-amber-100 text-amber-950 border-amber-300';
      case 'reflexion':
        return 'bg-sky-100 text-sky-950 border-sky-300';
      case 'urnas':
        return 'bg-red-900 text-white border-red-900 animate-pulse';
      default:
        return 'bg-white text-neutral-800 border-neutral-200';
    }
  };

  return (
    <div className="space-y-10">
      {/* Diario de campaña día a día */}
      <section className="rounded-2xl border border-[#dfd9cc] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <span className="inline-block rounded-full bg-red-900/10 px-3 py-1 text-xs font-bold text-red-900">
            Diario de campaña interactivo
          </span>
          <h2 className="mt-2 font-editorial text-2xl sm:text-4xl font-bold text-neutral-950">
            Los 16 días clave: del arranque de campaña al recuento del 29-N
          </h2>
          <p className="mt-1 text-sm text-neutral-600 max-w-3xl">
            Sigue la evolución de la campaña electoral día a día: debates televisados, último día legal de sondeos, veda, jornada de reflexión y la apertura de urnas.
          </p>
        </div>

        {/* Carrusel horizontal de días de Noviembre 2026 */}
        <div className="border-y border-neutral-200 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-bold text-neutral-500">
              Noviembre 2026 · Haz clic en cualquier día:
            </span>
            <span className="text-xs font-semibold text-red-900">
              Día seleccionado: {diaSeleccionado} de noviembre
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 [scrollbar-width:thin]">
            {DIAS_CAMPANA.map((item) => {
              const activo = item.dia === diaSeleccionado;
              return (
                <button
                  key={item.dia}
                  type="button"
                  onClick={() => setDiaSeleccionado(item.dia)}
                  className={`flex flex-col items-center justify-center min-w-[52px] h-14 rounded-xl border transition ${
                    activo
                      ? 'bg-neutral-950 text-white border-neutral-950 shadow-md scale-105'
                      : 'bg-[#faf7f2] text-neutral-800 border-neutral-300 hover:bg-white hover:border-neutral-400'
                  }`}
                >
                  <span className="font-editorial text-lg font-bold leading-none">{item.dia}</span>
                  <span className="text-xs font-mono mt-0.5 opacity-80">
                    {item.tipo === 'urnas'
                      ? '29-N'
                      : item.tipo === 'debate'
                      ? 'Debate'
                      : item.tipo === 'encuestas'
                      ? 'Sondeos'
                      : item.tipo === 'cierre'
                      ? 'Cierre'
                      : 'Día'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ficha detallada del día seleccionado */}
        <div className="rounded-2xl border-2 border-neutral-300 bg-[#faf7f2]/70 p-5 sm:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
            <div>
              <span className={`inline-block rounded-md border px-2.5 py-0.5 text-xs font-extrabold ${estiloHito(eventoActivo.tipo)}`}>
                {eventoActivo.hito}
              </span>
              <div className="mt-1 font-mono text-xs text-neutral-500 font-semibold">
                {eventoActivo.fechaCompleta}
              </div>
            </div>
            {eventoActivo.dia === 29 && (
              <span className="rounded-full bg-red-600 text-white px-3 py-1 text-xs font-bold animate-bounce">
                ¡Día de votación!
              </span>
            )}
          </div>

          <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-neutral-950">
            {eventoActivo.titulo}
          </h3>

          <p className="text-sm sm:text-base text-neutral-800 leading-relaxed font-medium">
            {eventoActivo.descripcion}
          </p>

          {eventoActivo.detalleNormativo && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-950 leading-relaxed">
              <strong>Base jurídica electoral: </strong>
              {eventoActivo.detalleNormativo}
            </div>
          )}

          <div className="pt-2">
            <span className="block text-xs font-bold text-neutral-500 mb-2">
              Puntos clave de esta jornada:
            </span>
            <ul className="grid gap-2 sm:grid-cols-2">
              {eventoActivo.detalles.map((detalle, idx) => (
                <li
                  key={idx}
                  className="rounded-lg bg-white border border-neutral-200/80 p-2.5 text-xs text-neutral-700 flex items-start gap-2"
                >
                  <span className="text-red-900 font-bold shrink-0"></span>
                  <span>{detalle}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Próximas elecciones */}
      <section className="rounded-2xl border border-[#dfd9cc] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <span className="inline-block rounded-full bg-neutral-900 text-white px-3 py-1 text-xs font-bold">
            Calendario Electoral Global
          </span>
          <h2 className="mt-2 font-editorial text-2xl sm:text-3xl font-bold text-neutral-950">
            Próximas citas electorales en España (2026–2029)
          </h2>
          <p className="mt-1 text-sm text-neutral-600 max-w-3xl">
            Cuándo se vota en cada nivel de la administración: elecciones generales, municipales, autonómicas y europeas.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROXIMAS_ELECCIONES.map((elec, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-neutral-200 bg-[#faf7f2]/60 p-4 space-y-3 flex flex-col justify-between hover:border-neutral-400 hover:bg-white transition"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${elec.color}`}>
                    {elec.estado}
                  </span>
                  <span className="font-mono text-xs font-bold text-red-900">
                    {elec.fecha}
                  </span>
                </div>
                <h3 className="font-bold text-base text-neutral-950 leading-snug">
                  {elec.titulo}
                </h3>
                <p className="text-xs text-neutral-600">
                  <strong>Ámbito: </strong>{elec.ambito}
                </p>
                <p className="text-xs text-neutral-500 italic">
                  {elec.tipo}
                </p>
              </div>

              {elec.enlace && (
                <div className="pt-2 border-t border-neutral-200">
                  <Link
                    href={elec.enlace}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-900 hover:underline"
                  >
                    <span>Ver portal de las Generales 2026</span>
                    <span>→</span>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
