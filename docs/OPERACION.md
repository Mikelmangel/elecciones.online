# Operación: que no se llenen los servidores

Notas de operación aprendidas con el sitio en producción. Sirven para cualquier web estática grande (Next.js, Astro…) desplegada con Docker en un VPS y reconstruida con frecuencia.

## 1. El disco se llena solo (Docker no borra lo que ya no usas)

**Qué pasó.** El sitio genera unas 5.900 páginas estáticas, así que cada imagen de Docker pesa ~1,5 GB. El ciclo de actualización reconstruye la web **cada hora** durante la campaña. Docker deja la imagen anterior huérfana (*dangling*) y acumula caché de compilación: en pocos días había 25 imágenes (27,8 GB) y 15,9 GB de caché, unos 40 GB en total. El disco llegó al 99 % con 675 MB libres. Si se llena del todo, la siguiente reconstrucción falla y puede caerse hasta la web que ya estaba funcionando.

**Cómo detectarlo.**

```sh
df -h /                       # uso real del disco
docker system df              # imágenes, caché y volúmenes; fíjate en RECLAIMABLE
du -xh --max-depth=1 / | sort -rh | head      # quién ocupa: suele ser /var/lib/containerd o /var/lib/docker
```

**Cómo limpiarlo (es regenerable).**

```sh
docker image prune -f                          # imágenes huérfanas
docker builder prune -f --keep-storage 2GB     # caché de compilación (deja 2 GB para que la siguiente build sea rápida)
apt-get clean && journalctl --vacuum-size=50M  # cachés del sistema
```

No borres la imagen en uso ni la etiquetada para volver atrás (`docker tag web:latest web:anterior` antes de cada despliegue): al estar etiquetadas, `prune` no las toca.

**Cómo evitarlo.** Limpiar **después de cada reconstrucción** y, si queda poco disco, **antes**. Está en [`scripts/ciclo_actualizacion.py`](../scripts/ciclo_actualizacion.py): tras cada ciclo en verde ejecuta las dos limpiezas de arriba y, si hay menos de 6 GB libres, limpia antes de construir.

Además, el registro del ciclo crece sin parar si nadie lo rota. Ejemplo en [`infra/logrotate-elecciones-actualizar`](../infra/logrotate-elecciones-actualizar) (cópialo a `/etc/logrotate.d/`).

## 2. Docker dijo «Started» y la web seguía con los datos viejos

**Qué pasó.** Tras subir datos nuevos y ejecutar `docker compose up -d --build web`, el contenedor arrancó pero **servía una imagen antigua**: la web mostraba los textos de la versión anterior aunque los ficheros del servidor ya eran los nuevos. El código de salida y el mensaje «Started» no lo delataban.

**Cómo comprobarlo.** Compara la huella de algunos ficheros de datos **dentro del contenedor** y **fuera**:

```sh
cd /srv/proyecto/data && sha256sum votaciones_clave.json calendario_electoral.json | cut -c1-16
docker exec web-1 sh -c 'cd /app/data && sha256sum votaciones_clave.json calendario_electoral.json | cut -c1-16'
```

Si difieren, reconstruye sin caché: `docker compose build --no-cache web && docker compose up -d web`. Una web que va por Cloudflare puede además servir una copia en caché durante unos minutos: prueba con un parámetro nuevo en la URL (`?v=123`) para ver el origen.

## 3. Lista de comprobación tras cada despliegue

1. `df -h /` y `docker system df`: el espacio no debe subir de un despliegue a otro.
2. La huella de datos dentro del contenedor coincide con la de fuera.
3. Las páginas clave responden 200 (y las retiradas, 307/404 según lo esperado).
4. Queda una imagen `anterior` para volver atrás en segundos: `docker tag web:anterior web:latest && docker compose up -d --no-build web`.

## 4. Qué no se hace

- No se construye la web en el propio servidor con `pnpm build` además de en Docker: duplica `node_modules` (≈450 MB) y cachés (≈700 MB) que nadie usa.
- No se deja que el ciclo de actualización reconstruya sin limpiar después.
