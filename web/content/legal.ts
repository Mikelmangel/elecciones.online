// Datos del titular (LSSI art. 10).
export const TITULAR = {
  nombre: 'NOMBRE O RAZÓN SOCIAL',
  nif: 'NIF',
  domicilio: 'DOMICILIO',
  correo: 'correo@example.org',
};

export interface Legal {
  slug: string;
  titulo: string;
  secciones: { titulo: string; parrafos: string[] }[];
}

export const LEGAL: Legal[] = [
  {
    slug: 'aviso-legal',
    titulo: 'Aviso legal',
    secciones: [
      {
        titulo: 'Titular del sitio',
        parrafos: [
          `Titular: ${TITULAR.nombre}. NIF: ${TITULAR.nif}. Domicilio: ${TITULAR.domicilio}. Contacto: ${TITULAR.correo}.`,
        ],
      },
      {
        titulo: 'Qué es este sitio',
        parrafos: [
          'elecciones.online es un sitio informativo independiente. No pertenece a ninguna administración, partido ni medio de comunicación, y no es una fuente oficial. Los datos proceden de documentos públicos enlazados en cada página.',
        ],
      },
      {
        titulo: 'Corrección de errores y solicitudes de retirada',
        parrafos: [
          `Todos los contenidos tienen carácter exclusivamente informativo y proceden de fuentes públicas oficiales enlazadas en cada página. Si algún dato no coincide con su fuente oficial o consideras que algún contenido no debe publicarse, escríbenos a ${TITULAR.correo} indicando la URL y el motivo para revisarlo, corregirlo o retirarlo de inmediato.`,
        ],
      },
    ],
  },
  {
    slug: 'privacidad',
    titulo: 'Política de privacidad',
    secciones: [
      {
        titulo: 'Qué datos tratamos',
        parrafos: [
          'Este sitio no tiene cuentas de usuario ni formularios de registro, y no pide datos personales para consultarlo.',
          'Termómetro ciudadano: si participas, se guardan la candidatura y la provincia que indiques y el día, sin tu dirección IP ni ningún identificador. Para admitir un solo apoyo por conexión cada 21 días, se guarda durante ese plazo una huella cifrada de tu IP (SHA-256 con una clave secreta), en una tabla separada que no se relaciona con el apoyo emitido y que se borra al caducar. Es un dato seudonimizado: no guardamos la IP, pero no es anónimo en sentido estricto. Una comprobación de Cloudflare Turnstile verifica que no eres un programa automático.',
          'El servidor y el proveedor de red (Cloudflare) registran de forma temporal datos técnicos de cada visita, como la dirección IP, para servir las páginas y protegerlas frente a abusos.',
        ],
      },
      {
        titulo: 'Tus derechos',
        parrafos: [
          `Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición y limitación escribiendo a ${TITULAR.correo}, y reclamar ante la Agencia Española de Protección de Datos.`,
        ],
      },
    ],
  },
  {
    slug: 'cookies',
    titulo: 'Política de cookies',
    secciones: [
      {
        titulo: 'Qué son las cookies',
        parrafos: [
          'Una cookie es un pequeño fichero de texto que los sitios web almacenan en tu navegador al visitarlos. Sirven para recordar aspectos técnicos de la sesión, proteger contra ataques o medir el tráfico de forma agregada.',
          'De conformidad con el artículo 22.2 de la Ley 34/2002 (LSSI-CE) y las directrices de la Agencia Española de Protección de Datos (AEPD), en esta página te informamos de qué cookies y tecnologías similares utilizamos, con qué finalidad y cómo puedes gestionar o revocar tu consentimiento.',
        ],
      },
      {
        titulo: 'Cookies técnicas y de seguridad (estrictamente necesarias)',
        parrafos: [
          'Son imprescindibles para el funcionamiento seguro del sitio web y no requieren consentimiento previo.',
          'Cloudflare y Cloudflare Turnstile: el portal utiliza los servicios de red y seguridad de Cloudflare para mitigar ataques de denegación de servicio (DDoS) y verificar en el termómetro de opinión que no se emiten apoyos mediante scripts o bots automáticos (galletas técnicas como __cf_bm o identificadores temporales de sesión). Estas cookies no almacenan información de perfilado ni se usan con fines comerciales.',
        ],
      },
      {
        titulo: 'Cookies analíticas (requieren consentimiento previo)',
        parrafos: [
          'Google Tag Manager / Google Analytics (identificador GTM-XXXXXXX): permite recopilar métricas estadísticas de navegación de manera agregada y anónima (número de visitas, páginas consultadas, duración media) para entender qué contenidos son útiles para la ciudadanía y mejorar la plataforma.',
          'Estas cookies (como _ga y _ga_*) solo se activan si pulsas «Aceptar» en nuestro aviso de cookies. Si pulsas «Rechazar», las cookies analíticas quedan bloqueadas mediante el modo de consentimiento (Google Consent Mode v2) y no se guardará ningún identificador de analítica en tu navegador.',
        ],
      },
      {
        titulo: 'Publicidad (Google AdSense)',
        parrafos: [
          'Este sitio utiliza Google AdSense (identificador ca-pub-XXXXXXXXXXXXXXXX) para mostrar anuncios que ayudan a financiar los costes de servidores y dominio.',
          'En cumplimiento del RGPD y las políticas de Google y la AEPD, la entrega de anuncios respeta el modo de consentimiento (Google Consent Mode v2). Si rechazas las cookies, no se utilizarán cookies para personalización de anuncios ni seguimiento entre sitios.',
        ],
      },
      {
        titulo: 'Enlaces externos y donaciones',
        parrafos: [
          'El sitio incluye enlaces externos a plataformas de apoyo voluntario (Ko-fi). Al hacer clic en dicho enlace, eres redirigido a una plataforma externa independiente con sus propios proveedores de pago (como PayPal o Stripe). Dichos servicios operan bajo sus propias políticas de privacidad y cookies, sin que elecciones.online instale ni gestione cookies relacionadas con esas transacciones en tu navegador.',
        ],
      },
      {
        titulo: 'Cómo gestionar o retirar tu consentimiento',
        parrafos: [
          'Puedes aceptar o rechazar las cookies no esenciales en cualquier momento borrando el almacenamiento local («consentimiento-cookies») o las cookies de tu navegador mediante sus opciones de configuración (Chrome, Firefox, Safari, Edge). Al reiniciar la sesión se te volverá a mostrar el selector de consentimiento.',
        ],
      },
    ],
  },
  {
    slug: 'transparencia',
    titulo: 'Transparencia y financiación',
    secciones: [
      {
        titulo: 'Quién paga este sitio',
        parrafos: [
          'elecciones.online lo mantiene una persona a título particular. Sus costes son el servidor, los dominios y la infraestructura técnica.',
          'El proyecto se financia mediante recursos propios, donaciones ciudadanas voluntarias y publicidad programática (Google AdSense) para cubrir gastos de mantenimiento. No recibe dinero de partidos políticos, cargos públicos, candidatos ni fundaciones vinculadas a ellos. Si alguno de ellos hiciera una aportación, se devolvería.',
        ],
      },
      {
        titulo: 'Donaciones',
        parrafos: [
          'Se aceptan donaciones voluntarias a través de Ko-fi (enlace al pie de cada página). Las donaciones no dan derecho a influir en el contenido.',
          'El pie enlaza también a licitia.eu, un proyecto del mismo autor sobre licitaciones públicas. Es un enlace propio, no publicidad pagada.',
          'Los ingresos y gastos se publicarán en esta página tras las elecciones.',
        ],
      },
    ],
  },
  {
    slug: 'metodologia',
    titulo: 'Metodología y fuentes',
    secciones: [
      {
        titulo: 'De dónde salen los datos',
        parrafos: [
          'Resultados electorales de 2023: resumen oficial de la Junta Electoral Central publicado en el BOE.',
          'Escaños por circunscripción y fecha electoral de 2026: Real Decreto de convocatoria publicado en el BOE.',
          'Votaciones: datos abiertos del Congreso de los Diputados. Se muestra el voto agregado por grupo parlamentario tal como figura en el registro.',
        ],
      },
      {
        titulo: 'Cómo los tratamos',
        parrafos: [
          'Cada dato enlaza al documento oficial del que procede. Los programas de extracción se comprueban contra valores leídos directamente del documento original.',
          'No se añaden valoraciones. Cuando una cifra no puede leerse con seguridad, se deja en blanco.',
        ],
      },
      {
        titulo: 'Sondeos',
        parrafos: [
          'De acuerdo con el artículo 69.7 de la Ley Orgánica del Régimen Electoral General, este sitio no difunde sondeos electorales durante los cinco días anteriores a la votación.',
        ],
      },
    ],
  },
];

// Enlace de donación (Ko-fi, Stripe Payment Link…). Vacío = no se muestra.
export const DONACION_URL = '';
