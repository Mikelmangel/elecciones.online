"""raw/<id>.xml -> data/actualidad.json: titular + enlace + fecha de cada fuente. Sin texto ajeno ni valoración.

Canales propios de un partido: entra todo. Medios e instituciones: solo titulares con palabra electoral o
alias de un partido. Se fusiona con lo ya publicado (los feeds solo traen los últimos 10-20) y caduca a los 30 días.
"""
import hashlib
import html
import json
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw"
SALIDA = HERE.parents[2] / "data" / "actualidad.json"
ATOM = "{http://www.w3.org/2005/Atom}"
DIAS = 30
MAX_TITULO = 200


def _fecha(s: str) -> str | None:
    s = (s or "").strip()
    if not s:
        return None
    try:
        d = datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        try:
            d = parsedate_to_datetime(s)
        except (TypeError, ValueError):
            return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _limpio(s: str) -> str:
    s = " ".join(html.unescape(re.sub(r"<[^>]+>", " ", s or "")).split())
    return s if len(s) <= MAX_TITULO else s[: MAX_TITULO - 1].rsplit(" ", 1)[0] + "…"


def parse_feed(raw: bytes) -> tuple[str, list[dict]]:
    """RSS 2.0 o Atom -> (título del canal, [{titulo, url, fecha}])."""
    root = ET.fromstring(raw)
    if root.tag == f"{ATOM}feed":
        canal = root.findtext(f"{ATOM}title") or ""
        items = [
            {
                "titulo": _limpio(e.findtext(f"{ATOM}title")),
                "url": next((l.attrib.get("href", "") for l in e.findall(f"{ATOM}link") if l.attrib.get("rel", "alternate") == "alternate"), ""),
                "fecha": _fecha(e.findtext(f"{ATOM}published") or e.findtext(f"{ATOM}updated")),
            }
            for e in root.findall(f"{ATOM}entry")
        ]
    else:
        canal = root.findtext("channel/title") or ""
        items = [
            {"titulo": _limpio(i.findtext("title")), "url": (i.findtext("link") or "").strip(), "fecha": _fecha(i.findtext("pubDate"))}
            for i in root.iter("item")
        ]
    return _limpio(canal), items


_TG = re.compile(
    r'data-post="([^"]+)".*?tgme_widget_message_text[^>]*>(.*?)</div>.*?<time datetime="([^"]+)"', re.S
)


def parse_telegram(raw: bytes) -> tuple[str, list[dict]]:
    """Vista pública t.me/s/<canal>. Mensajes sin texto (solo imagen) se ignoran."""
    t = raw.decode("utf-8", "replace")
    canal = re.search(r'<meta property="og:title" content="([^"]*)"', t)
    bloques = t.split('<div class="tgme_widget_message_wrap')[1:]
    items = []
    for b in bloques:
        m = _TG.search(b)
        if m:
            items.append({"titulo": _limpio(m.group(2)), "url": f"https://t.me/{m.group(1)}", "fecha": _fecha(m.group(3))})
    return _limpio(canal.group(1)) if canal else "", items


def partidos_mencionados(titulo: str, alias: dict[str, list[str]]) -> list[str]:
    """Siglas cuyo alias aparece como palabra completa ("PP" no casa con "app")."""
    return [s for s, nombres in alias.items() if any(re.search(rf"(?<!\w){re.escape(n)}(?!\w)", titulo, re.I) for n in nombres)]


def construir(cfg: dict, raws: dict[str, bytes], previos: list[dict], ahora: datetime) -> dict:
    filtro = re.compile("|".join(re.escape(p) for p in cfg["filtro_medios"]), re.I)
    fuentes, items = [], {i["url"]: i for i in previos}
    for f in cfg["fuentes"]:
        raw = raws.get(f["id"])
        if raw is None:
            continue
        try:
            canal, lista = (parse_telegram if f["tipo"] == "telegram" else parse_feed)(raw)
        except ET.ParseError as e:
            print(f"AVISO actualidad: {f['id']} ilegible ({e})")
            continue
        fuentes.append({"id": f["id"], "canal": canal, "clase": f["clase"], "fuente_url": f["url"], "sha256": hashlib.sha256(raw).hexdigest()})
        for it in lista:
            if not (it["titulo"] and it["url"].startswith("http") and it["fecha"]):
                continue
            propio = f.get("partido")
            menciona = partidos_mencionados(it["titulo"], cfg["alias"])
            if not propio and not menciona and not filtro.search(it["titulo"]):
                continue
            items[it["url"]] = {**it, "fuente": f["id"], "canal": canal, "clase": f["clase"], "partidos": [propio] if propio else menciona}
    limite = (ahora - timedelta(days=DIAS)).strftime("%Y-%m-%dT%H:%M:%SZ")
    vivos = sorted((i for i in items.values() if i["fecha"] >= limite), key=lambda i: i["fecha"], reverse=True)
    return {"fuente": "actualidad", "fetched_at": ahora.strftime("%Y-%m-%dT%H:%M:%SZ"), "fuentes": fuentes, "items": vivos}


def main() -> None:
    cfg = json.loads((HERE / "fuentes.json").read_text(encoding="utf-8"))
    raws = {p.stem: p.read_bytes() for p in RAW.glob("*.xml")}
    previos = json.loads(SALIDA.read_text(encoding="utf-8"))["items"] if SALIDA.exists() else []
    doc = construir(cfg, raws, previos, datetime.now(timezone.utc))
    SALIDA.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"actualidad: {len(doc['items'])} titulares de {len(doc['fuentes'])} fuentes")


if __name__ == "__main__":
    main()
