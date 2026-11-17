# Política de seguridad

## Cómo informar de una vulnerabilidad

**No abras un *issue* público.** Usa el aviso privado de GitHub: pestaña *Security* → *Report a vulnerability* (<https://github.com/Mikelmangel/elecciones.online/security/advisories/new>).

Incluye los pasos para reproducirla y el impacto que crees que tiene. Respondemos en la medida de lo posible en pocos días.

## Alcance

- El código de este repositorio (web, pipeline, motor Rust).
- Especialmente: el termómetro ciudadano (`web/app/api/termometro`), el tratamiento de entradas del usuario y las cabeceras de seguridad (`web/next.config.*`, `infra/Caddyfile`).

Fuera de alcance: denegación de servicio, ingeniería social, y la infraestructura de terceros (Cloudflare, Google, GitHub).

## Qué no hay en este repositorio

Claves, credenciales, direcciones de servidores y datos personales no se versionan. Si encuentras alguno por error, avísanos por el mismo canal privado para retirarlo y rotarlo.
