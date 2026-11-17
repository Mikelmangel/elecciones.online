import json
from pathlib import Path

import pytest

DATA = Path(__file__).parents[4] / "data" / "resultados_generales_2023.json"


@pytest.fixture(scope="module")
def d():
    return json.loads(DATA.read_text())


def dhondt(votos: dict[str, int], escanos: int, validos: int) -> dict[str, int]:
    aptos = {s: v for s, v in votos.items() if v * 100 >= validos * 3}  # barrera 3 % sobre votos válidos
    q = sorted(((v, k, s) for s, v in aptos.items() for k in range(1, escanos + 1)),
               key=lambda x: (-x[0] / x[1], -x[0]))  # ponytail: float; los empates exactos no se dan (test lo confirma)
    res = {s: 0 for s in votos}
    for _, _, s in q[:escanos]:
        res[s] += 1
    return res


def test_52_circunscripciones_y_350_escanos(d):
    assert [p["codigo"] for p in d["provincias"]] == [f"{i:02d}" for i in range(1, 53)]
    assert sum(p["escanos"] for p in d["provincias"]) == 350
    assert sum(c["escanos"] for p in d["provincias"] for c in p["candidaturas"]) == 350


def test_dhondt_reproduce_escanos_oficiales(d):
    for p in d["provincias"]:
        votos = {c["siglas"]: c["votos"] for c in p["candidaturas"]}
        oficial = {c["siglas"]: c["escanos"] for c in p["candidaturas"]}
        assert dhondt(votos, p["escanos"], p["votos_validos"]) == oficial, p["nombre"]


def test_candidaturas_mas_blanco_son_validos(d):
    for p in d["provincias"]:
        assert sum(c["votos"] for c in p["candidaturas"]) + p["votos_blanco"] == p["votos_validos"], p["nombre"]
        # y coincide con la columna "Votos a Candidaturas" del Cuadro I
        assert sum(c["votos"] for c in p["candidaturas"]) == p["votos_candidaturas"], p["nombre"]


def test_nacional_coherente(d):
    assert sum(n["escanos"] for n in d["nacional"]) == 350
    assert sum(n["votos"] for n in d["nacional"]) == sum(p["votos_candidaturas"] for p in d["provincias"])


def test_valores_leidos_del_boe(d):
    # Valores leídos a mano en BOE-A-2023-18907 (PDF), no del parser.
    p = {x["codigo"]: x for x in d["provincias"]}
    # BOE núm. 209, pág. 122202 (Cuadro I, fila Soria): electores 75.768, votantes 51.157
    assert (p["42"]["censo"], p["42"]["votantes"]) == (75768, 51157)
    # pág. 122202 (Cuadro I, fila Madrid): votos a candidaturas 3.579.713
    assert sum(c["votos"] for c in p["28"]["candidaturas"]) == 3579713
    # pág. 122203 (Cuadro II, fila Barcelona, PSC-PSOE): 952.347 votos, 13 escaños
    psc = next(c for c in p["08"]["candidaturas"] if c["siglas"] == "PSC")
    assert (psc["votos"], psc["escanos"]) == (952347, 13)
    # pág. 122203 (Cuadro II, fila Albacete, PP): 88.299 votos, 2 escaños
    pp = next(c for c in p["02"]["candidaturas"] if c["siglas"] == "PP")
    assert (pp["votos"], pp["escanos"]) == (88299, 2)


def test_totales_estatales_del_boe(d):
    # Cuadro I, fila "Total estatal" (pág. 122202): electores 37.469.458, votantes 24.952.447, válidos 24.688.087,
    # candidaturas 24.487.414, blanco 200.673, nulos 264.360
    ps = d["provincias"]
    for campo, esperado in [("censo", 37469458), ("votantes", 24952447), ("votos_validos", 24688087),
                            ("votos_candidaturas", 24487414), ("votos_blanco", 200673), ("votos_nulos", 264360)]:
        assert sum(p[campo] for p in ps) == esperado, campo
    # Cuadro II, "Total estatal" de PP: 8.160.837 votos, 137 escaños
    pp = next(n for n in d["nacional"] if n["siglas"] == "PP")
    assert (pp["votos"], pp["escanos"]) == (8160837, 137)
