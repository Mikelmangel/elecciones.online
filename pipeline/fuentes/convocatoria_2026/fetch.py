"""Descarga el RD 806/2026 de convocatoria (BOE-A-2026-20742) en XML. Idempotente."""
import urllib.request
from pathlib import Path

ID = "BOE-A-2026-20742"
URL = f"https://www.boe.es/diario_boe/xml.php?id={ID}"
OUT = Path(__file__).parent / "raw" / f"{ID}.xml"

if __name__ == "__main__":
    if OUT.exists():
        print("ya descargado:", OUT.name)
    else:
        OUT.parent.mkdir(exist_ok=True)
        req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
        body = urllib.request.urlopen(req, timeout=30).read()
        assert body.lstrip().startswith(b"<?xml"), "no es XML"
        OUT.write_bytes(body)
        print("descargado:", OUT.name, len(body))
