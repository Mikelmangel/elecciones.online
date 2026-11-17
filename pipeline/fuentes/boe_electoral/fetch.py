"""Descarga sumarios diarios del BOE vía API de Datos Abiertos (boe.es)."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
import urllib.error
import urllib.request

RAW_DIR = Path(__file__).resolve().parent / "data" / "raw"
API_URL = "https://www.boe.es/datosabiertos/api/boe/sumario/{ymd}"


def fetch_sumario(ymd: str) -> tuple[bytes, str] | None:
    url = API_URL.format(ymd=ymd)
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "elecciones.online/1.0 (+https://elecciones.online)",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            if resp.status != 200:
                return None
            return resp.read(), url
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            # Domingos o festivos sin edición del BOE
            return None
        raise


def main() -> None:
    parser = argparse.ArgumentParser(description="Descarga sumarios del BOE")
    parser.add_argument("--dias", type=int, default=21, help="Días hacia atrás desde hoy")
    args = parser.parse_args()

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    hoy = date.today()
    descargados = 0

    for offset in range(args.dias):
        d = hoy - timedelta(days=offset)
        ymd = d.strftime("%Y%m%d")
        dest = RAW_DIR / f"{ymd}.json"
        meta_dest = RAW_DIR / f"{ymd}.meta.json"
        if dest.exists() and meta_dest.exists() and offset > 1:
            continue
        res = fetch_sumario(ymd)
        if res is None:
            continue
        raw_bytes, url = res
        dest.write_bytes(raw_bytes)
        meta = {
            "ymd": ymd,
            "fuente_url": url,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "sha256": hashlib.sha256(raw_bytes).hexdigest(),
        }
        meta_dest.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
        descargados += 1

    print(f"boe_electoral fetch: {descargados} sumarios actualizados en {RAW_DIR}")


if __name__ == "__main__":
    main()
