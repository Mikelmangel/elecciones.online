"""Verificación automática de veredictos (decisión del titular, 16-nov-2026: sin revisión humana).

Un veredicto solo se publica si su prueba se puede comprobar contra datos que tenemos descargados:
  - la votación citada existe y el grupo del partido votó en el sentido que dice el texto;
  - la referencia "pág. N" del programa corresponde a una medida real de ese partido en esa página.
Lo que no se puede comprobar se retira del registro. Si el veredicto se apoya en una estadística
externa (INE, Banco de España…) que no hemos descargado, queda como NO COMPROBADO: la cifra que
escribió un modelo no es una fuente.
"""
import re

GRUPO = {
    "PP": "GP", "PSOE": "GS", "VOX": "GVOX", "Frente Amplio": "GSUMAR", "ERC": "GR",
    "JUNTS": "GJxCAT", "JxCat": "GJxCAT", "EAJ-PNV": "GV (EAJ-PNV)", "EH BILDU": "GEH Bildu",
    # PODEMOS, BNG y CCa están en el Grupo Mixto: el dato por grupo no prueba su voto individual.
}
SIGLAS_PROGRAMA = {"JUNTS": "JxCat", "EH BILDU": "EH Bildu", "Frente Amplio": "M+J"}
# Auditoría de contenido (IA, 16-nov): la votación existe pero no prueba lo que se afirma.
NO_PRUEBA = {
    "fc-pnv-esteban-onda-vasca-decreto-vivienda": "la votación 89-2 es del gravamen energético, no del decreto de vivienda; en la 175-3 el grupo se abstuvo",
    "fc-bildu-matute-rtve-decretos-vivienda": "la cita no dice lo que resume la afirmación",
    "fc-junts-nogueras-congreso-estabilidad": "es una declaración de intenciones, no un hecho comprobable; la afirmación añade más de lo que dice la cita",
}
# Cifras comprobables con series descargadas (data/estadisticas_oficiales.json). El veredicto es
# VERDADERO solo si la cifra se sostiene con TODAS las fechas y medidas razonables: así no depende
# de cuál elijamos cuando el candidato no lo precisa. Si no, queda sin veredicto.
CIFRAS = {
    "fc-pp-feijoo-wild-project-deuda": {
        "calculo": "variacion", "serie": "deuda_pde_aapp",
        "bases": {"2018-06": "junio de 2018 (cambio de Gobierno)", "2019-12": "diciembre de 2019"},
        "rango": (40, 50),
        "afirmacion": "La deuda pública se ha incrementado «un 40 y pico %» en estos años",
        "que": "La deuda de las Administraciones Públicas (Protocolo de Déficit Excesivo)",
    },
    "fc-pp-feijoo-esradio-poblacion-extranjera": {
        "calculo": "cociente", "serie": "poblacion_nacida_extranjero", "sobre": "poblacion_total",
        "rango": (19, 21),  # cifra redonda: se admite un punto arriba o abajo
        "afirmacion": "El 20 % de la población de España es de origen extranjero",
        "que": "nacidas en el extranjero",
    },
    "fc-pp-feijoo-esradio-deuda-galicia": {
        "calculo": "ranking", "prefijos": {"deuda_ccaa_pib": "sobre el PIB", "deuda_ccaa_eur": "en euros"},
        "objetivo": "Galicia", "tramos": [("2009-03", "2022-06"), ("2009-06", "2022-06")], "max_puesto": 4,
        "afirmacion": "Con Feijóo de presidente, Galicia estuvo entre las tres o cuatro comunidades con menor incremento de deuda",
    },
}
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre",
         "octubre", "noviembre", "diciembre"]
ID_RE = re.compile(r"\b(\d{1,3}-\d{1,3})\b")
SENTIDO_RE = re.compile(r"vot\w+\s+(SÍ|NO|a favor|en contra)", re.I)
PAG_RE = re.compile(r"pág\.\s*(\d+)(?:\s*y\s*(\d+))?")


def _sentido_dicho(texto: str, grupo: str) -> str | None:
    """Sentido que el texto atribuye al grupo: la primera mención tras nombrar al grupo, o la primera."""
    pos = texto.find(grupo.split(" ")[0])
    m = SENTIDO_RE.search(texto, pos if pos >= 0 else 0) or SENTIDO_RE.search(texto)
    if not m:
        return None
    return "si" if m.group(1).lower() in ("sí", "a favor") else "no"


def _sentido_real(votacion: dict, grupo: str) -> str | None:
    g = (votacion.get("por_grupo") or {}).get(grupo)
    if not g:
        return None
    mayor = max(("si", "no", "abstencion"), key=lambda k: g.get(k, 0))
    return mayor if g.get(mayor, 0) > 0 else None


def _es(n: float, dec: int = 0) -> str:
    return f"{n:,.{dec}f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _mes(p: str) -> str:
    return f"{MESES[int(p[5:]) - 1]} de {p[:4]}"


def _variacion(r: dict, series: dict) -> tuple[str, str] | None:
    s = series[r["serie"]]
    ultimo = max(s["puntos"])
    fin = s["puntos"][ultimo]
    var = {b: (fin / s["puntos"][b] - 1) * 100 for b in r["bases"]}
    lo, hi = r["rango"]
    if not all(lo <= v < hi for v in var.values()):
        return None
    tramos = "; ".join(f"desde {n}, {_es(s['puntos'][b] / 1000)} M€, un {_es(var[b], 1)} % más" for b, n in r["bases"].items())
    return (f"{r['que']} era de {_es(fin / 1000)} M€ en {_mes(ultimo)}: {tramos}.",
            f"El candidato no fija el periodo; el aumento está entre el {lo} % y el {hi} % con cualquiera de las fechas de inicio indicadas.")


def _cociente(r: dict, series: dict) -> tuple[str, str] | None:
    num, den = series[r["serie"]]["puntos"], series[r["sobre"]]["puntos"]
    fechas = sorted(set(num) & set(den))[-2:]  # los dos últimos trimestres publicados
    pct = {f: num[f] / den[f] * 100 for f in fechas}
    lo, hi = r["rango"]
    if len(fechas) < 2 or not all(lo <= v < hi for v in pct.values()):
        return None
    f = fechas[-1]
    return (f"A 1 de {_mes(f)} residían en España {_es(den[f])} personas, de ellas {_es(num[f])} {r['que']}: el {_es(pct[f], 1)} %.",
            f"Se toma «origen extranjero» como nacidos en el extranjero, tengan o no nacionalidad española. Se da por buena una cifra redonda si el dato oficial está entre el {lo} % y el {hi} %.")


def _ranking(r: dict, series: dict) -> tuple[str, str] | None:
    partes, puestos = [], []
    for pref, etiqueta in r["prefijos"].items():
        grupo = {k.split(":")[1]: v["puntos"] for k, v in series.items() if k.startswith(pref + ":")}
        medidas = {"relativo": lambda a, b: b / a - 1}
        if pref.endswith("_pib"):
            medidas = {"absoluto": lambda a, b: b - a, **medidas}
        for ini, fin in r["tramos"]:
            for fn in medidas.values():
                orden = sorted(grupo, key=lambda c: fn(grupo[c][ini], grupo[c][fin]))
                puestos.append(orden.index(r["objetivo"]) + 1)
        ini, fin = r["tramos"][0]
        g = grupo[r["objetivo"]]
        partes.append(f"{etiqueta}, de {_es(g[ini], 1) + ' %' if pref.endswith('_pib') else _es(g[ini] / 1000) + ' M€'} "
                      f"a {_es(g[fin], 1) + ' %' if pref.endswith('_pib') else _es(g[fin] / 1000) + ' M€'}")
    if len(grupo) != 17 or max(puestos) > r["max_puesto"]:
        return None
    ini, fin = r["tramos"][0]
    return (f"Deuda de {r['objetivo']} entre {_mes(ini)} y {_mes(fin)}: {'; '.join(partes)}. Ordenadas las 17 comunidades "
            f"de menor a mayor incremento, {r['objetivo']} queda entre el puesto {min(puestos)} y el {max(puestos)} según la medida.",
            "Se compara el incremento en puntos de PIB, en porcentaje sobre el PIB y en euros, con dos fechas de inicio "
            f"(marzo y junio de 2009; presidió la Xunta de abril de 2009 a mayo de 2022). En todas queda entre las {r['max_puesto']} primeras.")


def comprobar_cifra(regla: dict, series: dict) -> dict | None:
    """Campos del veredicto calculados con las series, o None si la cifra no se sostiene en todos los supuestos."""
    try:
        res = {"variacion": _variacion, "cociente": _cociente, "ranking": _ranking}[regla["calculo"]](regla, series)
        ref = series[regla.get("serie") or f"{next(iter(regla['prefijos']))}:{regla['objetivo']}"]
    except (KeyError, StopIteration):  # serie o fecha no descargada: sin prueba no hay veredicto
        return None
    if not res:
        return None
    return {
        "afirmacion": regla["afirmacion"],
        "veredicto": "VERDADERO",
        "dato_oficial": res[0],
        "fuente_oficial_nombre": ref["fuente_nombre"],
        "fuente_oficial_url": ref["fuente_url"],
        "explicacion": f"Comprobación automática con la serie descargada. {res[1]} No se valora la conclusión que saca de la cifra.",
        "revisado": True,
        "metodo": "automatico_serie_oficial",
    }


def comprobar(item: dict, votaciones: dict[str, dict], paginas: dict[str, set[int]],
              series: dict | None = None) -> dict:
    """Devuelve el registro con solo lo comprobable y `revisado` según haya prueba o no."""
    out = dict(item)
    notas: list[str] = []

    prog = out.get("cruce_programa") or ""
    siglas = SIGLAS_PROGRAMA.get(out["partido"], out["partido"])
    pags = [int(n) for par in PAG_RE.findall(prog) for n in par if n]
    if prog and (not pags or any(p not in paginas.get(siglas, set()) for p in pags)):
        out.pop("cruce_programa", None)
        notas.append("referencia al programa retirada: sin página comprobable")

    voto_ok = False
    cruce = out.get("cruce_votacion") or ""
    ids = ID_RE.findall(cruce)
    grupo = GRUPO.get(out["partido"])
    if cruce:
        dicho = _sentido_dicho(cruce, grupo) if grupo else None
        voto_ok = bool(grupo and ids and dicho) and all(
            i in votaciones and _sentido_real(votaciones[i], grupo) == dicho for i in ids
        )
        if not voto_ok:
            out.pop("cruce_votacion", None)
            notas.append("referencia a votaciones retirada: no coincide con el acta por grupo o no es comprobable")

    veredicto = out.get("veredicto") or "NO COMPROBADO"
    apoyado_en_votos = "congreso.es/votaciones" in (out.get("fuente_oficial_url") or "")
    if out.get("id") in NO_PRUEBA:
        notas.append(NO_PRUEBA[out["id"]])
    if veredicto != "NO COMPROBADO" and apoyado_en_votos and voto_ok and out.get("id") not in NO_PRUEBA:
        out["revisado"] = True
        out["metodo"] = "automatico_votaciones"
    else:
        out["revisado"] = False
        if veredicto != "NO COMPROBADO":
            notas.append("veredicto no publicado: la prueba no está descargada ni es comprobable")
    cifra = comprobar_cifra(CIFRAS[out["id"]], series or {}) if out.get("id") in CIFRAS else None
    if cifra:
        out.update(cifra)
        # el veredicto se apoya solo en la serie: los cruces redactados por un modelo no se publican con él
        out.pop("cruce_programa", None)
        out.pop("cruce_votacion", None)
        notas = [n for n in notas if not n.startswith("veredicto no publicado")]
    out.pop("notas_verificacion", None)
    if notas:
        out["notas_verificacion"] = notas
    return out


def demo() -> None:
    vots = {"1-1": {"por_grupo": {"GP": {"si": 0, "no": 130, "abstencion": 0}}}}
    base = {"partido": "PP", "veredicto": "VERDADERO", "cruce_votacion": "GP votó NO (Votación 1-1).",
            "fuente_oficial_url": "https://www.congreso.es/votaciones-detalle?x=1-1", "cruce_programa": "Programa PP (pág. 9)"}
    r = comprobar(base, vots, {"PP": {9}})
    assert r["revisado"] and r["cruce_programa"]
    r = comprobar({**base, "cruce_votacion": "GP votó SÍ (Votación 1-1)."}, vots, {"PP": {8}})
    assert not r["revisado"] and "cruce_votacion" not in r and "cruce_programa" not in r
    r = comprobar({**base, "fuente_oficial_url": "https://www.ine.es/"}, vots, {"PP": {9}})
    assert not r["revisado"] and r["cruce_votacion"]
    serie = {"deuda_pde_aapp": {"puntos": {"2018-06": 100, "2019-12": 104, "2026-06": 146},
                                "fuente_nombre": "BdE", "fuente_url": "https://www.bde.es/x.csv"}}
    fc = {"id": "fc-pp-feijoo-wild-project-deuda", "partido": "PP", "veredicto": "CON MATICES"}
    r = comprobar(fc, {}, {}, serie)
    assert r["revisado"] and r["veredicto"] == "VERDADERO" and "46,0 %" in r["dato_oficial"]
    serie["deuda_pde_aapp"]["puntos"]["2026-06"] = 139  # +39 % desde 2018: fuera del rango dicho
    assert not comprobar(fc, {}, {}, serie)["revisado"]
    assert not comprobar(fc, {}, {})["revisado"]  # sin serie descargada no hay veredicto


if __name__ == "__main__":
    demo()
    print("ok")
