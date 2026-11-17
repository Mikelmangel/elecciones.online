"""Valores esperados leídos del anexo del RD 806/2026 en el XML del BOE (tabla "Circunscripción / Diputados")."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from parse import RAW, parse


def test_convocatoria():
    d = parse(RAW.read_text(encoding="utf-8"))
    esc = {c["codigo"]: c["diputados"] for c in d["circunscripciones"]}
    assert d["fecha_eleccion"] == "2026-11-29"  # art. 2: "domingo 29 de noviembre de 2026"
    assert len(esc) == 52
    assert sum(esc.values()) == 350
    assert esc["08"] == 32  # Barcelona: "Treinta y dos."
    assert esc["03"] == 12  # Alicante/Alacant: "Doce."
    assert esc["46"] == 16  # Valencia/València: "Dieciséis."
    assert esc["51"] == 1 and esc["52"] == 1  # Ceuta y Melilla: "Uno."
