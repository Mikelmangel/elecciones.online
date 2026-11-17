import json
from pathlib import Path

from pipeline.fuentes.boe_electoral.parse import (
    es_relevante_electoral,
    extraer_items_sumario,
    parse_directorio,
)


def test_extraer_y_filtrar_boe_sumario(tmp_path: Path) -> None:
    ejemplo = {
        "data": {
            "sumario": {
                "metadatos": {"fecha_publicacion": "20261104"},
                "diario": {
                    "seccion": [
                        {
                            "codigo": "3",
                            "nombre": "III. Otras disposiciones",
                            "departamento": [
                                {
                                    "nombre": "JUNTA ELECTORAL CENTRAL",
                                    "epigrafe": {
                                        "nombre": "Elecciones Generales",
                                        "item": {
                                            "identificador": "BOE-A-2026-23383",
                                            "titulo": "Corrección de errores de las candidaturas presentadas para las elecciones al Congreso de los Diputados.",
                                            "url_html": "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23383",
                                            "url_pdf": {
                                                "texto": "https://www.boe.es/boe/dias/2026/11/04/pdfs/BOE-A-2026-23383.pdf"
                                            },
                                        },
                                    },
                                },
                                {
                                    "nombre": "MINISTERIO DE HACIENDA",
                                    "item": {
                                        "identificador": "BOE-A-2026-99999",
                                        "titulo": "Resolución sobre precios de labores del tabaco.",
                                        "url_html": "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-99999",
                                        "url_pdf": "https://www.boe.es/boe/dias/2026/11/04/pdfs/BOE-A-2026-99999.pdf",
                                    },
                                },
                            ],
                        }
                    ]
                },
            }
        }
    }
    raw_file = tmp_path / "20261104.json"
    raw_file.write_text(json.dumps(ejemplo), encoding="utf-8")

    items = extraer_items_sumario(ejemplo)
    assert len(items) == 2
    assert es_relevante_electoral(items[0]) is True
    assert es_relevante_electoral(items[1]) is False

    res = parse_directorio(tmp_path)
    assert res["total"] == 1
    assert res["disposiciones"][0]["identificador"] == "BOE-A-2026-23383"
    assert res["disposiciones"][0]["fecha"] == "2026-11-04"
    assert res["disposiciones"][0]["sha256"]
