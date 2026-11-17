"""Descarga las series oficiales de FUENTES a raw/. Ficheros públicos de datos abiertos."""
import urllib.request
from pathlib import Path

RAW = Path(__file__).resolve().parent / "raw"
BDE = "https://www.bde.es/webbe/es/estadisticas/compartido/datos/csv/"
INE = "https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/"
FUENTES = {
    # Banco de España, Boletín Estadístico: deuda según el Protocolo de Déficit Excesivo (trimestral)
    "be1101.csv": BDE + "be1101.csv",   # 11.1 total AAPP
    "be1309.csv": BDE + "be1309.csv",   # 13.9 por comunidad autónoma, miles de euros
    "be1310.csv": BDE + "be1310.csv",   # 13.10 por comunidad autónoma, % del PIB
    # INE, Estadística Continua de Población (trimestral)
    "ECP9221.json": INE + "ECP9221?nult=12&tip=A",  # población residente, total nacional
    "ECP5381.json": INE + "ECP5381?nult=12&tip=A",  # población residente nacida en el extranjero
}


def main() -> None:
    RAW.mkdir(exist_ok=True)
    for nombre, url in FUENTES.items():
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 elecciones.online"})
        with urllib.request.urlopen(req, timeout=60) as r:
            datos = r.read()
        if (b"SERIE" if nombre.endswith(".csv") else b'"COD"') not in datos[:200]:
            raise SystemExit(f"estadisticas_oficiales: {nombre} no tiene el formato esperado")
        (RAW / nombre).write_bytes(datos)
    print(f"estadisticas_oficiales: {len(FUENTES)} ficheros descargados")


if __name__ == "__main__":
    main()
