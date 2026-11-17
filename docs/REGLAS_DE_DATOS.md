# Reglas de datos

1. Todo registro lleva `fuente_url`, `fetched_at` y, si procede de un fichero, `sha256`.
2. Los valores esperados de un test se leen **del documento original**, nunca de la salida del parser.
3. Los datos de personas con nombre (bienes, causas judiciales) solo se publican revisados por una persona.
4. Un PDF con texto no es necesariamente un PDF nativo: se comprueba con `pdfimages -list`; si hay una imagen a página completa es un escaneo y exige OCR propio.
5. Importes con expresión regular estricta (`\d{1,3}(\.\d{3})*,\d{2}`); si no casa, el campo queda `null` y se revisa.
6. Lenguaje neutral. Cita literal y página para cada propuesta de programa. Sin adjetivos propios.
7. No se envían nombres ni datos personales a servicios externos.
8. Los veredictos y resúmenes los verifica un modelo de IA, pero **solo con prueba comprobable en datos descargados**: un veredicto se publica si la votación citada confirma lo dicho, o si la cifra se sostiene con una serie oficial en todas las fechas base razonables; un resumen, si todas sus páginas corresponden a medidas reales. Una cifra oficial escrita por un modelo no es prueba: sin documento descargado, la declaración se muestra solo como cita.
9. El contenido generado a partir de los programas es titular, cita y página, y resúmenes descriptivos rotulados como tales. Nada de valoraciones ni comparaciones redactadas por un modelo.
10. **Modo electoral (LOREG art. 69):** en los cinco días previos a la votación quedan ocultos los sondeos y el termómetro ciudadano.
