#!/usr/bin/env python3
"""Vuelve a descargar los programas de data/programas/_fuentes.json a raw/ y avisa si cambia el sha256."""
import hashlib, json, pathlib, sys, time, urllib.request
from urllib.parse import urlparse

AQUI = pathlib.Path(__file__).parent
FUENTES = AQUI.parents[2] / "data/programas/_fuentes.json"
UA = "Mozilla/5.0 (X11; Linux x86_64) elecciones.online"

def main() -> int:
    cambios = 0
    ultimo: dict[str, float] = {}
    for p in json.loads(FUENTES.read_text())["programas"]:
        if p["estado"] != "descargado":
            continue
        dom = urlparse(p["fuente_url"]).netloc
        time.sleep(max(0, 3 - (time.time() - ultimo.get(dom, 0))))  # pausa por dominio
        dest = AQUI / "raw" / (p["siglas"].lower().replace(" ", "") + ".pdf")
        ultimo[dom] = time.time()
        req = urllib.request.Request(p["fuente_url"], headers={"User-Agent": UA})
        try:
            data = urllib.request.urlopen(req, timeout=180).read()
        except OSError as e:  # el partido movió o retiró el PDF: el programa ya extraído sigue valiendo
            print(f"AVISO {p['siglas']}: no se pudo descargar ({e}); revisar fuente_url"); continue
        if not data.startswith(b"%PDF"):
            print(f"ERROR {p['siglas']}: no es un PDF"); cambios += 1; continue
        sha = hashlib.sha256(data).hexdigest()
        if sha != p["sha256"]:
            print(f"CAMBIO {p['siglas']}: sha256 {p['sha256'][:12]} -> {sha[:12]} (revisar y regenerar _fuentes.json)")
            cambios += 1
        if not dest.exists() or hashlib.sha256(dest.read_bytes()).hexdigest() != sha:
            dest.write_bytes(data)
        else:
            print(f"ok {p['siglas']}")
    # aviso, no fallo: un cambio de PDF exige re-extraer a mano, no debe parar el resto del ciclo
    print(f"programas: {cambios} cambios o errores")
    return 0

if __name__ == "__main__":
    sys.exit(main())
