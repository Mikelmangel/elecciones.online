# Entrevistas, debates y artículos de campaña (`entrevistas`)

- **Qué es:** Índice de entrevistas, debates y comunicados de campaña (`data/entrevistas.json`) y corpus de afirmaciones contrastadas letra a letra contra la transcripción/artículo original (`data/factchecking_entrevistas.json`).
- **Fuentes:** Feeds Atom de YouTube + subtítulos oficiales TimedText XML (`<text start="..." dur="...">`) y artículos HTML de RTVE, laSexta, 3Cat, Onda Vasca, BNG y prensa regional.
- **Frecuencia:** Bajo demanda (`make actualizar`) con caché idempotente por `sha256` en `raw/manifest.json` y pausa de ≥ 2 s por dominio.
- **Verificación:** `pipeline/verificar_entrevistas.py` y `crates/verificador` comprueban que cada `cita_literal` existe en el fichero `raw/<raw_file>` en la ventana del minuto indicado (`contexto_minuto`) y que el `sha256` y las votaciones del Congreso coinciden.
