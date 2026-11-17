# actualidad

Titulares con enlace de los canales propios de cada partido (web, YouTube, Telegram), de instituciones y de medios.
Solo titular, enlace, fecha y canal: no se copia texto ni se valora.

- `fuentes.json` — lista de fuentes y alias de partidos. Añadir una fuente = una línea.
- `fetch.py` — descarga cada feed a `raw/`. Un feed caído no para el resto.
- `parse.py` — genera `data/actualidad.json`; fusiona con lo anterior y caduca a los 30 días.

X/Twitter no se incluye: no hay feed público y la API es de pago. Si se contrata, se añade un `tipo` nuevo aquí.
