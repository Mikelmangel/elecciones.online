from datetime import datetime, timezone

from pipeline.fuentes.actualidad.parse import construir, parse_feed, parse_telegram, partidos_mencionados

RSS = b"""<rss><channel><title>Medio</title>
<item><title>El PP presenta su programa &amp; calendario</title><link>https://m.es/1</link><pubDate>Sat, 14 Nov 2026 10:00:00 +0100</pubDate></item>
<item><title>Una app para el tiempo</title><link>https://m.es/2</link><pubDate>Sat, 14 Nov 2026 11:00:00 +0100</pubDate></item>
<item><title>Noticia vieja del debate</title><link>https://m.es/3</link><pubDate>Thu, 01 Oct 2026 11:00:00 +0100</pubDate></item>
</channel></rss>"""
ATOM = b"""<feed xmlns="http://www.w3.org/2005/Atom"><title>Canal BNG</title>
<entry><title>Mitin en Vigo</title><link rel="alternate" href="https://y.t/v1"/><published>2026-11-13T18:00:00+00:00</published></entry></feed>"""
TG = b"""<meta property="og:title" content="Podemos">
<div class="tgme_widget_message_wrap"><div data-post="canal/7"><div class="tgme_widget_message_text js">Hola <b>mundo</b></div><time datetime="2026-11-12T09:00:00+00:00"></time></div></div>"""
CFG = {
    "alias": {"PP": ["PP"], "BNG": ["BNG"]},
    "filtro_medios": ["debate"],
    "fuentes": [
        {"id": "m", "clase": "medio", "tipo": "rss", "url": "https://m.es/rss"},
        {"id": "b", "clase": "partido", "partido": "BNG", "tipo": "youtube", "url": "https://y.t/f"},
        {"id": "t", "clase": "partido", "partido": "Podemos", "tipo": "telegram", "url": "https://t.me/s/canal"},
    ],
}


def test_formatos():
    assert parse_feed(RSS)[1][0] == {"titulo": "El PP presenta su programa & calendario", "url": "https://m.es/1", "fecha": "2026-11-14T09:00:00Z"}
    assert parse_feed(ATOM) == ("Canal BNG", [{"titulo": "Mitin en Vigo", "url": "https://y.t/v1", "fecha": "2026-11-13T18:00:00Z"}])
    assert parse_telegram(TG) == ("Podemos", [{"titulo": "Hola mundo", "url": "https://t.me/canal/7", "fecha": "2026-11-12T09:00:00Z"}])


def test_alias_palabra_completa():
    assert partidos_mencionados("El PP y el BNG pactan", CFG["alias"]) == ["PP", "BNG"]
    assert partidos_mencionados("Una app nueva", CFG["alias"]) == []


def test_construir_filtra_fusiona_y_caduca():
    previo = [{"titulo": "Antiguo", "url": "https://m.es/0", "fecha": "2026-11-10T00:00:00Z", "fuente": "m", "canal": "Medio", "clase": "medio", "partidos": []}]
    doc = construir(CFG, {"m": RSS, "b": ATOM, "t": TG}, previo, datetime(2026, 11, 15, tzinfo=timezone.utc))
    urls = [i["url"] for i in doc["items"]]
    # fuera: la app (sin partido ni palabra electoral) y la de octubre (más de 30 días)
    assert urls == ["https://m.es/1", "https://y.t/v1", "https://t.me/canal/7", "https://m.es/0"]
    assert doc["items"][0]["partidos"] == ["PP"] and doc["items"][1]["partidos"] == ["BNG"]
    assert len(doc["fuentes"]) == 3 and len(doc["fuentes"][0]["sha256"]) == 64
