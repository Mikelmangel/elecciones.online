# Infraestructura

`Dockerfile` (Next.js *standalone*, usuario sin privilegios), `docker-compose.yml` y `Caddyfile` (solo acepta tráfico de los rangos publicados de Cloudflare). Variables de entorno: ver `.env.example` en la raíz. `logrotate-elecciones-actualizar`: rotación del registro del ciclo. Qué vigilar para que no se llene el disco: [docs/OPERACION.md](../docs/OPERACION.md).
