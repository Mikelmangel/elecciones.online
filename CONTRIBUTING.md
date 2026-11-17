# Cómo contribuir

Gracias por ayudar. En un proyecto de información electoral, **un dato incorrecto es peor que un dato ausente**, así que las reglas son estrictas y las contribuciones más valiosas son las correcciones.

## 1. Avisar de un error en un dato

Abre un [*issue* de error de datos](https://github.com/Mikelmangel/elecciones.online/issues/new?template=error-de-datos.yml). Necesitamos:

- la **página** de elecciones.online donde lo ves,
- lo que dice la web y **lo que dice la fuente oficial**,
- un **enlace a la fuente** (BOE, acta del Congreso, programa del partido con su página…).

Sin fuente no podemos corregirlo: toda corrección se comprueba contra el documento original.

## 2. Proponer una fuente nueva

Una fuente es un directorio en `pipeline/fuentes/<fuente>/` con este contrato:

1. `fetch.py` descarga a `raw/` (nunca a `data/`) y guarda el `sha256` de cada fichero; pausa de al menos 2 s por dominio; idempotente.
2. `parse.py` genera un JSON en `data/` donde cada registro lleva `fuente_url`, `fetched_at` y, si procede, `sha256`.
3. Un test cuyo **valor esperado se ha leído del documento original**, no de la salida del propio parser.
4. Un `README.md` breve: qué es, de dónde sale, con qué frecuencia y cómo se verifica.

Mira `pipeline/fuentes/estadisticas_oficiales` como ejemplo mínimo.

## 3. Reglas de datos (no negociables)

Resumen de [`docs/REGLAS_DE_DATOS.md`](docs/REGLAS_DE_DATOS.md):

- Cita **literal** y **página** para cada propuesta de un programa. Sin parafrasear.
- **Lenguaje neutral:** sin adjetivos propios ni valoraciones.
- Un veredicto solo se publica si lo prueba un documento descargado (una votación o una serie oficial). Una cifra escrita de memoria, por una persona o por un modelo, no es prueba.
- Datos de personas con nombre (patrimonio, causas judiciales): solo con revisión previa.
- Nada de contenido sobre una persona o partido que no esté respaldado por una fuente enlazada.

## 4. Código

```sh
make test      # tests de la web, del pipeline y motor Rust: debe pasar entero
make build     # la web debe compilar (zod valida los datos)
```

- Rust: `cargo fmt` y `cargo clippy` limpios en `crates/verificador`.
- Una *pull request* = un cambio. Explica el **porqué** y enlaza la fuente si toca datos.
- Si cambias un parser, añade o ajusta su test con el valor leído del documento original.
- No incluyas claves, tokens, direcciones de servidores ni datos personales (ver `.env.example`).

## 5. Qué no aceptamos

- Contenido de opinión, rankings de partidos o valoraciones sin una regla objetiva y verificable detrás.
- Datos obtenidos saltándose bloqueos técnicos o los términos de uso de una fuente.
- Cambios que sustituyan una comprobación automática por revisión "a ojo".

Al contribuir aceptas que tu aportación se publique bajo la licencia MIT del repositorio.
