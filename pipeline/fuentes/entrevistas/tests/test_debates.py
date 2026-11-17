"""Un debate nunca se indexa como entrevista a una persona: los subtítulos no dicen quién habla."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))

from fetch import es_debate, participantes_en_titulo  # noqa: E402
from parse import cargar_declaraciones  # noqa: E402


def test_titulos_de_debate():
    assert es_debate("debate sánchez feijóo en directo")
    assert es_debate("cara a cara: sánchez y feijóo")
    assert es_debate("debate a ocho en rtve")  # sin nombres: basta la palabra debate
    assert es_debate("sánchez contra feijóo")  # dos candidatos sin la palabra debate
    assert participantes_en_titulo("sánchez y feijóo en directo") == ["PP", "PSOE"]


def test_titulos_de_entrevista_no_son_debate():
    assert not es_debate("pedro sánchez en la revuelta")
    assert not es_debate("entrevista a abascal")


def test_declaraciones_de_un_debate_se_ignoran(tmp_path, monkeypatch):
    import parse

    d = tmp_path / "declaraciones"
    d.mkdir()
    url = "https://www.youtube.com/watch?v=DEBATE000001"
    cita = "Vamos a bajar los impuestos a las familias en los primeros cien días de gobierno."
    (d / "DEBATE000001.json").write_text(json.dumps([{"id": "x-1", "entrevista_url": url, "tema": "impuestos", "cita_literal": cita, "contexto_minuto": "10:00"}]))
    monkeypatch.setattr(parse, "DECLARACIONES", d)
    manifest = {url: {"categoria": "debate", "persona": None, "partido": None}}
    assert cargar_declaraciones(manifest) == []
    manifest[url]["categoria"] = "entrevista"
    manifest[url]["persona"] = "Alguien"
    assert len(cargar_declaraciones(manifest)) == 1
