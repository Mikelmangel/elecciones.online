// Carga y valida data/*.json en build. Un dato que no cumple el esquema rompe el build: no se publica.
import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { z } from 'zod';

const DATA = existsSync(path.join(process.cwd(), 'data'))
  ? path.join(process.cwd(), 'data')
  : path.join(process.cwd(), '..', 'data');

function cargar<T>(fichero: string, esquema: z.ZodType<T>): T {
  return esquema.parse(JSON.parse(readFileSync(path.join(DATA, fichero), 'utf-8')));
}

const Procedencia = { fuente_url: z.url(), fetched_at: z.string().min(10), sha256: z.string().length(64) };

const Convocatoria = z.object({
  ...Procedencia,
  fecha_eleccion: z.iso.date(),
  circunscripciones: z
    .array(z.object({ codigo: z.string().length(2), nombre: z.string(), diputados: z.number().int().positive() }))
    .length(52)
    .refine((c) => c.reduce((a, x) => a + x.diputados, 0) === 350, 'los diputados no suman 350'),
});

const Recuento = z.object({
  si: z.number().int(),
  no: z.number().int(),
  abstencion: z.number().int(),
  no_vota: z.number().int(),
});

const Votacion = z.object({
  ...Procedencia,
  id: z.string(),
  sesion: z.number().int(),
  numero: z.number().int(),
  fecha: z.iso.date(),
  titulo: z.string(),
  texto_expediente: z.string().nullable(),
  titulo_subgrupo: z.string().nullable(),
  totales: Recuento.extend({ presentes: z.number().int() }),
  por_grupo: z.record(z.string(), Recuento).nullable(),
});
export type Votacion = z.infer<typeof Votacion>;

const Resultados = z.object({
  ...Procedencia,
  boe_id: z.string(),
  provincias: z
    .array(
      z.object({
        codigo: z.string().length(2),
        nombre: z.string(),
        escanos: z.number().int(),
        censo: z.number().int(),
        votantes: z.number().int(),
        votos_validos: z.number().int(),
        votos_blanco: z.number().int(),
        votos_nulos: z.number().int(),
        candidaturas: z.array(
          z.object({ siglas: z.string(), nombre: z.string(), votos: z.number().int(), escanos: z.number().int() })
        ),
      })
    )
    .length(52),
  nacional: z
    .array(z.object({ siglas: z.string(), votos: z.number().int(), escanos: z.number().int() }))
    .refine((n) => n.reduce((a, x) => a + x.escanos, 0) === 350, 'los escaños no suman 350'),
});

export const AREAS = {
  vivienda: 'Vivienda',
  empleo: 'Empleo y salarios',
  impuestos: 'Impuestos',
  economia: 'Economía y empresa',
  sanidad: 'Sanidad',
  educacion: 'Educación',
  energia_clima: 'Energía y clima',
  pensiones: 'Pensiones',
  social: 'Familia, igualdad y servicios sociales',
  seguridad_justicia: 'Seguridad y justicia',
  inmigracion: 'Inmigración',
  territorial: 'Modelo territorial',
  instituciones: 'Instituciones y democracia',
  defensa_exterior: 'Defensa y política exterior',
  infraestructuras: 'Infraestructuras y transporte',
  rural: 'Campo y medio rural',
  cultura: 'Cultura, deporte y lenguas',
  otros: 'Otros temas',
} as const;
export type Area = keyof typeof AREAS;

const Programa = z.object({
  ...Procedencia,
  siglas: z.string(),
  nombre: z.string(),
  propuestas: z.array(
    z.object({
      area: z.enum(Object.keys(AREAS) as [Area, ...Area[]]),
      titular: z.string().max(140),
      cita: z.string().min(20),
      pagina: z.number().int().positive(),
      ley_afectada: z.string().nullable(),
      situacion_actual: z.string().nullable(),
      en_tu_dia_a_dia: z.string().nullable(),
    })
  ),
});
export type Programa = z.infer<typeof Programa>;

let _prog: Programa[] | undefined;
export function programas(): Programa[] {
  if (_prog) return _prog;
  const dir = path.join(DATA, 'programas');
  const ficheros = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('_')) : [];
  return (_prog = ficheros.sort().map((f) => cargar(`programas/${f}`, Programa)));
}
export const slug = (siglas: string) => siglas.toLowerCase().replace(/[^a-z0-9]+/g, '-');

let _res: z.infer<typeof Resultados> | undefined;
export const resultados2023 = () => (_res ??= cargar('resultados_generales_2023.json', Resultados));

let _conv: z.infer<typeof Convocatoria> | undefined;
export const convocatoria = () => (_conv ??= cargar('convocatoria_2026.json', Convocatoria));

let _vot: Votacion[] | undefined;
export const votaciones = () =>
  (_vot ??= cargar('congreso_votaciones.json', z.object({ votaciones: z.array(Votacion) })).votaciones);

const Candidaturas2026 = z.object({
  ...Procedencia,
  circunscripciones: z
    .array(
      z.object({
        codigo: z.string().length(2),
        nombre: z.string(),
        candidaturas: z.array(
          z.object({
            denominacion: z.string(),
            siglas: z.string(),
            cabeza_de_lista: z.string(),
          })
        ),
      })
    )
    .length(52),
});
export type Candidaturas2026 = z.infer<typeof Candidaturas2026>;

let _cand26: Candidaturas2026 | undefined;
export const candidaturas2026 = () => (_cand26 ??= cargar('candidaturas_2026.json', Candidaturas2026));

const VotacionesClave = z.object({
  fuente: z.string(),
  criterio: z.string(),
  votaciones: z.array(
    z.object({
      id: z.string(),
      tema: z.enum(Object.keys(AREAS) as [Area, ...Area[]]),
      categoria: z.string(),
      titulo_llano: z.string(),
    })
  ),
});
export type VotacionClave = z.infer<typeof VotacionesClave>['votaciones'][number];

let _vclave: z.infer<typeof VotacionesClave> | undefined;
export const votacionesClave = () => (_vclave ??= cargar('votaciones_clave.json', VotacionesClave));

const Entrevistas = z.object({
  fuente: z.string(),
  fetched_at: z.string().min(10),
  debates: z.array(
    z.object({
      titulo: z.string(),
      fecha: z.iso.date().nullable(),
      medio: z.string(),
      formato: z.literal('debate'),
      participantes: z.array(z.string()),
      fuente_url: z.url(),
      nota: z.string().nullable(),
    })
  ),
  entrevistas: z.array(
    z.object({
      id: z.string().optional(),
      slug: z.string().optional(),
      partido: z.string(),
      persona: z.string(),
      titulo: z.string(),
      medio: z.string(),
      formato: z.enum(['youtube', 'tv', 'radio', 'prensa']),
      fecha: z.iso.date().nullable(),
      fuente_url: z.url(),
    })
  ),
});
export type EntrevistasData = z.infer<typeof Entrevistas>;

let _entr: EntrevistasData | undefined;
export const entrevistas = () => (_entr ??= cargar('entrevistas.json', Entrevistas));

export function extraerYoutubeId(url: string): string | null {
  const m = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(url);
  return m ? m[1] : null;
}

export const obtenerEntrevistaPorSlug = (slugOrId: string) => {
  const data = entrevistas();
  const direct = data.entrevistas.find(
    (e) => e.slug === slugOrId || e.id === slugOrId || extraerYoutubeId(e.fuente_url) === slugOrId
  );
  if (direct) return direct;

  const fcItem = factcheckingEntrevistas().verificaciones.find(
    (v) => v.entrevista_id === slugOrId || v.id === slugOrId
  );
  if (fcItem && fcItem.entrevista_url) {
    return data.entrevistas.find((e) => e.fuente_url === fcItem.entrevista_url);
  }
  return undefined;
};

// ==========================================
// Análisis y Comentarios Editoriales de Vídeos
// ==========================================

const EjeTematicoSchema = z.object({
  tema: z.string(),
  titular: z.string(),
  analisis: z.string(),
  minutos_clave: z.array(z.string()),
});

const ContrasteHechoSchema = z.object({
  declaracion: z.string(),
  minuto: z.string(),
  en_programa: z.string(),
  en_congreso: z.string(),
  evaluacion: z.string(),
  nota_editorial: z.string(),
});

const AnalisisEntrevistaSchema = z.object({
  slug: z.string(),
  entrevista_id: z.string(),
  persona: z.string(),
  partido: z.string(),
  medio: z.string(),
  fecha: z.iso.date().nullable(),
  duracion_aprox: z.string(),
  resumen_ejecutivo: z.string(),
  contexto_politico: z.string(),
  ejes_tematicos: z.array(EjeTematicoSchema),
  contrastes_hechos: z.array(ContrasteHechoSchema),
  conclusiones: z.array(z.string()),
});

const AnalisisEntrevistasDocSchema = z.object({
  fuente: z.string(),
  actualizado: z.string(),
  total_analisis: z.number(),
  analisis: z.array(AnalisisEntrevistaSchema),
});

export type EjeTematicoItem = z.infer<typeof EjeTematicoSchema>;
export type ContrasteHechoItem = z.infer<typeof ContrasteHechoSchema>;
export type AnalisisEntrevistaItem = z.infer<typeof AnalisisEntrevistaSchema>;
export type AnalisisEntrevistasDocData = z.infer<typeof AnalisisEntrevistasDocSchema>;

let _analisisEntr: AnalisisEntrevistasDocData | undefined;
export const analisisEntrevistas = () =>
  (_analisisEntr ??= cargar('analisis_entrevistas.json', AnalisisEntrevistasDocSchema));

export const obtenerAnalisisEntrevista = (
  slugOrIdOrUrl: string
): AnalisisEntrevistaItem | undefined => {
  const doc = analisisEntrevistas();
  const ytId = extraerYoutubeId(slugOrIdOrUrl);
  return doc.analisis.find(
    (a) =>
      a.slug === slugOrIdOrUrl ||
      a.entrevista_id === slugOrIdOrUrl ||
      (ytId && a.entrevista_id === ytId) ||
      (ytId && a.slug.includes(ytId))
  );
};

export function parseMinutoASegundos(minutoStr: string): number {
  if (!minutoStr) return 0;
  const partes = minutoStr.trim().replace('[', '').replace(']', '').split(':');
  if (partes.length === 2) {
    const min = parseInt(partes[0], 10) || 0;
    const sec = parseInt(partes[1], 10) || 0;
    return min * 60 + sec;
  }
  if (partes.length === 3) {
    const horas = parseInt(partes[0], 10) || 0;
    const min = parseInt(partes[1], 10) || 0;
    const sec = parseInt(partes[2], 10) || 0;
    return horas * 3600 + min * 60 + sec;
  }
  return 0;
}

export const obtenerVerificacionesEntrevista = (fuenteUrl: string, persona?: string): VerificacionEntrevistaItem[] => {
  const ytId = extraerYoutubeId(fuenteUrl);
  const items = factcheckingEntrevistas().verificaciones;
  const encontradas = items.filter((v) => {
    if (v.entrevista_url === fuenteUrl) return true;
    if (ytId && v.entrevista_url && v.entrevista_url.includes(ytId)) return true;
    if (ytId && (v.raw_file?.includes(ytId) || v.entrevista_id === ytId)) return true;
    if (persona && v.persona === persona && !ytId) return true;
    return false;
  });

  if (encontradas.length > 0) {
    return encontradas.slice().sort(
      (a, b) => parseMinutoASegundos(a.contexto_minuto || '') - parseMinutoASegundos(b.contexto_minuto || '')
    );
  }

  // Fallback: cargar frases de la transcripción oficial indexada en raw/
  const rutaTranscripciones = path.join(
    DATA,
    '..',
    'pipeline',
    'fuentes',
    'entrevistas',
    'raw',
    'transcripciones_indexadas.json'
  );
  if (existsSync(rutaTranscripciones)) {
    try {
      const idx = JSON.parse(readFileSync(rutaTranscripciones, 'utf-8'));
      const fuente = (idx.fuentes || []).find((f: { url?: string; file?: string }) => {
        if (f.url === fuenteUrl) return true;
        if (ytId && f.url && f.url.includes(ytId)) return true;
        if (ytId && f.file && f.file.includes(ytId)) return true;
        return false;
      });
      if (fuente && Array.isArray(fuente.frases) && fuente.frases.length > 0) {
        return fuente.frases.map((fr: { minuto: string; texto: string; tema: string }, i: number) => ({
          id: `${ytId || 'transcripcion'}-${fr.minuto.replace(':', '-')}-${i}`,
          entrevista_id: ytId || undefined,
          medio: fuente.titulo || 'Transcripción oficial',
          formato_fuente: 'entrevista_video',
          persona: persona || fuente.persona || '',
          partido: fuente.partido || '',
          fecha: fuente.fecha || null,
          tema: (fr.tema as Area) || 'otros',
          cita_literal: fr.texto,
          afirmacion: fr.texto,
          tipo: 'posicion',
          contexto_minuto: fr.minuto,
          cruce_programa: null,
          cruce_votacion: null,
          dato_oficial: null,
          fuente_oficial_nombre: null,
          fuente_oficial_url: null,
          veredicto: 'NO COMPROBADO' as const,
          explicacion: null,
          entrevista_url: fuenteUrl,
          raw_file: fuente.file || '',
          fetched_at: fuente.fetched_at || '',
          sha256: fuente.sha256 || '',
          revisado: false,
        })).sort(
          (a: VerificacionEntrevistaItem, b: VerificacionEntrevistaItem) =>
            parseMinutoASegundos(a.contexto_minuto || '') - parseMinutoASegundos(b.contexto_minuto || '')
        );
      }
    } catch {
      // Ignorar errores de fallback
    }
  }

  return [];
};

const EleccionActiva = z.object({
  id: z.string(),
  nombre: z.string(),
  tipo: z.string(),
  fecha_eleccion: z.iso.date(),
  legislatura: z.string(),
  escanos_totales: z.number().int().positive(),
  mayoria_absoluta: z.number().int().positive(),
  circunscripciones: z.number().int().positive(),
  apertura_urnas: z.string(),
  cierre_urnas_peninsula: z.string(),
  cierre_urnas_canarias: z.string(),
});
export type EleccionActiva = z.infer<typeof EleccionActiva>;

let _eleccion: EleccionActiva | undefined;
export const eleccionActiva = () => (_eleccion ??= cargar('eleccion_activa.json', EleccionActiva));

const PartidoItem = z.object({
  slug: z.string(),
  siglas: z.string(),
  nombre: z.string(),
  ambito: z.enum(['nacional', 'regional']).optional(),
  territorio: z.string().optional(),
  grupoCongreso: z.string().nullable(),
  grupoEsCoalicion: z.boolean(),
  entrevistaKey: z.string(),
  programaSlug: z.string().optional(),
});
export type PartidoFicha = z.infer<typeof PartidoItem>;

let _partidos: PartidoFicha[] | undefined;
export const partidosData = () =>
  (_partidos ??= cargar('partidos.json', z.object({ partidos: z.array(PartidoItem) })).partidos);

const MapaProvincia = z.object({
  codigo: z.string().regex(/^\d{2}$/),
  nombre: z.string(),
  d: z.string().min(4),
  cx: z.number(),
  cy: z.number(),
});
export type MapaProvincia = z.infer<typeof MapaProvincia>;

let _mapa: MapaProvincia[] | undefined;
export const mapaEspana = () => (_mapa ??= cargar('mapa_espana.json', z.array(MapaProvincia)));

const BoeDisposicion = z.object({
  identificador: z.string(),
  fecha: z.string(),
  seccion: z.string(),
  departamento: z.string(),
  epigrafe: z.string(),
  titulo: z.string(),
  url_html: z.url(),
  url_pdf: z.string(),
  fuente_url: z.url(),
  fetched_at: z.string().min(10),
  sha256: z.string().length(64),
});

const BoeElectoral = z.object({
  fuente: z.string(),
  fuente_url: z.url(),
  fetched_at: z.string().min(10),
  total: z.number().int().nonnegative(),
  disposiciones: z.array(BoeDisposicion),
});
export type BoeElectoralData = z.infer<typeof BoeElectoral>;

let _boe: BoeElectoralData | undefined;
export const boeElectoral = () => (_boe ??= cargar('boe_electoral.json', BoeElectoral));

// Nombres oficiales de los grupos de la XV Legislatura. Un grupo no es un partido:
// el Mixto y el Plurinacional SUMAR reúnen a varios.
export const GRUPOS: Record<string, string> = {
  GS: 'Socialista',
  GP: 'Popular',
  GVOX: 'VOX',
  GSUMAR: 'Plurinacional SUMAR',
  GR: 'Republicano',
  GJxCAT: 'Junts per Catalunya',
  'GEH Bildu': 'Euskal Herria Bildu',
  'GV (EAJ-PNV)': 'Vasco (EAJ-PNV)',
  GMx: 'Mixto',
  '': 'Sin grupo en el registro oficial',
};

export const fechaLarga = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export const miles = (n: number) => n.toLocaleString('es-ES', { useGrouping: 'always' });
export const pct = (parte: number, total: number) =>
  total ? `${((parte / total) * 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %` : '—';

const CasoCoherencia = z.object({
  id_votacion: z.string(),
  titulo_llano: z.string(),
  tipo_coherencia: z.enum(['giro_de_voto', 'division_bloque', 'decreto_omnibus', 'cumplimiento']),
  etiqueta: z.string(),
  resumen: z.string(),
  revisado: z.boolean().optional(),
  partidos: z.array(
    z.object({
      siglas: z.string(),
      promesa_previa: z.string(),
      voto_emitido: z.string(),
      coherencia: z.string(),
      motivo_oficial: z.string(),
    })
  ),
});

const CoherenciaDoc = z.object({
  fuente: z.string(),
  actualizado: z.string(),
  descripcion: z.string(),
  casos: z.array(CasoCoherencia),
});
export type CoherenciaData = z.infer<typeof CoherenciaDoc>;
export type CasoCoherenciaItem = z.infer<typeof CasoCoherencia>;

let _coherencia: CoherenciaData | undefined;
// Regla 3 de CLAUDE.md: etiquetas de coherencia sobre partidos solo se publican revisadas por una persona.
export const coherenciaVotaciones = () =>
  (_coherencia ??= ((d) => ({ ...d, casos: d.casos.filter((c) => c.revisado === true) }))(
    cargar('coherencia_votaciones.json', CoherenciaDoc)
  ));

const VerificacionItem = z.object({
  id: z.string(),
  entrevista_id: z.string(),
  medio: z.string(),
  formato_fuente: z.enum(['entrevista_video', 'radio', 'debate_tv', 'rueda_prensa', 'blog_programa']).optional(),
  persona: z.string(),
  partido: z.string(),
  fecha: z.string(),
  tema: z.enum(Object.keys(AREAS) as [Area, ...Area[]]), // un tema fuera de AREAS no saldría en el comparador
  cita_literal: z.string(),
  afirmacion: z.string(),
  tipo: z.string().optional(),
  contexto_minuto: z.string(),
  cruce_programa: z.string().optional(),
  cruce_votacion: z.string().optional(),
  raw_file: z.string(),
  fetched_at: z.string(),
  sha256: z.string(),
  dato_oficial: z.string(),
  fuente_oficial_nombre: z.string(),
  fuente_oficial_url: z.url(),
  veredicto: z.enum(['VERDADERO', 'FALSO', 'CON MATICES', 'ENGAÑOSO', 'NO COMPROBADO', 'CONTRADICCIÓN']),
  explicacion: z.string(),
  entrevista_url: z.string().optional(),
  revisado: z.boolean().optional(),
});

const FactcheckingDoc = z.object({
  fuente: z.string(),
  fetched_at: z.string(),
  verificaciones: z.array(VerificacionItem),
});
export type FactcheckingData = z.infer<typeof FactcheckingDoc>;
export type VerificacionEntrevistaItem = z.infer<typeof VerificacionItem>;

let _factchecking: FactcheckingData | undefined;
// Regla 8 de CLAUDE.md: `revisado` lo pone la verificación automática (pipeline/fuentes/entrevistas/evidencia.py)
// solo cuando la prueba es comprobable. Sin eso sale únicamente la cita literal con su minuto.
// Veredicto, dato, paráfrasis y cruces se ocultan aquí para que ninguna página pueda pintarlos.
export const soloCita = (v: VerificacionEntrevistaItem): VerificacionEntrevistaItem =>
  v.revisado === true
    ? v
    : {
        ...v,
        afirmacion: v.cita_literal,
        veredicto: 'NO COMPROBADO',
        dato_oficial: 'Pendiente de revisión.',
        explicacion: 'Cita literal de la fuente enlazada. Sin evaluación.',
        cruce_programa: undefined,
        cruce_votacion: undefined,
      };
export const factcheckingEntrevistas = () =>
  (_factchecking ??= ((d) => ({ ...d, verificaciones: d.verificaciones.map(soloCita) }))(
    cargar('factchecking_entrevistas.json', FactcheckingDoc)
  ));

// ==========================================
// Tests y Minijuegos Virales
// ==========================================

const PosicionPartido = z.object({
  valor: z.number(),
  nota: z.string(),
  fuente: z.string(),
});

const PreguntaPropuesta = z.object({
  id: z.string(),
  propuesta: z.string(),
  partido_correcto: z.string(),
  opciones: z.array(z.string()),
  cita: z.string(),
  pagina: z.number(),
  fuente: z.string(),
  fuente_url: z.string(),
});

const PropuestasQuizDoc = z.object({
  fuente: z.string(),
  version: z.string(),
  descripcion: z.string(),
  preguntas: z.array(PreguntaPropuesta),
});
export type PropuestasQuizData = z.infer<typeof PropuestasQuizDoc>;
export type PreguntaPropuestaItem = z.infer<typeof PreguntaPropuesta>;

let _propuestasQuiz: PropuestasQuizData | undefined;
export const testsPropuestas = () =>
  (_propuestasQuiz ??= cargar(path.join('tests', 'propuestas_quiz.json'), PropuestasQuizDoc));

const PreguntaVotacionQuiz = z.object({
  id: z.string(),
  titulo: z.string(),
  pregunta: z.string(),
  opciones: z.array(z.string()),
  respuesta_correcta: z.string(),
  explicacion: z.string(),
  sesion: z.string(),
  fecha: z.string(),
  fuente_url: z.string(),
});

const VotacionesQuizDoc = z.object({
  fuente: z.string(),
  version: z.string(),
  descripcion: z.string(),
  preguntas: z.array(PreguntaVotacionQuiz),
});
export type VotacionesQuizData = z.infer<typeof VotacionesQuizDoc>;
export type PreguntaVotacionQuizItem = z.infer<typeof PreguntaVotacionQuiz>;

let _votacionesQuiz: VotacionesQuizData | undefined;
export const testsVotaciones = () =>
  (_votacionesQuiz ??= cargar(path.join('tests', 'votaciones_quiz.json'), VotacionesQuizDoc));

const PreguntaPreparadoQuiz = z.object({
  id: z.string(),
  pregunta: z.string(),
  opciones: z.array(z.string()),
  respuesta_correcta: z.string(),
  explicacion: z.string(),
});

const PreparadoQuizDoc = z.object({
  fuente: z.string(),
  version: z.string(),
  descripcion: z.string(),
  preguntas: z.array(PreguntaPreparadoQuiz),
});
export type PreparadoQuizData = z.infer<typeof PreparadoQuizDoc>;
export type PreguntaPreparadoQuizItem = z.infer<typeof PreguntaPreparadoQuiz>;

let _preparadoQuiz: PreparadoQuizData | undefined;
export const testsPreparado = () =>
  (_preparadoQuiz ??= cargar(path.join('tests', 'preparado_quiz.json'), PreparadoQuizDoc));

const PosicionAfinidad = z.object({
  valor: z.number(),
  nota: z.string(),
  fuente: z.string(),
  fuente_url: z.url(),
});

const AfirmacionAfinidad = z.object({
  id: z.string(),
  texto: z.string(),
  area: z.string(),
  caminos: z.array(z.string()),
  eje: z.object({
    dimension: z.enum(['economia', 'sociedad']),
    direccion: z.union([z.literal(1), z.literal(-1)]),
  }),
  posiciones: z.record(z.string(), PosicionAfinidad),
});

const PartidoIdeologia = z.object({
  siglas: z.string(),
  nombre: z.string(),
  x: z.number(),
  y: z.number(),
  color: z.string(),
  ambito: z.enum(['estatal', 'autonomico']),
  provincia: z.array(z.string()).optional(),
});

const AfinidadDoc = z.object({
  fuente: z.string(),
  version: z.string(),
  fecha_actualizacion: z.string(),
  metodologia: z.object({
    descripcion: z.string(),
    escala: z.record(z.string(), z.string()),
    ponderacion_estrella: z.number(),
    disclaimer: z.string(),
  }),
  partidos_ideologia: z.array(PartidoIdeologia),
  afirmaciones: z.array(AfirmacionAfinidad),
});
export type AfinidadData = z.infer<typeof AfinidadDoc>;
export type AfirmacionAfinidadItem = z.infer<typeof AfirmacionAfinidad>;
export type PartidoIdeologiaItem = z.infer<typeof PartidoIdeologia>;

let _afinidad: AfinidadData | undefined;
export const testsAfinidad = () =>
  (_afinidad ??= cargar(path.join('tests', 'afinidad_preguntas.json'), AfinidadDoc));

const ParSocios = z.object({
  a: z.string(),
  b: z.string(),
  porcentaje: z.number(),
  iguales: z.number(),
  total: z.number(),
  si_si: z.number(),
  no_no: z.number(),
});

const DueloSocios = z.object({
  id: z.string(),
  pregunta: z.string(),
  opcion_a: ParSocios.extend({ etiqueta: z.string() }),
  opcion_b: ParSocios.extend({ etiqueta: z.string() }),
  ganadora: z.string(),
});

const SociosQuizDoc = z.object({
  fuente: z.string(),
  version: z.string(),
  total_votaciones: z.number(),
  metodologia: z.string().optional(),
  partidos: z.array(z.string()),
  pares: z.array(ParSocios),
  duelos: z.array(DueloSocios),
});
export type SociosQuizData = z.infer<typeof SociosQuizDoc>;

let _sociosQuiz: SociosQuizData | undefined;
export const testsSocios = () =>
  (_sociosQuiz ??= cargar(path.join('tests', 'socios_quiz.json'), SociosQuizDoc));

const ProvinciaMargen = z.object({
  codigo: z.string(),
  nombre: z.string(),
  escanos_2023: z.number(),
  escanos_2026: z.number(),
  votos_validos: z.number(),
  ultimo_escanio_partido: z.string(),
  siguiente_partido: z.string(),
  margen_votos: z.number(),
  porcentaje_margen: z.number(),
});

const PreguntaProvincia = z.object({
  id: z.string(),
  pregunta: z.string(),
  opciones: z.array(z.string()),
  respuesta_correcta: z.string(),
  explicacion: z.string(),
});

const VotoProvinciaQuizDoc = z.object({
  fuente: z.string(),
  version: z.string(),
  mas_renidas: z.array(ProvinciaMargen),
  provincias: z.array(ProvinciaMargen),
  preguntas: z.array(PreguntaProvincia),
});
export type VotoProvinciaQuizData = z.infer<typeof VotoProvinciaQuizDoc>;

let _votoProvinciaQuiz: VotoProvinciaQuizData | undefined;
export const testsVotoProvincia = () =>
  (_votoProvinciaQuiz ??= cargar(path.join('tests', 'voto_provincia_quiz.json'), VotoProvinciaQuizDoc));



// ==========================================
// Actualidad: titulares enlazados de canales de partidos, instituciones y medios (pipeline/fuentes/actualidad)
const ActualidadDoc = z.object({
  fuente: z.string(),
  fetched_at: z.string(),
  fuentes: z.array(z.object({ id: z.string(), canal: z.string(), clase: z.string(), fuente_url: z.url(), sha256: z.string().length(64) })),
  items: z.array(
    z.object({
      titulo: z.string().min(1),
      url: z.url(),
      fecha: z.string(),
      fuente: z.string(),
      canal: z.string(),
      clase: z.enum(['partido', 'medio', 'institucion', 'programa']),
      partidos: z.array(z.string()),
    })
  ),
});
export type ActualidadItem = z.infer<typeof ActualidadDoc>['items'][number];
let _actualidad: z.infer<typeof ActualidadDoc> | undefined;
export const actualidad = () => (_actualidad ??= cargar('actualidad.json', ActualidadDoc));
