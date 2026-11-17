# Motor de verificación (Rust)

Crate `elecciones-verificador`: una auditoría de integridad de los datos publicados, pensada para ejecutarse en CI y antes de cada despliegue.

## Qué hace

1. Carga `data/congreso_votaciones.json` (todas las votaciones nominales de la XV Legislatura con su voto por grupo) en un `HashMap` por id.
2. **Coherencia** (`data/coherencia_votaciones.json`): para cada caso, la votación debe existir; el voto declarado de cada partido se compara con el voto mayoritario de su grupo en el acta (sí, no, abstención, no vota o dividido). Una discrepancia se imprime como advertencia; el grupo Mixto no se compara porque agrupa partidos distintos.
3. **Declaraciones** (`data/factchecking_entrevistas.json`): veredicto dentro del conjunto permitido, URL de fuente `http(s)`, `cita_literal` de al menos 40 caracteres, `sha256` de 64 caracteres hexadecimales y `raw_file` no vacío.
4. **Programas** (`data/programas/*.json`): para cada medida, titular no vacío y de hasta 140 caracteres, cita de al menos 20 y página mayor que cero.

Termina con código 1 ante cualquier error de las comprobaciones 3 y 4 o si una votación citada no existe, y con 0 si todo está en orden. Con más de 5.000 registros tarda decenas de milisegundos.

## Uso

```sh
cd crates/verificador
cargo run --release
```

El binario sube por los directorios hasta encontrar una carpeta `data/`, así que funciona lanzado desde cualquier punto del repositorio.

## Qué no hace (lo hace Python)

Comprobar que una cita aparece **letra por letra** en la página indicada del PDF original, o en su minuto de la transcripción, exige los documentos descargados: lo hacen `pipeline/verificar_citas.py` y `pipeline/verificar_entrevistas.py`. El motor Rust garantiza que los datos tienen la forma correcta y que los cruces entre ficheros no están rotos; Python garantiza que el texto es el del documento.
