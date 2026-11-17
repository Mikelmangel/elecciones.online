"""Comprueba que cada cita de data/programas/<siglas>.json está en la página indicada del PDF.

Uso: python pipeline/verificar_citas.py <siglas> [--quitar]
Sale con código 1 si alguna cita no aparece. Con --quitar, elimina del JSON las que fallan.
"""
import json
import re
import subprocess
import sys
import unicodedata
from functools import lru_cache
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def normalizar(s: str) -> str:
    """Minúsculas, sin tildes ni puntuación, sin guiones de corte de línea, espacios colapsados."""
    s = re.sub(r"[-­\u2010]\s*\n\s*", "", s)  # palabra par- \n tida
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c if c.isalnum() else " " for c in s if unicodedata.category(c) != "Mn")
    return " ".join(s.split())


# Una cita que acaba en una de estas palabras (o en guion) está cortada a media frase:
# el fragmento existe en la página, pero no contiene la medida.
_COLGANTES = set("que de del la las el los un una unos unas y e o u a en con por para al dos das do da na no nas nos "
                 "i els les amb per als uns unes os as ao aos unha cunha e ou".split())
MIN_CITA = 40
MAX_TITULAR = 110
# Palabras de distancia o valoración que no deben aparecer en un titular nuestro.
_VETADAS = re.compile(r"\b(supuest[oa]s?|presunt[oa]s?|polémic[oa]s?|ambicios[oa]s?)\b|que el programa considera|que describe el programa", re.I)


def problemas_formato(p: dict) -> list[str]:
    cita, titular = (p.get("cita") or "").strip(), (p.get("titular") or "").strip()
    out = []
    if len(cita) < MIN_CITA:
        out.append(f"cita de menos de {MIN_CITA} caracteres")
    palabras = normalizar(cita).split()
    if cita.endswith(("-", "\u00ad", ",")) or (palabras and palabras[-1] in _COLGANTES):
        out.append("cita cortada a media frase")
    if len(titular) > MAX_TITULAR:
        out.append(f"titular de más de {MAX_TITULAR} caracteres")
    if _VETADAS.search(titular):
        out.append("titular con palabra de distancia o valoración")
    if re.match(r"^0{3}\b", titular):  # "35.000" partido por el punto de millar al extraer
        out.append("titular con cifra cortada")
    return out


def cita_en_texto(cita: str, texto: str) -> bool:
    c = normalizar(cita)
    return len(c) >= 20 and c in normalizar(texto)  # citas de dos palabras casan con cualquier cosa


@lru_cache(maxsize=None)
def texto_pagina(pdf: str, pagina: int) -> str:
    return subprocess.run(
        ["pdftotext", "-f", str(pagina), "-l", str(pagina), pdf, "-"],
        capture_output=True, text=True, check=True,
    ).stdout


def verificar(siglas: str, quitar: bool = False) -> int:
    ruta = RAIZ / "data" / "programas" / f"{siglas}.json"
    pdf = str(RAIZ / "pipeline" / "fuentes" / "programas" / "raw" / f"{siglas}.pdf")
    datos = json.loads(ruta.read_text(encoding="utf-8"))
    buenas, malas = [], []
    for p in datos["propuestas"]:
        ok = isinstance(p.get("pagina"), int) and cita_en_texto(p.get("cita") or "", texto_pagina(pdf, p["pagina"]))
        (buenas if ok else malas).append(p)
    for p in malas:
        print(f"NO ENCONTRADA p.{p.get('pagina')}: {(p.get('cita') or '')[:90]!r}")
    formato = 0
    vistos: dict[tuple, int] = {}
    for i, p in enumerate(datos["propuestas"]):
        avisos = problemas_formato(p)
        clave = (p.get("pagina"), normalizar(p.get("cita") or ""))
        if clave in vistos:
            avisos.append(f"cita duplicada con el registro {vistos[clave]}")
        vistos.setdefault(clave, i)
        if avisos:
            formato += 1
            print(f"FORMATO #{i} p.{p.get('pagina')}: {'; '.join(avisos)} | {(p.get('cita') or '')[:70]!r}")
    print(f"{siglas}: {len(buenas)} verificadas, {len(malas)} no encontradas, {formato} con problemas de formato")
    if quitar and malas:
        datos["propuestas"] = buenas
        ruta.write_text(json.dumps(datos, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return 1 if malas or formato else 0


def demo() -> None:
    pagina = "El Gobierno aprobará una Ley de Vi-\nvienda que   garantice el acceso\na un alquiler asequible."
    assert cita_en_texto("una Ley de Vivienda que garantice el acceso a un alquiler asequible", pagina)
    assert cita_en_texto("LEY DE VIVIENDA QUE GARANTICE EL ACCESO", pagina)
    assert not cita_en_texto("una Ley de Vivienda que prohíba el alquiler turístico", pagina)
    assert not cita_en_texto("el acceso", pagina)  # demasiado corta para probar nada
    ok = {"titular": "Derogar la Ley de Vivienda", "cita": "Derogaremos la Ley de Vivienda en los primeros cien días"}
    assert problemas_formato(ok) == []
    assert problemas_formato({**ok, "cita": "Será derogada cualquier normativa autonómica o estatal que"}) == ["cita cortada a media frase"]
    assert problemas_formato({**ok, "cita": "Reformarem el sistema de finançament per garantir la sufi-"}) == ["cita cortada a media frase"]
    assert "cita de menos de 40 caracteres" in problemas_formato({**ok, "cita": "Aumento de los supuestos"})
    assert problemas_formato({**ok, "titular": "Actuar frente a la supuesta deriva censora"}) == ["titular con palabra de distancia o valoración"]
    assert problemas_formato({**ok, "titular": "Aprobar los Presupuestos Generales del Estado"}) == []
    assert problemas_formato({**ok, "titular": "000 euros libres de IRPF"}) == ["titular con cifra cortada"]  # "presupuestos" no es "supuestos"
    print("ok")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        demo()
    else:
        sys.exit(verificar(sys.argv[1], "--quitar" in sys.argv))
