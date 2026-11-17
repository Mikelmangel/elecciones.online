# Programas electorales 29-N 2026

Documentos oficiales de los programas, solo de dominios del propio partido/coalición. Inventario y procedencia en `data/programas/_fuentes.json`.

- `fetch.py`: re-descarga las entradas `descargado` a `raw/` (gitignored), valida `%PDF`, pausa 3 s por dominio y avisa (`CAMBIO`, exit 1) si el sha256 difiere del JSON: los partidos a veces sustituyen el PDF.
- Estados: `descargado`, `no_publicado` (solo hay 2023, borradores o notas de prensa), `descarga_manual` (sitio con anti-bot; no se elude), `solo_web`.
- Clasificación con `pdfinfo` / `pdfimages -list` / `pdftotext`. Ningún PDF descargado es escaneo.
- Un PDF cambiado no se da por bueno hasta revisar el diff y regenerar el JSON.
