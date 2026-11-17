import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from pipeline.provincias import PROVINCIAS, codigo_de  # noqa: E402

RAW_DIR = Path(__file__).parent / "raw"
MAIN_XML = RAW_DIR / "BOE-A-2026-23103.xml"
CORR_XML = RAW_DIR / "BOE-A-2026-23383.xml"
OUT = ROOT / "data" / "candidaturas_2026.json"
FUENTE_URL = "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23103"

_CAND_NUM_RE = re.compile(r"^\d+\.\s+(.+)$")
_SIGLAS_RE = re.compile(r"^(.+?)\s*\(([^()]+)\)\s*$")
_PRIMERO_RE = re.compile(r"^1\.\s+(.+?)\.?$")
_PAREN_FINAL_RE = re.compile(r"\s*\([^()]+\)\s*$")


def _texto_p(p: ET.Element) -> str:
    return " ".join("".join(p.itertext()).split())


def _parse_denominacion_siglas(raw_header: str) -> tuple[str, str]:
    m = _CAND_NUM_RE.match(raw_header)
    body = m.group(1).strip() if m else raw_header.strip()
    sm = _SIGLAS_RE.match(body)
    if sm:
        return sm.group(1).strip(), sm.group(2).strip()
    return body, body


def _limpiar_nombre(raw: str) -> str:
    limpio = _PAREN_FINAL_RE.sub("", raw).strip()
    return limpio.rstrip(".").strip()


def parse_congreso(xml_path: Path) -> dict[str, list[dict[str, str]]]:
    tree = ET.parse(xml_path)
    root = tree.getroot()
    por_prov: dict[str, list[dict[str, str]]] = {}

    cod_actual: str | None = None
    in_congreso = False
    cand_actual: dict[str, str] | None = None
    skip_cand = False

    def _flush_cand() -> None:
        nonlocal cand_actual, skip_cand
        if cand_actual is not None and not skip_cand and cod_actual is not None:
            por_prov.setdefault(cod_actual, []).append(cand_actual)
        cand_actual = None
        skip_cand = False

    for p in root.findall(".//texto//p"):
        cls = p.attrib.get("class", "")
        txt = _texto_p(p)
        if not txt:
            continue

        if cls == "centro_negrita" and txt.startswith("JUNTA ELECTORAL DE "):
            _flush_cand()
            nombre_prov = txt.removeprefix("JUNTA ELECTORAL DE ").strip()
            cod_actual = codigo_de(nombre_prov)
            in_congreso = False
            continue

        if cls == "centro_cursiva":
            upper = txt.upper()
            if upper == "CONGRESO DE LOS DIPUTADOS":
                _flush_cand()
                in_congreso = True
            elif upper == "SENADO":
                _flush_cand()
                in_congreso = False
            continue

        if not in_congreso or cod_actual is None:
            continue

        if cls == "centro_redonda" and _CAND_NUM_RE.match(txt):
            _flush_cand()
            denom, siglas = _parse_denominacion_siglas(txt)
            cand_actual = {
                "denominacion": denom,
                "siglas": siglas,
                "cabeza_de_lista": "",
            }
            continue

        if cand_actual is not None:
            if txt == "No proclamada.":
                skip_cand = True
                continue
            if not cand_actual["cabeza_de_lista"]:
                m1 = _PRIMERO_RE.match(txt)
                if m1:
                    cand_actual["cabeza_de_lista"] = _limpiar_nombre(m1.group(1))

    _flush_cand()
    return por_prov


def aplicar_correcciones(por_prov: dict[str, list[dict[str, str]]], corr_path: Path) -> None:
    """Aplica las correcciones de errores de BOE-A-2026-23383 para el Congreso."""
    if not corr_path.exists():
        return
    # Verificar que el XML de corrección está presente y es el esperado
    ET.parse(corr_path)

    # 1. La Rioja (26): PCTE cabeza de lista -> Francisco Castro Portolés
    for c in por_prov.get("26", []):
        if c["siglas"] == "PCTE":
            c["cabeza_de_lista"] = "Francisco Castro Portolés"

    # 2. Navarra (31): EH BILDU-ERC -> EH BILDU; Frente Amplio-Fronte Zabala -> mayúsculas
    for c in por_prov.get("31", []):
        if c["siglas"] == "EH BILDU-ERC":
            c["denominacion"] = "EUSKAL HERRIA BILDU"
            c["siglas"] = "EH BILDU"
        elif c["denominacion"] == "Frente Amplio-Fronte Zabala":
            c["denominacion"] = "FRENTE AMPLIO-FRONTE ZABALA"

    # 3. Tarragona (43): Comuns-Front Ampli -> Ester Roca Domedel
    for c in por_prov.get("43", []):
        if c["siglas"] == "COMUNS-FRONT AMPLI":
            c["cabeza_de_lista"] = "Ester Roca Domedel"

    # 4. Teruel (44): PSOE -> Herminio Rufino Sancho Íñiguez
    for c in por_prov.get("44", []):
        if c["siglas"] == "PSOE":
            c["cabeza_de_lista"] = "Herminio Rufino Sancho Íñiguez"


def main() -> None:
    por_prov = parse_congreso(MAIN_XML)
    aplicar_correcciones(por_prov, CORR_XML)

    circunscripciones = []
    for codigo in sorted(PROVINCIAS.keys()):
        cands = por_prov.get(codigo, [])
        circunscripciones.append({
            "codigo": codigo,
            "nombre": PROVINCIAS[codigo],
            "candidaturas": cands,
        })

    h = hashlib.sha256()
    for p in (MAIN_XML, CORR_XML):
        if p.exists():
            h.update(p.read_bytes())

    data = {
        "fuente": "boe_candidaturas",
        "fuente_url": FUENTE_URL,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "sha256": h.hexdigest(),
        "circunscripciones": circunscripciones,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total_cands = sum(len(c["candidaturas"]) for c in circunscripciones)
    print(f"Escrito {OUT}: {len(circunscripciones)} circunscripciones, {total_cands} candidaturas.")


if __name__ == "__main__":
    main()
