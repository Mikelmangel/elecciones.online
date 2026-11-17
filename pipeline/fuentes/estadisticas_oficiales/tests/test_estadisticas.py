import sys
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
from parse import BDE, parse_bde, parse_ine  # noqa: E402

# Valores esperados leídos a mano de los ficheros originales, no de la salida del parser.


def bde(fichero):
    return parse_bde((HERE / "raw" / fichero).read_bytes(), BDE[fichero][1])


def test_deuda_pde():
    s = bde("be1101.csv")["deuda_pde_aapp"]  # columna BE_11_1.11, miles de euros
    assert s["unidad"] == "Miles de euros"
    assert s["puntos"]["2018-06"] == 1203666984
    assert s["puntos"]["1994-12"] == 249507619


def test_deuda_ccaa():
    eur, pib = bde("be1309.csv"), bde("be1310.csv")
    assert len(eur) == len(pib) == 17  # sin la columna del total de CCAA
    assert eur["deuda_ccaa_eur:Galicia"]["puntos"]["2009-03"] == 3923135
    assert eur["deuda_ccaa_eur:Comunidad Valenciana"]["puntos"]["2022-06"] == 54260379
    assert pib["deuda_ccaa_pib:Galicia"]["puntos"]["2022-06"] == 17.4
    assert pib["deuda_ccaa_pib:País Vasco"]["puntos"]["2009-03"] == 1.5


def test_poblacion_ine():
    assert parse_ine((HERE / "raw" / "ECP9221.json").read_bytes())["puntos"]["2026-07"] == 49805419
    assert parse_ine((HERE / "raw" / "ECP5381.json").read_bytes())["puntos"]["2026-07"] == 10304413
