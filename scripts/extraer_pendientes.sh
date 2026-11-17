#!/usr/bin/env bash
# Extrae con Sonnet (Claude Code en local, sin API de pago aparte) cada transcripción descargada
# que aún no tiene declaraciones, una sesión por vídeo. Después regenera y verifica todo de golpe.
# La red de seguridad no es el modelo: verificar_entrevistas.py rechaza cualquier cita que no esté
# letra por letra en la transcripción, en su minuto.
#   scripts/extraer_pendientes.sh          # todos los pendientes
#   MODELO=opus scripts/extraer_pendientes.sh
set -euo pipefail
cd "$(dirname "$0")/.."
F=pipeline/fuentes/entrevistas
PY=${PY:-scraper/.venv/bin/python}
for xml in "$F"/raw/*.xml; do
  id=$(basename "$xml" .xml)
  [ -f "$F/declaraciones/$id.json" ] && continue
  # debates: los subtítulos no identifican al orador; no se extrae (ver skill extraer-entrevista, regla 7)
  "$PY" - "$F" "$id" <<'PYEOF' && continue
import json, sys
m = json.load(open(f"{sys.argv[1]}/raw/manifest.json"))
sys.exit(0 if any(v["file"].startswith(sys.argv[2]) and v.get("categoria") == "debate" for v in m.values()) else 1)
PYEOF
  echo "== $id"
  rc=0
  out=$(claude -p "Extrae la entrevista con id $id (transcripción en $xml)." \
    --agent extractor-entrevistas --model "${MODELO:-sonnet}" --permission-mode acceptEdits \
    --allowedTools Read Write Edit Grep Glob "Bash($PY:*)" </dev/null 2>&1) || rc=$?
  echo "$out"
  # límite de la cuenta: no se procesó nada; marcar "[]" dejaría el vídeo sin declaraciones para siempre
  if echo "$out" | grep -qi "hit your .*limit"; then
    echo "LÍMITE de la cuenta: se detiene sin marcar $id; relanzar cuando se reinicie" >&2; break
  fi
  [ "$rc" -eq 0 ] || { echo "AVISO: $id falló; se reintenta en la próxima ejecución" >&2; continue; }
  # sin citas válidas: se marca vacío para no volver a gastar una sesión en él
  [ -f "$F/declaraciones/$id.json" ] || echo "[]" > "$F/declaraciones/$id.json"
done
"$PY" "$F/parse.py"
"$PY" pipeline/verificar_entrevistas.py
echo "Revisa: git diff data/factchecking_entrevistas.json  ·  luego: make test && make deploy"
