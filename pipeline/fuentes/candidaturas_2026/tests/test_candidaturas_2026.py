import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
DATA = json.loads((ROOT / "data" / "candidaturas_2026.json").read_text(encoding="utf-8"))


def _por_codigo(codigo: str) -> dict:
    return next(c for c in DATA["circunscripciones"] if c["codigo"] == codigo)


def _cabeza(codigo: str, siglas: str) -> str:
    circ = _por_codigo(codigo)
    return next(x["cabeza_de_lista"] for x in circ["candidaturas"] if x["siglas"] == siglas)


def test_52_circunscripciones():
    assert len(DATA["circunscripciones"]) == 52
    for circ in DATA["circunscripciones"]:
        assert len(circ["candidaturas"]) > 0
        for cand in circ["candidaturas"]:
            assert cand["denominacion"]
            assert cand["siglas"]
            assert cand["cabeza_de_lista"]


def test_tres_cabezas_de_lista_boe():
    # Leidos directamente de pipeline/fuentes/candidaturas_2026/raw/BOE-A-2026-23103.xml:
    # Albacete PSOE: lineas 56-57
    assert _cabeza("02", "PSOE") == "Amparo Torres Valencoso"
    # Ceuta PP: lineas 16194-16196 (incluye cabecera "Titular:")
    assert _cabeza("51", "PP") == "Rafael Martínez Peñalver Mateos"
    # Melilla PSOE: lineas 16313-16314
    assert _cabeza("52", "PSOE") == "Riduan Moh Abdelkader"


def test_correcciones_boe_23383():
    # BOE-A-2026-23383: correcciones al Congreso
    assert _cabeza("26", "PCTE") == "Francisco Castro Portolés"
    assert _cabeza("43", "COMUNS-FRONT AMPLI") == "Ester Roca Domedel"
    assert _cabeza("44", "PSOE") == "Herminio Rufino Sancho Íñiguez"
    navarra_siglas = {x["siglas"] for x in _por_codigo("31")["candidaturas"]}
    assert "EH BILDU" in navarra_siglas
    assert "EH BILDU-ERC" not in navarra_siglas


def test_excluye_no_proclamadas():
    # Malaga (29) lista 9 "José María Calvo Guerra" aparece como "No proclamada." en BOE-A-2026-23103.xml
    malaga_denoms = {x["denominacion"] for x in _por_codigo("29")["candidaturas"]}
    assert "José María Calvo Guerra" not in malaga_denoms
