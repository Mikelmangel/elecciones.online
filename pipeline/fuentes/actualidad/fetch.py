"""Descarga cada feed de fuentes.json a raw/<id>.xml. Un feed caído avisa y no detiene el resto."""
import json
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw"
UA = "Mozilla/5.0 (X11; Linux x86_64) elecciones.online-lector-de-feeds"


def main() -> None:
    RAW.mkdir(exist_ok=True)
    fallos = 0
    for f in json.loads((HERE / "fuentes.json").read_text(encoding="utf-8"))["fuentes"]:
        try:
            req = urllib.request.Request(f["url"], headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=20) as r:
                (RAW / f"{f['id']}.xml").write_bytes(r.read())
        except Exception as e:  # frontera de red: se registra y se sigue con lo ya descargado
            fallos += 1
            print(f"AVISO actualidad: {f['id']} no descargado ({e})")
        time.sleep(1)
    print(f"actualidad: {fallos} fuentes con fallo")


if __name__ == "__main__":
    main()
