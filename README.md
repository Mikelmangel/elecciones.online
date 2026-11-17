# elecciones.online

Portal informativo y neutral sobre las **elecciones generales de España del 29 de noviembre de 2026**: qué propone cada partido (con cita literal y página de su programa), qué ha votado en el Congreso, resultados oficiales de 2023, simulador D'Hondt, pactómetro, guías para votar y entrevistas citadas minuto a minuto.

Este repositorio contiene el código y los datos publicados. No contiene claves, credenciales, direcciones de servidores ni datos personales del titular: los valores propios de cada despliegue se leen de variables de entorno (`.env.example`) y de `web/content/legal.ts`, que aquí es una plantilla.

## Principios

1. **Cada dato lleva su fuente** (`fuente_url`, `fetched_at`, `sha256` del documento original).
2. **Los datos son ficheros JSON versionados en git**, no una base de datos de contenido. `zod` valida todo en el build: un dato inválido rompe la compilación y no se publica.
3. **Lo que no se puede comprobar con un documento descargado no se publica como hecho.** Ver [`docs/REGLAS_DE_DATOS.md`](docs/REGLAS_DE_DATOS.md).

## Stack

| Capa | Tecnología |
|---|---|
| **Motor de verificación** | **Rust** (`crates/verificador`) |
| Web | Next.js 15 (App Router, salida *standalone*), TypeScript, Tailwind, `zod` |
| Pipeline de datos | Python 3 (un directorio por fuente en `pipeline/fuentes/`), `pdftotext` |
| Tests | `node:test` (web), `pytest` (pipeline), el propio motor Rust |
| Despliegue | Docker Compose + Caddy, detrás de Cloudflare |

## El motor Rust: `crates/verificador`

Binario único, sin más dependencias que `serde`/`serde_json`, que audita **todos los datos publicados** antes de cada despliegue. Carga las ~2.175 votaciones del Congreso en memoria y comprueba, en unas decenas de milisegundos:

- **Programas electorales** (`data/programas/*.json`): cada medida lleva titular (≤ 140 caracteres), cita (≥ 20) y número de página válido.
- **Declaraciones de entrevistas** (`data/factchecking_entrevistas.json`): veredicto dentro del conjunto permitido, URL de fuente válida, cita literal de al menos 40 caracteres, `sha256` bien formado del documento original y fichero de origen indicado.
- **Coherencia con las votaciones** (`data/coherencia_votaciones.json`): cada votación citada existe en el acta y el voto declarado de cada grupo se contrasta con su voto mayoritario en el acta; una discrepancia se señala como advertencia.

Si falla una comprobación de las dos primeras (o una votación citada no existe), el proceso termina con código distinto de cero y el despliegue no continúa.

```sh
cd crates/verificador
cargo run --release        # localiza solo la raíz del repo (carpeta con data/)
```

Salida de ejemplo:

```
✓ TODAS LAS VERIFICACIONES COMPLETADAS CON ÉXITO en 39 ms
  - 1152 afirmaciones de entrevistas con formato válido (cita, minuto, sha256)
  - 3537 propuestas de programas electorales con cita y página verificadas
```

El motor Rust comprueba **estructura y coherencia entre ficheros**. La comprobación de que cada cita aparece **literalmente en la página indicada del PDF original** la hace `pipeline/verificar_citas.py` (sobre el texto de `pdftotext`) y `pipeline/verificar_entrevistas.py` (sobre la transcripción, en su minuto). Los tres corren juntos en `make test`. Más detalle en [`crates/verificador/README.md`](crates/verificador/README.md).

## Estructura

```
crates/verificador/     motor de verificación en Rust
data/                   datos publicados (JSON), con fuente y huella
pipeline/fuentes/       una fuente por directorio: fetch.py + parse.py + tests
  programas/            programas de los partidos (PDF → medidas con cita y página)
  entrevistas/          transcripciones → declaraciones con cita y minuto
  estadisticas_oficiales/  series del Banco de España y del INE para contrastar cifras
  congreso_votaciones/  votaciones nominales del Congreso (datos abiertos)
  candidaturas_2026/, boe_electoral/, resultados_2023/, convocatoria_2026/, actualidad/
web/                    sitio Next.js (genera páginas estáticas desde data/)
infra/                  Dockerfile, docker-compose y Caddyfile de ejemplo
scripts/                ciclo de actualización y extracción
```

## Cómo se decide un veredicto

Una declaración de un candidato solo recibe veredicto (`VERDADERO`, `FALSO`…) si hay prueba comprobable en datos descargados: una votación del Congreso que confirma o desmiente lo dicho, o una serie oficial (Banco de España, INE) que sostiene la cifra en todas las fechas base razonables (`pipeline/fuentes/entrevistas/evidencia.py`). Sin documento descargado, la declaración se muestra solo como cita. Las cifras que escribe un modelo no cuentan como prueba.

## Puesta en marcha

Requisitos: Node 22+, pnpm, Python 3.11+, Rust estable, `poppler-utils` (`pdftotext`).

```sh
cp .env.example .env            # y rellenar los valores propios
python3 -m venv scraper/.venv && scraper/.venv/bin/pip install -r pipeline/requirements.txt
make test                       # tests web + pipeline + motor Rust
make build                      # build de producción de la web
```

Los documentos originales (PDF de programas, transcripciones) **no están en el repositorio**: se descargan con `make actualizar` y se identifican por su `sha256`. Sin ellos, las comprobaciones literales de `verificar_citas.py` y `verificar_entrevistas.py` no pueden ejecutarse, pero el motor Rust y los tests de la web sí.

Antes de publicar con tu propio dominio, edita `web/content/legal.ts` (aviso legal con los datos del titular, obligatorio por la LSSI) y los identificadores de analítica o anuncios, o elimínalos.

## Licencia

Código: MIT (ver `LICENSE`). Los datos proceden de fuentes públicas (BOE, Congreso de los Diputados, Junta Electoral Central, INE, Banco de España, webs de los partidos); cada registro indica la suya y su reutilización queda sujeta a las condiciones de cada fuente.
