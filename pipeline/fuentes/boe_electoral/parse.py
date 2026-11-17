"""Extrae disposiciones y anuncios electorales de los sumarios del BOE."""

from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
RAW_DIR = Path(__file__).resolve().parent / "data" / "raw"
OUT_PATH = ROOT / "data" / "boe_electoral.json"

PATRON_ELECTORAL = re.compile(
    r"\b("
    r"junta electoral central|"
    r"juntas electorales|"
    r"elecciones generales|"
    r"elecciones a cortes generales|"
    r"candidaturas presentadas|"
    r"candidaturas proclamadas|"
    r"congreso de los diputados y al senado|"
    r"voto por correo|"
    r"censo electoral|"
    r"oficina del censo electoral|"
    r"subvenciones electorales|"
    r"r[eé]gimen electoral general|"
    r"loreg|"
    r"campa[ñn]a electoral|"
    r"espacios gratuitos de propaganda electoral"
    r")\b",
    re.IGNORECASE,
)


def _as_list(val: object) -> list:
    if val is None:
        return []
    return val if isinstance(val, list) else [val]


def extraer_items_sumario(payload: dict) -> list[dict]:
    """Recorre un JSON de sumario del BOE y devuelve sus ítems normalizados."""
    sumario = payload.get("data", {}).get("sumario", {})
    fecha_raw = str(sumario.get("metadatos", {}).get("fecha_publicacion", ""))
    fecha_iso = (
        f"{fecha_raw[:4]}-{fecha_raw[4:6]}-{fecha_raw[6:8]}"
        if len(fecha_raw) == 8 and fecha_raw.isdigit()
        else fecha_raw
    )
    encontrados: list[dict] = []

    for diario in _as_list(sumario.get("diario")):
        for seccion in _as_list(diario.get("seccion")):
            sec_cod = str(seccion.get("codigo", ""))
            sec_nom = str(seccion.get("nombre", ""))
            for dept in _as_list(seccion.get("departamento")):
                dept_nom = str(dept.get("nombre", ""))
                # Ítems directos bajo departamento
                for item in _as_list(dept.get("item")):
                    encontrados.append(
                        _normalizar_item(item, fecha_iso, sec_cod, sec_nom, dept_nom, "")
                    )
                # Ítems bajo epígrafe
                for epi in _as_list(dept.get("epigrafe")):
                    epi_nom = str(epi.get("nombre", ""))
                    for item in _as_list(epi.get("item")):
                        encontrados.append(
                            _normalizar_item(item, fecha_iso, sec_cod, sec_nom, dept_nom, epi_nom)
                        )
    return encontrados


def _normalizar_item(
    item: dict,
    fecha_iso: str,
    sec_cod: str,
    sec_nom: str,
    dept_nom: str,
    epi_nom: str,
) -> dict:
    url_pdf_obj = item.get("url_pdf")
    url_pdf = url_pdf_obj.get("texto", "") if isinstance(url_pdf_obj, dict) else str(url_pdf_obj or "")
    return {
        "identificador": str(item.get("identificador", "")),
        "fecha": fecha_iso,
        "seccion": f"{sec_cod} · {sec_nom}".strip(" ·"),
        "departamento": dept_nom,
        "epigrafe": epi_nom,
        "titulo": str(item.get("titulo", "")).strip(),
        "url_html": str(item.get("url_html", "")),
        "url_pdf": url_pdf,
    }


def es_relevante_electoral(item: dict) -> bool:
    texto = " ".join(
        [
            item.get("departamento", ""),
            item.get("epigrafe", ""),
            item.get("titulo", ""),
        ]
    )
    return bool(PATRON_ELECTORAL.search(texto))


def parse_directorio(raw_dir: Path = RAW_DIR) -> dict:
    por_id: dict[str, dict] = {}
    ficheros = sorted(
        p for p in raw_dir.glob("*.json") if not p.name.endswith(".meta.json")
    )
    for path in ficheros:
        raw_bytes = path.read_bytes()
        payload = json.loads(raw_bytes.decode("utf-8"))
        meta_path = path.with_suffix(".meta.json")
        if meta_path.exists():
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
        else:
            ymd = path.stem
            meta = {
                "fuente_url": f"https://www.boe.es/datosabiertos/api/boe/sumario/{ymd}",
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "sha256": hashlib.sha256(raw_bytes).hexdigest(),
            }
        for item in extraer_items_sumario(payload):
            if not item["identificador"] or not es_relevante_electoral(item):
                continue
            item["fuente_url"] = meta["fuente_url"]
            item["fetched_at"] = meta["fetched_at"]
            item["sha256"] = meta["sha256"]
            por_id[item["identificador"]] = item

    disposiciones = sorted(
        por_id.values(),
        key=lambda x: (x["fecha"], x["identificador"]),
        reverse=True,
    )
    return {
        "fuente": "Boletín Oficial del Estado — API de Datos Abiertos",
        "fuente_url": "https://www.boe.es/datosabiertos/api/boe/sumario",
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "total": len(disposiciones),
        "disposiciones": disposiciones,
    }


def main() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    resultado = parse_directorio(RAW_DIR)
    OUT_PATH.write_text(
        json.dumps(resultado, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"boe_electoral parse: {resultado['total']} disposiciones -> {OUT_PATH}")


if __name__ == "__main__":
    main()
