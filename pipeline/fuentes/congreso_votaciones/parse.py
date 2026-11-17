"""raw/zips/*.zip -> data/congreso_votaciones.json (agregado por grupo, sin voto nominal).

Se lee el JSON de cada votacion (el XML y el PDF del zip se ignoran). Usa solo la libreria estandar.
"""
import hashlib
import json
import re
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path

AQUI = Path(__file__).parent
RAW = AQUI / "raw"
SALIDA = AQUI.parents[2] / "data" / "congreso_votaciones.json"
JSON_RE = re.compile(r"sesion(\d+)votacion(\d+)\.json$")
# valores de "voto" tal como vienen en el fichero oficial -> clave de salida
VOTOS = {"Sí": "si", "No": "no", "Abstención": "abstencion", "No vota": "no_vota"}


def fecha_iso(s: str) -> str:
    d, m, a = s.split("/")
    return f"{int(a):04d}-{int(m):02d}-{int(d):02d}"


def parse_votacion(raw: bytes, *, sesion: int, numero: int, fuente_url: str, fetched_at: str, sha256: str) -> dict:
    """Un fichero JSON de votacion -> registro. Voto desconocido => ValueError (no se inventa)."""
    d = json.loads(raw)
    info, tot = d["informacion"], d["totales"]
    por_grupo: dict[str, dict[str, int]] = {}
    for v in d["votaciones"]:
        voto = VOTOS.get(v["voto"])
        if voto is None:
            raise ValueError(f"voto desconocido {v['voto']!r} en sesion {sesion} votacion {numero}")
        g = por_grupo.setdefault(v["grupo"], {"si": 0, "no": 0, "abstencion": 0, "no_vota": 0})
        g[voto] += 1
    return {
        "id": f"{sesion}-{numero}",
        "sesion": sesion,
        "numero": numero,
        "fecha": fecha_iso(info["fecha"]),
        "titulo": info["titulo"] or None,
        "texto_expediente": info["textoExpediente"] or None,
        "titulo_subgrupo": info["tituloSubGrupo"] or None,
        "asentimiento": tot["asentimiento"] == "Si" or tot["asentimiento"] == "Sí",
        "totales": {"si": tot["afavor"], "no": tot["enContra"], "abstencion": tot["abstenciones"],
                    "no_vota": tot["noVotan"], "presentes": tot["presentes"]},
        "por_grupo": dict(sorted(por_grupo.items())) or None,  # None: el fichero oficial no trae votos nominales
        "fuente_url": fuente_url,
        "fetched_at": fetched_at,
        "sha256": sha256,
    }


def main() -> int:
    man = json.loads((RAW / "manifest.json").read_text())
    registros, sin_json = [], []
    for info in man.values():
        with zipfile.ZipFile(RAW / "zips" / info["file"]) as z:
            fich = [(n, JSON_RE.search(n)) for n in z.namelist()]
            fich = [(n, m) for n, m in fich if m]
            if not fich:
                sin_json.append(info["file"])
            for n, m in fich:
                body = z.read(n)
                # sha256 del fichero de votacion; fuente_url = zip oficial + nombre dentro
                registros.append(parse_votacion(
                    body, sesion=int(m[1]), numero=int(m[2]),
                    fuente_url=f"{info['url']}#{n}", fetched_at=info["fetched_at"],
                    sha256=hashlib.sha256(body).hexdigest()))
    registros.sort(key=lambda r: (r["sesion"], r["numero"]))
    ids = [r["id"] for r in registros]
    assert len(ids) == len(set(ids)), "ids duplicados"
    out = {"fuente": "congreso_votaciones", "legislatura": "XV",
           "generado": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "votaciones": registros}
    SALIDA.parent.mkdir(exist_ok=True)
    SALIDA.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print(f"{len(registros)} votaciones, {len({r['sesion'] for r in registros})} sesiones -> {SALIDA}")
    if sin_json:
        print(f"zips sin JSON de votacion ({len(sin_json)}): {sin_json}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
