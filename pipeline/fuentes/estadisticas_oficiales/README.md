# estadisticas_oficiales

Series oficiales descargadas para comprobar cifras citadas en entrevistas (regla 8 de `CLAUDE.md`).

- `be1101.csv`: Banco de España, Boletín Estadístico 11.1, deuda de las AAPP según el PDE (trimestral, miles de euros).

Añadir una serie: URL en `fetch.py`, código en `parse.py`, un valor leído a mano del fichero en el test.
La comprobación de cada declaración está en `pipeline/fuentes/entrevistas/evidencia.py` (`CIFRAS`).
