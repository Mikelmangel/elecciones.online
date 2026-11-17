# `boe_electoral`

Monitorización automática de disposiciones y anuncios electorales en el Boletín Oficial del Estado (BOE).

## Fuente oficial

- API de Datos Abiertos del BOE: `https://www.boe.es/datosabiertos/api/boe/sumario/{YYYYMMDD}` (cabecera `Accept: application/json`).
- Los domingos y festivos nacionales sin edición devuelven `404` y se omiten de forma controlada.

## Criterio de filtrado

Se seleccionan ítems cuyo departamento, epígrafe o título mencione explícitamente la Junta Electoral Central, Juntas Electorales, elecciones generales/a Cortes Generales, candidaturas presentadas o proclamadas, voto por correo, censo electoral, LOREG o subvenciones/campaña electoral.

## Salida

- `data/boe_electoral.json`: lista ordenada cronológicamente (más reciente primero) con `identificador`, `fecha`, `seccion`, `departamento`, `epigrafe`, `titulo`, `url_html`, `url_pdf`, `fuente_url`, `fetched_at` y `sha256`.
