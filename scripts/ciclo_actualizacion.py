#!/usr/bin/env python3
"""Orquestador de actualización con frecuencia adaptativa según data/eleccion_activa.json.

Frecuencias:
  - > 30 días antes de la elección: cada 24 h (periodo normal)
  - 2 a 30 días antes: cada 4 h (mes previo y campaña)
  - Víspera, día electoral y día siguiente (-1 a +1 días): cada 30 min
  - Post-elección (< -1 día): cada 24 h

Uso en cron del VPS (cada 15 min):
  */15 * * * * cd /srv/elecciones.online && scraper/.venv/bin/python scripts/ciclo_actualizacion.py
"""
import argparse
import json
import subprocess
import time
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ELECCION_FILE = ROOT / "data" / "eleccion_activa.json"
STAMP_FILE = ROOT / "var" / "ultimo_ciclo.txt"
DATA = ROOT / "data"


# data/ es del usuario que despliega y el cron corre como root: safe.directory evita el bloqueo de git
GIT = ["git", "-C", str(DATA), "-c", "safe.directory=*", "-c", "user.name=ciclo", "-c", "user.email=ciclo@localhost"]


def git(*args: str) -> None:
    subprocess.run([*GIT, *args], check=True)


def hay_cambios() -> bool:
    git("add", "-A")
    return subprocess.run([*GIT, "diff", "--cached", "--quiet"]).returncode != 0


def intervalo_segundos(fecha_eleccion: str, hoy: date | None = None) -> tuple[str, int]:
    hoy = hoy or datetime.now(timezone.utc).date()
    objetivo = date.fromisoformat(fecha_eleccion)
    dias = (objetivo - hoy).days
    if -1 <= dias <= 1:
        return "jornada_electoral", 30 * 60
    if 2 <= dias <= 30:
        return "campana_4h", 4 * 3600
    return "normal_24h", 24 * 3600


def toca_ejecutar(intervalo: int, force: bool = False) -> bool:
    if force or not STAMP_FILE.exists():
        return True
    try:
        ultimo = float(STAMP_FILE.read_text(encoding="utf-8").strip())
    except ValueError:
        return True
    return (time.time() - ultimo) >= intervalo


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="Solo muestra la cadencia actual sin ejecutar")
    ap.add_argument("--force", action="store_true", help="Fuerza la ejecución ignorando el último timestamp")
    args = ap.parse_args()

    eleccion = json.loads(ELECCION_FILE.read_text(encoding="utf-8"))
    modo, cada_seg = intervalo_segundos(eleccion["fecha_eleccion"])
    due = toca_ejecutar(cada_seg, args.force)
    print(f"Elección: {eleccion['nombre']} ({eleccion['fecha_eleccion']}) | modo={modo} | intervalo={cada_seg}s | toca={due}")

    if args.check or not due:
        return 0

    # Versionado de data/: un commit por ciclo publicado; si algo falla, data/ vuelve al último bueno.
    # Ver historial: git -C data log --stat · volver a una versión: git -C data checkout <hash> -- .
    if not (DATA / ".git").exists():
        git("init", "-q")
        git("add", "-A")
        git("commit", "-q", "-m", "estado inicial")

    # lo que llegó por rsync (despliegue a mano) ya está publicado: se versiona antes de tocar nada
    if hay_cambios():
        git("commit", "-q", "-m", "despliegue manual")

    pasos = (
        ["make", "actualizar"],
        ["make", "test"],
        # la imagen en marcha queda como infra-web:anterior para volver atrás sin recompilar
        ["docker", "tag", "infra-web:latest", "infra-web:anterior"],
        ["docker", "compose", "-f", "infra/docker-compose.yml", "up", "-d", "--build", "web"],
    )
    for cmd in pasos:
        print("Ejecutando:", " ".join(cmd))
        res = subprocess.run(cmd, cwd=ROOT)
        if res.returncode != 0:
            print(f"Fallo en {' '.join(cmd)}; data/ vuelve al último estado publicado y no se despliega.")
            git("checkout", "-q", "--", ".")
            git("clean", "-qfd")
            return res.returncode

    if hay_cambios():
        git("commit", "-q", "-m", f"ciclo {datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC")
        print("data/ versionado:", subprocess.run([*GIT, "log", "-1", "--format=%h %s"], capture_output=True, text=True).stdout.strip())

    STAMP_FILE.parent.mkdir(parents=True, exist_ok=True)
    STAMP_FILE.write_text(str(time.time()), encoding="utf-8")
    print("Ciclo completado en verde.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
