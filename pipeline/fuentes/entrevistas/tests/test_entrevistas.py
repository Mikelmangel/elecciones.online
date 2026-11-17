import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(HERE))

from fetch import extraer_video_id, parse_atom_feed, slug_de_url  # noqa: E402
from parse import (  # noqa: E402
    clasificar_tema,
    parse_html_articulo,
    parse_youtube_xml,
    unir_segmentos_en_frases,
    verificar_cita_en_raw,
)


def test_entrevistas_json_valido():
    d = json.loads((ROOT / "data" / "entrevistas.json").read_text(encoding="utf-8"))
    urls = [x["fuente_url"] for x in d["debates"]] + [x["fuente_url"] for x in d["entrevistas"]]
    assert len(urls) == len(set(urls))
    assert all(u.startswith("https://") for u in urls)


def test_parse_atom_feed():
    sample = b"""<?xml version="1.0" encoding="UTF-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <entry>
        <title>Entrevista electoral PP</title>
        <link rel="alternate" href="https://www.youtube.com/watch?v=abc123"/>
        <published>2026-11-15T10:00:00+00:00</published>
      </entry>
    </feed>"""
    items = parse_atom_feed(sample, "RTVE Noticias (YouTube)")
    assert items == [{
        "titulo": "Entrevista electoral PP",
        "fecha": "2026-11-15",
        "fuente_url": "https://www.youtube.com/watch?v=abc123",
        "medio": "RTVE Noticias (YouTube)",
    }]


def test_extraer_video_id_y_slug():
    assert extraer_video_id("https://www.youtube.com/watch?v=mStOFBvToUI") == "mStOFBvToUI"
    assert extraer_video_id("https://youtu.be/1YlGArMx_N4") == "1YlGArMx_N4"
    assert extraer_video_id("https://www.rtve.es/noticias/debate.shtml") is None
    assert "rtve.es" in slug_de_url("https://www.rtve.es/noticias/debate.shtml")


def test_parse_youtube_xml_y_verificacion_minuto():
    fixture_xml = """<?xml version="1.0" encoding="utf-8" ?>
    <transcript>
      <text start="1535.2" dur="3.4">Si hacemos un millón de viviendas, crearemos 500,000</text>
      <text start="1538.6" dur="3.1">puestos de trabajo. Pues ya te lo digo para que la gente sepa lo que quiero hacer.</text>
    </transcript>""".encode("utf-8")

    segs = parse_youtube_xml(fixture_xml)
    assert len(segs) == 2
    assert segs[0]["minuto"] == "25:35"

    frases = unir_segmentos_en_frases(segs)
    assert len(frases) == 1
    assert frases[0]["minuto"] == "25:35"
    assert frases[0]["tema"] == "vivienda"

    assert verificar_cita_en_raw(
        "Si hacemos un millón de viviendas, crearemos 500,000 puestos de trabajo",
        fixture_xml,
        "youtube_xml",
        "25:35",
    )
    assert not verificar_cita_en_raw(
        "Construiremos dos millones de hospitales públicos en cuatro años",
        fixture_xml,
        "youtube_xml",
        "25:35",
    )


def test_parse_html_articulo_y_citas():
    fixture_html = """<html><head><title>Entrevista a Cristina Valido en Radio Marca</title></head>
    <body>
      <p>La candidata de Coalición Canaria aseguró en antena: «Hay muchas cosas de Sánchez que he votado en contra, empezando por la amnistía. Si es necesario para Canarias vamos a votar a favor».</p>
    </body></html>""".encode("utf-8")

    parsed = parse_html_articulo(fixture_html)
    assert "Cristina Valido" in parsed["titulo"]
    assert len(parsed["parrafos"]) == 1
    assert len(parsed["citas"]) == 1
    assert verificar_cita_en_raw(
        "Hay muchas cosas de Sánchez que he votado en contra, empezando por la amnistía",
        fixture_html,
        "html",
        "cita en texto",
    )
    assert clasificar_tema(parsed["citas"][0]) == "territorial"


def test_factchecking_entrevistas_coherencia():
    fc = json.loads((ROOT / "data" / "factchecking_entrevistas.json").read_text(encoding="utf-8"))
    ent = json.loads((ROOT / "data" / "entrevistas.json").read_text(encoding="utf-8"))
    urls = {e["fuente_url"] for e in ent["entrevistas"]} | {d["fuente_url"] for d in ent["debates"]}

    assert len(fc["verificaciones"]) >= 12
    for v in fc["verificaciones"]:
        assert len(v["cita_literal"]) >= 40
        assert len(v["sha256"]) == 64
        assert v["raw_file"].endswith((".xml", ".html"))
        assert v["entrevista_url"] in urls
