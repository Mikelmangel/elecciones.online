"""Códigos INE de las 52 circunscripciones. `codigo_de(nombre)` tolera las variantes oficiales
("Alicante/Alacant", "Balears (Illes)", "Coruña (A)", "Rioja (La)")."""
import unicodedata

PROVINCIAS = {
    "01": "Araba/Álava", "02": "Albacete", "03": "Alicante/Alacant", "04": "Almería", "05": "Ávila",
    "06": "Badajoz", "07": "Illes Balears", "08": "Barcelona", "09": "Burgos", "10": "Cáceres",
    "11": "Cádiz", "12": "Castellón/Castelló", "13": "Ciudad Real", "14": "Córdoba", "15": "A Coruña",
    "16": "Cuenca", "17": "Girona", "18": "Granada", "19": "Guadalajara", "20": "Gipuzkoa",
    "21": "Huelva", "22": "Huesca", "23": "Jaén", "24": "León", "25": "Lleida", "26": "La Rioja",
    "27": "Lugo", "28": "Madrid", "29": "Málaga", "30": "Murcia", "31": "Navarra", "32": "Ourense",
    "33": "Asturias", "34": "Palencia", "35": "Las Palmas", "36": "Pontevedra", "37": "Salamanca",
    "38": "Santa Cruz de Tenerife", "39": "Cantabria", "40": "Segovia", "41": "Sevilla", "42": "Soria",
    "43": "Tarragona", "44": "Teruel", "45": "Toledo", "46": "Valencia/València", "47": "Valladolid",
    "48": "Bizkaia", "49": "Zamora", "50": "Zaragoza", "51": "Ceuta", "52": "Melilla",
}

# Palabra distintiva de cada provincia, ya normalizada. El orden importa poco: son únicas.
_CLAVES = {
    "01": ("alava", "araba"), "03": ("alicante", "alacant"), "07": ("balears", "baleares"),
    "12": ("castellon", "castello"), "13": ("ciudad real",), "15": ("coruna",),
    "17": ("girona", "gerona"), "20": ("gipuzkoa", "guipuzcoa"), "25": ("lleida", "lerida"),
    "26": ("rioja",), "31": ("navarra",), "32": ("ourense", "orense"), "35": ("palmas",),
    "38": ("tenerife",), "46": ("valencia",), "48": ("bizkaia", "vizcaya"),
}


def _norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if c.isalpha() or c == " ").strip()


def codigo_de(nombre: str) -> str:
    n = _norm(nombre)
    for cod, claves in _CLAVES.items():
        if any(k in n for k in claves):
            return cod
    for cod, oficial in PROVINCIAS.items():
        if cod not in _CLAVES and _norm(oficial) == n:
            return cod
    raise KeyError(f"provincia desconocida: {nombre!r}")
