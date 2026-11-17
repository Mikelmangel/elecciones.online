"""raw/ -> data/resultados_generales_2023.json

Cuadro I (censo, votantes, válidos, blanco, nulos) solo está como texto en el PDF (en el XML es una imagen) -> pdftotext.
Cuadros II (con escaño) y III (sin escaño) vienen como tablas en el XML.
"""
import json, re, subprocess
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

AQUI = Path(__file__).parent
RAW = AQUI / "raw"
SALIDA = AQUI.parents[2] / "data" / "resultados_generales_2023.json"
ID = "BOE-A-2023-18907"

# Nombre normalizado (como lo escribe el BOE en el Cuadro I) -> código INE
PROVINCIAS = {n: f"{i:02d}" for i, n in enumerate([
    "Araba/Álava", "Albacete", "Alicante/Alacant", "Almería", "Ávila", "Badajoz", "Balears (Illes)", "Barcelona",
    "Burgos", "Cáceres", "Cádiz", "Castellón/Castelló", "Ciudad Real", "Córdoba", "Coruña (A)", "Cuenca", "Girona",
    "Granada", "Guadalajara", "Gipuzkoa", "Huelva", "Huesca", "Jaén", "León", "Lleida", "Rioja (La)", "Lugo", "Madrid",
    "Málaga", "Murcia", "Navarra", "Ourense", "Asturias", "Palencia", "Palmas (Las)", "Pontevedra", "Salamanca",
    "Santa Cruz de Tenerife", "Cantabria", "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo",
    "Valencia/València", "Valladolid", "Bizkaia", "Zamora", "Zaragoza", "Ceuta", "Melilla"], start=1)}
NUM = re.compile(r"\d{1,3}(?:\.\d{3})*")


def num(s: str) -> int | None:
    s = s.replace("\xa0", " ").strip().rstrip(".").strip()  # el BOE tiene typos como "9.938."
    if not s:
        return None
    if not NUM.fullmatch(s):
        raise ValueError(f"número no válido: {s!r}")
    return int(s.replace(".", ""))


def norm(n: str) -> str:
    n = re.sub(r"\s+", " ", n.replace("\xa0", " ")).strip().rstrip(".")
    return re.sub(r"/ ", "/", n)


def parse_cuadro1(texto: str) -> dict[str, dict]:
    out = {}
    for l in texto.splitlines():
        m = re.match(r"^\s*(\D.*?)\s{2,}((?:\d{1,3}(?:\.\d{3})*\s+){5}\d{1,3}(?:\.\d{3})*)\s*$", l)
        if m and norm(m[1]) in PROVINCIAS:
            e, v, val, cand, bl, nul = (num(x) for x in m[2].split())
            out[norm(m[1])] = dict(censo=e, votantes=v, votos_validos=val, votos_candidaturas=cand, votos_blanco=bl, votos_nulos=nul)
    return out


def partido(th: str) -> tuple[str, str]:
    """'Partido Popular (PP)' -> ('PP', 'Partido Popular'). Siglas = último paréntesis."""
    t = re.sub(r"\s+", " ", th.replace("\xa0", " ")).strip().rstrip(".")
    m = re.fullmatch(r"(.*) \(([^()]*)\)", t)
    return (m[2], m[1].strip()) if m else (t, t)


def parse_tablas(xml: bytes):
    """Devuelve (escanos_prov, votos[(prov, siglas)] , nombres{siglas: set(nombre)}, orden_partidos, totales_estatales)"""
    root = ET.fromstring(xml)
    esc, votos, nombres, totales = {}, {}, defaultdict(set), {}
    for t in root.find("texto").iter("table"):
        head = t.find("thead/tr")
        ths = [("".join(th.itertext())) for th in head]
        con_escanos = "Total escaños" in ths
        ps = [partido(h) for h in ths if h.strip() and h != "Total escaños"]
        for tr in t.findall("tbody/tr"):
            c = ["".join(td.itertext()) for td in tr]
            nombre = norm(c[0])
            if nombre == "Total estatal":
                f = 2 if con_escanos else 1
                for k, (s, _) in enumerate(ps):
                    sl = c[f + k * 2: f + k * 2 + 2] if con_escanos else [c[f + k], None]
                    totales[s] = (num(sl[0]), num(sl[1]) if sl[1] is not None else 0)
                continue
            prov = PROVINCIAS[nombre]
            if con_escanos:
                esc[prov] = int(c[1])
            for k, (s, n) in enumerate(ps):
                if con_escanos:
                    v, e = num(c[2 + 2 * k]), num(c[3 + 2 * k])
                    if (v is None) != (e is None):
                        raise ValueError(f"{nombre}/{s}: votos/escaños incompletos")
                else:
                    v, e = num(c[1 + k]), 0
                if v is not None:
                    votos[(prov, s)] = (v, e)
                    nombres[s].add(n)
    return esc, votos, nombres, totales


def main() -> None:
    man = json.loads((RAW / "manifest.json").read_text())
    xml = (RAW / f"{ID}.xml").read_bytes()
    pdf = RAW / f"{ID}.pdf"
    txt = subprocess.run(["pdftotext", "-layout", "-f", "2", "-l", "2", str(pdf), "-"], capture_output=True, text=True, check=True).stdout
    c1 = parse_cuadro1(txt)
    esc, votos, nombres, totales = parse_tablas(xml)
    assert len(c1) == 52 and len(esc) == 52, (len(c1), len(esc))
    cod2nom = {v: k for k, v in PROVINCIAS.items()}
    provincias = []
    for cod in sorted(cod2nom):
        d = c1[cod2nom[cod]]
        cands = [{"siglas": s, "nombre": sorted(nombres[s])[0], "votos": v, "escanos": e}
                 for (p, s), (v, e) in votos.items() if p == cod]
        cands.sort(key=lambda c: (-c["votos"], c["siglas"]))
        provincias.append({"codigo": cod, "nombre": cod2nom[cod], "escanos": esc[cod], "censo": d["censo"],
                           "votantes": d["votantes"], "votos_validos": d["votos_validos"], "votos_blanco": d["votos_blanco"],
                           "votos_nulos": d["votos_nulos"], "votos_candidaturas": d["votos_candidaturas"], "candidaturas": cands})
    nac = defaultdict(lambda: [0, 0])
    for (p, s), (v, e) in votos.items():
        nac[s][0] += v
        nac[s][1] += e
    nacional = sorted(({"siglas": s, "votos": v, "escanos": e} for s, (v, e) in nac.items()), key=lambda x: (-x["votos"], x["siglas"]))
    pdf_m, xml_m = man[f"{ID}.pdf"], man[f"{ID}.xml"]
    out = {"fuente": "boe_jec", "eleccion": "generales", "fecha": "2023-07-23",
           "generado": datetime.now(timezone.utc).isoformat(timespec="seconds"),
           "boe_id": ID, "fuente_url": pdf_m["url"], "fetched_at": pdf_m["fetched_at"], "sha256": pdf_m["sha256"],
           "fuente_xml_url": xml_m["url"], "sha256_xml": xml_m["sha256"],
           "provincias": provincias, "nacional": nacional}
    SALIDA.parent.mkdir(exist_ok=True)
    SALIDA.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print(f"{SALIDA}: {len(provincias)} provincias, {len(nacional)} siglas")


if __name__ == "__main__":
    main()
