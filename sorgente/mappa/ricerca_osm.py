#!/usr/bin/env python3
"""Ricerca di luoghi con musica dal vivo da OpenStreetMap, per ampliare la mappa interna.

Gira su GitHub Actions (flusso "Ricerca luoghi per la mappa"), perché ha bisogno di servizi
che dall'ambiente di Claude non si raggiungono (Overpass, Nominatim, Wikidata, siti dei locali).
Non scrive niente nel sito: produce file JSON in risultati/, scaricabili come artifact.

    python3 sorgente/mappa/ricerca_osm.py raccolta      candidati OSM + foglio attuale + siti + Wikidata
    python3 sorgente/mappa/ricerca_osm.py dettagli      (env DATI = id OSM separati da spazi, es. "n123 w456")
                                                         indirizzo da Nominatim e social da ricerca web
    python3 sorgente/mappa/ricerca_osm.py foglio        scarica il foglio (Luoghi e In attesa) in CSV
Solo libreria standard di Python.
"""
import concurrent.futures as cf, html, json, os, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

ID_FOGLIO = "1HKYIkrxkkWEHDjdLtpI4rs3qxXiPGcZYhkiXdHBnwrA"
UA = "FactoryAreaMappa/1.0 (mappa interna di Factory+ ETS; https://factoryarea.it/mappa/)"
OUT = Path("risultati"); OUT.mkdir(exist_ok=True)
OVERPASS = ["https://overpass-api.de/api/interpreter", "https://lz4.overpass-api.de/api/interpreter",
            "https://z.overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter",
            "https://overpass.private.coffee/api/interpreter"]
REGIONI = ["IT-21", "IT-23", "IT-25", "IT-32", "IT-34", "IT-36", "IT-42", "IT-45", "IT-52", "IT-55", "IT-57",
           "IT-62", "IT-65", "IT-67", "IT-72", "IT-75", "IT-77", "IT-78", "IT-82", "IT-88"]


def get(url, data=None, timeout=30, limite=1_500_000, headers=None):
    h = {"User-Agent": UA, "Accept-Language": "it,en;q=0.8"}
    h.update(headers or {})
    req = urllib.request.Request(url, data=data, headers=h)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.geturl(), r.read(limite).decode("utf-8", "replace")


def overpass(q, timeout=200):
    for giro in range(2):
        for url in OVERPASS:
            try:
                _, _, t = get(url, data=urllib.parse.urlencode({"data": q}).encode(), timeout=timeout, limite=300_000_000)
                d = json.loads(t)
                if d.get("remark") and "error" in d["remark"].lower():
                    raise RuntimeError(d["remark"][:150])
                return d
            except Exception as e:
                print("overpass", url, giro, str(e)[:150], flush=True); time.sleep(5)
        time.sleep(30)
    raise RuntimeError("Overpass non raggiungibile")


Q_RACCOLTA = """[out:json][timeout:180];
area["ISO3166-2"="{reg}"]["admin_level"="4"]->.it;
(
  nwr["amenity"="music_venue"](area.it);
  nwr["amenity"="concert_hall"](area.it);
  nwr["amenity"="theatre"](area.it);
  nwr["live_music"="yes"](area.it);
  nwr["amenity"="arts_centre"](area.it);
  nwr["amenity"="social_centre"](area.it);
  nwr["amenity"="events_venue"](area.it);
);
out center tags;"""

NO_IG = {"p", "reel", "reels", "explore", "accounts", "stories", "tv", "about", "developer", "legal", "direct",
         "instagram", "share", "sharer", "web", "tags", "embed.js", "static"}
NO_FB = {"sharer", "sharer.php", "share", "share.php", "plugins", "tr", "dialog", "events", "groups", "photo",
         "photo.php", "watch", "login", "profile.php", "pages", "hashtag", "help", "policies", "privacy",
         "facebook", "home.php", "permalink.php", "story.php", "media", "people", "public", "l.php", "ads",
         "business", "legal", "terms", "notes", "gaming", "marketplace", "fundraisers", "2008", "connect"}


def social_da_html(t):
    ig = []
    for m in re.finditer(r"instagram\.com/([A-Za-z0-9_.]{2,30})", t, re.I):
        h = m.group(1).rstrip(".")
        if h.lower() not in NO_IG and h not in ig: ig.append(h)
    fb = []
    for m in re.finditer(r"facebook\.com/(?:pg/)?([A-Za-z0-9.\-]{3,80})", t, re.I):
        h = m.group(1).rstrip(".")
        if h.lower() not in NO_FB and not h.lower().startswith("sharer") and h not in fb: fb.append(h)
    mail = [m for m in dict.fromkeys(re.findall(r"mailto:([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[a-z]{2,})", t, re.I))]
    testo = re.sub(r"<[^>]+>", " ", t)
    titolo = re.search(r"<title[^>]*>(.*?)</title>", t, re.I | re.S)
    return {"ig": ig[:4], "fb": fb[:4], "mail": mail[:3], "anni": {a: testo.count(a) for a in ("2024", "2025", "2026")},
            "titolo": html.unescape(titolo.group(1).strip())[:120] if titolo else ""}


def visita_sito(url):
    if not url: return None
    if not re.match(r"https?://", url): url = "https://" + url.lstrip("/")
    for u in (url, url.replace("https://", "http://", 1)):
        try:
            st, fin, t = get(u, timeout=10)
            r = social_da_html(t); r.update({"stato": st, "url_finale": fin})
            return r
        except Exception as e:
            err = str(e)[:120]
    return {"errore": err}


def wikidata(ids):
    ris = {}
    def v(e, p):
        c = [x for x in (e.get("claims", {}).get(p) or []) if x.get("rank") != "deprecated"]
        if not c: return ""
        best = next((x for x in c if x.get("rank") == "preferred"), c[-1])
        d = best["mainsnak"].get("datavalue", {}).get("value")
        if isinstance(d, dict): return str(d.get("amount", "")).lstrip("+")
        return d or ""
    ids = list(ids)
    for i in range(0, len(ids), 50):
        try:
            _, _, t = get("https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|sitelinks&ids="
                          + "|".join(ids[i:i + 50]), timeout=60, limite=50_000_000)
            for k, e in json.loads(t).get("entities", {}).items():
                ris[k] = {"ig": v(e, "P2003"), "fb": v(e, "P2013"), "web": v(e, "P856"), "cap": v(e, "P1083"),
                          "mail": str(v(e, "P968")).replace("mailto:", ""), "itwiki": "itwiki" in e.get("sitelinks", {})}
        except Exception as ex:
            print("wikidata", ex, flush=True)
        time.sleep(1)
    return ris


def foglio():
    for scheda in ("Luoghi", "In attesa"):
        u = (f"https://docs.google.com/spreadsheets/d/{ID_FOGLIO}/gviz/tq?tqx=out:csv&headers=1&sheet="
             + urllib.parse.quote(scheda))
        try:
            _, _, t = get(u, timeout=60, limite=50_000_000)
            (OUT / f"foglio_{scheda.replace(' ', '_')}.csv").write_text(t, encoding="utf-8")
            print("foglio", scheda, t.count("\n"), "righe", flush=True)
        except Exception as e:
            print("foglio", scheda, e, flush=True)


def raccolta():
    solo = os.environ.get("REGIONE", "").strip()
    if not solo: foglio()
    el, visti = [], set()
    for reg in ([solo] if solo else REGIONI):
        try:
            q = Q_RACCOLTA.replace("{reg}", reg)
            if reg.startswith("bbox:"):  # riquadro sud,ovest,nord,est (il comune giusto si assegna dopo)
                q = q.replace(f'area["ISO3166-2"="{reg}"]["admin_level"="4"]->.it;', "").replace("(area.it)", f"({reg[5:]})")
            elif reg.startswith("nome:"):  # regioni il cui confine OSM non ha il codice ISO
                q = q.replace(f'area["ISO3166-2"="{reg}"]["admin_level"="4"]', f'area["name"="{reg[5:]}"]["admin_level"="4"]["boundary"="administrative"]')
            d = overpass(q)
        except Exception as ex:
            print("regione", reg, "NON riuscita", ex, flush=True); continue
        n = 0
        for e in d["elements"]:
            k = (e["type"], e["id"])
            if e.get("tags", {}).get("name") and k not in visti:
                visti.add(k); el.append(e); n += 1
        print("regione", reg, n, flush=True)
    print("elementi con nome", len(el), flush=True)
    for e in el:
        e["lat"] = e.get("lat") or e.get("center", {}).get("lat")
        e["lon"] = e.get("lon") or e.get("center", {}).get("lon")
        e.pop("center", None)
    # siti web dei candidati
    siti = {}
    def sito(e):
        t = e["tags"]
        return t.get("website") or t.get("contact:website") or t.get("url") or ""
    lavoro = {f'{e["type"][0]}{e["id"]}': sito(e) for e in el if sito(e)}
    print("siti da visitare", len(lavoro), flush=True)
    with cf.ThreadPoolExecutor(32) as ex:
        for k, r in zip(lavoro, ex.map(visita_sito, lavoro.values())):
            siti[k] = r
    wd = wikidata({e["tags"]["wikidata"].split(";")[0].strip() for e in el if e["tags"].get("wikidata")})
    for e in el:
        k = f'{e["type"][0]}{e["id"]}'
        e["k"] = k; e["sito"] = siti.get(k); e["wd"] = wd.get(e["tags"].get("wikidata", "").split(";")[0].strip())
    nome = f"candidati_{re.sub(r'[^A-Za-z0-9-]', '_', solo)}.json" if solo else "candidati.json"
    (OUT / nome).write_text(json.dumps(el, ensure_ascii=False), encoding="utf-8")
    print("fatto", len(el), flush=True)


def ddg(q):
    st, _, t = get("https://html.duckduckgo.com/html/?" + urllib.parse.urlencode({"q": q}), timeout=20)
    if "result__url" not in t: raise RuntimeError("nessun risultato o blocco")
    ris = []
    for m in re.finditer(r'class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', t, re.S):
        href = html.unescape(m.group(1))
        uq = urllib.parse.parse_qs(urllib.parse.urlparse(href).query).get("uddg")
        ris.append([uq[0] if uq else href, re.sub(r"<[^>]+>", "", html.unescape(m.group(2))).strip()[:90]])
    return ris[:8]


PAROLE = {"concerti": r"concert[io]", "live": r"\blive\b", "musica": r"musica|musicale|music\b", "jazz": r"\bjazz\b",
          "band": r"\bband\b", "dj": r"\bdj\b|dj[ -]set", "rassegna": r"rassegna|stagione|cartellone|programma"}


def parole_sito(url):
    if not url: return None
    if not re.match(r"https?://", url): url = "https://" + url.lstrip("/")
    try:
        st, fin, t = get(url, timeout=12)
    except Exception as e:
        return {"errore": str(e)[:100]}
    testo = re.sub(r"<script.*?</script>|<style.*?</style>", " ", t, flags=re.S | re.I)
    testo = html.unescape(re.sub(r"<[^>]+>", " ", testo)).lower()
    r = {k: len(re.findall(v, testo)) for k, v in PAROLE.items()}
    r.update({a: testo.count(a) for a in ("2025", "2026")}); r["stato"] = st
    return r


def cerca_web(q):
    """Prova più motori di ricerca; restituisce [url, titolo] dei primi risultati."""
    motori = [
        ("bing", "https://www.bing.com/search?setlang=it&cc=it&" + urllib.parse.urlencode({"q": q}),
         r'<li class="b_algo".*?<h2[^>]*><a[^>]+href="([^"]+)"[^>]*>(.*?)</a>'),
        ("brave", "https://search.brave.com/search?" + urllib.parse.urlencode({"q": q, "source": "web"}),
         r'<a[^>]+href="(https?://[^"]+)"[^>]*class="[^"]*(?:heading-serpresult|result-header)[^"]*"[^>]*>(.*?)</a>'),
        ("mojeek", "https://www.mojeek.com/search?" + urllib.parse.urlencode({"q": q}),
         r'<a[^>]+class="title"[^>]+href="([^"]+)"[^>]*>(.*?)</a>'),
        ("ddglite", "https://lite.duckduckgo.com/lite/?" + urllib.parse.urlencode({"q": q}),
         r'<a[^>]+href="([^"]+)"[^>]*class=.result-link.[^>]*>(.*?)</a>'),
    ]
    errori = []
    for nome, url, rx in motori:
        if MOTORI_KO.get(nome, 0) >= 3: continue
        try:
            _, _, t = get(url, timeout=20, headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"})
            ris = []
            for m in re.finditer(rx, t, re.S):
                href = html.unescape(m.group(1))
                uq = urllib.parse.parse_qs(urllib.parse.urlparse(href).query).get("uddg")
                ris.append([uq[0] if uq else href, re.sub(r"<[^>]+>", "", html.unescape(m.group(2))).strip()[:90]])
            if ris:
                MOTORI_KO[nome] = 0
                return nome, ris[:8]
            MOTORI_KO[nome] = MOTORI_KO.get(nome, 0) + 1; errori.append(nome + ":vuoto")
        except Exception as e:
            MOTORI_KO[nome] = MOTORI_KO.get(nome, 0) + 1; errori.append(nome + ":" + str(e)[:40])
    raise RuntimeError(" ".join(errori))


MOTORI_KO = {}

Q_WIKIDATA = """SELECT ?item ?itemLabel ?lat ?lon ?ig ?fb ?web ?cap ?tipoLabel WHERE {
  hint:Query hint:optimizer "None" .
  { ?item wdt:P2003 ?ig . } UNION { ?item wdt:P2013 ?fb . }
  ?item wdt:P17 wd:Q38 .
  ?item wdt:P31 ?tipo .
  VALUES ?tipo { wd:Q24354 wd:Q153562 wd:Q1060829 wd:Q8719053 wd:Q622425 wd:Q57660343 wd:Q2338524 wd:Q1137809 wd:Q641226 wd:Q15206070 wd:Q29351369 }
  ?item p:P625/psv:P625 [ wikibase:geoLatitude ?lat ; wikibase:geoLongitude ?lon ] .
  FILTER NOT EXISTS { ?item wdt:P576 ?fine }
  OPTIONAL { ?item wdt:P856 ?web } OPTIONAL { ?item wdt:P1083 ?cap }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "it,en". }
}"""


def wikidata_luoghi():
    u = "https://query.wikidata.org/sparql?" + urllib.parse.urlencode({"query": Q_WIKIDATA, "format": "json"})
    _, _, t = get(u, timeout=300, limite=200_000_000, headers={"Accept": "application/sparql-results+json"})
    b = json.loads(t)["results"]["bindings"]
    ris = {}
    for x in b:
        k = x["item"]["value"].rsplit("/", 1)[-1]
        r = ris.setdefault(k, {"k": k, "nome": x["itemLabel"]["value"], "lat": float(x["lat"]["value"]), "lon": float(x["lon"]["value"]),
                               "ig": "", "fb": "", "web": "", "cap": "", "tipi": []})
        for f in ("ig", "fb", "web", "cap"):
            if f in x and not r[f]: r[f] = x[f]["value"]
        tl = x.get("tipoLabel", {}).get("value")
        if tl and tl not in r["tipi"]: r["tipi"].append(tl)
    el = list(ris.values())
    url = lambda e: e["web"]
    con_sito = [e for e in el if e["web"]]
    with cf.ThreadPoolExecutor(24) as ex:
        for e, p in zip(con_sito, ex.map(lambda e: parole_sito(e["web"]), con_sito)):
            e["parole"] = p
    for e in el:
        if not (e["ig"] or e["fb"]): continue   # senza social non serve l'indirizzo
        try:
            _, _, t = get(f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&lat={e['lat']}&lon={e['lon']}", timeout=30)
            e["rev"] = json.loads(t).get("address", {})
        except Exception as ex:
            e["rev_err"] = str(ex)[:80]
        time.sleep(1.1)
    (OUT / "wikidata.json").write_text(json.dumps(el, ensure_ascii=False), encoding="utf-8")
    print("wikidata luoghi", len(el), "con instagram", sum(1 for e in el if e["ig"]), flush=True)


def cerca_social():
    """env DATI = righe 'id|nome|città' separate da ';;'"""
    voci = [v.split("|") for v in os.environ.get("DATI", "").split(";;") if v.strip()]
    ris = {}
    for k, nome, citta in voci:
        r = {}
        for q in (f"{nome} {citta} instagram", f"{nome} {citta} facebook"):
            try:
                mot, res = cerca_web(q); r.setdefault("motore", mot); r.setdefault("ris", []).extend(res)
            except Exception as ex:
                r["err"] = str(ex)[:150]
            time.sleep(1.5)
            if any("instagram.com/" in u for u, _ in r.get("ris", [])): break
        ris[k] = r
        if len(ris) % 20 == 0: print("cerca_social", len(ris), MOTORI_KO, flush=True)
    (OUT / "social.json").write_text(json.dumps(ris, ensure_ascii=False), encoding="utf-8")
    print("fatto", len(ris), "con risultati", sum(1 for v in ris.values() if v.get("ris")), MOTORI_KO, flush=True)


def dettagli():
    ids = os.environ.get("DATI", "").split()
    tipi = {"n": "node", "w": "way", "r": "relation"}
    q = "[out:json][timeout:300];(" + "".join(f'{tipi[i[0]]}(id:{i[1:]});' for i in ids) + ");out center tags;"
    el = overpass(q)["elements"]
    url = lambda e: e["tags"].get("website") or e["tags"].get("contact:website") or e["tags"].get("url") or ""
    with cf.ThreadPoolExecutor(24) as ex:
        parole = dict(zip([f'{e["type"][0]}{e["id"]}' for e in el], ex.map(lambda e: parole_sito(url(e)), el)))
    print("siti controllati", sum(1 for v in parole.values() if v), flush=True)
    ris = {}
    bloccato = 0
    for e in el:
        k = f'{e["type"][0]}{e["id"]}'
        lat = e.get("lat") or e.get("center", {}).get("lat"); lon = e.get("lon") or e.get("center", {}).get("lon")
        r = {"k": k}
        try:
            _, _, t = get(f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&lat={lat}&lon={lon}", timeout=30)
            r["rev"] = json.loads(t).get("address", {})
        except Exception as ex:
            r["rev_err"] = str(ex)[:100]
        time.sleep(1.1)
        pw = parole.get(k) or {}
        musica = sum(pw.get(x, 0) for x in ("concerti", "live", "musica", "jazz", "band")) if pw and not pw.get("errore") else None
        if os.environ.get("CERCA_SOCIAL") == "1" and bloccato < 4 and (musica is None or musica >= 2):
            nome = e["tags"].get("name", ""); citta = (r.get("rev") or {}).get("city") or (r.get("rev") or {}).get("town") or (r.get("rev") or {}).get("village") or ""
            try:
                r["ddg"] = ddg(f"{nome} {citta} instagram"); bloccato = 0
            except Exception as ex:
                r["ddg_err"] = str(ex)[:100]; bloccato += 1
            time.sleep(2.5)
        r["parole"] = parole.get(k)
        ris[k] = r
        if len(ris) % 25 == 0: print("dettagli", len(ris), flush=True)
    (OUT / "dettagli.json").write_text(json.dumps(ris, ensure_ascii=False), encoding="utf-8")
    print("fatto", len(ris), "ddg bloccata" if bloccato >= 4 else "", flush=True)


if __name__ == "__main__":
    {"raccolta": raccolta, "dettagli": dettagli, "foglio": foglio, "wikidata": wikidata_luoghi,
     "social": cerca_social}[sys.argv[1]]()
