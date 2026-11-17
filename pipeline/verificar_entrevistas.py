"""Comprueba que cada afirmación de data/factchecking_entrevistas.json está respaldada por su fuente en raw/.

Análogo a pipeline/verificar_citas.py para programas en PDF:
1. Comprueba longitud mínima de cita_literal (>= 40 caracteres), ausencia de duplicados y hash sha256 válido.
2. Comprueba que entrevista_url existe en data/entrevistas.json.
3. Si el fichero primario existe en pipeline/fuentes/entrevistas/raw/<raw_file>, verifica que su sha256
   coincide exactamente y que cita_literal aparece letra por letra (normalizada) en la ventana del
   minuto indicado (contexto_minuto) de la transcripción XML o en los párrafos del artículo HTML.
4. Comprueba que todas las votaciones del Congreso citadas (p. ej. 175-3, 89-2, 30-1) existen en
   data/congreso_votaciones.json.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "pipeline" / "fuentes" / "entrevistas"))

from parse import normalizar, verificar_cita_en_raw  # noqa: E402

MIN_CITA = 40
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
VOTACION_ID_RE = re.compile(r"\b(\d{1,3}-\d{1,3})\b")


def demo() -> None:
    sample_xml = b"""<?xml version="1.0" encoding="utf-8" ?>
    <transcript>
      <text start="12.0" dur="4.0">Nosotros proponemos eliminar esos impuestos</text>
      <text start="16.0" dur="4.5">para abaratar la primera vivienda habitual.</text>
    </transcript>"""
    assert verificar_cita_en_raw(
        "Nosotros proponemos eliminar esos impuestos para abaratar la primera vivienda habitual",
        sample_xml,
        "youtube_xml",
        "00:12",
    )
    assert not verificar_cita_en_raw(
        "Subiremos el IVA de la primera vivienda al 25 por ciento",
        sample_xml,
        "youtube_xml",
        "00:12",
    )
    sample_html = """<html><head><title>Entrevista</title></head><body>
    <p>La candidata afirmó: «Hay muchas cosas de Sánchez que he votado en contra, empezando por la amnistía».</p>
    </body></html>""".encode("utf-8")
    assert verificar_cita_en_raw(
        "Hay muchas cosas de Sánchez que he votado en contra, empezando por la amnistía",
        sample_html,
        "html",
        "cita en texto",
    )


def verificar() -> int:
    demo()
    fc_path = RAIZ / "data" / "factchecking_entrevistas.json"
    ent_path = RAIZ / "data" / "entrevistas.json"
    vot_path = RAIZ / "data" / "congreso_votaciones.json"
    raw_dir = RAIZ / "pipeline" / "fuentes" / "entrevistas" / "raw"

    fc_doc = json.loads(fc_path.read_text(encoding="utf-8"))
    ent_doc = json.loads(ent_path.read_text(encoding="utf-8"))
    vot_doc = json.loads(vot_path.read_text(encoding="utf-8"))

    urls_registradas = {e["fuente_url"] for e in ent_doc["entrevistas"]} | {
        d["fuente_url"] for d in ent_doc["debates"]
    }
    votaciones_ids = {v["id"] for v in vot_doc["votaciones"]}

    errores: list[str] = []
    vistas: set[str] = set()
    verificadas_raw = 0

    for i, v in enumerate(fc_doc["verificaciones"]):
        vid = v.get("id", f"#{i}")
        cita = (v.get("cita_literal") or "").strip()
        if len(cita) < MIN_CITA:
            errores.append(f"{vid}: cita_literal demasiado corta ({len(cita)} < {MIN_CITA})")
        cita_norm = normalizar(cita)
        if cita_norm in vistas:
            errores.append(f"{vid}: cita_literal duplicada")
        vistas.add(cita_norm)

        sha = v.get("sha256") or ""
        if not SHA256_RE.match(sha):
            errores.append(f"{vid}: sha256 inválido ({sha!r})")

        url = v.get("entrevista_url") or ""
        if url not in urls_registradas:
            errores.append(f"{vid}: entrevista_url {url!r} no está registrada en data/entrevistas.json")

        # Comprobar votaciones referenciadas en cruce_votacion
        cruce_vot = v.get("cruce_votacion") or ""
        for m in VOTACION_ID_RE.finditer(cruce_vot):
            vot_id = m.group(1)
            if vot_id not in votaciones_ids:
                errores.append(f"{vid}: votación {vot_id} citada en cruce_votacion no existe en congreso_votaciones.json")

        # Si existe el fichero primario en raw/, verificar sha256 y presencia literal de la cita en el minuto
        raw_file = v.get("raw_file") or ""
        raw_path = raw_dir / raw_file if raw_file else None
        if raw_path and raw_path.exists():
            raw_bytes = raw_path.read_bytes()
            real_sha = hashlib.sha256(raw_bytes).hexdigest()
            if real_sha != sha:
                errores.append(f"{vid}: sha256 de {raw_file} ({real_sha}) != declarado ({sha})")
            tipo = "youtube_xml" if raw_file.endswith(".xml") else "html"
            if not verificar_cita_en_raw(cita, raw_bytes, tipo, v.get("contexto_minuto")):
                errores.append(
                    f"{vid}: cita_literal no encontrada en {raw_file} (minuto {v.get('contexto_minuto')}): {cita[:80]!r}"
                )
            else:
                verificadas_raw += 1

    for e in errores:
        print(f"ERROR: {e}", file=sys.stderr)

    print(
        f"entrevistas: {len(fc_doc['verificaciones'])} afirmaciones validadas "
        f"({verificadas_raw} contrastadas contra raw/ en disco), {len(errores)} errores"
    )
    return 1 if errores else 0


if __name__ == "__main__":
    sys.exit(verificar())
