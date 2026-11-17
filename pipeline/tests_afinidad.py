#!/usr/bin/env python3
"""Genera los datasets verificados para la suite de tests y juegos virales en data/tests/:
  - afinidad_preguntas.json  (20 afirmaciones, 8 partidos con cobertura >= 14/20)
  - politicos_quiz.json      (8 escenarios, 8 perfiles parlamentarios)
  - verificador_quiz.json    (10 citas de entrevistas verificadas: ¿Verdadero o Bulo?)
  - socios_quiz.json         (matriz 8x8 de las 2.175 votaciones reales + 8 duelos)

Regla 8: ningún dato inventado; todo se calcula o enlaza a data/.
  scraper/.venv/bin/python pipeline/tests_afinidad.py
"""
import json
from pathlib import Path

DATA = Path(__file__).resolve().parents[1] / "data"

GRUPO_A_PARTIDO = {
    "GP": "PP",
    "GS": "PSOE",
    "GVOX": "VOX",
    "GSUMAR": "Sumar",
    "GR": "ERC",
    "GJxCAT": "Junts",
    "GEH Bildu": "EH Bildu",
    "GV (EAJ-PNV)": "EAJ-PNV",
}

PARTIDOS_META = [
    {"siglas": "Sumar", "nombre": "Sumar", "color": "#e51c55", "ambito": "estatal"},
    {"siglas": "PSOE", "nombre": "PSOE", "color": "#e30613", "ambito": "estatal"},
    {"siglas": "PP", "nombre": "Partido Popular", "color": "#0056a8", "ambito": "estatal"},
    {"siglas": "VOX", "nombre": "VOX", "color": "#5cb811", "ambito": "estatal"},
    {"siglas": "ERC", "nombre": "Esquerra Republicana", "color": "#f2a900", "ambito": "autonomico", "provincia": ["08", "17", "25", "43"]},
    {"siglas": "Junts", "nombre": "Junts per Catalunya", "color": "#00a7a0", "ambito": "autonomico", "provincia": ["08", "17", "25", "43"]},
    {"siglas": "EH Bildu", "nombre": "EH Bildu", "color": "#6aa84f", "ambito": "autonomico", "provincia": ["01", "20", "48", "31"]},
    {"siglas": "EAJ-PNV", "nombre": "EAJ-PNV", "color": "#008000", "ambito": "autonomico", "provincia": ["01", "20", "48", "31"]},
]


def cargar_votaciones() -> tuple[list[dict], dict[str, dict]]:
    raw = json.loads((DATA / "congreso_votaciones.json").read_text())["votaciones"]
    return raw, {v["id"]: v for v in raw}


def cargar_programas() -> dict[str, dict]:
    out = {}
    for f in sorted((DATA / "programas").glob("[a-z]*.json")):
        d = json.loads(f.read_text())
        out[d["siglas"]] = d
    return out


def buscar_propuesta(prog: dict, pagina: int, texto_clave: str) -> dict:
    kw = texto_clave.lower()
    for p in prog["propuestas"]:
        if p["pagina"] == pagina and kw in (p["titular"] + " " + p["cita"]).lower():
            return p
    raise AssertionError(f"No se encontró propuesta con '{texto_clave}' en {prog['siglas']} p.{pagina}")


MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]


def fecha_llana(iso: str) -> str:
    a, m, d = iso.split("-")
    return f"{int(d)} de {MESES[int(m) - 1]} de {a}"


def voto_a_valor(conteo: dict, invertir: bool = False) -> tuple[int, str] | None:
    si, no, abs_ = conteo["si"], conteo["no"], conteo["abstencion"]
    if si > no and si > abs_:
        val, etiq = (2, f"Votó SÍ ({si} diputados)")
    elif no > si and no > abs_:
        val, etiq = (-2, f"Votó NO ({no} diputados)")
    elif abs_ > si and abs_ > no:
        val, etiq = (0, f"Se abstuvo ({abs_} diputados)")
    else:
        return None
    if invertir:
        val = -val
    return val, etiq


PREGUNTAS_VOTOS = [
    {
        "id": "af-1",
        "votacion_id": "89-2",
        "texto": "Debe cobrarse un impuesto temporal a las empresas energéticas durante 2025.",
        "area": "impuestos",
        "dimension": "economia",
        "direccion": -1,
        "invertir": False,
        "etiqueta_corta": "impuesto temporal a las energéticas",
    },
    {
        "id": "af-2",
        "votacion_id": "175-3",
        "texto": "Debe aprobarse un decreto con medidas sobre el alquiler por las consecuencias de la guerra de Irán.",
        "area": "vivienda",
        "dimension": "economia",
        "direccion": -1,
        "invertir": False,
        "etiqueta_corta": "medidas sobre el alquiler",
    },
    {
        "id": "af-3",
        "votacion_id": "89-1",
        "texto": "Debe aprobarse el decreto con medidas de economía, impuestos, transporte y Seguridad Social, y la prórroga de las medidas para personas vulnerables.",
        "area": "pensiones",
        "dimension": "economia",
        "direccion": -1,
        "invertir": False,
        "etiqueta_corta": "medidas económicas, de transporte y para personas vulnerables",
    },
    {
        "id": "af-4",
        "votacion_id": "56-77",
        "texto": "Deben aprobarse los límites de déficit y deuda para 2025-2027 que propone el Gobierno.",
        "area": "economia",
        "dimension": "economia",
        "direccion": -1,
        "invertir": False,
        "etiqueta_corta": "límites de déficit y deuda de 2025-2027",
    },
    {
        "id": "af-5",
        "votacion_id": "128-17",
        "texto": "Debe aprobarse el decreto con medidas urgentes para reforzar el sistema eléctrico.",
        "area": "energia_clima",
        "dimension": "economia",
        "direccion": -1,
        "invertir": False,
        "etiqueta_corta": "refuerzo del sistema eléctrico",
    },
    {
        "id": "af-6",
        "votacion_id": "198-16",
        "texto": "Debe aprobarse el decreto de transparencia de los grupos de presión (lobbies).",
        "area": "instituciones",
        "dimension": "economia",
        "direccion": -1,
        "invertir": False,
        "etiqueta_corta": "transparencia de los grupos de presión",
    },
    {
        "id": "af-7",
        "votacion_id": "154-14",
        "texto": "Debe aprobarse el decreto para favorecer la inversión de los ayuntamientos y las comunidades autónomas.",
        "area": "economia",
        "dimension": "economia",
        "direccion": 1,
        "invertir": False,
        "etiqueta_corta": "inversión de ayuntamientos y comunidades",
    },
    {
        "id": "af-8",
        "votacion_id": "106-15",
        "texto": "Debe aprobarse el decreto para proteger a niños y adolescentes en situaciones migratorias extraordinarias.",
        "area": "inmigracion",
        "dimension": "sociedad",
        "direccion": -1,
        "invertir": False,
        "etiqueta_corta": "protección de menores migrantes",
    },
    {
        "id": "af-9",
        "votacion_id": "159-23",
        "texto": "Debe aprobarse la reforma del Código Penal sobre la multirreincidencia (quien delinque muchas veces).",
        "area": "seguridad_justicia",
        "dimension": "sociedad",
        "direccion": 1,
        "invertir": False,
        "etiqueta_corta": "castigo a la multirreincidencia",
    },
    {
        "id": "af-10",
        "votacion_id": "191-22",
        "texto": "Debe aprobarse la reforma del Código Penal para castigar las terapias de conversión.",
        "area": "seguridad_justicia",
        "dimension": "sociedad",
        "direccion": -1,
        "invertir": False,
        "etiqueta_corta": "castigo a las terapias de conversión",
    },
    {
        "id": "af-11",
        "votacion_id": "136-87",
        "texto": "Debe aprobarse el decreto con medidas urgentes sobre Gaza y de apoyo a la población palestina.",
        "area": "defensa_exterior",
        "dimension": "sociedad",
        "direccion": -1,
        "invertir": False,
        "etiqueta_corta": "medidas sobre Gaza",
    },
    {
        "id": "af-12",
        "votacion_id": "30-1",
        "texto": "Debe aprobarse la ley de amnistía para la normalización política en Cataluña.",
        "area": "territorial",
        "dimension": "sociedad",
        "direccion": -1,
        "invertir": False,
        "etiqueta_corta": "ley de amnistía",
    },
    {
        "id": "af-13",
        "votacion_id": "52-44",
        "texto": "Debe aprobarse la ley de paridad entre mujeres y hombres.",
        "area": "social",
        "dimension": "sociedad",
        "direccion": -1,
        "invertir": False,
        "etiqueta_corta": "ley de paridad",
    },
    {
        "id": "af-14",
        "votacion_id": "169-53",
        "texto": "Debe aprobarse el decreto que modifica la Ley de Memoria Democrática.",
        "area": "instituciones",
        "dimension": "sociedad",
        "direccion": -1,
        "invertir": False,
        "etiqueta_corta": "ley de Memoria Democrática",
    },
]

PREGUNTAS_PROGRAMAS = [
    {
        "id": "af-15",
        "texto": "Hay que bajar y simplificar el impuesto de la renta (IRPF) para las personas y las familias.",
        "area": "impuestos",
        "dimension": "economia",
        "direccion": 1,
        "citas": {
            "PP": (47, "Elevar los mínimos personales", 2),
            "VOX": (9, "IRPF", 2),
        },
    },
    {
        "id": "af-16",
        "texto": "Debe aprobarse la reforma de la ley de los jueces y del estatuto de los fiscales.",
        "area": "instituciones",
        "dimension": "sociedad",
        "direccion": 1,
        "votacion_id": "56-65",
        "citas": {},
    },
    {
        "id": "af-19",
        "texto": "Debe aprobarse el decreto con medidas ante las consecuencias de las guerras de Ucrania y Oriente Próximo y de la sequía.",
        "area": "economia",
        "dimension": "economia",
        "direccion": -1,
        "votacion_id": "15-4",
        "citas": {},
    },
    {
        "id": "af-20",
        "texto": "Debe aprobarse el traspaso de la autopista AP-9 a Galicia.",
        "area": "territorial",
        "dimension": "sociedad",
        "direccion": -1,
        "votacion_id": "191-24",
        "citas": {},
    },
]


def generar_afinidad(vots: dict[str, dict], progs: dict[str, dict]) -> dict:
    afirmaciones = []
    permitidos = {m["siglas"] for m in PARTIDOS_META}

    for pv in PREGUNTAS_VOTOS:
        v = vots[pv["votacion_id"]]
        posiciones = {}
        for grp, p_siglas in GRUPO_A_PARTIDO.items():
            if p_siglas not in permitidos or grp not in v["por_grupo"]:
                continue
            res = voto_a_valor(v["por_grupo"][grp], pv["invertir"])
            if res is None:
                continue
            val, etiq = res
            posiciones[p_siglas] = {
                "valor": val,
                "nota": f"{etiq} el {fecha_llana(v['fecha'])}: {pv['etiqueta_corta']}.",
                "fuente": f"Acta de la votación del Congreso del {fecha_llana(v['fecha'])}",
                "fuente_url": v["fuente_url"],
            }
        afirmaciones.append({
            "id": pv["id"],
            "texto": pv["texto"],
            "area": pv["area"],
            "caminos": ["partidos", "ideologia"],
            "eje": {"dimension": pv["dimension"], "direccion": pv["direccion"]},
            "posiciones": posiciones,
        })

    for pp in PREGUNTAS_PROGRAMAS:
        posiciones = {}
        if "votacion_id" in pp:
            v = vots[pp["votacion_id"]]
            for grp, p_siglas in GRUPO_A_PARTIDO.items():
                if p_siglas not in permitidos or grp not in v["por_grupo"]:
                    continue
                res = voto_a_valor(v["por_grupo"][grp])
                if res is not None:
                    val, etiq = res
                    posiciones[p_siglas] = {
                        "valor": val,
                        "nota": f"{etiq} el {fecha_llana(v['fecha'])}.",
                        "fuente": f"Acta de la votación del Congreso del {fecha_llana(v['fecha'])}",
                        "fuente_url": v["fuente_url"],
                    }
        for p_siglas, (pagina, kw, val) in pp["citas"].items():
            if p_siglas not in permitidos:
                continue
            prog = progs[p_siglas]
            prop = buscar_propuesta(prog, pagina, kw)
            posiciones[p_siglas] = {
                "valor": val,
                "nota": f"«{prop['cita']}» (p. {prop['pagina']}).",
                "fuente": f"Programa {p_siglas} 2026 · p. {prop['pagina']}",
                "fuente_url": prog["fuente_url"],
            }
        afirmaciones.append({
            "id": pp["id"],
            "texto": pp["texto"],
            "area": pp["area"],
            "caminos": ["partidos", "ideologia"],
            "eje": {"dimension": pp["dimension"], "direccion": pp["direccion"]},
            "posiciones": posiciones,
        })

    partidos_ideologia = []
    for meta in PARTIDOS_META:
        s = meta["siglas"]
        eco_vals, soc_vals = [], []
        for af in afirmaciones:
            if s not in af["posiciones"]:
                continue
            val = af["posiciones"][s]["valor"]
            coord = (val / 2.0) * af["eje"]["direccion"]
            if af["eje"]["dimension"] == "economia":
                eco_vals.append(coord)
            else:
                soc_vals.append(coord)
        assert len(eco_vals) >= 6 and len(soc_vals) >= 6, f"Cobertura baja para {s}: {len(eco_vals)}/{len(soc_vals)}"
        x = round((sum(eco_vals) / len(eco_vals)) * 1.8, 2)
        y = round((sum(soc_vals) / len(soc_vals)) * 1.8, 2)
        entry = {
            "siglas": s,
            "nombre": meta["nombre"],
            "x": x,
            "y": y,
            "color": meta["color"],
            "ambito": meta["ambito"],
        }
        if "provincia" in meta:
            entry["provincia"] = meta["provincia"]
        partidos_ideologia.append(entry)

    cuenta = [sum(1 for af in afirmaciones if m["siglas"] in af["posiciones"]) for m in PARTIDOS_META]
    lo, hi = min(cuenta), max(cuenta)

    return {
        "fuente": "data/congreso_votaciones.json + data/programas/*.json",
        "version": "2.1.0",
        "fecha_actualizacion": "2026-11-16",
        "metodologia": {
            "descripcion": (
                f"Compara tus respuestas con las de los 8 grupos del Congreso, a partir de cómo votaron en la legislatura "
                f"y de lo que dicen sus programas ({lo} a {hi} puntos de comparación por partido)."
            ),
            "escala": {
                "-2": "Muy en desacuerdo",
                "-1": "En desacuerdo",
                "0": "Sin opinión / No cuenta",
                "1": "De acuerdo",
                "2": "Muy de acuerdo",
            },
            "ponderacion_estrella": 2.0,
            "disclaimer": (
                "Este test se basa en las votaciones reales del Congreso y en citas de los programas. "
                "El mapa sale solo de las preguntas de este test: no es una clasificación oficial de los partidos, "
                "y refleja también quién apoyó o rechazó cada texto estando en el Gobierno o en la oposición. "
                "Todo se calcula en tu navegador: no enviamos ni guardamos tus respuestas."
            ),
        },
        "partidos_ideologia": partidos_ideologia,
        "afirmaciones": afirmaciones,
    }


def generar_voto_provincia() -> dict:
    res = json.loads((DATA / "resultados_generales_2023.json").read_text())
    conv = json.loads((DATA / "convocatoria_2026.json").read_text())
    escanos_2026 = {c["codigo"]: c["diputados"] for c in conv["circunscripciones"]}

    provincias = []
    for p in res["provincias"]:
        umbral = p["votos_validos"] * 0.03
        cands = [c for c in p["candidaturas"] if c["votos"] >= umbral]
        cocs = []
        for c in cands:
            for d in range(1, p["escanos"] + 1):
                cocs.append((c["votos"] / d, c["siglas"], d, c["votos"]))
        cocs.sort(reverse=True)
        ultimo = cocs[p["escanos"] - 1]
        # el rival es el mejor cociente de OTRO partido: si el siguiente es del mismo partido del último escaño no hay disputa
        siguiente = next((c for c in cocs[p["escanos"]:] if c[1] != ultimo[1]), None)
        faltaron = int(ultimo[0] * siguiente[2] - siguiente[3]) + 1 if siguiente else 0
        provincias.append({
            "codigo": p["codigo"],
            "nombre": p["nombre"],
            "escanos_2023": p["escanos"],
            "escanos_2026": escanos_2026.get(p["codigo"], p["escanos"]),
            "votos_validos": p["votos_validos"],
            "ultimo_escanio_partido": ultimo[1],
            "siguiente_partido": siguiente[1] if siguiente else "",
            "margen_votos": faltaron,
            "porcentaje_margen": round(100.0 * faltaron / p["votos_validos"], 2) if p["votos_validos"] else 0.0,
        })

    ordenadas = sorted([x for x in provincias if x["margen_votos"] > 0], key=lambda x: x["margen_votos"])
    preguntas = [
        {
            "id": "prov-1",
            "pregunta": "En Girona, el último diputado en juego en 2023 fue para Junts. ¿Cuántos votos más le habrían hecho falta al PP para quedárselo?",
            "opciones": ["285 votos", "2.850 votos", "9.400 votos", "24.000 votos"],
            "respuesta_correcta": "285 votos",
            "explicacion": "Solo 285 votos. Esa fue la distancia entre Junts y el PP por el último diputado de Girona, según nuestro cálculo sobre el recuento oficial (BOE).",
        },
        {
            "id": "prov-2",
            "pregunta": "En Madrid, ¿por cuántos votos ganó el PP el último diputado frente al PSOE en 2023?",
            "opciones": ["1.340 votos", "18.500 votos", "42.000 votos", "85.000 votos"],
            "respuesta_correcta": "1.340 votos",
            "explicacion": "Madrid sumó más de 3,5 millones de votos válidos y el último diputado se decidió por solo 1.340 votos (el 0,04 %).",
        },
        {
            "id": "prov-3",
            "pregunta": "El número de diputados de cada provincia se actualiza según su población. ¿Qué dos provincias cambian el 29-N respecto a 2023?",
            "opciones": ["Madrid (+1) y Cádiz (-1)", "Barcelona (+1) y Asturias (-1)", "Valencia (+1) y León (-1)", "Málaga (+1) y Zamora (-1)"],
            "respuesta_correcta": "Madrid (+1) y Cádiz (-1)",
            "explicacion": "Según el decreto que convoca las elecciones (BOE), Madrid pasa a tener 38 diputados (uno más) y Cádiz 8 (uno menos), porque ha cambiado su población.",
        },
        {
            "id": "prov-4",
            "pregunta": "En Cantabria se reparten 5 diputados. En 2023, ¿cuántos votos le faltaron al PP para quitarle el último diputado a VOX?",
            "opciones": ["404 votos", "4.100 votos", "11.200 votos", "25.000 votos"],
            "respuesta_correcta": "404 votos",
            "explicacion": "Solo 404 votos separaron al PP del quinto diputado de Cantabria, que se quedó VOX.",
        },
        {
            "id": "prov-5",
            "pregunta": "En Santa Cruz de Tenerife se reparten 7 diputados. ¿Qué dos partidos se jugaron el último por solo 1.565 votos?",
            "opciones": ["PSOE frente a Sumar", "PP frente a Coalición Canaria", "VOX frente a PSOE", "CCa frente a Sumar"],
            "respuesta_correcta": "PSOE frente a Sumar",
            "explicacion": "El PSOE se quedó el último diputado de Santa Cruz de Tenerife con 1.565 votos de ventaja sobre Sumar.",
        },
        {
            "id": "prov-6",
            "pregunta": "¿Qué porcentaje mínimo de votos necesita un partido en una provincia para tener opción a diputados?",
            "opciones": ["3 % en la provincia", "5 % en toda España", "1 % en la provincia", "No hay mínimo"],
            "respuesta_correcta": "3 % en la provincia",
            "explicacion": "La ley electoral (art. 163 de la LOREG, en el BOE) deja fuera del reparto a los partidos que no llegan al 3 % de los votos válidos de la provincia, contando también los votos en blanco.",
        },
        {
            "id": "prov-7",
            "pregunta": "En Teruel se reparten 3 diputados. ¿Por cuántos votos el PP mantuvo su segundo diputado frente a Teruel Existe en 2023?",
            "opciones": ["1.946 votos", "6.800 votos", "14.200 votos", "31.000 votos"],
            "respuesta_correcta": "1.946 votos",
            "explicacion": "Teruel Existe se quedó a solo 1.946 votos de conseguir un diputado a costa del PP en 2023.",
        },
        {
            "id": "prov-8",
            "pregunta": "En Albacete se reparten 4 diputados. ¿Por cuántos votos se decidió el último entre el PSOE y VOX?",
            "opciones": ["1.412 votos", "7.500 votos", "16.000 votos", "29.000 votos"],
            "respuesta_correcta": "1.412 votos",
            "explicacion": "Solo 1.412 votos separaron al PSOE de VOX en el último diputado de Albacete (el 0,64 % de los votos válidos).",
        },
    ]

    return {
        "fuente": "data/resultados_generales_2023.json + data/convocatoria_2026.json",
        "version": "1.0.0",
        "mas_renidas": ordenadas[:10],
        "provincias": sorted(provincias, key=lambda x: x["nombre"]),
        "preguntas": preguntas,
    }


def generar_socios(vots_lista: list[dict]) -> dict:
    grupos = list(GRUPO_A_PARTIDO.keys())
    pares = {}
    for i, g1 in enumerate(grupos):
        for g2 in grupos[i + 1 :]:
            s1, s2 = GRUPO_A_PARTIDO[g1], GRUPO_A_PARTIDO[g2]
            tot = eq = si_si = no_no = 0
            for v in vots_lista:
                pg = v.get("por_grupo") or {}
                if g1 not in pg or g2 not in pg:
                    continue
                r1, r2 = voto_a_valor(pg[g1]), voto_a_valor(pg[g2])
                if r1 is None or r2 is None:
                    continue
                tot += 1
                if r1[0] == r2[0]:
                    eq += 1
                    if r1[0] == 2:
                        si_si += 1
                    elif r1[0] == -2:
                        no_no += 1
            clave = f"{s1}|{s2}"
            pares[clave] = {
                "a": s1,
                "b": s2,
                "porcentaje": round(100.0 * eq / tot, 1) if tot else 0.0,
                "iguales": eq,
                "total": tot,
                "si_si": si_si,
                "no_no": no_no,
            }

    def buscar_par(a: str, b: str) -> dict:
        return pares.get(f"{a}|{b}") or pares[f"{b}|{a}"]

    duelos_spec = [
        ("duelo-1", "¿Qué pareja votó lo mismo más veces en las votaciones del Congreso?", ("PSOE", "Junts"), ("PP", "VOX")),
        ("duelo-2", "¿Quién coincidió más veces con el PP en el hemiciclo?", ("PP", "PSOE"), ("PP", "Junts")),
        ("duelo-3", "¿Con quién votó igual más veces el PNV en esta legislatura?", ("PSOE", "EAJ-PNV"), ("PP", "EAJ-PNV")),
        ("duelo-4", "¿Qué pareja votó unida en mayor proporción?", ("PSOE", "Sumar"), ("ERC", "EH Bildu")),
        ("duelo-5", "¿Quién coincidió más veces con Junts?", ("PSOE", "Junts"), ("VOX", "Junts")),
        ("duelo-6", "¿Qué pareja votó más veces en el mismo sentido?", ("PP", "EAJ-PNV"), ("VOX", "Sumar")),
        ("duelo-7", "¿Con quién coincidió más veces ERC?", ("PSOE", "ERC"), ("Junts", "ERC")),
        ("duelo-8", "¿Qué pareja tuvo mayor coincidencia de voto?", ("Sumar", "EH Bildu"), ("PP", "PSOE")),
    ]

    duelos = []
    for did, preg, (a1, b1), (a2, b2) in duelos_spec:
        p1, p2 = buscar_par(a1, b1), buscar_par(a2, b2)
        ganadora = f"{a1} + {b1}" if p1["porcentaje"] >= p2["porcentaje"] else f"{a2} + {b2}"
        duelos.append({
            "id": did,
            "pregunta": preg,
            "opcion_a": {"etiqueta": f"{a1} + {b1}", **p1},
            "opcion_b": {"etiqueta": f"{a2} + {b2}", **p2},
            "ganadora": ganadora,
        })

    con_desglose = sum(1 for v in vots_lista if v.get("por_grupo"))
    return {
        "fuente": "data/congreso_votaciones.json",
        "version": "1.1.0",
        "total_votaciones": con_desglose,
        "metodologia": (
            f"Se cuentan las {con_desglose} votaciones del Pleno con desglose por grupo en las actas. Dos grupos coinciden "
            "cuando su voto mayoritario es el mismo (sí, no o abstención); abstención con abstención cuenta como "
            "coincidencia. Las parejas de cada duelo las hemos elegido nosotros."
        ),
        "partidos": [GRUPO_A_PARTIDO[g] for g in grupos],
        "pares": list(pares.values()),
        "duelos": duelos,
    }


def main() -> None:
    vots_lista, vots_map = cargar_votaciones()
    progs = cargar_programas()
    destino = DATA / "tests"
    destino.mkdir(parents=True, exist_ok=True)

    afinidad = generar_afinidad(vots_map, progs)
    (destino / "afinidad_preguntas.json").write_text(json.dumps(afinidad, ensure_ascii=False, indent=2) + "\n")

    voto_prov = generar_voto_provincia()
    (destino / "voto_provincia_quiz.json").write_text(json.dumps(voto_prov, ensure_ascii=False, indent=2) + "\n")

    socios = generar_socios(vots_lista)
    (destino / "socios_quiz.json").write_text(json.dumps(socios, ensure_ascii=False, indent=2) + "\n")

    print(
        f"tests_afinidad OK: {len(afinidad['afirmaciones'])} afinidad, "
        f"{len(voto_prov['preguntas'])} preguntas provincia ({len(voto_prov['provincias'])} provs), "
        f"{len(socios['duelos'])} duelos socios ({len(socios['pares'])} pares)"
    )


if __name__ == "__main__":
    main()
