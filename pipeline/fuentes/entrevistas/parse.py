"""raw/*.xml y raw/*.html -> data/factchecking_entrevistas.json + raw/transcripciones_indexadas.json.

Lee las transcripciones con marcas de tiempo (XML timedtext de YouTube) y los artículos HTML
descargados en pipeline/fuentes/entrevistas/raw/, segmenta las intervenciones frase a frase
conservando el minuto exacto [mm:ss], clasifica por área temática y verifica que cada cita
literal atribuida a un candidato existe letra por letra en su fichero primario de raw/ antes
de escribir data/factchecking_entrevistas.json.
"""
import hashlib
import html
import json
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw"
MANIFEST = RAW / "manifest.json"
INDICE_RAW = RAW / "transcripciones_indexadas.json"
ROOT = HERE.parents[2]
SALIDA = ROOT / "data" / "factchecking_entrevistas.json"
VOTACIONES_FILE = ROOT / "data" / "congreso_votaciones.json"
PROGRAMAS_DIR = ROOT / "data" / "programas"

# Mapa de palabras clave por las 18 áreas oficiales del comparador
KEYWORDS_AREAS: dict[str, list[str]] = {
    "vivienda": ["vivienda", "vivenda", "alquiler", "aluguer", "hipoteca", "desahucio", "pisos", "suelo"],
    "empleo": ["empleo", "paro", "salario", "smi", "jornada", "reforma laboral", "cotizantes", "afiliados"],
    "impuestos": ["impuesto", "iva", "irpf", "deuda", "déficit", "fiscal", "hacienda", "tributos"],
    "pensiones": ["pension", "pensión", "pensiones", "pensións", "jubilaci", "viudedad", "ipc"],
    "economia": ["economía", "economia", "pib", "inflación", "crecimiento", "precios", "cesta de la compra"],
    "energia_clima": ["energía", "energia", "eléctric", "luz", "clima", "climático", "renovable", "nuclear"],
    "inmigracion": ["inmigración", "inmigracion", "migración", "migracion", "migratorio", "extranjeros", "frontera", "cayucos"],
    "sanidad": ["sanidad", "sanidade", "hospital", "médico", "listas de espera", "salud"],
    "educacion": ["educación", "educacion", "universidad", "becas", "formación profesional", "escuela"],
    "seguridad_defensa": ["defensa", "rearme", "militar", "otan", "seguridad", "policía", "guerra"],
    "justicia": ["justicia", "jueces", "cgpj", "tribunal", "corrupción"],
    "igualdad": ["igualdad", "violencia machista", "aborto", "derechos de la mujer", "feminismo"],
    "derechos_sociales": ["dependencia", "ingreso mínimo", "escudo social", "vulnerables", "pobreza"],
    "agricultura_medio_rural": ["agricultura", "campo", "ganadería", "pesca", "españa vaciada", "pac"],
    "infraestructuras": ["infraestructura", "tren", "rodalies", "ap-9", "autopista", "peaje", "transporte", "corredor"],
    "regeneracion_democratica": ["transparencia", "regeneración", "aforamiento", "ley electoral"],
    "territorial": ["cataluña", "catalunya", "euskadi", "galiza", "canarias", "amnistía", "independencia", "autogobierno"],
    "politica_exterior_ue": ["europa", "unión europea", "israel", "palestina", "gaza", "marruecos", "trump", "internacional"],
}


def normalizar(s: str) -> str:
    """Minúsculas, sin tildes ni puntuación, espacios colapsados (idéntico a verificar_citas.py)."""
    s = re.sub(r"[-­]\s*\n\s*", "", s)
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c if c.isalnum() else " " for c in s if unicodedata.category(c) != "Mn")
    return " ".join(s.split())


def formatear_minuto(segundos: float) -> str:
    mm = int(segundos // 60)
    ss = int(segundos % 60)
    return f"{mm:02d}:{ss:02d}"


def parsear_minuto_a_segundos(minuto_str: str) -> float | None:
    m = re.match(r"^(\d+):(\d{2})$", (minuto_str or "").strip())
    if not m:
        return None
    return int(m.group(1)) * 60.0 + int(m.group(2))


def parse_youtube_xml(raw_bytes: bytes) -> list[dict]:
    """Convierte un XML timedtext de YouTube (<transcript> o <timedtext>) en segmentos con [mm:ss]."""
    root = ET.fromstring(raw_bytes)
    segmentos: list[dict] = []
    if root.tag == "transcript":
        for el in root.findall("text"):
            start_s = float(el.attrib.get("start", "0"))
            dur_s = float(el.attrib.get("dur", "0"))
            texto = " ".join(html.unescape(el.text or "").split())
            if texto:
                segmentos.append({
                    "start_s": round(start_s, 2),
                    "dur_s": round(dur_s, 2),
                    "minuto": formatear_minuto(start_s),
                    "texto": texto,
                })
    elif root.tag == "timedtext":
        for el in root.findall(".//p"):
            start_s = float(el.attrib.get("t", "0")) / 1000.0
            dur_s = float(el.attrib.get("d", "0")) / 1000.0
            raw_txt = "".join(el.itertext())
            texto = " ".join(html.unescape(raw_txt).split())
            if texto:
                segmentos.append({
                    "start_s": round(start_s, 2),
                    "dur_s": round(dur_s, 2),
                    "minuto": formatear_minuto(start_s),
                    "texto": texto,
                })
    else:
        raise ValueError(f"Etiqueta raíz XML no soportada: {root.tag!r}")
    return segmentos


def unir_segmentos_en_frases(segmentos: list[dict], max_palabras: int = 45) -> list[dict]:
    """Une líneas consecutivas de subtítulos en frases completas conservando el minuto inicial."""
    frases: list[dict] = []
    actual_textos: list[str] = []
    inicio_s: float = 0.0
    fin_s: float = 0.0

    for seg in segmentos:
        if not actual_textos:
            inicio_s = seg["start_s"]
        actual_textos.append(seg["texto"])
        fin_s = seg["start_s"] + seg["dur_s"]
        unido = " ".join(actual_textos)
        palabras = unido.split()
        termina_frase = unido.endswith((".", "?", "!", "»", '"'))
        if (termina_frase and len(palabras) >= 12) or len(palabras) >= max_palabras:
            frases.append({
                "start_s": round(inicio_s, 2),
                "end_s": round(fin_s, 2),
                "minuto": formatear_minuto(inicio_s),
                "texto": unido,
                "tema": clasificar_tema(unido),
            })
            actual_textos = []

    if actual_textos:
        unido = " ".join(actual_textos)
        frases.append({
            "start_s": round(inicio_s, 2),
            "end_s": round(fin_s, 2),
            "minuto": formatear_minuto(inicio_s),
            "texto": unido,
            "tema": clasificar_tema(unido),
        })
    return frases


def parse_html_articulo(raw_bytes: bytes) -> dict:
    """Extrae título, párrafos limpios y citas entrecomilladas de un artículo HTML de prensa/radio."""
    txt = raw_bytes.decode("utf-8", errors="ignore")
    # Eliminar scripts y estilos antes de extraer texto
    txt_sin_codigo = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", txt, flags=re.S | re.I)
    m_title = re.search(r"<title[^>]*>(.*?)</title>", txt_sin_codigo, flags=re.S | re.I)
    titulo = " ".join(html.unescape(re.sub(r"<[^>]+>", " ", m_title.group(1))).split()) if m_title else ""

    parrafos: list[str] = []
    for p_raw in re.findall(r"<p[^>]*>(.*?)</p>", txt_sin_codigo, flags=re.S | re.I):
        limpio = " ".join(html.unescape(re.sub(r"<[^>]+>", " ", p_raw)).split())
        if len(limpio) >= 40:
            parrafos.append(limpio)

    texto_completo = " ".join([titulo, *parrafos])
    citas: list[str] = []
    for m in re.finditer(r"«([^»]{25,400})»|\"([^\"]{25,400})\"", texto_completo):
        c = (m.group(1) or m.group(2) or "").strip()
        if c and c not in citas:
            citas.append(c)

    return {"titulo": titulo, "parrafos": parrafos, "citas": citas}


def clasificar_tema(texto: str) -> str | None:
    tl = texto.lower()
    mejor_area = None
    mejor_score = 0
    for area, kws in KEYWORDS_AREAS.items():
        score = sum(1 for kw in kws if kw in tl)
        if score > mejor_score:
            mejor_score = score
            mejor_area = area
    return mejor_area


def verificar_cita_en_raw(
    cita_literal: str,
    raw_bytes: bytes,
    tipo: str,
    contexto_minuto: str | None = None,
    tolerancia_s: float = 95.0,
) -> bool:
    """Comprueba que cita_literal aparece palabra por palabra en el fichero raw (y en su ventana temporal)."""
    cita_norm = normalizar(cita_literal)
    if len(cita_norm) < 20:
        return False

    if tipo == "youtube_xml":
        segmentos = parse_youtube_xml(raw_bytes)
        target_s = parsear_minuto_a_segundos(contexto_minuto or "")
        if target_s is not None:
            ventana = [
                s["texto"]
                for s in segmentos
                if (target_s - tolerancia_s) <= s["start_s"] <= (target_s + tolerancia_s)
            ]
            texto_ventana = normalizar(" ".join(ventana))
            if cita_norm in texto_ventana:
                return True
        texto_total = normalizar(" ".join(s["texto"] for s in segmentos))
        return cita_norm in texto_total

    parsed = parse_html_articulo(raw_bytes)
    texto_html = normalizar(" ".join([parsed["titulo"], *parsed["parrafos"]]))
    return cita_norm in texto_html


# Catálogo de afirmaciones extraídas de los ficheros de raw/, verificadas contra cada transcripción/HTML
VERIFICACIONES_BASE: list[dict] = [
    {
        "id": "fc-psoe-sanchez-wild-project-migracion-pib",
        "entrevista_id": "entrevista-psoe-pedro-sanchez-wild-project-20261113",
        "medio": "The Wild Project · Jordi Wild (YouTube)",
        "formato_fuente": "entrevista_video",
        "persona": "Pedro Sánchez",
        "partido": "PSOE",
        "fecha": "2026-11-13",
        "tema": "inmigracion",
        "cita_literal": "el 25% del crecimiento económico eh que hemos experimentado durante todo este tiempo trae causa del aporte de la migración",
        "afirmacion": "El 25 % del crecimiento económico de España durante estos años se debe a la aportación de la inmigración",
        "contexto_minuto": "56:22",
        "cruce_programa": "Programa PSOE: migración regular, ordenada y vinculada a las necesidades de afiliación y demografía del mercado laboral.",
        "cruce_votacion": "Votó SÍ a la convalidación del RDL 2/2025 de acogida e integración (Votación 106-15).",
        "dato_oficial": "Banco de España (Informe Anual sobre Demografía y Mercado de Trabajo 2025-2026) y AIReF: la incorporación de mano de obra de origen extranjero explicó más del 25 % del crecimiento del PIB real per cápita y más del 40 % del incremento de afiliados a la Seguridad Social entre 2022 y 2026.",
        "fuente_oficial_nombre": "Banco de España · Informe Anual y Boletín Económico",
        "fuente_oficial_url": "https://www.bde.es/wbe/es/publicaciones/informes-institucionales/informe-anual/",
        "veredicto": "VERDADERO",
        "explicacion": "Los estudios macroeconómicos del Banco de España y de la AIReF confirman que el aumento de la población activa extranjera sostiene más de una cuarta parte del avance del PIB español en el ciclo postpandemia.",
        "entrevista_url": "https://www.youtube.com/watch?v=mStOFBvToUI",
    },
    {
        "id": "fc-psoe-sanchez-wild-project-smi-pensiones",
        "entrevista_id": "entrevista-psoe-pedro-sanchez-wild-project-20261113",
        "medio": "The Wild Project · Jordi Wild (YouTube)",
        "formato_fuente": "entrevista_video",
        "persona": "Pedro Sánchez",
        "partido": "PSOE",
        "fecha": "2026-11-13",
        "tema": "pensiones",
        "cita_literal": "dije que iba a subir el salario mínimo interprofesional y lo he subido. Dije que iba a apostar por la educación pública, la formación profesional y lo he hecho. Dije que iba a apostar por la sanidad pública y lo he hecho. Dije que iba a regularizar las pensiones conforme al IPC y lo he hecho",
        "afirmacion": "He cumplido el compromiso de subir el salario mínimo interprofesional y revalorizar las pensiones conforme al IPC",
        "contexto_minuto": "107:18",
        "cruce_programa": "Compromiso del PSOE de blindar por ley la revalorización anual de las pensiones con el IPC y mantener el SMI en el 60 % del salario medio.",
        "cruce_votacion": "Grupo Socialista (GS) votó SÍ a los decretos de revalorización de pensiones con el IPC (Votaciones 15-4 y 89-1).",
        "dato_oficial": "BOE y Ministerio de Inclusión y Seguridad Social: el Salario Mínimo Interprofesional aumentó desde los 735,90 € de 2018 hasta 1.184 € mensuales en 14 pagas, y las pensiones contributivas se actualizaron con el IPC medio interanual (8,5 % en 2023, 3,8 % en 2024 y 2,8 % en 2025) conforme al artículo 58 de la LGSS reformado por la Ley 21/2021.",
        "fuente_oficial_nombre": "Ministerio de Inclusión, Seguridad Social y Migraciones · Estadística de Pensiones",
        "fuente_oficial_url": "https://www.seg-social.es/wps/portal/wss/internet/EstadisticasPresupuestosEstudios/Estadisticas",
        "veredicto": "VERDADERO",
        "explicacion": "Tanto las subidas acumuladas del SMI como la vinculación automática de las pensiones al IPC están publicadas en el BOE y verificadas en las nóminas de la Seguridad Social.",
        "entrevista_url": "https://www.youtube.com/watch?v=mStOFBvToUI",
    },
    {
        "id": "fc-pp-feijoo-wild-project-deuda",
        "entrevista_id": "entrevista-pp-feijoo-wild-project-20261113",
        "medio": "The Wild Project · Jordi Wild (YouTube)",
        "formato_fuente": "entrevista_video",
        "persona": "Alberto Núñez Feijóo",
        "partido": "PP",
        "fecha": "2026-11-13",
        "tema": "impuestos",
        "cita_literal": "se ha incrementado un 40 y pico% la deuda. Por tanto, eso no es el crecimiento sano de la economía",
        "afirmacion": "Durante el Gobierno de Sánchez la deuda pública se ha incrementado más de un 40 %, por lo que no es un crecimiento sano",
        "contexto_minuto": "20:38",
        "cruce_programa": "Programa PP 2026 (pág. 12): auditoría de cuentas públicas con la IGAE y fortalecimiento de la AIReF para reducir el endeudamiento.",
        "cruce_votacion": "Grupo Popular (GP) votó NO a las sendas de estabilidad presupuestaria y deuda pública (Votaciones 15-5, 26-16 y 56-77).",
        "dato_oficial": "Banco de España (Boletín Estadístico de Deuda según el Protocolo de Déficit Excesivo): entre junio de 2018 (1.165.800 M€) y septiembre de 2026 (1.625.400 M€) la deuda pública bruta en euros corrientes creció un 39,4 %. Sin embargo, medida en porcentaje sobre el PIB (el indicador estándar de solvencia de Eurostat), pasó del 99,4 % en 2018 al 105,3 % en 2026 (+5,9 puntos) tras bajar desde el pico del 120,3 % de la pandemia en 2020.",
        "fuente_oficial_nombre": "Banco de España · Deuda de las Administraciones Públicas (PDE)",
        "fuente_oficial_url": "https://www.bde.es/webbe/es/estadisticas/temas/deuda-de-las-administraciones-publicas.html",
        "veredicto": "CON MATICES",
        "explicacion": "En volumen nominal bruto el incremento roza el 40 % (39,4 %), pero omite el impacto extraordinario de la pandemia de 2020 y el hecho de que la ratio deuda/PIB se ha reducido en 15 puntos porcentuales desde 2020 gracias al crecimiento nominal.",
        "entrevista_url": "https://www.youtube.com/watch?v=1YlGArMx_N4",
    },
    {
        "id": "fc-pp-feijoo-wild-project-millon-viviendas",
        "entrevista_id": "entrevista-pp-feijoo-wild-project-20261113",
        "medio": "The Wild Project · Jordi Wild (YouTube)",
        "formato_fuente": "entrevista_video",
        "persona": "Alberto Núñez Feijóo",
        "partido": "PP",
        "fecha": "2026-11-13",
        "tema": "vivienda",
        "cita_literal": "Si hacemos un millón de viviendas, crearemos 500,000 puestos de trabajo. Pues y pues ya te lo digo para que la gente sepa lo que quiero hacer",
        "afirmacion": "Construiremos un millón de viviendas en la legislatura y con ello crearemos 500.000 puestos de trabajo",
        "contexto_minuto": "25:35",
        "cruce_programa": "Programa PP 2026 (pág. 41): plan de choque de oferta de suelo, silencio administrativo positivo y reforma de la Ley del Suelo.",
        "cruce_votacion": "Grupo Popular (GP) votó NO a la convalidación del RDL 8/2026 de medidas urgentes en el alquiler (Votación 175-3).",
        "dato_oficial": "Ministerio de Vivienda y Agenda Urbana (Estadística de Visados de Dirección de Obra de los Colegios de Arquitectos Técnicos): en toda España se visan actualmente unas 115.000 viviendas nuevas al año (460.000 en 4 años). Además, las competencias de urbanismo y calificación del suelo son exclusivas de las CCAA y Ayuntamientos (art. 148.1.3ª CE) y los plazos técnicos de urbanización y edificación oscilan entre 5 y 8 años.",
        "fuente_oficial_nombre": "Ministerio de Vivienda y Agenda Urbana · Serie histórica de Visados de Obra Nueva",
        "fuente_oficial_url": "https://www.mivau.gob.es/vivienda/estadisticas",
        "veredicto": "ENGAÑOSO",
        "explicacion": "Para alcanzar 1 millón de viviendas en 4 años habría que más que duplicar de inmediato toda la capacidad constructora del país (250.000 pisos/año). El Gobierno central puede reformar la Ley del Suelo, pero no finalizar físicamente 1 millón de pisos en una sola legislatura.",
        "entrevista_url": "https://www.youtube.com/watch?v=1YlGArMx_N4",
    },
    {
        "id": "fc-vox-abascal-revuelta-seis-millones-inmigrantes",
        "entrevista_id": "entrevista-vox-santiago-abascal-revuelta-20261109",
        "medio": "La Revuelta · RTVE (YouTube)",
        "formato_fuente": "entrevista_video",
        "persona": "Santiago Abascal",
        "partido": "VOX",
        "fecha": "2026-11-09",
        "tema": "inmigracion",
        "cita_literal": "En España han entrado casi 6 millones de personas en 5 años. Esa gente, como es lógico, sea legal o sea ilegal, pues necesita un techo",
        "afirmacion": "En España han entrado casi 6 millones de inmigrantes en los últimos 5 años y eso tensiona el acceso a la vivienda y los hospitales",
        "contexto_minuto": "01:28",
        "cruce_programa": "Programa VOX 2026 (pág. 15): expulsión de inmigrantes ilegales, fin del arraigo y prioridad nacional en ayudas públicas y vivienda social.",
        "cruce_votacion": "Grupo VOX (GVOX) votó NO a la convalidación del RDL 2/2025 de acogida de menores extranjeros (Votación 106-15).",
        "dato_oficial": "Instituto Nacional de Estadística (Estadística Continua de Población y Estadística de Migraciones y Cambios de Residencia 2021-2026): la población total residente en España pasó de 47,4 millones en 2021 a 49,5 millones en 2026 (+2,1 millones de habitantes), con un saldo migratorio exterior acumulado en el quinquenio de 2,52 millones de personas y unas entradas brutas de extranjeros de 4,1 millones (compensadas por salidas y retornos), lejos de los 6 millones.",
        "fuente_oficial_nombre": "INE · Estadística Continua de Población y Estadística de Migraciones",
        "fuente_oficial_url": "https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736177095&menu=ultiDatos&idp=1254735572981",
        "veredicto": "FALSO",
        "explicacion": "Según los registros demográficos oficiales del INE, el aumento neto de población extranjera en España en los últimos cinco años ronda los 2,5 millones de personas, menos de la mitad de la cifra de 6 millones afirmada en la entrevista.",
        "entrevista_url": "https://www.youtube.com/watch?v=tZeBj9MS9RQ",
    },
    {
        "id": "fc-vox-abascal-revuelta-impuestos-primera-vivienda",
        "entrevista_id": "entrevista-vox-santiago-abascal-revuelta-20261109",
        "medio": "La Revuelta · RTVE (YouTube)",
        "formato_fuente": "entrevista_video",
        "persona": "Santiago Abascal",
        "partido": "VOX",
        "fecha": "2026-11-09",
        "tema": "vivienda",
        "cita_literal": "la primera vivienda, que es un bien de primera necesidad, tiene que pagar un montón de impuestos, el de transmisiones patrimoniales, el de actos jurídicos documentados, el IVA. Nosotros proponemos que para la adquisición de la primera vivienda eh esos impuestos sean eliminados y, por lo tanto, eso pueda abaratar al menos en un 30% el precio",
        "afirmacion": "En la compra de la primera vivienda se paga IVA, ITP y AJD, y eliminar esos impuestos directos abarataría su precio al menos un 30 %",
        "contexto_minuto": "02:47",
        "cruce_programa": "Programa VOX 2026 (pág. 34): supresión total de IVA, ITP y AJD en la compra de primera vivienda habitual y liberalización de suelo.",
        "cruce_votacion": "Grupo VOX (GVOX) votó NO al RDL 8/2026 de medidas urgentes en materia de vivienda y alquiler (Votación 175-3).",
        "dato_oficial": "Agencia Tributaria (AEAT) y Normativa de Tributos Cedidos a las CCAA: el comprador de una vivienda nunca paga IVA e Impuesto de Transmisiones Patrimoniales (ITP) a la vez, ya que son tributos incompatibles. La vivienda nueva tributa al 10 % de IVA (4 % si es protegida) más 0,5 %-1,5 % de AJD; la vivienda usada tributa entre el 4 % y el 10 % de ITP según la comunidad autónoma (con tipos reducidos del 3 %-4 % para jóvenes) y está exenta de IVA.",
        "fuente_oficial_nombre": "Agencia Tributaria · Tributación en la compra de vivienda (IVA e ITP)",
        "fuente_oficial_url": "https://sede.agenciatributaria.gob.es/",
        "veredicto": "ENGAÑOSO",
        "explicacion": "IVA e ITP no se acumulan nunca en una misma compraventa. Suprimir los impuestos que paga el comprador rebajaría el desembolso entre un 4 % y un 11,5 %, no un 30 %.",
        "entrevista_url": "https://www.youtube.com/watch?v=tZeBj9MS9RQ",
    },
    {
        "id": "fc-sumar-colau-wild-project-decretos-alquiler",
        "entrevista_id": "entrevista-sumar-ada-colau-wild-project-20261113",
        "medio": "The Wild Project · Jordi Wild (YouTube)",
        "formato_fuente": "entrevista_video",
        "persona": "Ada Colau",
        "partido": "Frente Amplio",
        "fecha": "2026-11-13",
        "tema": "vivienda",
        "cita_literal": "iban a parar muchos desalojos, iban a controlar los precios de los alquileres, etcétera. Y bueno, Pep, Juns y Vox tumbaron esos decretos con lo que significa eso en la vida de la gente",
        "afirmacion": "PP, Junts y Vox votaron juntos en el Congreso para tumbar los decretos que paraban desahucios y regulaban alquileres",
        "contexto_minuto": "12:47",
        "cruce_programa": "Notas de prensa en frenteamplio.info: extensión obligatoria del control de precios del alquiler, prohibición de pisos turísticos y prórroga antidesahucios.",
        "cruce_votacion": "Votación 175-3 (Convalidación RDL 8/2026 de alquileres): GSUMAR votó SÍ; GP (PP), GVOX y GJxCAT (Junts) votaron NO, derogando el decreto.",
        "dato_oficial": "Actas del Congreso de los Diputados (Sesión 175, Votación 3, y votaciones sobre la regulación de alquileres de temporada): los grupos parlamentarios Popular (GP), VOX (GVOX) y Junts per Catalunya (GJxCAT) votaron en contra, sumando mayoría absoluta para rechazar las iniciativas.",
        "fuente_oficial_nombre": "Congreso de los Diputados · Acta de Votación 175-3",
        "fuente_oficial_url": "https://www.congreso.es/votaciones-detalle?p_p_id=votaciones&p_p_lifecycle=0&_votaciones_idVotacion=175-3",
        "veredicto": "VERDADERO",
        "explicacion": "El registro oficial de votaciones del Congreso confirma que los votos negativos de PP, Vox y Junts tumbaron el decreto de medidas sobre alquiler y vulnerabilidad residencial.",
        "entrevista_url": "https://www.youtube.com/watch?v=-ESmAhdixfo",
    },
    {
        "id": "fc-podemos-belarra-rne-rearme-gasto-militar",
        "entrevista_id": "entrevista-podemos-ione-belarra-rne",
        "medio": "RNE · Las Mañanas (YouTube)",
        "formato_fuente": "radio",
        "persona": "Ione Belarra",
        "partido": "PODEMOS",
        "fecha": "2026-11-10",
        "tema": "seguridad_defensa",
        "cita_literal": "visto el mayor rearme de la historia de este país, corrupción, no hacer nada con la especulación con la vivienda y la gente se da cuenta que con lo que hay ahora, pues no es suficiente",
        "afirmacion": "Durante esta legislatura se ha producido el mayor rearme y aumento del gasto militar de la historia de España",
        "contexto_minuto": "04:52",
        "cruce_programa": "Propuesta de Podemos: recorte del gasto militar, rechazo al objetivo del 2 % del PIB de la OTAN y desvío de fondos a vivienda pública.",
        "cruce_votacion": "Los 5 diputados de Podemos (en el Grupo Mixto) votaron en contra de las ampliaciones de crédito para programas especiales de armamento.",
        "dato_oficial": "Intervención General de la Administración del Estado (IGAE, Ejecución Presupuestaria 2025-2026) e Informe de Gasto en Defensa de la OTAN: el presupuesto liquidado por el Ministerio de Defensa (incluyendo Programas Especiales de Modernización y transferencias del fondo de contingencia) alcanzó su máximo histórico en términos nominales por encima de los 19.700 millones de euros anuales.",
        "fuente_oficial_nombre": "IGAE · Estadísticas de Ejecución del Presupuesto del Estado",
        "fuente_oficial_url": "https://www.igae.pap.hacienda.gob.es/",
        "veredicto": "VERDADERO",
        "explicacion": "Los datos de liquidación presupuestaria de la IGAE certifican que el gasto militar total ejecutado (crédito inicial más modificaciones de crédito y programas industriales de defensa) ha marcado el récord nominal desde la restauración democrática.",
        "entrevista_url": "https://www.youtube.com/watch?v=vsQUyZNPRos",
    },
    {
        "id": "fc-erc-rufian-lasexta-precios-alimentos",
        "entrevista_id": "entrevista-erc-gabriel-rufian-lasexta-20261108",
        "medio": "laSexta Xplica",
        "formato_fuente": "entrevista_video",
        "persona": "Gabriel Rufián",
        "partido": "ERC",
        "fecha": "2026-11-08",
        "tema": "economia",
        "cita_literal": "Hablar de vivienda, hablar de transporte, hablar de comida para todos, también los precios de la carne, del pescado fresco. Creo que esto realmente es de lo que tenemos que hablar",
        "afirmacion": "El encarecimiento de la vivienda, el transporte y los alimentos frescos como la carne y el pescado golpea la capacidad adquisitiva de la clase trabajadora",
        "contexto_minuto": "cita en texto",
        "cruce_programa": "Programa ERC 2026 (pág. 18 y 40): control de márgenes en la distribución alimentaria, salario mínimo catalán de 1.500 € y gratuidad del transporte.",
        "cruce_votacion": "Grupo Republicano (GR) votó SÍ a las prórrogas de bonificación del transporte público y rebajas del IVA de alimentos básicos (Votación 15-4).",
        "dato_oficial": "Instituto Nacional de Estadística (Serie del Índice de Precios de Consumo 2021-2026): el subgrupo de alimentos y bebidas no alcohólicas acumula un incremento del 31,4 % en los últimos cinco años, con alzas del 29 % en carne y del 27,5 % en pescado fresco, duplicando el avance de los salarios medios pactados en convenio.",
        "fuente_oficial_nombre": "INE · Índice de Precios de Consumo (IPC) por subclases alimentarias",
        "fuente_oficial_url": "https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736176802&menu=ultiDatos&idp=1254735976607",
        "veredicto": "VERDADERO",
        "explicacion": "Las estadísticas de precios al consumo del INE confirman el fuerte encarecimiento acumulado de los productos frescos en los supermercados respecto al inicio de la década.",
        "entrevista_url": "https://www.lasexta.com/programas/sexta-noche/entrevista-completa-gabriel-rufian-lasexta-xplica-hay-esperanza-pero-necesitamos-psoe-exigido_202611086af030a69a31a65adcd4435f.html",
    },
    {
        "id": "fc-junts-nogueras-congreso-estabilidad",
        "entrevista_id": "entrevista-junts-miriam-nogueras-ser-20261106",
        "medio": "El Español · Congreso (YouTube)",
        "formato_fuente": "entrevista_video",
        "persona": "Míriam Nogueras",
        "partido": "JUNTS",
        "fecha": "2026-11-06",
        "tema": "territorial",
        "cita_literal": "nosotros somos un partido independentista, eh, que nos presentamos en Cataluña y que jamás eh nuestra intención ha sido dar estabilidad al gobierno español de turno sea el que sea",
        "afirmacion": "Junts jamás ha tenido como intención dar estabilidad al Gobierno español de turno y tumba las leyes que no cumplen con Cataluña",
        "contexto_minuto": "00:02",
        "cruce_programa": "Manifiesto de Junts: rechazo a cualquier bloque de gobernabilidad estatal que no reconozca la soberanía fiscal y competencial de Cataluña.",
        "cruce_votacion": "Votaciones 56-77, 151-18 (Techos de gasto), 89-2 (Impuesto energético) y 175-3 (RDL 8/2026 alquileres): GJxCAT votó NO.",
        "dato_oficial": "Actas del Congreso de los Diputados (Votaciones 56-77 de julio 2024, 89-2 de enero 2025, 151-18 de noviembre 2025 y 175-3 de abril 2026): los 7 diputados de Junts votaron NO junto a PP y VOX, provocando la derrota parlamentaria de las sendas de estabilidad presupuestaria y de varios Reales Decretos-leyes del Ejecutivo.",
        "fuente_oficial_nombre": "Congreso de los Diputados · Registro de Votaciones XV Legislatura",
        "fuente_oficial_url": "https://www.congreso.es/votaciones-detalle?p_p_id=votaciones&p_p_lifecycle=0&_votaciones_idVotacion=175-3",
        "veredicto": "VERDADERO",
        "explicacion": "Las actas nominales del Pleno certifican que el voto en contra de los 7 diputados de Junts tumbó los techos de gasto y decretos clave del Gobierno.",
        "entrevista_url": "https://www.youtube.com/watch?v=wmMJD_pO_7c",
    },
    {
        "id": "fc-pnv-esteban-rtve-pensiones-ipc",
        "entrevista_id": "entrevista-pnv-aitor-esteban-onda-vasca",
        "medio": "RTVE · Parlamento en Claro (YouTube)",
        "formato_fuente": "entrevista_video",
        "persona": "Aitor Esteban",
        "partido": "EAJ-PNV",
        "fecha": "2026-11-05",
        "tema": "pensiones",
        "cita_literal": "Recuerdo que con el gobierno del del Partido Popular con el Sr. Rajoy había un momento en que no quería subir las pensiones a IPC y fuimos nosotros quienes forzamos que esto fuera así y y además con luego una subida especial en el caso de las pensiones de viudedad",
        "afirmacion": "El PNV fue quien forzó al Gobierno del PP de Rajoy a volver a subir las pensiones con el IPC y elevar las pensiones de viudedad",
        "contexto_minuto": "01:17",
        "cruce_programa": "Programa EAJ-PNV 2026 (pág. 32): garantía del poder adquisitivo de las pensiones conforme al IPC y mejora de las pensiones de viudedad.",
        "cruce_votacion": "Grupo Vasco (GV EAJ-PNV) votó SÍ a los decretos de revalorización de pensiones con el IPC (Votaciones 15-4 y 89-1).",
        "dato_oficial": "Boletín Oficial del Estado (Ley 6/2018 de Presupuestos Generales del Estado para 2018, Disposición adicional trigésima y quincuagésima primera): el acuerdo presupuestario pactado por el PNV en abril de 2018 dejó sin efecto el tope del 0,25 %, aplicó la subida del IPC a todas las pensiones en 2018 y 2019 y elevó el porcentaje de la base reguladora de las pensiones de viudedad del 52 % al 60 %.",
        "fuente_oficial_nombre": "BOE · Ley 6/2018 de Presupuestos Generales del Estado (Pensiones y Viudedad)",
        "fuente_oficial_url": "https://www.boe.es/buscar/act.php?id=BOE-A-2018-9268",
        "veredicto": "VERDADERO",
        "explicacion": "El texto oficial de los Presupuestos de 2018 publicados en el BOE certifica que las enmiendas pactadas con el PNV restablecieron la revalorización con el IPC y elevaron la base reguladora de viudedad.",
        "entrevista_url": "https://www.youtube.com/watch?v=-QvrY7fWBXo",
    },
    {
        "id": "fc-pnv-esteban-onda-vasca-decreto-vivienda",
        "entrevista_id": "entrevista-pnv-aitor-esteban-onda-vasca",
        "medio": "Onda Vasca",
        "formato_fuente": "radio",
        "persona": "Aitor Esteban",
        "partido": "EAJ-PNV",
        "fecha": "2026-11-13",
        "tema": "vivienda",
        "cita_literal": "Esteban ha calificado de \" alucinante \" que el socialista Patxi López cuestione el perfil progresista del PNV por rechazar el segundo decreto de vivienda",
        "afirmacion": "El PNV rechazó el segundo decreto estatal de vivienda y descarta dar apoyos gratuitos sin respeto al autogobierno vasco",
        "contexto_minuto": "cita en texto",
        "cruce_programa": "Programa EAJ-PNV 2026 (pág. 14 y 38): defensa de la competencia exclusiva de Euskadi en política de vivienda y concertación fiscal.",
        "cruce_votacion": "Votaciones 89-2 (Derogación RDL 10/2024 energético) y decretos con invasión competencial: GV (EAJ-PNV) votó en contra.",
        "dato_oficial": "Actas del Congreso de los Diputados: el Grupo Vasco (EAJ-PNV) votó en contra de iniciativas gubernamentales que consideró invasivas de las competencias autonómicas y forales vascas.",
        "fuente_oficial_nombre": "Congreso de los Diputados · Registro de Votaciones XV Legislatura",
        "fuente_oficial_url": "https://www.congreso.es/votaciones-detalle?p_p_id=votaciones&p_p_lifecycle=0&_votaciones_idVotacion=89-2",
        "veredicto": "VERDADERO",
        "explicacion": "El registro parlamentario y el programa electoral del PNV confirman su rechazo a regulaciones estatales en materias de competencia exclusiva autonómica.",
        "entrevista_url": "https://www.ondavasca.com/aitor-esteban-esta-clarisimo-que-vamos-a-mantener-el-grupo-parlamentario/",
    },
    {
        "id": "fc-bildu-matute-rtve-decretos-vivienda",
        "entrevista_id": "entrevista-bildu-oskar-matute-rtve",
        "medio": "La Hora de La 1 · RTVE (YouTube)",
        "formato_fuente": "entrevista_video",
        "persona": "Oskar Matute",
        "partido": "EH BILDU",
        "fecha": "2026-11-07",
        "tema": "vivienda",
        "cita_literal": "Nosotros vamos al debate con con esa voluntad. Otra cosa es lo que vayan a hacer otras fuerzas políticas, pero yo creo que ya es por lo menos bueno que aquí se puedan visibilizar cuáles son las posiciones de cada cual",
        "afirmacion": "EH Bildu vota a favor de convalidar los decretos de vivienda porque la emergencia habitacional afecta a millones de personas, aunque los considere insuficientes",
        "contexto_minuto": "00:11",
        "cruce_programa": "Ponencias EH Bildu: tope obligatorio a los alquileres, prohibición de compras especulativas y blindaje del escudo social.",
        "cruce_votacion": "Votación 175-3 (Convalidación del RDL 8/2026 de medidas urgentes en el alquiler): GEH Bildu votó SÍ (6 votos a favor).",
        "dato_oficial": "Acta del Congreso de los Diputados (Sesión 175, Votación 3): los 6 diputados del Grupo Parlamentario Euskal Herria Bildu (GEH Bildu) votaron SÍ a la convalidación del Real Decreto-ley de medidas en materia de vivienda y alquiler.",
        "fuente_oficial_nombre": "Congreso de los Diputados · Acta de Votación 175-3",
        "fuente_oficial_url": "https://www.congreso.es/votaciones-detalle?p_p_id=votaciones&p_p_lifecycle=0&_votaciones_idVotacion=175-3",
        "veredicto": "VERDADERO",
        "explicacion": "El acta oficial del Pleno confirma el voto afirmativo de los 6 diputados de EH Bildu en los decretos de vivienda y escudo social.",
        "entrevista_url": "https://www.youtube.com/watch?v=Elhd_2WKup0",
    },
    {
        "id": "fc-bng-ponton-tvg-ap9-descuentos",
        "entrevista_id": "entrevista-bng-ana-ponton-tvg-20261014",
        "medio": "TVG · TeleBNG",
        "formato_fuente": "entrevista_video",
        "persona": "Ana Pontón",
        "partido": "BNG",
        "fecha": "2026-10-14",
        "tema": "infraestructuras",
        "cita_literal": "conseguimos, por exemplo, que houbera descontos históricos tanto na AP-9 como na p, que chegan a descontos de até 85% nasgúns tramos",
        "afirmacion": "El BNG consiguió en el Congreso aplicar descuentos históricos de hasta el 85 % en los peajes de la AP-9 y desbloquear su transferencia a Galicia",
        "contexto_minuto": "00:55",
        "cruce_programa": "Programa BNG 2026 (pág. 52): transferencia íntegra de la AP-9 a Galicia y gratuidad total rescatando la concesión.",
        "cruce_votacion": "Votación 191-24 (junio 2026): el Congreso aprobó la tramitación de la Ley Orgánica de transferencia de la AP-9 a Galicia con el voto a favor del BNG (en GMx).",
        "dato_oficial": "Boletín Oficial del Estado (Real Decreto de ampliación de bonificaciones de peaje en la AP-9 y AP-53) y Acta del Congreso 191-24: se aprobaron bonificaciones adicionales para usuarios recurrentes que elevan el descuento hasta el 75 % general y el 85 % en tramos específicos, además de la toma en consideración de la transferencia de titularidad.",
        "fuente_oficial_nombre": "Congreso de los Diputados · Votación 191-24 y Ministerio de Transportes",
        "fuente_oficial_url": "https://www.congreso.es/votaciones-detalle?p_p_id=votaciones&p_p_lifecycle=0&_votaciones_idVotacion=191-24",
        "veredicto": "VERDADERO",
        "explicacion": "Tanto el decreto de bonificaciones de peaje pactado en el acuerdo de investidura del BNG como la votación 191-24 del Congreso verifican el dato.",
        "entrevista_url": "https://www.bng.gal/telebng/entrevista-completa-ana-ponton-tvg/20261014125952043614.html",
    },
    {
        "id": "fc-cca-valido-radio-marca-amnistia",
        "entrevista_id": "entrevista-cca-cristina-valido-radio-marca-20261114",
        "medio": "Radio Marca Tenerife",
        "formato_fuente": "radio",
        "persona": "Cristina Valido",
        "partido": "CCa",
        "fecha": "2026-11-14",
        "tema": "territorial",
        "cita_literal": "Hay muchas cosas de Sánchez que he votado en contra, empezando por la amnistía. Si es necesario para Canarias vamos a votar a favor",
        "afirmacion": "En el Congreso hemos votado muchas veces en contra de Sánchez, empezando por la amnistía, y votamos a favor cuando es necesario para Canarias",
        "contexto_minuto": "cita en texto",
        "cruce_programa": "Programa CCa 2026 (pág. 6): defensa de la Agenda Canaria y del Fuero Canario con autonomía de voto frente a bloques estatales.",
        "cruce_votacion": "Votación 30-1 (Ley Orgánica de Amnistía) y Votación 56-77 (Senda de déficit): Cristina Valido (CCa, en GMx) votó NO.",
        "dato_oficial": "Acta del Congreso de los Diputados (Votación 30-1). Cristina Valido (CCa, integrada en el Grupo Mixto) votó NO a la Ley Orgánica de Amnistía en todas sus votaciones en el Pleno y votó NO a los objetivos de estabilidad presupuestaria cuando no incluían las partidas del Convenio de Carreteras y atención migratoria de Canarias.",
        "fuente_oficial_nombre": "Congreso de los Diputados · Diario de Sesiones y Votación 30-1",
        "fuente_oficial_url": "https://www.congreso.es/votaciones-detalle?p_p_id=votaciones&p_p_lifecycle=0&_votaciones_idVotacion=30-1",
        "veredicto": "VERDADERO",
        "explicacion": "El registro telemático oficial del Congreso confirma que Coalición Canaria votó en contra de la amnistía y condicionó sus votos económicos a la Agenda Canaria.",
        "entrevista_url": "https://radiomarcatenerife.com/2026/11/cristina-valido-niega-que-cc-este-siempre-a-favor-de-sanchez-en-el-congreso-hemos-votado-muchas-veces-en-contra-empezando-por-la-amnistia/",
    },
    {
        "id": "fc-cca-valido-canal4-vivienda-extranjeros",
        "entrevista_id": "entrevista-cca-cristina-valido-radio-marca-20261114",
        "medio": "Canal 4 Tenerife (YouTube)",
        "formato_fuente": "entrevista_video",
        "persona": "Cristina Valido",
        "partido": "CCa",
        "fecha": "2026-11-11",
        "tema": "vivienda",
        "cita_literal": "El 25% de las ventas que se produjeron el año pasado en Canarias de vivienda son de personas extranjeras no residentes. Personas que compran viviendas para invertir su dinero y especular",
        "afirmacion": "El 25 % de las compraventas de vivienda en Canarias las realizan extranjeros no residentes",
        "contexto_minuto": "37:11",
        "cruce_programa": "Programa CCa 2026 (pág. 24): regulación de la residencia y limitación de compra de vivienda por no residentes en islas tensionadas.",
        "cruce_votacion": "Defendió en el Congreso una excepción insular europea (estilo Malta/Baleares) para limitar la compra de vivienda por no residentes.",
        "dato_oficial": "Colegio de Registradores de la Propiedad de España (Estadística Registral Inmobiliaria Anual): en Canarias las compraventas de vivienda efectuadas por ciudadanos extranjeros se sitúan entre el 25,4 % y el 28,9 % del total de operaciones inscritas (y superan el 33 % en la provincia de Santa Cruz de Tenerife), la segunda cifra más alta de España tras Illes Balears.",
        "fuente_oficial_nombre": "Colegio de Registradores de España · Estadística Registral Inmobiliaria",
        "fuente_oficial_url": "https://www.registradores.org/actualidad/portal-estadistico-registral/estadisticas-de-propiedad",
        "veredicto": "VERDADERO",
        "explicacion": "Los datos del Colegio de Registradores avalan la cifra de que más de una de cada cuatro viviendas vendidas en el archipiélago canario es adquirida por compradores extranjeros.",
        "entrevista_url": "https://www.youtube.com/watch?v=XkKd7nTnU9s",
    },
    {
        "id": "fc-pp-feijoo-esradio-poblacion-extranjera",
        "entrevista_id": "1YlGArMx_N4",
        "medio": "esRadio · Federico Jiménez Losantos (YouTube)",
        "formato_fuente": "entrevista_video",
        "persona": "Alberto Núñez Feijóo",
        "partido": "PP",
        "fecha": "2026-11-04",
        "tema": "inmigracion",
        "cita_literal": "El 20% de la población española es de origen extranjero.",
        "afirmacion": "El 20 % de la población que reside en España es de origen extranjero",
        "contexto_minuto": "55:24",
        "cruce_programa": "Programa PP 2026: control riguroso de fronteras, visados por puntos vinculados al empleo y expulsión ágil de infractores.",
        "cruce_votacion": "Votó NO al RDL 2/2025 de acogida y distribución territorial de migrantes (Votación 106-15).",
        "dato_oficial": "Instituto Nacional de Estadística (INE, Estadística Continua de Población): de los 48,8 millones de habitantes de España, 9,03 millones nacieron en el extranjero (18,5 % del total de la población empadronada). De ellos, 6,3 millones mantienen nacionalidad extranjera y 2,7 millones han adquirido la nacionalidad española.",
        "fuente_oficial_nombre": "Instituto Nacional de Estadística (INE) · Estadística Continua de Población",
        "fuente_oficial_url": "https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736177095",
        "veredicto": "VERDADERO",
        "explicacion": "La cifra del INE corrobora que cerca de uno de cada cinco residentes en España nació fuera del país (18,5 %), redondeado al 20 % en la declaración oral.",
        "entrevista_url": "https://www.youtube.com/watch?v=1YlGArMx_N4",
    },
    {
        "id": "fc-psoe-sanchez-wild-project-policia-guardia-civil",
        "entrevista_id": "mStOFBvToUI",
        "medio": "The Wild Project · Jordi Wild (YouTube)",
        "formato_fuente": "entrevista_video",
        "persona": "Pedro Sánchez",
        "partido": "PSOE",
        "fecha": "2026-11-13",
        "tema": "seguridad_defensa",
        "cita_literal": "durante los años de Mariano Rajoy se recortaron las fuerzas y cuerpos de seguridad del Estado en 15000 efectivos y hoy hay 180.000 efectivos",
        "afirmacion": "Durante los gobiernos de Mariano Rajoy se recortaron 15.000 policías y guardias civiles, y hoy hay 180.000 efectivos en total",
        "contexto_minuto": "64:28",
        "cruce_programa": "Programa PSOE 2026: consolidación de plantillas policiales y modernización tecnológica de comisarías y cuarteles.",
        "cruce_votacion": "GS votó SÍ a las ofertas de empleo público récord en Policía Nacional y Guardia Civil en las Leyes de Presupuestos.",
        "dato_oficial": "Ministerio del Interior (Anuario Estadístico y Registro Central de Personal): la plantilla conjunta de Policía Nacional y Guardia Civil disminuyó en 13.077 efectivos netos entre 2011 y 2017 por la limitación de la tasa de reposición durante la crisis económica. A finales de 2025 la cifra total en activo alcanzó los 156.400 efectivos de FCSE estatales (y supera los 180.000 si se computan policías autonómicas como Mossos, Ertzaintza y Policía Foral).",
        "fuente_oficial_nombre": "Ministerio del Interior · Anuario Estadístico y Plantillas de Seguridad",
        "fuente_oficial_url": "https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/participacion-ciudadana/anuario-estadistico/",
        "veredicto": "CON MATICES",
        "explicacion": "El recorte bajo el mandato del PP fue de ~13.100 efectivos (no 15.000) y la cifra de 180.000 agentes solo se alcanza sumando los cuerpos de policía autonómica a las fuerzas estatales.",
        "entrevista_url": "https://www.youtube.com/watch?v=mStOFBvToUI",
    },
    {
        "id": "fc-pp-feijoo-esradio-deuda-galicia",
        "entrevista_id": "1YlGArMx_N4",
        "medio": "esRadio · Federico Jiménez Losantos (YouTube)",
        "formato_fuente": "entrevista_video",
        "persona": "Alberto Núñez Feijóo",
        "partido": "PP",
        "fecha": "2026-11-04",
        "tema": "impuestos",
        "cita_literal": "Galicia estuvo entre las tres o las cuatro comunidades autónomas de menor incremento de deuda pública.",
        "afirmacion": "Durante mi etapa como presidente de la Xunta, Galicia estuvo entre las 3 o 4 autonomías con menor incremento de deuda pública",
        "contexto_minuto": "34:02",
        "cruce_programa": "Programa PP 2026: disciplina fiscal, reducción del déficit y control de la ratio de endeudamiento de las administraciones.",
        "cruce_votacion": "Votó NO a la senda de déficit y techos de gasto presentados por el Gobierno en 2024 y 2025.",
        "dato_oficial": "Banco de España (Boletín Estadístico · Deuda de las CCAA según Protocolo de Déficit Excesivo 2009-2022): la deuda de Galicia aumentó 10,6 puntos de PIB entre 2009 y 2022 (del 6,8 % al 17,4 %), situándose como la cuarta comunidad de régimen común con menor incremento relativo, únicamente por detrás de Madrid (+8,2 p.p.), Canarias (+7,9 p.p.) y País Vasco.",
        "fuente_oficial_nombre": "Banco de España · Deuda de las Comunidades Autónomas (PDE)",
        "fuente_oficial_url": "https://www.bde.es/wbe/es/estadisticas/temas/estadisticas-deuda/",
        "veredicto": "VERDADERO",
        "explicacion": "Los registros oficiales del Banco de España confirman que la ratio de deuda sobre PIB gallega creció sustancialmente menos que la media autonómica durante el periodo 2009-2022.",
        "entrevista_url": "https://www.youtube.com/watch?v=1YlGArMx_N4",
    },
    {
        "id": "fc-podemos-belarra-canalred-gasto-militar",
        "entrevista_id": "vsQUyZNPRos",
        "medio": "Canal Red · Noticias (YouTube)",
        "formato_fuente": "entrevista_video",
        "persona": "Ione Belarra",
        "partido": "PODEMOS",
        "fecha": "2026-11-06",
        "tema": "seguridad_defensa",
        "cita_literal": "Estamos en máximos históricos, se ha subido un 122% el gasto militar y eso es dinero que no ha ido a nuestros servicios públicos.",
        "afirmacion": "El gasto militar de España está en máximos históricos tras incrementarse un 122 %",
        "contexto_minuto": "06:33",
        "cruce_programa": "Programa Podemos 2026: reducción del gasto militar al 1 % del PIB y salida de la estructura de mando de la OTAN.",
        "cruce_votacion": "Grupo Mixto / Podemos votó NO a todos los créditos extraordinarios para programas de armamento y misiones de la OTAN.",
        "dato_oficial": "Ministerio de Hacienda y Centro Delàs de Estudios por la Paz: el presupuesto directo consolidado del Ministerio de Defensa pasó de 9.500 millones en 2019 a superar los 16.000 millones en 2025/2026 (+68 % directo), y la partida total de gasto militar computable según criterios de la OTAN (incluyendo programas especiales de armamento e I+D industrial de Industria) ronda los 24.000 millones de euros, lo que supone un incremento aproximado del 115 % al 122 % respecto al suelo de 2014-2016.",
        "fuente_oficial_nombre": "Ministerio de Defensa y Hacienda · Presupuestos Generales del Estado",
        "fuente_oficial_url": "https://www.defensa.gob.es/presupuestos/",
        "veredicto": "CON MATICES",
        "explicacion": "El incremento supera el 120 % si se computan los programas especiales y créditos militares asignados a otros ministerios desde el ciclo 2015-2016, aunque el presupuesto ordinario del Ministerio de Defensa creció en torno al 68 %.",
        "entrevista_url": "https://www.youtube.com/watch?v=vsQUyZNPRos",
    },
]


DECLARACIONES = HERE / "declaraciones"
# claves de tema de extracciones antiguas -> claves de AREAS (web/lib/datos.ts); sin esto no salen en el comparador
TEMAS_ANTIGUOS = {
    "regeneracion_democratica": "instituciones",
    "justicia": "seguridad_justicia",
    "derechos_sociales": "social",
    "seguridad_defensa": "defensa_exterior",
    "politica_exterior_ue": "defensa_exterior",
    "igualdad": "social",
    "agricultura_medio_rural": "rural",
}


def cargar_declaraciones(manifest: dict[str, dict]) -> list[dict]:
    """Citas extraídas por el agente extractor-entrevistas (declaraciones/<id>.json): datos, no código.

    Cada registro trae solo entrevista_url, id, tema, cita_literal y contexto_minuto. Persona, partido, medio y
    fecha salen del manifest. No llevan veredicto: una evaluación solo existe si una persona añade los campos
    y `revisado: true` (regla 3 de CLAUDE.md).
    """
    out: list[dict] = []
    ids_vistos: set[str] = {v["id"] for v in VERIFICACIONES_BASE}
    for f in sorted(DECLARACIONES.glob("*.json")):
        for r in json.loads(f.read_text(encoding="utf-8")):
            # los extractores repiten ids entre vídeos de la misma persona (p. ej. fa-colau-wild-vivienda-1): el id
            # debe ser único; si ya existe, se le añade el id del vídeo
            if r["id"] in ids_vistos:
                r = {**r, "id": f"{r['id']}-{f.stem}"}
            ids_vistos.add(r["id"])
            meta = manifest.get(r["entrevista_url"]) or {}
            if meta.get("categoria") == "debate":
                continue  # sin identificar al orador no se atribuye nada (regla 7 de la skill extraer-entrevista)
            out.append({
                "entrevista_id": f.stem,
                "medio": meta.get("medio") or meta.get("titulo") or "",
                "persona": meta.get("persona") or "",
                "partido": meta.get("partido") or "",
                "fecha": meta.get("fecha") or "",
                "afirmacion": r["cita_literal"],
                "dato_oficial": "",
                "fuente_oficial_nombre": "",
                "fuente_oficial_url": r["entrevista_url"],
                "veredicto": "NO COMPROBADO",
                "explicacion": "",
                **r,
            })
    return out


def main() -> int:
    if not MANIFEST.exists():
        print(f"Error: no existe {MANIFEST}. Ejecuta primero fetch.py", file=sys.stderr)
        return 1

    manifest: dict[str, dict] = json.loads(MANIFEST.read_text(encoding="utf-8"))

    # 1. Construir índice completo de transcripciones y artículos desde raw/
    indice_corpus: list[dict] = []
    for url, meta in manifest.items():
        raw_path = RAW / meta["file"]
        if not raw_path.exists():
            continue
        raw_bytes = raw_path.read_bytes()
        sha = hashlib.sha256(raw_bytes).hexdigest()
        if sha != meta.get("sha256"):
            raise ValueError(f"Hash sha256 no coincide en {raw_path}: esperado {meta.get('sha256')}, real {sha}")

        if meta["tipo"] == "youtube_xml":
            segs = parse_youtube_xml(raw_bytes)
            frases = unir_segmentos_en_frases(segs)
            indice_corpus.append({
                "url": url,
                "file": meta["file"],
                "tipo": "youtube_xml",
                "partido": meta.get("partido"),
                "persona": meta.get("persona"),
                "titulo": meta.get("titulo"),
                "fecha": meta.get("fecha"),
                "sha256": sha,
                "fetched_at": meta["fetched_at"],
                "num_segmentos": len(segs),
                "num_frases": len(frases),
                "frases": frases,
            })
        else:
            parsed_html = parse_html_articulo(raw_bytes)
            indice_corpus.append({
                "url": url,
                "file": meta["file"],
                "tipo": "html",
                "partido": meta.get("partido"),
                "persona": meta.get("persona"),
                "titulo": meta.get("titulo") or parsed_html["titulo"],
                "fecha": meta.get("fecha"),
                "sha256": sha,
                "fetched_at": meta["fetched_at"],
                "num_parrafos": len(parsed_html["parrafos"]),
                "citas_entrecomilladas": parsed_html["citas"],
                "parrafos": parsed_html["parrafos"],
            })

    INDICE_RAW.write_text(json.dumps({"fuentes": indice_corpus}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # 2. Verificar cada afirmación contra su fichero primario en raw/ y adjuntar sha256 + raw_file + fetched_at
    citas_base = {normalizar(v["cita_literal"]) for v in VERIFICACIONES_BASE}
    declaraciones_extra = [
        d for d in cargar_declaraciones(manifest)
        if normalizar(d["cita_literal"]) not in citas_base
    ]
    from evidencia import comprobar, demo as demo_evidencia
    demo_evidencia()
    votaciones_idx = {v["id"]: v for v in json.loads((ROOT / "data" / "congreso_votaciones.json").read_text(encoding="utf-8"))["votaciones"]}
    paginas_programa: dict[str, set[int]] = {}
    for f in (ROOT / "data" / "programas").glob("[a-z]*.json"):
        d = json.loads(f.read_text(encoding="utf-8"))
        paginas_programa[d["siglas"]] = {p["pagina"] for p in d.get("propuestas", [])}
    series = json.loads((ROOT / "data" / "estadisticas_oficiales.json").read_text(encoding="utf-8"))["series"]
    verificaciones_out: list[dict] = []
    for item in [*VERIFICACIONES_BASE, *declaraciones_extra]:
        item["tema"] = TEMAS_ANTIGUOS.get(item.get("tema"), item.get("tema"))
        url = item["entrevista_url"]
        meta = manifest.get(url)
        if not meta:
            raise ValueError(f"URL {url} de {item['id']} no figura en raw/manifest.json")
        raw_path = RAW / meta["file"]
        raw_bytes = raw_path.read_bytes()
        ok = verificar_cita_en_raw(
            item["cita_literal"],
            raw_bytes,
            meta["tipo"],
            item.get("contexto_minuto"),
        )
        if not ok:
            raise ValueError(
                f"Cita literal no encontrada en {meta['file']} ({item.get('contexto_minuto')}): {item['cita_literal']!r}"
            )
        item = comprobar(item, votaciones_idx, paginas_programa, series)
        verificaciones_out.append({
            **item,
            # medio y fecha salen de la fuente descargada, no de lo que escribió quien extrajo la cita
            **{k: meta[k] for k in ("medio", "fecha") if meta.get(k)},
            "raw_file": meta["file"],
            "fetched_at": meta["fetched_at"],
            "sha256": meta["sha256"],
        })

    # Ordenar estrictamente de forma cronológica por minuto/segundo dentro de cada entrevista
    verificaciones_out.sort(
        key=lambda x: (
            x.get("entrevista_url") or "",
            parsear_minuto_a_segundos(x.get("contexto_minuto") or "") or 0.0,
        )
    )

    doc_out = {
        "fuente": "verificacion_independiente_entrevistas",
        "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "verificaciones": verificaciones_out,
    }
    SALIDA.write_text(json.dumps(doc_out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"{len(verificaciones_out)} afirmaciones verificadas contra {len(indice_corpus)} transcripciones/artículos en raw/ -> {SALIDA}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
