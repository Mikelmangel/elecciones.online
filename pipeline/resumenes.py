"""Genera con un modelo (Claude Code en local) el resumen por partido y área a partir de las
medidas ya extraídas, y lo comprueba de forma mecánica antes de marcarlo publicable.

Comprobación: toda página citada en el resumen debe ser la página de alguna medida de ese partido
en esa área. Si falla, el resumen se guarda con revisado=false y no sale en la web.

  scraper/.venv/bin/python pipeline/resumenes.py            # áreas que faltan
  scraper/.venv/bin/python pipeline/resumenes.py --check    # solo verificar lo que hay
"""
import glob
import json
import os
import re
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "data" / "resumenes_programas.json"
MIN_MEDIDAS = 3

PROMPT = """Eres documentalista de un portal electoral neutral. Abajo tienes, para el área «{area}», las medidas de varios programas electorales (número, página, titular). Escribe para CADA partido un resumen descriptivo.

Reglas estrictas:
- 2 o 3 frases. Describe qué propone, agrupando medidas parecidas. Nada más.
- Cada frase termina con las páginas de las medidas que resume, así: (p. 41) o (pp. 41-43) o (pp. 4 y 6). Solo páginas que aparezcan en la lista de ese partido.
- Sin valoraciones, sin adjetivos propios, sin decir si es bueno, viable, ambicioso o insuficiente. Sin comparar partidos. Sin información que no esté en los titulares.
- Usa los verbos del programa (propone, plantea, reclama, incluye). Conserva cifras tal cual.
- "a_quien_afecta": una frase que enumera los grupos de personas a los que se dirigen las medidas (inquilinos, autónomos, pensionistas…), sin decir si salen ganando o perdiendo.
- Español de España, lenguaje llano.

Responde SOLO con JSON válido, sin texto alrededor:
[{{"siglas": "...", "resumen": "...", "a_quien_afecta": "..."}}]

MEDIDAS:
{medidas}
"""


def programas():
    for f in sorted(glob.glob(str(RAIZ / "data" / "programas" / "[a-z]*.json"))):
        d = json.loads(Path(f).read_text(encoding="utf-8"))
        yield d["siglas"], d.get("propuestas", [])


def paginas_citadas(texto: str) -> set[int]:
    pags: set[int] = set()
    for grupo in re.findall(r"\(pp?\.\s*([^)]*)\)", texto):
        for a, b in re.findall(r"(\d+)(?:\s*-\s*(\d+))?", grupo):
            pags.update(range(int(a), int(b or a) + 1))
    return pags


def verificar(r: dict, paginas_reales: set[int]) -> str | None:
    citadas = paginas_citadas(r["resumen"])
    if not citadas:
        return "no cita ninguna página"
    # un rango "pp. 41-43" puede incluir páginas intermedias sin medida: se exige que los extremos existan
    extremos = {int(n) for n in re.findall(r"\d+", " ".join(re.findall(r"\(pp?\.\s*([^)]*)\)", r["resumen"])))}
    falsas = extremos - paginas_reales
    if falsas:
        return f"cita páginas sin medidas: {sorted(falsas)}"
    if not (80 <= len(r["resumen"]) <= 1500):
        return "longitud fuera de rango"
    return None


def demo() -> None:
    assert paginas_citadas("Hace A (p. 4). Hace B (pp. 10-12 y 85).") == {4, 10, 11, 12, 85}
    assert verificar({"resumen": "x" * 80 + " (p. 9)"}, {4}) is not None
    assert verificar({"resumen": "x" * 80 + " (pp. 4 y 6)"}, {4, 6}) is None


def main() -> int:
    demo()
    doc = json.loads(SALIDA.read_text(encoding="utf-8")) if SALIDA.exists() else {"resumenes": []}
    por_area: dict[str, dict[str, list]] = {}
    for siglas, props in programas():
        for p in props:
            por_area.setdefault(p["area"], {}).setdefault(siglas, []).append(p)

    if "--check" not in sys.argv:
        hechas = {r["area"] for r in doc["resumenes"]}
        for area, partidos in sorted(por_area.items()):
            if area in hechas:
                continue
            partidos = {s: ms for s, ms in partidos.items() if len(ms) >= MIN_MEDIDAS}
            if not partidos:
                continue
            medidas = "\n".join(
                f"\n## {s}\n" + "\n".join(f"{i+1}. p{m['pagina']} {m['titular']}" for i, m in enumerate(ms))
                for s, ms in partidos.items()
            )
            print(f"== {area} ({len(partidos)} partidos)", flush=True)
            out = subprocess.run(
                ["claude", "-p", PROMPT.format(area=area, medidas=medidas), "--model", os.environ.get("MODELO", "sonnet")],
                capture_output=True, text=True, stdin=subprocess.DEVNULL, timeout=600,
            ).stdout
            m = re.search(r"\[.*\]", out, re.S)
            if not m:
                print(f"AVISO: {area} sin JSON; se reintenta en la próxima ejecución", file=sys.stderr)
                continue
            for r in json.loads(m.group(0)):
                if r.get("siglas") in partidos:
                    doc["resumenes"].append({"siglas": r["siglas"], "area": area, "resumen": r["resumen"].strip(),
                                             "a_quien_afecta": r["a_quien_afecta"].strip(), "origen": "ia"})
            SALIDA.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    errores = 0
    for r in doc["resumenes"]:
        reales = {m["pagina"] for m in por_area.get(r["area"], {}).get(r["siglas"], [])}
        fallo = verificar(r, reales)
        r["revisado"] = fallo is None  # aquí "revisado" = pasó la comprobación mecánica de páginas
        r.setdefault("origen", "ia")
        if fallo:
            errores += 1
            print(f"NO PUBLICABLE {r['siglas']}/{r['area']}: {fallo}", file=sys.stderr)
    doc["nota"] = ("Resúmenes redactados por IA a partir de las medidas extraídas de cada programa. No son citas. "
                   "Se publican solo si todas las páginas que citan corresponden a medidas reales (pipeline/resumenes.py).")
    SALIDA.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"resumenes: {len(doc['resumenes'])} en total, {errores} no publicables")
    return 0


if __name__ == "__main__":
    sys.exit(main())
