#!/usr/bin/env python3
"""Genera la mappa della musica dal vivo (strumento interno di Factory Area).

Uso, dalla cartella del repository:
    python3 sorgente/mappa/genera_mappa.py            -> pagina del sito in mappa/
    python3 sorgente/mappa/genera_mappa.py --file F   -> anche un unico file HTML da aprire con un doppio clic

La pagina legge i luoghi dal foglio Google (ID_FOGLIO). dati.json è la copia di riserva usata
quando il foglio non risponde: per aggiornarla scarica il foglio e rigenera (vedi README).
"""
import base64, datetime, hashlib, json, re, shutil, sys
from pathlib import Path

QUI = Path(__file__).resolve().parent
REPO = QUI.parent.parent
OUT = REPO / "mappa"
ID_FOGLIO = "1uyPMJnodXrHayUxTRTMg9XjCBhb-MwLRFV4CND_KkkI"
COL_EMAIL = 16  # posizione della colonna Email nelle righe di dati.json


modello = (QUI / "modello.html").read_text(encoding="utf-8")
vendor = lambda f: (QUI / "vendor" / f).read_text(encoding="utf-8")
confini = lambda f: (QUI / "confini" / f).read_text(encoding="utf-8").strip()
dati = json.loads((QUI / "dati.json").read_text(encoding="utf-8"))
oggi = datetime.date.today().strftime("%d/%m/%Y")

leaflet_js = re.sub(r"//# sourceMappingURL=.*", "", vendor("leaflet.js"))
cluster_js = re.sub(r"//# sourceMappingURL=.*", "", vendor("leaflet.markercluster.js"))
leaflet_css = re.sub(r"url\(images/[^)]*\)", "none", vendor("leaflet.css"))  # segnalini disegnati in CSS
cluster_css = vendor("MarkerCluster.css")

m = re.search(r"<style>\n(.*?)</style>", modello, re.S)
css_app = m.group(1).replace("/*__LEAFLET_CSS__*/\n", "").replace("/*__CLUSTER_CSS__*/\n", "")
scripts = re.findall(r"<script>(.*?)</script>", modello, re.S)
app_js = scripts[-1]


def js_app(sito, dati_inline=None):
    s = app_js.replace('ID_FOGLIO: "__ID_FOGLIO__"', f'ID_FOGLIO: "{ID_FOGLIO}"').replace("__DATA_COPIA__", oggi)
    if sito:
        s = s.replace("  SITO: false,", "  SITO: true, ").replace("  EMAIL: true ", "  EMAIL: false")
        s = s.replace("/*__DATI__*/[]", "(window.FA_DATI || [])")
        for k in ("STATO", "REGIONI", "COMUNI"):
            s = s.replace(f"/*__{k}__*/null", f"(window.FA_CONFINI || {{}}).{k.lower()}")
    else:
        s = s.replace("/*__DATI__*/[]", json.dumps(dati_inline, ensure_ascii=False, separators=(",", ":")))
        for k, f in (("STATO", "stato.json"), ("REGIONI", "regioni.json"), ("COMUNI", "comuni.json")):
            s = s.replace(f"/*__{k}__*/null", confini(f))
    return s.replace("</script", "<\\/script")


# ---------------------------------------------------------------- versione del sito
font_face = "\n".join(re.findall(r"@font-face \{.*?\}", (REPO / "assets/css/style.css").read_text(encoding="utf-8"), re.S))
font_face = font_face.replace("../fonts/", "../assets/fonts/")
OUT.mkdir(exist_ok=True)
(OUT / "mappa.css").write_text(
    "/* Mappa della musica dal vivo: stile. Generato da sorgente/mappa/genera_mappa.py: non modificare a mano. */\n"
    + font_face + "\n" + leaflet_css + "\n" + cluster_css + "\n" + css_app + ".piede-link{display:inline-flex;gap:14px}\n", encoding="utf-8")
(OUT / "leaflet.js").write_text(leaflet_js, encoding="utf-8")
(OUT / "leaflet.markercluster.js").write_text(cluster_js, encoding="utf-8")
shutil.copy(QUI / "vendor/LICENSE-leaflet.txt", OUT / "LICENSE-leaflet.txt")
shutil.copy(QUI / "vendor/LICENSE-markercluster.txt", OUT / "LICENSE-markercluster.txt")
dati_sito = [r[:COL_EMAIL] + [""] + r[COL_EMAIL + 1:] for r in dati]
(OUT / "dati.js").write_text(
    "/* Copia di riserva dei luoghi e confini (ISTAT, via openpolis/geojson-italy). Generato: non modificare a mano. */\n"
    "window.FA_DATI = " + json.dumps(dati_sito, ensure_ascii=False, separators=(",", ":")) + ";\n"
    "window.FA_CONFINI = {stato: " + confini("stato.json") + ", regioni: " + confini("regioni.json")
    + ", comuni: " + confini("comuni.json") + "};\n", encoding="utf-8")
(OUT / "mappa.js").write_text("/* Mappa della musica dal vivo. Generato da sorgente/mappa/genera_mappa.py: non modificare a mano. */"
                              + js_app(True).replace("<\\/script", "</script"), encoding="utf-8")

CSP = "; ".join([
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://tile.openstreetmap.org",
    "font-src 'self'",
    "connect-src 'self' https://docs.google.com https://*.googleusercontent.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "upgrade-insecure-requests",
])
# Numero di versione nei link ai file: a ogni modifica il browser scarica la versione nuova
ver = lambda f: f + "?v=" + hashlib.sha256((OUT / f).read_bytes()).hexdigest()[:10]
corpo = modello[modello.index("<body>"):modello.index("<script>")]
# Link all'informativa (la pagina usa servizi esterni): accanto ad "Apri il foglio"
corpo = corpo.replace('<a id="link-foglio"', '<span class="piede-link"><a href="/privacy/#mappa">Privacy</a> <a id="link-foglio"', 1)
corpo = corpo.replace('>Apri il foglio</a>', '>Apri il foglio</a></span>', 1)
html = f"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="{CSP}">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>Mappa della musica dal vivo in Italia · Factory Area</title>
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="{ver("mappa.css")}">
</head>
{corpo}<script src="{ver("leaflet.js")}"></script>
<script src="{ver("leaflet.markercluster.js")}"></script>
<script src="{ver("dati.js")}"></script>
<script src="{ver("mappa.js")}"></script>
</body>
</html>
"""
(OUT / "index.html").write_text(html, encoding="utf-8")
print("Pagina del sito:", OUT, "-", len(dati), "luoghi")

# ---------------------------------------------------------------- file unico (facoltativo)
if "--file" in sys.argv:
    dest = Path(sys.argv[sys.argv.index("--file") + 1])
    s = modello.replace("/*__LEAFLET_CSS__*/", leaflet_css).replace("/*__CLUSTER_CSS__*/", cluster_css)
    s = s.replace("<script>/*__LEAFLET_JS__*/</script>", "<script>" + leaflet_js.replace("</script", "<\\/script") + "</script>")
    s = s.replace("<script>/*__CLUSTER_JS__*/</script>", "<script>" + cluster_js.replace("</script", "<\\/script") + "</script>")
    s = s.replace(app_js, js_app(False, dati))
    dest.write_text(s, encoding="utf-8")
    print("File unico:", dest)
