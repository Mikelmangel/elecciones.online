"""Descarga feeds y transcripciones/artículos originales a pipeline/fuentes/entrevistas/raw/.

1. Consulta los feeds Atom de YouTube y RSS de prensa/blogs para descubrir nuevas entrevistas.
2. Para cada entrada de data/entrevistas.json (debates y entrevistas):
   - Si es un vídeo de YouTube, extrae la pista oficial de subtítulos con marcas de tiempo (XML
     timedtext con <text start="..." dur="...">) mediante la API Innertube y la guarda en
     raw/<video_id>.xml con su sha256.
   - Si es un artículo de prensa, radio o blog de partido, descarga el HTML original en
     raw/<slug>.html con pausa >= 2 s por dominio y registra su sha256 en raw/manifest.json.
   - Idempotente: si la URL ya figura en raw/manifest.json y el fichero existe con el mismo sha256,
     no repite la descarga.
"""
import hashlib
import json
import re
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qs, urlparse

try:
    from curl_cffi import requests as cffi_requests
except ImportError:
    cffi_requests = None

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw"
MANIFEST = RAW / "manifest.json"
ROOT = HERE.parents[2]
OUT = ROOT / "data" / "entrevistas.json"
PARTIDOS_FILE = ROOT / "data" / "partidos.json"

# Canales públicos de YouTube monitorizados automáticamente (channel_id -> etiqueta de medio)
CANALES_YOUTUBE: dict[str, str] = {
    "UCBYyJBCtCvgqA4NwtoPMwpQ": "The Wild Project · Jordi Wild (YouTube)",
    "UCB-EBFwrvXDYSi32Wyzf-IQ": "La Revuelta · RTVE (YouTube)",
    "UC7QZIf0dta-XPXsp9Hv4dTw": "RTVE Noticias (YouTube)",
    "UCCJs5mITIqxqJGeFjt9N1Mg": "laSexta (YouTube)",
    "UC_Oni82GyYcabEr3rd-eJkg": "Antena 3 Noticias (YouTube)",
}

# Feeds RSS de blogs oficiales de partidos y agencias/medios públicos (sin bloqueo anti-bot)
FEEDS_RSS_BLOGS_Y_MEDIOS: list[tuple[str, str, str]] = [
        ("https://coalicioncanaria.org/feed/", "Blog Oficial Coalición Canaria", "prensa"),
    ("https://movimientosumar.es/feed/", "Movimiento Sumar", "prensa"),
]

# Nombres de líderes / candidatos clave para detectar entrevistas aunque el título no lleve las siglas
CANDIDATOS_CLAVE: dict[str, tuple[str, str]] = {
    "pedro sánchez": ("PSOE", "Pedro Sánchez"),
    "pedro sanchez": ("PSOE", "Pedro Sánchez"),
    "carlos cuerpo": ("PSOE", "Carlos Cuerpo"),
    "feijóo": ("PP", "Alberto Núñez Feijóo"),
    "feijoo": ("PP", "Alberto Núñez Feijóo"),
    "abascal": ("VOX", "Santiago Abascal"),
    "yolanda díaz": ("Frente Amplio", "Yolanda Díaz"),
    "ada colau": ("Frente Amplio", "Ada Colau"),
    "ione belarra": ("PODEMOS", "Ione Belarra"),
    "irene montero": ("PODEMOS", "Irene Montero"),
    "rufián": ("ERC", "Gabriel Rufián"),
    "rufian": ("ERC", "Gabriel Rufián"),
    "míriam nogueras": ("JxCat", "Míriam Nogueras"),
    "miriam nogueras": ("JxCat", "Míriam Nogueras"),
    "oskar matute": ("EH BILDU", "Oskar Matute"),
    "aitor esteban": ("EAJ-PNV", "Aitor Esteban"),
    "néstor rego": ("BNG", "Néstor Rego"),
    "ana pontón": ("BNG", "Ana Pontón"),
    "cristina valido": ("CCa", "Cristina Valido"),
    "alvise": ("SALF", "Luis Pérez (Alvise)"),
}

ATOM_NS = {"a": "http://www.w3.org/2005/Atom"}
INNERTUBE_PLAYER_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false"
IOS_CLIENT_CONTEXT = {
    "client": {
        "clientName": "IOS",
        "clientVersion": "20.03.02",
        "deviceMake": "Apple",
        "deviceModel": "iPhone16,2",
        "osName": "iPhone",
        "osVersion": "18.2.1.22C161",
        "hl": "es",
        "gl": "ES",
    }
}


def parse_atom_feed(xml_bytes: bytes, medio: str) -> list[dict]:
    root = ET.fromstring(xml_bytes)
    items = []
    for entry in root.findall("a:entry", ATOM_NS):
        title = (entry.findtext("a:title", default="", namespaces=ATOM_NS) or "").strip()
        published = (entry.findtext("a:published", default="", namespaces=ATOM_NS) or "")[:10]
        link_el = entry.find("a:link[@rel='alternate']", ATOM_NS)
        href = link_el.attrib.get("href", "").strip() if link_el is not None else ""
        if title and href:
            items.append({"titulo": title, "fecha": published or None, "fuente_url": href, "medio": medio})
    return items


def extraer_video_id(url: str) -> str | None:
    parsed = urlparse(url)
    if "youtube.com" in parsed.netloc and parsed.path == "/watch":
        v = parse_qs(parsed.query).get("v", [None])[0]
        return v
    if "youtu.be" in parsed.netloc:
        return parsed.path.lstrip("/") or None
    return None


def slug_de_url(url: str) -> str:
    parsed = urlparse(url)
    host = re.sub(r"^www\.", "", parsed.netloc)
    path = re.sub(r"[^a-zA-Z0-9_-]+", "-", parsed.path.strip("/")).strip("-")
    slug = f"{host}-{path}" if path else host
    return slug[:90]


def descargar_subtitulos_youtube(video_id: str, session=None) -> tuple[bytes, str]:
    """Obtiene el XML timedtext oficial de YouTube para video_id. Devuelve (xml_bytes, lang_code)."""
    payload = {"context": IOS_CLIENT_CONTEXT, "videoId": video_id}
    if session is not None:
        resp = session.post(INNERTUBE_PLAYER_URL, json=payload, timeout=15)
        data = resp.json()
    else:
        req = urllib.request.Request(
            INNERTUBE_PLAYER_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "com.google.ios.youtube/20.03.02"},
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode("utf-8"))

    tracks = (
        data.get("captions", {})
        .get("playerCaptionsTracklistRenderer", {})
        .get("captionTracks", [])
    )
    if not tracks:
        raise ValueError(f"El vídeo {video_id} no expone pistas de subtítulos públicas")

    # Priorizar español ('es'), luego lenguas cooficiales ('ca', 'gl', 'eu'), luego la primera pista
    prioridad = {"es": 0, "ca": 1, "gl": 2, "eu": 3}
    tracks_ord = sorted(
        tracks,
        key=lambda t: (
            prioridad.get(t.get("languageCode", "").split("-")[0], 99),
            0 if t.get("kind") != "asr" else 1,
        ),
    )
    elegida = tracks_ord[0]
    base_url = elegida["baseUrl"]
    lang = elegida.get("languageCode", "es")

    if session is not None:
        xml_bytes = session.get(base_url, timeout=15).content
    else:
        with urllib.request.urlopen(base_url, timeout=15) as r:
            xml_bytes = r.read()

    # Validar XML bien formado
    root = ET.fromstring(xml_bytes)
    if root.tag not in ("transcript", "timedtext"):
        raise ValueError(f"Raíz XML inesperada {root.tag!r} en subtítulos de {video_id}")
    return xml_bytes, lang


def descargar_html(url: str, session=None) -> bytes:
    """Descarga el HTML de una noticia o entrevista en prensa/radio/blog."""
    if session is not None:
        r = session.get(url, timeout=15)
        if r.status_code >= 400:
            raise ValueError(f"HTTP {r.status_code} al descargar {url}")
        body = r.content
    else:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; elecciones.online/1.0)"})
        with urllib.request.urlopen(req, timeout=15) as r:
            body = r.read()
    if len(body) < 200:
        raise ValueError(f"Respuesta demasiado corta ({len(body)} bytes) en {url}")
    return body


def sincronizar_raw(actual: dict) -> dict:
    """Descarga a raw/ todas las fuentes de data/entrevistas.json de forma idempotente."""
    RAW.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, dict] = {}
    if MANIFEST.exists():
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    session = cffi_requests.Session(impersonate="chrome") if cffi_requests else None
    ultimo_dominio: dict[str, float] = {}

    todas_entradas = [
        {**d, "_categoria": "debate"} for d in actual.get("debates", [])
    ] + [
        {**e, "_categoria": "entrevista"} for e in actual.get("entrevistas", [])
    ]

    descargados = 0
    reutilizados = 0

    for item in todas_entradas:
        url = item["fuente_url"]
        prev = manifest.get(url)
        if prev:
            raw_path = RAW / prev["file"]
            if raw_path.exists():
                actual_sha = hashlib.sha256(raw_path.read_bytes()).hexdigest()
                if actual_sha == prev.get("sha256"):
                    reutilizados += 1
                    continue

        dominio = urlparse(url).netloc
        ahora = time.monotonic()
        if dominio in ultimo_dominio and (ahora - ultimo_dominio[dominio]) < 2.0:
            time.sleep(2.0 - (ahora - ultimo_dominio[dominio]))

        vid = extraer_video_id(url)
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        try:
            if vid:
                body, lang = descargar_subtitulos_youtube(vid, session=session)
                fname = f"{vid}.xml"
                tipo = "youtube_xml"
            else:
                body = descargar_html(url, session=session)
                html_str = body.decode("utf-8", errors="ignore")
                parrafos = [p for p in re.findall(r"<p[^>]*>(.*?)</p>", html_str, re.S) if len(re.sub(r"<[^>]+>", "", p).strip()) > 80]
                embeds = re.findall(r"youtube\.com/embed/([a-zA-Z0-9_-]{11})", html_str)
                if len(parrafos) < 4 and embeds:
                    # La página del partido/medio es un contenedor de vídeo de YouTube: descargamos su transcripción XML
                    body, lang = descargar_subtitulos_youtube(embeds[0], session=session)
                    fname = f"{embeds[0]}.xml"
                    tipo = "youtube_xml"
                else:
                    fname = f"{slug_de_url(url)}.html"
                    tipo = "html"
                    lang = "es"
        except Exception as exc:
            print(f"Aviso: no se pudo descargar raw de {url} ({exc})")
            continue
        finally:
            ultimo_dominio[dominio] = time.monotonic()

        raw_path = RAW / fname
        raw_path.write_bytes(body)
        sha = hashlib.sha256(body).hexdigest()
        manifest[url] = {
            "url": url,
            "file": fname,
            "tipo": tipo,
            "lang": lang,
            "categoria": item["_categoria"],
            "partido": item.get("partido"),
            "persona": item.get("persona"),
            "titulo": item.get("titulo"),
            "medio": item.get("medio"),
            "fecha": item.get("fecha"),
            "fetched_at": now_iso,
            "sha256": sha,
        }
        descargados += 1

    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Raw sincronizado: {descargados} descargados, {reutilizados} en caché (total {len(manifest)} en manifest).")
    return manifest


def main() -> None:
    actual = json.loads(OUT.read_text(encoding="utf-8"))
    vistos = {e["fuente_url"] for e in actual["entrevistas"]} | {d["fuente_url"] for d in actual["debates"]}
    partidos = json.loads(PARTIDOS_FILE.read_text(encoding="utf-8"))["partidos"]

    nuevos = 0
    for cid, medio in CANALES_YOUTUBE.items():
        url = f"https://www.youtube.com/feeds/videos.xml?channel_id={cid}"
        try:
            with urllib.request.urlopen(url, timeout=10) as r:
                xml_bytes = r.read()
        except Exception as exc:
            print(f"Aviso: no se pudo leer {medio} ({exc}); se mantienen los datos existentes.")
            continue

        for item in parse_atom_feed(xml_bytes, medio):
            if item["fuente_url"] in vistos:
                continue
            tl = item["titulo"].lower()
            partido_key = None
            persona_nom = None
            for kw, (p_key, per_nom) in CANDIDATOS_CLAVE.items():
                if kw in tl:
                    partido_key, persona_nom = p_key, per_nom
                    break
            if not partido_key:
                match = next(
                    (
                        p
                        for p in partidos
                        if re.search(rf"\b{re.escape(p['siglas'].lower())}\b", tl)
                        or re.search(rf"\b{re.escape(p['nombre'].lower())}\b", tl)
                    ),
                    None,
                )
                if match:
                    partido_key = match["entrevistaKey"]
                    persona_nom = match["siglas"]
            if not partido_key:
                continue
            actual["entrevistas"].append({
                "partido": partido_key,
                "persona": persona_nom,
                "titulo": item["titulo"],
                "medio": item["medio"],
                "formato": "youtube",
                "fecha": item["fecha"],
                "fuente_url": item["fuente_url"],
            })
            vistos.add(item["fuente_url"])
            nuevos += 1

    if nuevos:
        actual["fetched_at"] = datetime.now(timezone.utc).isoformat()
        OUT.write_text(json.dumps(actual, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Entrevistas en índice: {nuevos} nuevas (total {len(actual['entrevistas'])}).")

    sincronizar_raw(actual)


if __name__ == "__main__":
    main()
