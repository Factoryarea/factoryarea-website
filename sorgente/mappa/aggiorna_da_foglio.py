#!/usr/bin/env python3
"""Allinea la copia di riserva della mappa al foglio Google e aggiunge i confini dei comuni nuovi.

Uso, dalla cartella del repository:
    python3 sorgente/mappa/aggiorna_da_foglio.py foglio.json              (sostituisce tutta la copia)
    python3 sorgente/mappa/aggiorna_da_foglio.py --aggiungi nuovi.json    (aggiunge solo i luoghi nuovi)

foglio.json = il risultato di Google Sheets get_values sul range Luoghi!A:T (oggetto con "values",
oppure direttamente la lista di righe; la prima riga sono le intestazioni).
nuovi.json = lista di righe nell'ordine delle colonne del foglio (senza intestazioni), oppure lista
di oggetti con le intestazioni come chiavi. I luoghi già presenti (stesso nome e città) si saltano.
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
    aggiungi = "--aggiungi" in sys.argv
    raw = json.loads(Path([a for a in sys.argv[1:] if a != "--aggiungi"][0]).read_text(encoding="utf-8"))
    righe = raw["values"] if isinstance(raw, dict) else raw
    if aggiungi:  # righe senza intestazioni: liste nell'ordine delle colonne oppure oggetti
        righe = [COLONNE] + [[o.get(c, "") for c in COLONNE] if isinstance(o, dict) else o for o in righe]
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
    if aggiungi:
        chiave = lambda d: (norm(d[0]), norm(d[8]))
        presenti = {chiave(d) for d in vecchi}
        nuovi = [d for d in dati if chiave(d) not in presenti]
        print("nuovi:", ", ".join(d[0] for d in nuovi) or "nessuno")
        dati = vecchi + nuovi
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
                        "-simplify", "70%", "keep-shapes", "-each", "n=name", "-filter-fields", "n,k,prov_acr",
                        "-o", "precision=0.0001", "format=geojson", str(out)], check=True, capture_output=True)
        tutti = json.loads(out.read_text(encoding="utf-8"))
        # per nome si cerca città + provincia (ci sono comuni omonimi), o solo il nome se manca la sigla
        citta = {(norm(d[8]), d[9].strip().upper()) for d in dati if d[8]}
        nome_ok = lambda p: (norm(p["n"]), p.get("prov_acr") or "") in citta or (norm(p["n"]), "") in citta
        tieni = [f for f in tutti["features"] if (f["properties"].get("k") or 0) > 0 or nome_ok(f["properties"])]
        for f in tieni: f["properties"] = {"n": f["properties"]["n"]}
        nuovi = {"type": "FeatureCollection", "features": tieni}
        out.write_text(json.dumps(nuovi, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        prima = len(json.loads((QUI / "confini/comuni.json").read_text(encoding="utf-8"))["features"])
        (QUI / "confini/comuni.json").write_text(out.read_text(encoding="utf-8").strip(), encoding="utf-8")
        print(f"confini comuni: {prima} -> {len(nuovi['features'])}")


if __name__ == "__main__":
    main()
