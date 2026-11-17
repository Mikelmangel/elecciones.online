"""RD de convocatoria -> data/convocatoria_2026.json (fechas y diputados por circunscripción)."""
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(RAIZ / "pipeline"))
from provincias import PROVINCIAS, codigo_de  # noqa: E402

RAW = Path(__file__).parent / "raw" / "BOE-A-2026-20742.xml"
OUT = RAIZ / "data" / "convocatoria_2026.json"

_U = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once",
      "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte",
      "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete",
      "veintiocho", "veintinueve"]
NUMEROS = {w: i for i, w in enumerate(_U) if w}
for d, base in (("treinta", 30), ("cuarenta", 40)):
    NUMEROS[d] = base
    for i in range(1, 10):
        NUMEROS[f"{d} y {_U[i]}"] = base + i

MESES = {"octubre": 10, "noviembre": 11, "diciembre": 12}


def parse(xml: str) -> dict:
    filas = re.findall(r'<td class="cuerpo_tabla_izq">([^<]+)</td>\s*<td class="cuerpo_tabla_izq">([^<]+)</td>', xml)
    escanos = {codigo_de(n.rstrip(".")): NUMEROS[e.rstrip(".").lower()] for n, e in filas}
    dia, mes, anio = re.search(r"se celebrar\S+\s+el\s+\w+\s+(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})", xml).groups()
    return {
        "fecha_eleccion": f"{anio}-{MESES[mes]:02d}-{int(dia):02d}",
        "titulo": re.search(r"<titulo>(.*?)</titulo>", xml, re.S).group(1).strip(),
        "circunscripciones": [
            {"codigo": c, "nombre": PROVINCIAS[c], "diputados": escanos[c]} for c in sorted(escanos)
        ],
    }


if __name__ == "__main__":
    body = RAW.read_bytes()
    datos = {
        "fuente": "boe_convocatoria",
        "generado": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "fuente_url": "https://www.boe.es/buscar/doc.php?id=BOE-A-2026-20742",
        "fetched_at": datetime.fromtimestamp(RAW.stat().st_mtime, timezone.utc).isoformat(timespec="seconds"),
        "sha256": hashlib.sha256(body).hexdigest(),
        **parse(body.decode("utf-8")),
    }
    OUT.write_text(json.dumps(datos, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(OUT.name, len(datos["circunscripciones"]), "circunscripciones")
