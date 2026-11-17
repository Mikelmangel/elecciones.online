#!/usr/bin/env python3
"""Genera los minijuegos "¿De quién es la propuesta?" y "¿Quién votó esto?" SOLO desde data/.

Regla 8: nada escrito a mano. La propuesta es un titular + cita literal con página de
data/programas/<siglas>.json; la votación, el voto por grupo del acta (congreso_votaciones.json).
Una pregunta de voto solo se hace si todo el grupo votó lo mismo (si no, la respuesta sería discutible).
  python pipeline/tests_quiz.py          # regenera data/tests/{propuestas,votaciones}_quiz.json
"""
import json
import random
from pathlib import Path

DATA = Path(__file__).resolve().parents[1] / "data"
GRUPOS = {
    "GP": "Grupo Popular (PP)",
    "GS": "Grupo Socialista (PSOE)",
    "GVOX": "VOX",
    "GSUMAR": "Sumar",
    "GR": "ERC",
    "GJxCAT": "Junts",
    "GEH Bildu": "EH Bildu",
    "GV (EAJ-PNV)": "PNV",
}
OPCIONES_VOTO = ["Sí", "No", "Abstención"]


def propuestas(n: int = 16) -> list[dict]:
    progs = [json.loads(f.read_text()) for f in sorted((DATA / "programas").glob("[a-z]*.json"))]
    rng = random.Random(29)  # fijo: el quiz no cambia en cada build
    candidatas = {
        p["siglas"]: [m for m in p["propuestas"] if 60 <= len(m["cita"]) <= 260] for p in progs
    }
    siglas = [s for s, ms in candidatas.items() if ms]
    preguntas, ronda = [], 0
    while len(preguntas) < n and ronda < 10:
        for p in progs:
            ms = candidatas[p["siglas"]]
            if len(preguntas) >= n or len(ms) <= ronda:
                continue
            m = ms[(ronda * 37) % len(ms)]  # salto fijo para variar de tema
            otras = rng.sample([s for s in siglas if s != p["siglas"]], 3)
            opciones = otras + [p["siglas"]]
            rng.shuffle(opciones)
            preguntas.append({
                "id": f"prop-{len(preguntas) + 1}",
                "propuesta": m["titular"],
                "partido_correcto": p["siglas"],
                "opciones": opciones,
                "cita": m["cita"],
                "pagina": m["pagina"],
                "fuente": f"Programa electoral de {p['nombre']} (generales 2026)",
                "fuente_url": p["fuente_url"],
            })
        ronda += 1
    return preguntas


def sentido(g: dict) -> str | None:
    """Voto del grupo si todos los que votaron votaron lo mismo."""
    votos = {"Sí": g["si"], "No": g["no"], "Abstención": g["abstencion"]}
    emitidos = [k for k, v in votos.items() if v > 0]
    return emitidos[0] if len(emitidos) == 1 else None


def votaciones() -> list[dict]:
    todas = {v["id"]: v for v in json.loads((DATA / "congreso_votaciones.json").read_text())["votaciones"]}
    clave = json.loads((DATA / "votaciones_clave.json").read_text())["votaciones"]
    preguntas = []
    for i, c in enumerate(clave[::3]):  # una de cada tres: 13 preguntas, partida corta
        v = todas.get(c["id"])
        if not v or not v.get("por_grupo"):
            continue
        grupos = [g for g in GRUPOS if g in v["por_grupo"] and sentido(v["por_grupo"][g])]
        if not grupos:
            continue
        g = grupos[i % len(grupos)]  # rota el grupo preguntado
        t = v["totales"]
        resultado = "salió adelante" if t["si"] > t["no"] else "no salió adelante" if t["si"] < t["no"] else "acabó en empate"
        d = v["por_grupo"][g]
        a, m, dd = v["fecha"].split("-")
        preguntas.append({
            "id": f"vot-{len(preguntas) + 1}",
            "titulo": c["titulo_llano"],
            "pregunta": f"¿Qué votó {GRUPOS[g]}?",
            "opciones": OPCIONES_VOTO,
            "respuesta_correcta": sentido(d),
            "explicacion": (
                f"{GRUPOS[g]}: {d['si']} diputados votaron sí, {d['no']} votaron no y {d['abstencion']} se abstuvieron. "
                f"En total hubo {t['si']} votos a favor, {t['no']} en contra y {t['abstencion']} abstenciones, y la votación {resultado}."
            ),
            "sesion": v["id"],
            "fecha": f"{dd}/{m}/{a}",
            "fuente_url": v["fuente_url"],
        })
    return preguntas


def demo() -> None:
    assert sentido({"si": 0, "no": 33, "abstencion": 0}) == "No"
    assert sentido({"si": 2, "no": 6, "abstencion": 0}) is None


def main() -> None:
    demo()
    destino = DATA / "tests"
    ps = propuestas()
    (destino / "propuestas_quiz.json").write_text(json.dumps({
        "fuente": "data/programas",
        "version": "2.0.0",
        "descripcion": f"{len(ps)} propuestas con cita literal y página de los programas oficiales, generadas por pipeline/tests_quiz.py.",
        "preguntas": ps,
    }, ensure_ascii=False, indent=2) + "\n")
    vs = votaciones()
    (destino / "votaciones_quiz.json").write_text(json.dumps({
        "fuente": "data/congreso_votaciones.json",
        "version": "2.0.0",
        "descripcion": f"{len(vs)} votaciones importantes de esta legislatura con el voto de cada partido según el registro oficial del Congreso, generadas por pipeline/tests_quiz.py.",
        "preguntas": vs,
    }, ensure_ascii=False, indent=2) + "\n")
    print(f"tests_quiz: {len(ps)} propuestas, {len(vs)} votaciones")


if __name__ == "__main__":
    main()
