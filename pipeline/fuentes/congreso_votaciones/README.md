# congreso_votaciones

Votaciones del Pleno del Congreso, XV Legislatura, agregadas por grupo parlamentario (sin voto nominal).

- Fuente: https://www.congreso.es/es/opendata/votaciones. Akamai: solo navegador (patchright, un contexto, pausa >= 2 s).
- Estructura real: la página lista en `var diasVotaciones` los días con votaciones; `...&targetLegislatura=XV&targetDate=DD/MM/YYYY` da la página del día con un único zip `Leg15/SesionN/AAAAMMDD/VOT_*.zip`. Cada zip trae por votación `sesionNvotacionM.{json,xml,pdf,png}`; se parsea el JSON.
- Frecuencia: diaria. `scraper/.venv/bin/python fetch.py` (incremental; re-consulta los últimos 7 días) y luego `python3 parse.py` -> `data/congreso_votaciones.json`.
- Rarezas: (1) 5 zips traen solo PNG, sin JSON (sesiones 5, 6, 8, 17 y la 203 del 02/10/2026); esas votaciones no están en el corpus. (2) 2 votaciones sin voto nominal (89-5, 202-21): `por_grupo: null`. (3) Hay diputados con grupo `""` en origen (4 votaciones); se conserva la clave `""`. (4) `presentes` = si + no + abstención; `no_vota` son los ausentes/no votantes.
- Tests: `scraper/.venv/bin/python -m pytest tests` (fixture real + coherencia de todo el corpus).
