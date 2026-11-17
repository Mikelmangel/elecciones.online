// Plazos generales de la LOREG (arts. 26, 27, 72, 73, 75). Las fechas concretas de cada
// convocatoria las fijan el BOE y la Junta Electoral Central: cada guía enlaza a la fuente oficial.

export interface Guia {
  slug: string;
  icono: string;
  etiqueta: string;
  titulo: string;
  descripcion: string;
  secciones: { titulo: string; puntos: string[] }[];
  fuentes: { nombre: string; url: string }[];
  // plazos legales expresados en días antes de la votación; la página los convierte en fechas
  plazos?: { texto: string; diasAntes: number }[];
  herramientaExterna?: {
    titulo: string;
    descripcion: string;
    url: string;
    boton: string;
  };
}

export const GUIAS: Guia[] = [
  {
    slug: 'como-votar',
    icono: '',
    etiqueta: 'Guía práctica completa',
    plazos: [
      { texto: 'Último día para solicitar el voto por correo (plazo general LOREG)', diasAntes: 10 },
      { texto: 'Último día para depositar el voto por correo en oficinas de Correos', diasAntes: 3 },
      { texto: 'Inicio de la prohibición legal de publicar encuestas (veda electoral)', diasAntes: 5 },
      { texto: 'Jornada de reflexión', diasAntes: 1 },
    ],
    titulo: 'Cómo votar: plazos del voto por correo, documentos y voto desde el extranjero',
    descripcion: 'Guía práctica paso a paso con el calendario oficial de la Junta Electoral Central, documentos válidos para identificarte en la mesa y modalidades de voto.',
    secciones: [
      {
        titulo: '1. Qué documentos sirven para votar en persona en la mesa electoral',
        puntos: [
          'Documento Nacional de Identidad (DNI), Pasaporte o Permiso de conducir (carné de conducir).',
          'Deben ser documentos originales con fotografía (no valen fotocopias ni resguardos sin foto). Sí se acepta la aplicación oficial miDGT para el carné de conducir según acuerdo de la Junta Electoral Central.',
          'Importante: los documentos son válidos para identificarte ante la mesa electoral aunque estén caducados.',
        ],
      },
      {
        titulo: '2. Horario de los colegios electorales el 29 de noviembre',
        puntos: [
          'Los colegios electorales abren a las 09:00 horas y cierran a las 20:00 horas de forma ininterrumpida (en Canarias, en su hora insular).',
          'Si a las 20:00 horas quedan electores dentro del local electoral o en el acceso al mismo, el presidente de la mesa les permitirá votar antes de cerrar la urna.',
        ],
      },
      {
        titulo: '3. Diferencia entre papeleta del Congreso y papeleta del Senado',
        puntos: [
          'Congreso de los Diputados (sobre y papeleta blancos): listas cerradas y bloqueadas. Eliges la papeleta de una candidatura completa sin tachar ni añadir marcas.',
          'Senado (sobre y papeleta color sepia): listas abiertas. Puedes marcar con una cruz hasta un máximo de 3 candidatos en las provincias peninsulares (2 en Gran Canaria, Mallorca, Tenerife, Ceuta y Melilla; 1 en el resto de islas), incluso aunque sean de partidos distintos.',
        ],
      },
      {
        titulo: '4. Resumen de modalidades de voto si no puedes acudir el domingo',
        puntos: [
          'Voto por correo desde España: se solicita hasta 10 días antes de las elecciones (19 de noviembre) en Correos o por internet con certificado digital, y se entrega gratis en cualquier oficina de Correos hasta 3 días antes (26 de noviembre, salvo ampliación de la JEC).',
          'Voto desde el extranjero (CERA): los españoles residentes permanentes en el exterior reciben la documentación de oficio sin tener que «rogar» el voto y pueden descargar las papeletas homologadas.',
          'Español temporalmente en el extranjero (ERTA): debe inscribirse como no residente en el consulado y solicitar la documentación dentro del plazo legal.',
        ],
      },
    ],
    fuentes: [
      { nombre: 'Junta Electoral Central (JEC) — Normativa e instrucciones', url: 'https://www.juntaelectoralcentral.es' },
      { nombre: 'LOREG, arts. 72 a 75 y 84 a 88 (BOE)', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1985-11672' },
      { nombre: 'Correos: solicitud oficial de voto por correo', url: 'https://www.correos.es/es/es/particulares/para-el-ciudadano/voto-por-correo' },
    ],
  },
  {
    slug: 'colegio-electoral',
    icono: '',
    etiqueta: 'Censo y local electoral',
    titulo: 'Cómo saber cuál es tu colegio electoral: mesa, sección y local',
    descripcion: 'Mesa, sección y local: cómo se asignan según tu padrón e inicial de apellido, qué es la tarjeta censal y cómo usar el buscador oficial del INE.',
    herramientaExterna: {
      titulo: 'Busca tu colegio y mesa electoral en la Sede del INE',
      descripcion: 'Buscador oficial de la Oficina del Censo Electoral: consulta tu local exacto indicando provincia, municipio, calle, número e inicial de tu primer apellido (sin necesidad de certificado digital).',
      url: 'https://sede.ine.gob.es/ce-mesas/?lang=es_ES',
      boton: 'Abrir buscador oficial del INE ↗',
    },
    secciones: [
      {
        titulo: 'Cómo se asignan tu distrito, sección y mesa electoral',
        puntos: [
          'Cada municipio se divide en distritos censales y estos en secciones (entre 500 y 2.000 electores).',
          'Dentro de cada sección puede haber una o varias mesas electorales, ordenadas alfabéticamente por la inicial del primer apellido del elector (por ejemplo: Mesa A de la A a la L, Mesa B de la M a la Z).',
          'El censo que se utiliza en estas elecciones se cierra el día primero del segundo mes anterior a la convocatoria (art. 39 LOREG). Si te empadronaste después de esa fecha, seguirás votando en tu colegio electoral anterior.',
        ],
      },
      {
        titulo: 'La tarjeta censal que recibes en tu buzón',
        puntos: [
          'La Oficina del Censo Electoral envía por correo ordinario a todos los electores una tarjeta censal informativa con los datos de tu distrito, sección, mesa y la dirección exacta del colegio o local electoral.',
          'La tarjeta censal es meramente informativa: NO es obligatoria para ir a votar ni sirve como documento de identidad.',
        ],
      },
      {
        titulo: 'Cómo consultar tu mesa si no te ha llegado la tarjeta censal',
        puntos: [
          'En el buscador abierto del INE (https://sede.ine.gob.es/ce-mesas/?lang=es_ES) introduciendo tu provincia, municipio, dirección e inicial del primer apellido.',
          'Con Cl@ve o certificado digital en la Sede Electrónica del INE para consultar tus datos exactos de inscripción en el censo.',
          'En el ayuntamiento de tu municipio o llamando al teléfono gratuito 900 343 232 de la Oficina del Censo Electoral.',
        ],
      },
    ],
    fuentes: [
      { nombre: 'Sede Electrónica del INE — Consulta de mesas y locales electorales', url: 'https://sede.ine.gob.es/ce-mesas/?lang=es_ES' },
      { nombre: 'INE: Oficina del Censo Electoral', url: 'https://www.ine.es/oficina_censo/' },
      { nombre: 'LOREG, arts. 23 a 25 y 39 (BOE)', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1985-11672' },
    ],
  },
  {
    slug: 'mesa-electoral',
    icono: '',
    etiqueta: 'Sorteo, excusas y dieta',
    titulo: 'Cómo saber si te ha tocado mesa electoral: sorteo, notificación, excusas y dietas',
    descripcion: 'Cuándo se celebra el sorteo en los ayuntamientos, cómo te notifican, qué excusas legales puedes presentar en 7 días y qué dieta y permisos te corresponden.',
    secciones: [
      {
        titulo: '1. Sorteo público y cómo saber si te ha tocado',
        puntos: [
          'El sorteo público se realiza en cada ayuntamiento entre los días 25 y 29 posteriores al decreto de convocatoria.',
          'Entran en el sorteo los electores de la mesa menores de 70 años que sepan leer y escribir (para ser presidente de mesa se exige título de Bachiller, FP de segundo grado o equivalente).',
          'La designación se notifica en mano en tu domicilio en los 3 días siguientes al sorteo por policía local o correo certificado con acuse de recibo (si no estás en casa tras varios intentos, dejan aviso de recogida). Algunos ayuntamientos habilitan además consulta online con DNI.',
        ],
      },
      {
        titulo: '2. Plazo y causas justificadas para presentar excusas (7 días)',
        puntos: [
          'Tienes un plazo de 7 días naturales desde que recibes la notificación para presentar alegaciones ante la Junta Electoral de Zona, de forma presencial o a través de la aplicación oficial de excusas de las Juntas Electorales.',
          'Causas personales automáticas: ser mayor de 65 años (basta con manifestar la renuncia en 7 días), situación de discapacidad, incapacidad temporal para el trabajo (baja médica), embarazo de riesgo o a partir del sexto mes, e internamiento en centros hospitalarios o penitenciarios.',
          'Causas familiares: cuidado directo y continuo de menores de 12 años o personas con discapacidad, ser madre en periodo de lactancia natural o artificial hasta los 9 meses, o tener eventos familiares de especial relevancia (bodas de parientes hasta 2.º grado) inaplazables.',
          'Causas profesionales: sanitarios, bomberos, protección civil, jueces o periodistas que presten servicio de guardia o cobertura informativa el día de la votación.',
        ],
      },
      {
        titulo: '3. Dieta económica, permiso laboral y protección',
        puntos: [
          'Los titulares (presidente y dos vocales) que ejercen el cargo durante la jornada cobran una dieta oficial exenta de IRPF (70 € en las convocatorias recientes fijadas por Orden Ministerial).',
          'Los suplentes tienen la obligación de presentarse a las 08:00 h en el colegio electoral; si todos los titulares acuden, los suplentes pueden marcharse a casa a las 08:30 h.',
          'Derecho laboral: permiso retribuido durante toda la jornada del domingo si trabajas ese día, y reducción obligatoria de 5 horas en tu jornada laboral del lunes siguiente (tanto para titulares como para suplentes que lleguen a formar parte de la mesa).',
        ],
      },
      {
        titulo: '4. Qué ocurre si no te presentas sin causa justificada',
        puntos: [
          'Acudir a la mesa electoral (tanto si eres titular como suplente) es un deber cívico obligatorio.',
          'El artículo 143 de la LOREG tipifica como delito electoral no acudir a constituir la mesa sin causa legítima justificada, con pena de prisión de 3 meses a 1 año o multa de 6 a 24 meses.',
        ],
      },
    ],
    fuentes: [
      { nombre: 'Instrucción 6/2011 de la Junta Electoral Central sobre excusas de mesa', url: 'https://www.juntaelectoralcentral.es' },
      { nombre: 'LOREG, arts. 26 a 28 y 143 (BOE)', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1985-11672' },
    ],
  },
  {
    slug: 'voto-por-correo',
    icono: '',
    etiqueta: 'Paso a paso en Correos',
    plazos: [
      { texto: 'Último día para solicitar el voto por correo', diasAntes: 10 },
      { texto: 'Último día para entregar el voto en Correos', diasAntes: 3 },
    ],
    titulo: 'Cómo votar por correo en España',
    descripcion: 'Quién puede pedirlo, plazos y pasos para votar por correo desde España.',
    secciones: [
      {
        titulo: 'Quién puede solicitarlo',
        puntos: ['Cualquier elector inscrito en el censo, sin necesidad de justificar el motivo.'],
      },
      {
        titulo: 'Paso 1: solicitar el certificado de inscripción en el censo',
        puntos: [
          'Por internet, en la web de Correos, con DNI electrónico o certificado digital.',
          'En persona, en cualquier oficina de Correos, con DNI, pasaporte o carné de conducir originales.',
          'Plazo: desde la convocatoria hasta el décimo día anterior a la votación.',
        ],
      },
      {
        titulo: 'Paso 2: recibir la documentación',
        puntos: [
          'La Oficina del Censo Electoral envía por correo certificado las papeletas, los sobres y el certificado censal.',
          'Se entrega en mano al elector, previa identificación.',
        ],
      },
      {
        titulo: 'Paso 3: votar',
        puntos: [
          'Mete la papeleta en el sobre de votación y este, junto con el certificado, en el sobre dirigido a la mesa.',
          'Entrégalo en una oficina de Correos, gratis, hasta el tercer día anterior a la votación, salvo que la Junta Electoral Central amplíe el plazo.',
        ],
      },
      {
        titulo: 'Importante',
        puntos: ['Una vez aceptada la solicitud de voto por correo, ya no se puede votar en persona el día de las elecciones.'],
      },
    ],
    fuentes: [
      { nombre: 'Correos: voto por correo', url: 'https://www.correos.es/es/es/particulares/para-el-ciudadano/voto-por-correo' },
      { nombre: 'LOREG, arts. 72 y 73 (BOE)', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1985-11672' },
    ],
  },
  {
    slug: 'voto-desde-el-extranjero',
    icono: '',
    etiqueta: 'Voto CERA y ERTA',
    titulo: 'Cómo votar desde el extranjero (CERA y ERTA)',
    descripcion: 'Voto de residentes permanentes en el extranjero y de españoles temporalmente fuera.',
    secciones: [
      {
        titulo: 'Residentes permanentes (CERA)',
        puntos: [
          'Inscritos en el Registro de Matrícula Consular como residentes.',
          'Reciben la documentación de oficio y pueden descargar las papeletas.',
          'Votan en urna en el consulado o embajada, o por correo dirigido al consulado, dentro de los plazos oficiales.',
        ],
      },
      {
        titulo: 'Temporalmente en el extranjero (ERTA)',
        puntos: [
          'Deben estar inscritos como no residentes en el consulado.',
          'Solicitan la documentación a la Delegación Provincial de la Oficina del Censo Electoral.',
        ],
      },
    ],
    fuentes: [
      { nombre: 'INE: Oficina del Censo Electoral', url: 'https://www.ine.es/oficina_censo/' },
      { nombre: 'LOREG, art. 75 (BOE)', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1985-11672' },
    ],
  },
  {
    slug: 'como-funciona-el-sistema-electoral',
    icono: '',
    etiqueta: 'Ley D’Hondt y barrera 3 %',
    titulo: 'Cómo funciona el sistema electoral español',
    descripcion: 'Circunscripciones, barrera del 3 %, fórmula D’Hondt y elección del Senado.',
    secciones: [
      {
        titulo: 'Congreso: 350 escaños',
        puntos: [
          '52 circunscripciones: las 50 provincias, Ceuta y Melilla.',
          'Cada provincia parte de 2 escaños; Ceuta y Melilla tienen 1 cada una. Los 248 restantes se reparten según población.',
        ],
      },
      {
        titulo: 'Barrera del 3 %',
        puntos: ['En cada circunscripción quedan fuera del reparto las candidaturas con menos del 3 % de los votos válidos (incluidos los votos en blanco).'],
      },
      {
        titulo: 'Fórmula D’Hondt',
        puntos: [
          'Los votos de cada candidatura se dividen entre 1, 2, 3… y los escaños se asignan a los cocientes más altos.',
          'Puedes probarlo en el simulador.',
        ],
      },
      {
        titulo: 'Senado',
        puntos: [
          'Listas abiertas: en las provincias peninsulares se eligen 4 senadores y cada elector marca hasta 3.',
          'A los elegidos se suman los designados por los parlamentos autonómicos.',
        ],
      },
    ],
    fuentes: [{ nombre: 'LOREG, arts. 161 a 166 (BOE)', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1985-11672' }],
  },
];
