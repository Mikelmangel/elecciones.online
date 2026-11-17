"""Descarga las candidaturas proclamadas (BOE-A-2026-23103) y su corrección (BOE-A-2026-23383) en XML."""
import time
import urllib.request
from pathlib import Path

IDS = ["BOE-A-2026-23103", "BOE-A-2026-23383"]
RAW_DIR = Path(__file__).parent / "raw"


def fetch_id(doc_id: str) -> Path:
    out = RAW_DIR / f"{doc_id}.xml"
    if out.exists():
        print("ya descargado:", out.name)
        return out
    RAW_DIR.mkdir(exist_ok=True)
    url = f"https://www.boe.es/diario_boe/xml.php?id={doc_id}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    body = urllib.request.urlopen(req, timeout=60).read()
    assert body.lstrip().startswith(b"<?xml"), f"{doc_id} no es XML"
    out.write_bytes(body)
    print("descargado:", out.name, len(body))
    return out


if __name__ == "__main__":
    for i, doc_id in enumerate(IDS):
        if i > 0:
            time.sleep(2)
        fetch_id(doc_id)
