"""Ficheros del Banco de España y del INE -> data/estadisticas_oficiales.json."""
import csv
import hashlib
import io
import json
from datetime import datetime, timezone
from pathlib import Path

from fetch import FUENTES

RAIZ = Path(__file__).resolve().parents[3]
RAW = Path(__file__).parent / "raw"
OUT = RAIZ / "data" / "estadisticas_oficiales.json"
MESES = {"MAR": "03", "JUN": "06", "SEP": "09", "DIC": "12"}
# fichero -> (nombre de la fuente, función que da el id propio a partir del código y la descripción)
CCAA = lambda pref: lambda cod, desc: f"{pref}:{desc.split('CCAA. ')[1].split('. Deuda')[0]}" if cod.count("_") == 4 else None  # noqa: E731
BDE = {
    "be1101.csv": ("Banco de España · Boletín Estadístico, cuadro 11.1",
                   lambda cod, desc: {"DTNPDE2010_P00000_PS_APU": "deuda_pde_aapp"}.get(cod)),
    "be1309.csv": ("Banco de España · Boletín Estadístico, cuadro 13.9", CCAA("deuda_ccaa_eur")),
    "be1310.csv": ("Banco de España · Boletín Estadístico, cuadro 13.10", CCAA("deuda_ccaa_pib")),
}
INE = {"ECP9221.json": "poblacion_total", "ECP5381.json": "poblacion_nacida_extranjero"}


def parse_bde(raw: bytes, ident) -> dict[str, dict]:
    filas = [f for f in csv.reader(io.StringIO(raw.decode("latin-1"))) if f]
    cab = {f[0]: f for f in filas}
    out = {}
    for col, codigo in enumerate(cab["CÓDIGO DE LA SERIE"]):
        sid = ident(codigo, cab["DESCRIPCIÓN DE LA SERIE"][col]) if col else None
        if not sid:
            continue
        puntos = {}
        for f in filas:
            mes, _, anyo = f[0].partition(" ")
            if mes in MESES and anyo.isdigit() and col < len(f):
                try:
                    puntos[f"{anyo}-{MESES[mes]}"] = float(f[col]) if "." in f[col] else int(f[col])
                except ValueError:
                    pass  # "_" = sin dato
        out[sid] = {"codigo": codigo, "nombre": cab["DESCRIPCIÓN DE LA SERIE"][col],
                    "unidad": cab["DESCRIPCIÓN DE LAS UNIDADES"][col], "puntos": puntos}
    return out


def parse_ine(raw: bytes) -> dict:
    d = json.loads(raw)
    puntos = {x["Fecha"][:7]: x["Valor"] for x in d["Data"] if x["Valor"] is not None}
    return {"codigo": d["COD"], "nombre": d["Nombre"].strip(), "unidad": "Personas", "puntos": dict(sorted(puntos.items()))}


def main() -> None:
    ahora = datetime.now(timezone.utc).isoformat(timespec="seconds")
    series = {}

    def procedencia(fichero: str, raw: bytes, nombre: str) -> dict:
        return {"fuente_nombre": nombre, "fuente_url": FUENTES[fichero], "fetched_at": ahora,
                "sha256": hashlib.sha256(raw).hexdigest()}

    for fichero, (nombre, ident) in BDE.items():
        raw = (RAW / fichero).read_bytes()
        for sid, s in parse_bde(raw, ident).items():
            series[sid] = {**s, **procedencia(fichero, raw, nombre)}
    for fichero, sid in INE.items():
        raw = (RAW / fichero).read_bytes()
        series[sid] = {**parse_ine(raw), **procedencia(fichero, raw, "INE · Estadística Continua de Población")}
    OUT.write_text(json.dumps({"series": series}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"estadisticas_oficiales: {len(series)} series")


if __name__ == "__main__":
    main()
