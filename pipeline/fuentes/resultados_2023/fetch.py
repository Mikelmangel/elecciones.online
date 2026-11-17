"""Descarga a raw/ la Resolución de la JEC (BOE-A-2023-18907) en XML + PDF, y la corrección BOE-A-2023-19537.
Idempotente: si el fichero existe con contenido válido, no lo vuelve a bajar. Escribe raw/manifest.json."""
import hashlib, json, time, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

RAW = Path(__file__).parent / "raw"
PRINCIPAL = "BOE-A-2023-18907"
CORRECCION = "BOE-A-2023-19537"  # solo corrige un dato del Senado (Madrid); no afecta al Congreso
FICHEROS = {
    f"{PRINCIPAL}.xml": f"https://www.boe.es/diario_boe/xml.php?id={PRINCIPAL}",
    f"{PRINCIPAL}.pdf": f"https://www.boe.es/boe/dias/2023/09/01/pdfs/{PRINCIPAL}.pdf",
    f"{CORRECCION}.xml": f"https://www.boe.es/diario_boe/xml.php?id={CORRECCION}",
}


def _valido(nombre: str, datos: bytes) -> bool:
    if nombre.endswith(".pdf"):
        return datos.startswith(b"%PDF")
    try:
        ET.fromstring(datos)
        return True
    except ET.ParseError:
        return False


def main() -> None:
    RAW.mkdir(exist_ok=True)
    manifest = {}
    for i, (nombre, url) in enumerate(FICHEROS.items()):
        destino = RAW / nombre
        if destino.exists() and _valido(nombre, destino.read_bytes()):
            datos, ft = destino.read_bytes(), None
        else:
            if i:
                time.sleep(2)
            datos = urllib.request.urlopen(url, timeout=60).read()
            if not _valido(nombre, datos):
                raise SystemExit(f"{url}: contenido no válido")
            destino.write_bytes(datos)
            ft = datetime.now(timezone.utc).isoformat(timespec="seconds")
        prev = json.loads((RAW / "manifest.json").read_text()).get(nombre, {}) if (RAW / "manifest.json").exists() else {}
        manifest[nombre] = {"url": url, "sha256": hashlib.sha256(datos).hexdigest(),
                            "fetched_at": ft or prev.get("fetched_at") or datetime.fromtimestamp(destino.stat().st_mtime, timezone.utc).isoformat(timespec="seconds")}
    (RAW / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
