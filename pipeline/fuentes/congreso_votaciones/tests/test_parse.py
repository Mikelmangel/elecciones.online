import json
import sys
from pathlib import Path

AQUI = Path(__file__).parent
sys.path.insert(0, str(AQUI.parent))
from parse import parse_votacion  # noqa: E402

CORPUS = AQUI.parents[3] / "data" / "congreso_votaciones.json"


def test_fixture_real():
    # Fixture: sesion2votacion1.json del zip oficial VOT_20230919152000.zip (Sesion 2, 19/09/2023).
    # Valores esperados contados a mano sobre el XML hermano del mismo zip (no sobre la salida del parser):
    # totales Si 176 / No 169 / Abs 2 / No vota 3 / presentes 347; reparto por grupo abajo.
    # Ojo: un diputado (asiento 1804, Si) viene con grupo "" en el fichero oficial.
    r = parse_votacion((AQUI / "fixtures/sesion2votacion1.json").read_bytes(),
                       sesion=2, numero=1, fuente_url="u", fetched_at="t", sha256="s")
    assert r["fecha"] == "2023-09-19" and r["id"] == "2-1" and r["asentimiento"] is False
    assert r["totales"] == {"si": 176, "no": 169, "abstencion": 2, "no_vota": 3, "presentes": 347}
    z = lambda si=0, no=0, ab=0, nv=0: {"si": si, "no": no, "abstencion": ab, "no_vota": nv}  # noqa: E731
    assert r["por_grupo"] == {
        "": z(si=1), "GEH Bildu": z(si=6), "GJxCAT": z(si=7), "GMx": z(si=2, no=1),
        "GP": z(no=135, nv=2), "GR": z(si=7), "GS": z(si=118, ab=1, nv=1),
        "GSUMAR": z(si=30, ab=1), "GV (EAJ-PNV)": z(si=5), "GVOX": z(no=33)}


def test_corpus_suma_por_grupo_igual_a_totales():
    votaciones = json.loads(CORPUS.read_text())["votaciones"]
    assert votaciones
    ids = [(v["sesion"], v["numero"]) for v in votaciones]
    assert ids == sorted(set(ids))
    for v in votaciones:
        if v["por_grupo"] is None:  # sin voto nominal en origen (p. ej. 89-5, 202-21)
            continue
        for k in ("si", "no", "abstencion", "no_vota"):
            assert sum(g[k] for g in v["por_grupo"].values()) == v["totales"][k], (v["id"], k)
        t = v["totales"]
        assert t["presentes"] == t["si"] + t["no"] + t["abstencion"], v["id"]
