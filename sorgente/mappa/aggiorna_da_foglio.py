#!/usr/bin/env python3
"""Allinea la copia di riserva della mappa al foglio Google e aggiunge i confini dei comuni nuovi.

Uso, dalla cartella del repository:
    python3 sorgente/mappa/aggiorna_da_foglio.py foglio.json

foglio.json = il risultato di Google Sheets get_values sul range Luoghi!A:T (oggetto con "values",
oppure direttamente la lista di righe; la prima riga sono le intestazioni).
Poi rigenera la pagina con genera_mappa.py. Serve Node (npx) per mapshaper e l'accesso a
raw.githubusercontent.com per i confini ISTAT di openpolis/geojson-italy.
"""
import json, subprocess, sys, tempfile, unicodedata, urllib.request
from pathlib import Path

QUI = Path(__file__).resolve().parent
COLONNE = ["Nome", "Tipologia", "Pubblico/Privato", "Generi", "Capienza", "Nota capienza", "Indirizzo", "CAP", "Città",
           "Provincia", "Regione", "Latitudine", "Longitudine", "Instagram", "Facebook", "Sito web", "Email", "Telefono",
           "Note", "Fonte dati"]
COMUNI_URL = "https://raw.githubusercontent.com/openpolis/geojson-italy/master/topojson/limits_IT_municipalities.topo.json"
norm = lambda s: unicodedata.normalize("NFD", str(s)).encode("ascii", "ignore").decode().lower().strip()


def numero(v):
    v = str(v).strip().replace(" ", "")
    if not v: return ""
    if "," in v and "." in v: v = v.replace(".", "").replace(",", ".")
    else: v = v.replace(",", ".")
    try: return v if abs(float(v)) <= 180 else ""
    except ValueError: return ""


def main():
    raw = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    righe = raw["values"] if isinstance(raw, dict) else raw
    testa = [norm(c) for c in righe[0]]
    idx = [testa.index(norm(c)) if norm(c) in testa else None for c in COLONNE]
    assert idx[0] is not None, "colonna Nome mancante"
    dati = []
    for r in righe[1:]:
        cella = lambda i: str(r[i]).strip() if i is not None and i < len(r) and r[i] is not None else ""
        d = [cella(i) for i in idx]
        if not d[0]: continue
        d[11], d[12] = numero(d[11]), numero(d[12])
        d[4] = "".join(ch for ch in d[4] if ch.isdigit())
        for k in (13, 14):  # social: solo il nome utente, come nella copia originale
            v = d[k].rstrip("/")
            for dom in ("instagram.com/", "facebook.com/"):
                if dom in v: v = v.split(dom, 1)[1]
            d[k] = v.lstrip("@")
        dati.append(d)
    vecchi = json.loads((QUI / "dati.json").read_text(encoding="utf-8"))
    (QUI / "dati.json").write_text(json.dumps(dati, ensure_ascii=False), encoding="utf-8")
    print(f"dati.json: {len(vecchi)} -> {len(dati)} luoghi")

    # Confini dei comuni: tutti quelli che ospitano almeno un luogo con coordinate
    punti = {"type": "FeatureCollection", "features": [
        {"type": "Feature", "properties": {}, "geometry": {"type": "Point", "coordinates": [float(d[12]), float(d[11])]}}
        for d in dati if d[11] and d[12]]}
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        (tmp / "luoghi.geojson").write_text(json.dumps(punti), encoding="utf-8")
        topo = tmp / "comuni.topo.json"
        urllib.request.urlretrieve(COMUNI_URL, topo)
        out = tmp / "comuni.json"
        subprocess.run(["npx", "-y", "mapshaper@0.6", str(topo), "-join", str(tmp / "luoghi.geojson"), "calc=k=count()",
                        "-filter", "k>0", "-simplify", "70%", "keep-shapes", "-each", "n=name", "-filter-fields", "n",
                        "-o", "precision=0.0001", "format=geojson", str(out)], check=True, capture_output=True)
        nuovi = json.loads(out.read_text(encoding="utf-8"))
        prima = len(json.loads((QUI / "confini/comuni.json").read_text(encoding="utf-8"))["features"])
        (QUI / "confini/comuni.json").write_text(out.read_text(encoding="utf-8").strip(), encoding="utf-8")
        print(f"confini comuni: {prima} -> {len(nuovi['features'])}")


if __name__ == "__main__":
    main()
