#!/usr/bin/env python3
"""Genera tutte le pagine HTML del sito Factory Area.

Uso, dalla cartella del repository:  python3 sorgente/genera.py
Scrive le pagine nella cartella del sito (index.html, eventi/, about-us/, privacy/, 404.html,
sitemap.xml, robots.txt, site.webmanifest, CNAME). CSS, JavaScript, foto e video NON sono
generati qui: si modificano direttamente in assets/.
"""
import html
import json
import hashlib
import base64
from datetime import date
from pathlib import Path

# Cartella di questo programma e cartella del sito (quella sopra), dove scrive le pagine
SRC = Path(__file__).resolve().parent
OUT = SRC.parent
DOMAIN = "https://factoryarea.it"
TICKETS = "https://xceed.me/it/catanzaro/club/complesso-monumentale-del-san-giovanni"
# Link esterni: nuova scheda, nessun accesso alla pagina d'origine (tabnabbing) e nessun referrer
EXT = 'target="_blank" rel="noopener noreferrer"'
SOCIAL = [
    ("Instagram", "https://www.instagram.com/factoryarea"),
    ("WhatsApp", "https://www.whatsapp.com/channel/0029VbCT6C2CcW4zBC6F692b"),
    ("Telegram", "https://t.me/FACTORYAREA"),
    ("Spotify", "https://open.spotify.com/show/7eSPHnYkYD0GSq333V9OXO"),
    ("YouTube", "https://www.youtube.com/@factoryarea"),
    ("LinkedIn", "https://www.linkedin.com/company/factoryarea/"),
]
ORG = {
    "name": "Factory+ ETS",
    "legal": "Associazione culturale Factory+",
    "street": "Via Gregorio Mattei 3",
    "zip": "88100",
    "city": "Catanzaro",
    "prov": "CZ",
    "cf": "97105210799",
    "piva": "03942250790",
    "runts": "0118188",
    "runts_section": "Altri enti del Terzo settore",
    "runts_decree": "decreto della Regione Calabria n. 5206 del 16/04/2024",
}
ORG_ADDRESS = f"{ORG['street']}, {ORG['zip']} {ORG['city']} ({ORG['prov']})"
BRAND_BLUE = "#0024FF"   # blu elettrico della foto profilo Instagram
HERO_TINT = "#6e5745"    # bordo superiore della copertina del video, scurito come sotto la barra
# Colore del bordo superiore del video ogni mezzo secondo (versione orizzontale e verticale),
# calcolato una volta dai file video: serve a colorare la fascia in alto del browser
_TINT = json.loads((SRC / "tint-timeline.json").read_text())
TINT_H = ",".join(_TINT["h"])
TINT_V = ",".join(_TINT["v"])
TODAY = date.today().isoformat()

OG_IMAGE = "/assets/img/og-factoryarea.png"
OG_ALT = "Logo Factory+ di Factory Area Festival"

# Logo ufficiale (Logo_Factory+.svg dal press kit 2026), ritagliato e colorato con il colore del testo
LOGO_SHAPES = (SRC / "logo-shapes.txt").read_text().strip()
LOGO_SVG = (f'<svg class="nav__logo-svg" viewBox="784.94 705.36 1264.77 279.21" fill="currentColor" '
            f'aria-hidden="true" focusable="false">{LOGO_SHAPES}</svg>')

DESC = ("Factory Area Festival è il festival multidisciplinare di musica e arte nato in Calabria "
        "nel 2021 e organizzato da Factory+ ETS di Catanzaro.")


def jsonld(data):
    body = json.dumps(data, ensure_ascii=False, indent=2)
    body = "\n".join("  " + line for line in body.splitlines())
    return f'  <script type="application/ld+json">\n{body}\n  </script>\n'


NGO = {
    "@context": "https://schema.org",
    "@type": "NGO",
    "@id": f"{DOMAIN}/#ente",
    "name": ORG["name"],
    "alternateName": [ORG["legal"], "Factory Area Festival"],
    "description": "Ente del Terzo Settore che organizza Factory Area Festival, festival multidisciplinare di musica e arte in Calabria.",
    "url": f"{DOMAIN}/",
    "logo": f"{DOMAIN}/assets/img/logo-factory-nero.png",
    "foundingDate": "2021",
    "taxID": ORG["cf"],
    "vatID": f"IT{ORG['piva']}",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": ORG["street"],
        "postalCode": ORG["zip"],
        "addressLocality": ORG["city"],
        "addressRegion": ORG["prov"],
        "addressCountry": "IT",
    },
    "sameAs": [url for _, url in SOCIAL],
}

WEBSITE = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": f"{DOMAIN}/#sito",
    "name": "Factory Area Festival",
    "alternateName": ["Factory Area", "factoryarea.it"],
    "url": f"{DOMAIN}/",
    "inLanguage": "it-IT",
    "publisher": {"@id": f"{DOMAIN}/#ente"},
}

# Dimensioni originali delle foto (servono per proporzioni e srcset)
DIMS = {
    "2025": {"copertina": (4126, 5501), "foto-1": (4429, 5905), "foto-2": (4331, 5770), "foto-3": (4672, 4737), "foto-4": (1080, 1440)},
    "2024": {"copertina": (5149, 3862), "foto-1": (5190, 3893), "foto-2": (4000, 5333), "foto-3": (4000, 3715), "foto-4": (3931, 5897)},
    "2023": {"copertina": (5875, 3306), "foto-1": (3944, 7008), "foto-2": (3944, 7008), "foto-3": (6939, 3905), "foto-4": (3944, 7008)},
    "2022": {"copertina": (1440, 1440), "foto-1": (1440, 1440), "foto-2": (1440, 1440), "foto-3": (1600, 1066), "foto-4": (1440, 1440)},
    "2021": {"copertina": (1600, 1066), "foto-1": (1440, 959), "foto-2": (955, 719), "foto-3": (2048, 1536), "foto-4": (1080, 719)},
}
DIMS["2026"] = {"copertina": (4560, 3648), "foto-1": (3327, 4991), "foto-2": (2918, 3648), "foto-3": (5327, 3551), "foto-4": (3072, 4095)}

EDITIONS = [
    {
        "slug": "sestaed", "year": "2026", "num": "6", "ordinal": "sesta",
        "title": "Factory Area Festival 6",
        "venue": "Complesso Monumentale del S. Giovanni (Catanzaro)",
        "place": "Complesso Monumentale del San Giovanni", "city": "Catanzaro",
        "start": "2026-08-18", "end": "2026-08-19",
        "date": "18 - 19 agosto 2026",
        "lineup": "MACE, Toy Tonics Jam (Kapote & Fimiani), Scar, Tresca Y Tigre, Tyto (con Piero Perelli), Primogenito, Sèdine, Moribiondi Crew, Fabio Nirta, Nicodemo b2b Volantis, Noona.",
        "paras": [
            "Il 18 e 19 agosto la sesta edizione è tornata nel cuore di Catanzaro, al Complesso Monumentale del San Giovanni. Due notti in cui la città ha ballato insieme: dal closing set di MACE, che ci ha lasciato la pelle d'oca, alla selecta del collettivo berlinese Toy Tonics Jam, fino agli artisti calabresi che crescono con noi.",
            "È stata l'edizione più entusiasmante di sempre: un viaggio tra il romanticismo punk di Scar, la carica di Moribiondi Crew e Tresca Y Tigre, le esplorazioni sonore di Tyto con Piero Perelli e il suono nostalgico dei Noona. Per il secondo anno il festival ha avuto il patrocinio e la compartecipazione del Comune di Catanzaro.",
            "Factory Area non è solo musica. Accanto ai concerti, un programma multidisciplinare di workshop e talk con le realtà del territorio: la fotografia in studio e la cianotipia con Osservatorio Maree, gli incontri con Rubbettino Editore, la partecipazione di Chiama, Eremo Studio e Jungi Mundu. Perché un festival, per noi, è anche uno spazio per condividere, riflettere e sentirsi comunità.",
        ],
        "next": ["quintaed", "quartaed", "terzaed"],
    },
    {
        "slug": "quintaed", "year": "2025", "num": "5", "ordinal": "quinta",
        "title": "Factory Area Festival 5",
        "venue": "Complesso Monumentale del S. Giovanni (Catanzaro)",
        "place": "Complesso Monumentale del San Giovanni", "city": "Catanzaro",
        "start": "2025-08-20", "end": "2025-08-21",
        "date": "20 - 21 agosto 2025",
        "lineup": "Venerus, Camoufly, Faccianuvola, Emmanuelle, Bais, Paola Pizzino, Emporio, IonDJ.",
        "paras": [
            "Il progetto ha avuto una portata artistica dall'ampio respiro, ospitando artisti nazionali affermati ed emergenti. Tra le attività extra-musicali è possibile citare la mostra \"<em>casasempreaperta</em>\" in collaborazione con Osservatorio Maree, con cui è stato anche realizzato un talk, oltre quello organizzato con Simeri Lab. Inoltre Channel 808 ha realizzato un podcast live con i vari protagonisti del festival.",
            "La rassegna, che ha visto la compartecipazione del comune di Catanzaro, ha raggiunto i principali canali comunicativi regionali tramite media online, radio e televisione. I partecipanti sono stati oltre 1500, registrando il sold-out durante la seconda giornata del festival.",
            "La comunicazione è stata affidata allo studio creativo Tuttovento che ha declinato il claim della quinta edizione, <em>crafting together</em>, attraverso vari formati, digitali e fisici. Di particolare rilevanza la reinterpretazione grafica di uno dei simboli cittadini: il cavatore, associando il claim scelto all'immaginario dell'homo faber per rappresentare la tendenza all'impegno e all'autonomia della produzione.",
        ],
        "next": ["sestaed", "quartaed", "terzaed"],
    },
    {
        "slug": "quartaed", "year": "2024", "num": "4", "ordinal": "quarta",
        "title": "Factory Area Festival 4",
        "venue": "Castello Normanno di Squillace",
        "place": "Castello Normanno di Squillace", "city": "Squillace",
        "start": "2024-08-06", "end": "2024-08-06",
        "date": "6 agosto 2024",
        "lineup": "Gemello, Bruno Belissimo, Ibisco, RIP.",
        "paras": [
            "L'evento ha segnato la conclusione di un primo ciclo per il progetto Factory Area Festival. All'interno della meravigliosa cornice del castello normanno di Squillace si sono esibiti artisti di portata nazionale come Gemello ed emergenti in rampa di lancio come il duo RIP.",
            "La comunicazione è stata curata da Tuttovento studio che ha reinterpretato in chiave essenziale il concetto di espansione del suono attraverso il claim \"<em>Sound Based Connection</em>\".",
            "L'evento ha registrato il sold-out, certificando come il lavoro della produzione nei mesi precedenti abbia attivato un genuino interesse nei confronti della comunità locale.",
        ],
        "next": ["terzaed", "quintaed", "primaed"],
    },
    {
        "slug": "terzaed", "year": "2023", "num": "3", "ordinal": "terza",
        "title": "Factory Area Festival 3",
        "venue": "Ex Comac Soverato",
        "place": "Ex Comac", "city": "Soverato",
        "start": "2023-08-18", "end": "2023-08-18",
        "date": "18 agosto 2023",
        "lineup": "Rareș, FuckPop, Laripa.",
        "paras": [
            "La terza edizione del Factory Area Festival è stata l'ultima all'interno dell'Ex Comac di Soverato. La direzione artistica ha selezionato tre artisti emergenti dal background musicale differente, coprendo come generi l'elettronica, il rap e il cantautorato.",
            "Le attività multidisciplinari sono state la mostra \"Avanzi d'ossa\" organizzata da osservatorio maree e un'opera temporanea d'arte muraria realizzata dal writer calabrese Silver bounce.",
            "L'evento, con il patrocinio del comune di Soverato, ha registrato un discreto successo sia in termini di partecipazione che di copertura social e mediatica ad ambito locale.",
        ],
        "next": ["secondaed", "quartaed", "primaed"],
    },
    {
        "slug": "secondaed", "year": "2022", "num": "2", "ordinal": "seconda",
        "title": "Factory Area Festival 2",
        "venue": "Ex Comac Soverato",
        "place": "Ex Comac", "city": "Soverato",
        "start": "2022-08-10", "end": "2022-08-10",
        "date": "10 agosto 2022",
        "lineup": "Fuera, Praino, Emporio.",
        "paras": [
            "La seconda edizione del Factory Area Festival ha ospitato una lineup più corposa comprensiva del gruppo sperimentale Fuera, freschi dell'uscita dell'album \"<em>Circo Mezzaluna</em>\".",
            "A livello multidisciplinare hanno partecipato all'evento 0039 studio con dei visual realizzati appositamente per l'evento, Sewo con una sessione di live painting. Inoltre, ad inizio evento, è stato realizzato un talk con la partecipazione delle progettiste culturali Paola Galuffo e Giulia Bonanno.",
            "Il comune di Soverato ha rinnovato l'interesse e la fiducia nel progetto concedendo il patrocinio per la realizzazione del festival.",
        ],
        "next": ["quartaed", "primaed", "terzaed"],
    },
    {
        "slug": "primaed", "year": "2021", "num": "", "ordinal": "prima",
        "title": "Factory Area Festival",
        "venue": "Ex Comac Soverato",
        "place": "Ex Comac", "city": "Soverato",
        "start": "2021-08-23", "end": "2021-08-23",
        "date": "23 agosto 2021",
        "lineup": "Reino",
        "paras": [
            "La prima edizione è stato un banco di prova, la possibilità di rendere reale un progetto solo immaginato fin quel momento. L'artista ad esibirsi è stato Reino, rocker locale che ha preceduto il dj-set di Fabio Nirta.",
            "Ad inizio rassegna è stato realizzato un talk con Edoardo Suraci e Vincenzo Costantino, creatori del progetto Altrove, vero punto di riferimento per la produzione di Factory Area Festival. Inoltre, durante la serata, il pubblico ha avuto modo di assistere ad un live painting realizzato dall'associazione catanzarese Amatoriarte.",
            "L'evento è stata la prima occasione per presentare il progetto ad un'istituzione pubblica, il comune di Soverato, che ha dimostrato fin da subito entusiasmo per un'iniziativa giovanile del genere.",
        ],
        "next": ["quintaed", "quartaed", "terzaed"],
    },
]
BY_SLUG = {e["slug"]: e for e in EDITIONS}
PUBLIC = [e for e in EDITIONS if not e.get("hidden")]

# Effetto "edizioni impilate" della home: posizione e riduzione di ogni foto
STACK = [
    # slug, foto, top desktop, top telefono, scala desktop, scala telefono, spostamento desktop, telefono
    ("sestaed", "copertina", 0, 0, 0.4, 0.5, -100, -170),
    ("quintaed", "copertina", 50, 30, 0.5, 0.6, -100, -150),
    ("quartaed", "foto-1", 100, 60, 0.6, 0.7, -100, -130),
    ("terzaed", "foto-1", 150, 90, 0.7, 0.8, -100, -100),
    ("secondaed", "foto-1", 150, 90, 0.7, 0.8, -100, -100),
    ("primaed", "foto-1", 150, 90, 0.7, 0.8, -100, -100),
]

# Larghezze delle foto (margini pagina: 32 px su computer e tablet, 16 px su telefono)
SIZES_WIDE = "(max-width: 809.98px) calc(100vw - 32px), (max-width: 1663.98px) calc(100vw - 64px), 1600px"
SIZES_HALF = "(max-width: 809.98px) calc(100vw - 32px), (max-width: 1663.98px) calc(50vw - 37px), 795px"
SIZES_THIRD = "(max-width: 809.98px) calc(100vw - 32px), (max-width: 1663.98px) calc(33.3vw - 28px), 527px"


def esc(s):
    return html.escape(s, quote=True)


def scaled(w, h, limit):
    k = min(1.0, limit / max(w, h))
    return round(w * k), round(h * k)


def img(p, year, name, cls, alt, sizes, lazy=True, priority=False, small_src=False):
    w, h = DIMS[year][name]
    w1, _ = scaled(w, h, 1024)
    w2, h2 = scaled(w, h, 2048)
    base = f"{p}assets/img/edizioni/{year}/{name}"
    if w1 == w2:
        srcset = f"{base}-1024.jpg {w1}w"
    else:
        srcset = f"{base}-1024.jpg {w1}w, {base}-2048.jpg {w2}w"
    src = f"{base}-1024.jpg" if small_src else f"{base}-2048.jpg"
    attrs = [
        f'class="{cls}"' if cls else "",
        f'src="{src}"',
        f'srcset="{srcset}"',
        f'sizes="{sizes}"',
        f'width="{w2}" height="{h2}"',
        f'alt="{esc(alt)}"',
        'loading="lazy"' if lazy else "",
        'fetchpriority="high"' if priority else "",
        'decoding="async"',
    ]
    return "<img " + " ".join(a for a in attrs if a) + ">"


def edition_label(e):
    return f"{e['title']} ({e['year']})"


def breadcrumbs(items):
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": name, "item": f"{DOMAIN}{path}"}
            for i, (name, path) in enumerate(items)
        ],
    }


def event_data(e):
    performers = [x.strip() for x in e["lineup"].rstrip(".").split(",") if x.strip()]
    return {
        "@context": "https://schema.org",
        "@type": "Festival",
        "name": edition_label(e),
        "description": f"{e['ordinal'].capitalize()} edizione di Factory Area Festival, festival di musica e arte in Calabria.",
        "url": f"{DOMAIN}/eventi/{e['slug']}/",
        "image": [f"{DOMAIN}/assets/img/edizioni/{e['year']}/copertina-2048.jpg"],
        "startDate": e["start"],
        "endDate": e["end"],
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "location": {
            "@type": "Place",
            "name": e["place"],
            "address": {
                "@type": "PostalAddress",
                "addressLocality": e["city"],
                "addressRegion": "CZ",
                "addressCountry": "IT",
            },
        },
        "organizer": {"@type": "NGO", "name": ORG["name"], "url": f"{DOMAIN}/"},
        "performer": [{"@type": "PerformingGroup", "name": n} for n in performers],
    }


# ---------------------------------------------------------------------------
# Parti comuni
# ---------------------------------------------------------------------------

# Piccolo script in testa alla pagina: attiva le animazioni prima che la pagina compaia
INLINE_JS = """
    /* Attiva le animazioni (se il browser non chiede di ridurre i movimenti) */
    (function () {
      var d = document.documentElement;
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        d.classList.add("anim");
        setTimeout(function () { if (!window.__faReady) d.classList.remove("anim"); }, 4000);
      }
    })();
  """
_INLINE_HASH = base64.b64encode(hashlib.sha256(INLINE_JS.encode("utf-8")).digest()).decode()

# Content Security Policy: la pagina può caricare solo file del sito stesso
# (script, font, foto, video). Blocca script iniettati da terzi e incorporamenti.
CSP = "; ".join([
    "default-src 'self'",
    f"script-src 'self' 'sha256-{_INLINE_HASH}'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "media-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "upgrade-insecure-requests",
])


def head(p, title, path, description=DESC, og_title=None, abs_assets=False, data=(), robots=None, preload="", theme=None):
    a = "/" if abs_assets else p
    og_title = og_title or title
    robots = robots or "index, follow, max-image-preview:large"
    scripts = "".join(jsonld(d) for d in data)
    return f"""<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="{CSP}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}">
  <link rel="canonical" href="{DOMAIN}{path}">
  <meta name="robots" content="{robots}">
  <meta name="theme-color" content="{theme or BRAND_BLUE}">

  <!-- Anteprima quando il link viene condiviso (WhatsApp, Facebook, LinkedIn, X…) -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Factory Area Festival">
  <meta property="og:locale" content="it_IT">
  <meta property="og:title" content="{esc(og_title)}">
  <meta property="og:description" content="{esc(description)}">
  <meta property="og:url" content="{DOMAIN}{path}">
  <meta property="og:image" content="{DOMAIN}{OG_IMAGE}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{OG_ALT}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(og_title)}">
  <meta name="twitter:description" content="{esc(description)}">
  <meta name="twitter:image" content="{DOMAIN}{OG_IMAGE}">
  <meta name="twitter:image:alt" content="{OG_ALT}">

  <!-- Icone -->
  <link rel="icon" href="{a}favicon.ico" sizes="16x16 32x32 48x48">
  <link rel="icon" href="{a}assets/img/icon-192.png" type="image/png" sizes="192x192">
  <link rel="icon" href="{a}assets/img/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="{a}assets/img/apple-touch-icon.png">
  <link rel="manifest" href="{a}site.webmanifest">

  <link rel="preload" href="{a}assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
{preload}  <link rel="stylesheet" href="{a}assets/css/style.css">
  <script>{INLINE_JS}</script>
  <script src="{a}assets/js/lenis.min.js" defer></script>
  <script src="{a}assets/js/main.js" defer></script>
{scripts}</head>"""


def nav(p, current=None, overlay=False):
    home = p or "./"

    def cur(key):
        return ' aria-current="page"' if current == key else ""

    fx = 'data-split="word" data-trigger="load" style="--ty:10px;--tb:10px;--tdur:.4s"'
    reveal = 'data-reveal data-trigger="load" style="--ry:10px;--rb:6px;--rd:.8s;--rdelay:{d}s"'
    tint = "" if overlay else f"""  <!-- Invisibile: Safari su iPhone ne usa il colore per la fascia sopra la barra -->
  <div class="tint" aria-hidden="true" style="background-color:{BRAND_BLUE}"></div>
"""
    return tint + f"""  <a class="skip-link" href="#contenuto">Vai al contenuto</a>

  <!-- ================= NAVIGAZIONE =================
       Barra con sfondo sfocato. In home resta trasparente sopra il video
       finché non si scorre la pagina (attributo data-overlay). -->
  <header class="nav" data-nav{' data-overlay' if overlay else ''}>
    <div class="nav__bar">
      <a class="nav__logo" href="{home}"{cur('home')} aria-label="Factory Area Festival, vai alla home" {reveal.format(d='0')}>
        {LOGO_SVG}
      </a>
      <nav class="nav__links" aria-label="Menu principale">
        <a class="nav__link" href="{p}eventi/"{cur('eventi')} {fx} data-delay="0.1">Eventi</a>
        <a class="nav__link" href="{p}about-us/"{cur('about')} {fx} data-delay="0.1">About</a>
        <a class="btn-primary" href="{TICKETS}" {EXT} {reveal.format(d='.2')}>Tickets</a>
      </nav>
      <div class="nav__mobile">
        <a class="btn-primary" href="{TICKETS}" {EXT}>Tickets</a>
        <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="menu-mobile">Menu</button>
      </div>
    </div>
    <nav class="nav__menu" id="menu-mobile" aria-label="Menu" hidden>
      <a href="{p}eventi/"{cur('eventi')} style="--d:.3s">Eventi</a>
      <a href="{p}about-us/"{cur('about')} style="--d:.36s">About</a>
    </nav>
  </header>
"""


def footer(p):
    social = "\n".join(
        f'              <li><a href="{url}" {EXT}>{name}</a></li>' for name, url in SOCIAL
    )
    legal = [
        f"© <span data-year>2026</span> {ORG['name']}",
        ORG_ADDRESS,
        f"C.F. {ORG['cf']}",
        f"P.IVA {ORG['piva']}",
        f"RUNTS rep. n. {ORG['runts']}",
    ]
    legal_html = "\n            ".join(f"<span>{x}</span>" for x in legal)
    return f"""
  <!-- ================= FOOTER ================= -->
  <footer class="footer">
    <div class="footer__wrap">
      <div class="footer__top">
        <div class="footer__cols">
          <div class="footer__col">
            <p class="footer__title">Social</p>
            <ul class="footer__list">
{social}
            </ul>
          </div>
          <!-- Colonne libere: per aggiungere un gruppo di link copia il blocco "footer__col" qui sopra -->
        </div>
        <!-- Spazio per loghi o riconoscimenti (in basso a destra): per ora vuoto -->
        <div class="footer__badges"></div>
      </div>
      <div class="footer__bottom">
        <div class="footer__legal-wrap">
          <p class="footer__legal">
            {legal_html}
          </p>
        </div>
        <p class="footer__links"><a href="{p}privacy/">Privacy Policy</a><a href="{p}privacy/#cookie">Cookie Policy</a></p>
      </div>
    </div>
  </footer>
"""


def page(path_parts, content):
    target = OUT.joinpath(*path_parts)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def work_card(p_img, href, e, sizes, cursor_y):
    return f"""          <a class="work" href="{href}" data-reveal style="--ry:60px;--rdelay:.1s" data-cursor="explore" data-cursor-x="20" data-cursor-y="{cursor_y}">
            <div class="work__media">
              {img(p_img, e['year'], 'copertina', 'work__img', f"Foto di {edition_label(e)}", sizes, small_src=True)}
            </div>
            <div class="work__info">
              <h3 class="t-body">{esc(e['title'])}</h3>
              <p class="t-body c-70">{esc(e['venue'])}</p>
            </div>
          </a>"""


# ---------------------------------------------------------------------------
# HOME
# ---------------------------------------------------------------------------

PAUSE_ICON = '<svg class="hero__icon hero__icon--pause" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>'
PLAY_ICON = '<svg class="hero__icon hero__icon--play" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>'


def build_home():
    p = ""
    cards = []
    for slug, photo, top, top_m, sc, sc_m, dy, dy_m in STACK:
        e = BY_SLUG[slug]
        cards.append(f"""      <a class="stack__card" href="eventi/{slug}/" aria-label="{esc(edition_label(e))}" style="--top:{top}px;--top-m:{top_m}px" data-scale="{sc}" data-scale-m="{sc_m}" data-y="{dy}" data-y-m="{dy_m}">
        <div class="stack__inner">
          {img(p, e['year'], photo, 'stack__img', f"Foto di {edition_label(e)}", '100vw')}
          <div class="stack__label">
            <h2 class="t-h2" data-split="char" data-stagger="0.1" data-delay="0.1" style="--ty:10px;--ts:.8;--tb:3px;--tdur:1s">{e['year']}</h2>
            <span class="stack__line" aria-hidden="true"></span>
          </div>
        </div>
      </a>""")
    preload = '  <link rel="preload" href="assets/video/hero-poster.jpg" as="image" fetchpriority="high">\n'
    content = head(p, "Factory Area Festival | Festival di musica e arte in Calabria", "/",
                   og_title="Factory Area Festival", data=(NGO, WEBSITE), preload=preload,
                   theme=HERO_TINT) + f"""
<body class="page-home">
  <!-- Colore della fascia in alto del browser (Safari su iPhone e Mac, Chrome su Android):
       segue il colore del bordo superiore del video, finché non si scorre la pagina. -->
  <div class="tint" data-tint aria-hidden="true" style="background-color:{HERO_TINT}"></div>
{nav(p, 'home', overlay=True)}
  <main id="contenuto">

    <!-- HERO: video a tutto schermo, solo decorativo (non cliccabile).
         Il video resta fermo e le sezioni successive gli scorrono sopra.
         Parte da solo (autoplay), senza audio e in loop. Ogni browser sceglie il
         primo file che sa riprodurre: HEVC (Safari, iPhone, molti Chrome), AV1
         (Chrome, Firefox, Android) o H.264 (tutti gli altri); sui telefoni in
         verticale la versione ritagliata 3:4. Se il file scelto dà errore o resta
         fermo, lo script passa al formato successivo. -->
    <div class="hero__media">
      <div class="hero__parallax">
        <video class="hero__video" data-hero-video autoplay muted loop playsinline preload="auto" disablepictureinpicture disableremoteplayback x-webkit-airplay="deny" poster="assets/video/hero-poster.jpg" width="1920" height="1008" aria-hidden="true" tabindex="-1"
               data-tint-h="{TINT_H}"
               data-tint-v="{TINT_V}">
          <source src="assets/video/hero-verticale.hevc.mp4" type='video/mp4; codecs="hvc1.1.6.L93.90"' media="(max-aspect-ratio: 3/4)">
          <source src="assets/video/hero-verticale.av1.mp4" type='video/mp4; codecs="av01.0.05M.10"' media="(max-aspect-ratio: 3/4)">
          <source src="assets/video/hero-verticale.mp4" type="video/mp4" media="(max-aspect-ratio: 3/4)">
          <source src="assets/video/hero.hevc.mp4" type='video/mp4; codecs="hvc1.1.6.L120.90"'>
          <source src="assets/video/hero.av1.mp4" type='video/mp4; codecs="av01.0.08M.10"'>
          <source src="assets/video/hero.mp4" type="video/mp4">
        </video>
        <!-- Copertina sopra il video finché non parte davvero: nasconde il grande "play"
             che Safari mostra al centro quando blocca l'avvio automatico -->
        <img class="hero__cover" data-hero-cover src="assets/video/hero-poster.jpg" alt="" width="1920" height="1008" aria-hidden="true" decoding="async">
      </div>
    </div>
    <section class="hero" id="hero">
      <div class="hero__content" data-reveal data-trigger="load">
        <h1 class="hero__text t-hero" data-split="line" data-trigger="load" data-stagger="0.1" data-delay="0.1">Factory Area Festival nasce dall’incontro tra persone, dove la creatività si traduce in suoni e relazioni che trasformano i luoghi.</h1>
      </div>
      <button class="hero__toggle" type="button" data-video-toggle aria-label="Metti in pausa il video" hidden>
        {PAUSE_ICON}
        {PLAY_ICON}
      </button>
    </section>

    <!-- EDIZIONI: le foto si fermano e si impilano scorrendo -->
    <section class="stack" id="edizioni" aria-label="Le edizioni">
{chr(10).join(cards)}
    </section>

    <!-- INTRO: il testo si "accende" scorrendo -->
    <section class="intro" id="about">
      <h2 class="intro__text t-display reveal-scroll">Factory Area è il festival di Factory+ ETS, associazione senza scopo di lucro che porta arte e cultura in Calabria, accessibili a tutti.</h2>
      <a class="link-line" href="about-us/">Più informazioni</a>
    </section>

  </main>
{footer(p)}
</body>
</html>
"""
    page(["index.html"], content)


# ---------------------------------------------------------------------------
# EVENTI (elenco)
# ---------------------------------------------------------------------------

def build_events():
    p = "../"
    cards = "\n".join(work_card(p, f"{e['slug']}/", e, SIZES_HALF, 20) for e in PUBLIC)
    years = f"{PUBLIC[-1]['year']}–{PUBLIC[0]['year']}"
    content = head(p, f"Edizioni {years} | Factory Area Festival", "/eventi/",
                   description="Tutte le edizioni di Factory Area Festival dal 2021 a oggi: artisti, luoghi e foto del festival di musica e arte in Calabria, tra Catanzaro, Squillace e Soverato.",
                   og_title="Le edizioni di Factory Area Festival",
                   data=(breadcrumbs([("Home", "/"), ("Eventi", "/eventi/")]),)) + f"""
<body class="page-events">
{nav(p, 'eventi')}
  <main id="contenuto" class="page events">
    <div class="page-head" data-reveal style="--ry:60px">
      <h1 class="t-h2">Eventi</h1>
      <p class="t-h2" aria-label="{len(PUBLIC)} edizioni">({len(PUBLIC)})</p>
    </div>
    <div class="grid">
{cards}
    </div>
  </main>
{footer(p)}
</body>
</html>
"""
    page(["eventi", "index.html"], content)


# ---------------------------------------------------------------------------
# PAGINA EDIZIONE
# ---------------------------------------------------------------------------

def build_edition(e):
    p = "../../"
    y = e["year"]
    lbl = edition_label(e)
    hidden = e.get("hidden", False)
    nxt = "\n".join(work_card(p, f"../{s}/", BY_SLUG[s], SIZES_THIRD, 60) for s in e["next"])
    title = f"{lbl} · {e['city']}"
    desc = f"{e['title']} – {e['date']}, {e['venue']}. Lineup: {e['lineup'].rstrip('.')}."
    if hidden:
        data = ()
        robots = "noindex, nofollow"
        comment = """
  <!-- PAGINA PRONTA MA NON ANCORA PUBBLICATA: non è collegata dal resto del sito
       e non viene indicizzata (noindex). Per pubblicarla vedi il README, sezione "Pagina 2026". -->"""
    else:
        data = (event_data(e), breadcrumbs([("Home", "/"), ("Eventi", "/eventi/"), (lbl, f"/eventi/{e['slug']}/")]))
        robots = None
        comment = ""
    alt = lambda what: f"Foto di {lbl}"
    content = head(p, title, f"/eventi/{e['slug']}/", description=desc,
                   og_title=lbl, data=data, robots=robots) + f"""
<body class="page-edition">{comment}
{nav(p, 'eventi')}
  <main id="contenuto">

    <!-- Foto di copertina (resta ferma mentre il contenuto scorre sopra) -->
    <div class="banner" data-reveal data-trigger="load" style="--ry:50px;--rdelay:.1s">
      {img(p, y, 'copertina', 'banner__img', f"Foto di copertina di {lbl}", '100vw', lazy=False, priority=True)}
    </div>

    <section class="edition">
      <div class="page edition__wrap">

        <!-- Titolo, dettagli e primo testo -->
        <div class="edition__intro" data-reveal style="--ry:50px;--rdelay:.2s">
          <div class="edition__title">
            <h1 class="t-h2">{esc(e['title'])}</h1>
          </div>
          <div class="edition__info">
            <dl class="details">
              <div class="details__row"><dt>Venue</dt><dd>{esc(e['venue'])}</dd></div>
              <div class="details__row"><dt>Data</dt><dd>{esc(e['date'])}</dd></div>
              <div class="details__row"><dt>Lineup</dt><dd>{esc(e['lineup'])}</dd></div>
            </dl>
            <p class="prose">{e['paras'][0]}</p>
          </div>
        </div>

        <figure class="photo photo--wide">
          {img(p, y, 'foto-1', '', alt('foto 1'), SIZES_WIDE)}
        </figure>

        <div class="edition__split">
          <figure class="photo photo--tall">
            {img(p, y, 'foto-2', '', alt('foto 2'), SIZES_HALF)}
          </figure>
          <div class="edition__sticky">
            <p class="prose">{e['paras'][1]}</p>
          </div>
        </div>

        <figure class="photo photo--wide">
          {img(p, y, 'foto-3', '', alt('foto 3'), SIZES_WIDE)}
        </figure>

        <div class="edition__split edition__split--reverse">
          <div class="edition__sticky">
            <p class="prose">{e['paras'][2]}</p>
          </div>
          <figure class="photo photo--tall">
            {img(p, y, 'foto-4', '', alt('foto 4'), SIZES_HALF)}
          </figure>
        </div>

        <!-- Altre edizioni -->
        <section class="next" aria-labelledby="next-title">
          <h2 class="next__label" id="next-title">Next Projects</h2>
          <div class="next__grid">
{nxt}
          </div>
        </section>

      </div>
    </section>
  </main>
{footer(p)}
</body>
</html>
"""
    page(["eventi", e["slug"], "index.html"], content)


# ---------------------------------------------------------------------------
# ABOUT
# ---------------------------------------------------------------------------

PARTNERS = [
    "Comune di Catanzaro", "Comune di Squillace", "Comune di Soverato", "MUDIAC", "Altrove", "Rubbettino",
    "Simeri Lab", "Osservatorio maree", "Primavera dei teatri", "Color Fest",
    "Tuttovento studio", "0039 studio",
]


def build_about():
    p = "../"
    partners = "\n".join(f"            <li>{esc(x)}</li>" for x in PARTNERS)
    content = head(p, "Chi siamo | Factory Area Festival", "/about-us/",
                   description="Factory+ ETS, associazione senza scopo di lucro di Catanzaro che organizza Factory Area Festival: missione, attività, storia, obiettivi e dati dell'ente.",
                   data=(NGO, breadcrumbs([("Home", "/"), ("Chi siamo", "/about-us/")]))) + f"""
<body class="page-about">
{nav(p, 'about')}
  <main id="contenuto" class="page about" data-reveal data-trigger="load" style="--ry:80px">

    <section class="about__section" aria-labelledby="chi-siamo">
      <div class="about__title">
        <h1 class="t-h2" id="chi-siamo">Chi siamo</h1>
      </div>
      <div class="about__body">
        <p class="t-body">Factory+ ETS è un'associazione culturale senza scopo di lucro con sede a Catanzaro, iscritta al Registro Unico Nazionale del Terzo Settore. Dal 2021 organizza Factory Area Festival, festival multidisciplinare di musica e arte in Calabria.</p>
        <p class="t-body c-70">factoryarea.it è il sito ufficiale di Factory+ ETS e del festival.</p>
      </div>
    </section>

    <section class="about__section" aria-labelledby="missione">
      <div class="about__title">
        <h2 class="t-h2" id="missione">Missione</h2>
      </div>
      <div class="about__body about__body--tight">
        <p class="t-body">La nostra missione è promuovere l'arte e la cultura in tutte le loro forme e renderle accessibili a tutti, indipendentemente dal proprio background personale.</p>
        <p class="t-body c-70">Lo facciamo portando musica dal vivo, arti visive e momenti di formazione in luoghi della Calabria da riscoprire, e mettendo in rete artisti, realtà del territorio, istituzioni e cittadini.</p>
      </div>
    </section>

    <section class="about__section" aria-labelledby="attivita">
      <div class="about__title">
        <h2 class="t-h2" id="attivita">Cosa facciamo</h2>
      </div>
      <div class="about__body">
        <dl class="org">
          <div class="org__row"><dt>Festival</dt><dd>Factory Area Festival, ogni estate: concerti e dj set con artisti nazionali affermati ed emergenti, accanto ai talenti calabresi. Sei edizioni dal 2021, con oltre 1.500 partecipanti nel 2025.</dd></div>
          <div class="org__row"><dt>Arti visive</dt><dd>Mostre, live painting, visual e opere murali realizzate per il festival con collettivi e artisti del territorio, come Osservatorio Maree e 0039 studio.</dd></div>
          <div class="org__row"><dt>Talk e workshop</dt><dd>Incontri e laboratori aperti al pubblico: fotografia in studio, cianotipia, incontri con editori e progettisti culturali.</dd></div>
          <div class="org__row"><dt>Luoghi</dt><dd>Il festival anima spazi del territorio da valorizzare, in collaborazione con i Comuni: l'Ex Comac di Soverato, il Castello Normanno di Squillace, il Complesso Monumentale del San Giovanni a Catanzaro.</dd></div>
        </dl>
      </div>
    </section>

    <section class="about__section" aria-labelledby="storia">
      <div class="about__title">
        <h2 class="t-h2" id="storia">Storia</h2>
      </div>
      <div class="about__body">
        <dl class="org">
          <div class="org__row"><dt><a href="../eventi/primaed/">2021</a></dt><dd>Prima edizione all'Ex Comac di Soverato, con il patrocinio del Comune: un concerto, un talk con il progetto Altrove e un live painting.</dd></div>
          <div class="org__row"><dt><a href="../eventi/secondaed/">2022</a></dt><dd>Seconda edizione: lineup più ampia, visual di 0039 studio, live painting e un talk sulla progettazione culturale.</dd></div>
          <div class="org__row"><dt><a href="../eventi/terzaed/">2023</a></dt><dd>Terza edizione: artisti emergenti tra elettronica, rap e cantautorato, la mostra "Avanzi d'ossa" e un'opera muraria.</dd></div>
          <div class="org__row"><dt><a href="../eventi/quartaed/">2024</a></dt><dd>L'associazione entra nel RUNTS. Il festival arriva al Castello Normanno di Squillace e registra il sold-out.</dd></div>
          <div class="org__row"><dt><a href="../eventi/quintaed/">2025</a></dt><dd>Il festival si sposta a Catanzaro, al Complesso Monumentale del San Giovanni, con la compartecipazione del Comune: due giornate, oltre 1.500 partecipanti, una mostra e due talk.</dd></div>
          <div class="org__row"><dt><a href="../eventi/sestaed/">2026</a></dt><dd>Sesta edizione: due serate, workshop di fotografia e cianotipia, incontri con Rubbettino Editore e le realtà del territorio.</dd></div>
        </dl>
      </div>
    </section>

    <section class="about__section" aria-labelledby="visione">
      <div class="about__title">
        <h2 class="t-h2" id="visione">Visione e obiettivi</h2>
      </div>
      <div class="about__body">
        <p class="t-body">Immaginiamo una Calabria in cui la cultura sia motore di cambiamento e di partecipazione: uno spazio di incontro tra creatività, comunità e territorio, fondato sulla sperimentazione e sulla condivisione.</p>
        <ul class="org">
          <li class="org__row">Rendere l'arte e la musica contemporanea accessibili a un pubblico ampio.</li>
          <li class="org__row">Sostenere artisti e creativi emergenti, in particolare calabresi.</li>
          <li class="org__row">Valorizzare luoghi e patrimonio del territorio.</li>
          <li class="org__row">Costruire una rete stabile tra associazioni, istituzioni e professionisti della cultura.</li>
          <li class="org__row">Offrire occasioni di formazione e di confronto con talk e workshop.</li>
        </ul>
      </div>
    </section>

    <section class="about__section" aria-labelledby="partners">
      <div class="about__title">
        <h2 class="t-h2" id="partners">Partners</h2>
      </div>
      <div class="about__body">
        <ul class="partners">
{partners}
        </ul>
      </div>
    </section>

    <section class="about__section" id="factory-plus-ets" aria-labelledby="ente">
      <div class="about__title">
        <h2 class="t-h2" id="ente">Factory+ ETS</h2>
      </div>
      <div class="about__body">
        <p class="t-body c-70">L'associazione promuove lo sviluppo e la diffusione della cultura in tutte le sue forme (musica, arti, teatro, attività educative) e la valorizzazione del territorio, dell'ambiente e del turismo in Calabria, per contribuire alla crescita culturale e civile delle comunità.</p>
        <dl class="org">
          <div class="org__row"><dt>Denominazione</dt><dd>{ORG['name']} ({ORG['legal']})</dd></div>
          <div class="org__row"><dt>Sede legale</dt><dd>{ORG_ADDRESS}</dd></div>
          <div class="org__row"><dt>Codice fiscale</dt><dd>{ORG['cf']}</dd></div>
          <div class="org__row"><dt>Partita IVA</dt><dd>{ORG['piva']}</dd></div>
          <div class="org__row"><dt>RUNTS</dt><dd>Repertorio n. {ORG['runts']} ({ORG['runts_decree']})</dd></div>
        </dl>
      </div>
    </section>

  </main>
{footer(p)}
</body>
</html>
"""
    page(["about-us", "index.html"], content)


# ---------------------------------------------------------------------------
# PRIVACY
# ---------------------------------------------------------------------------

def build_privacy():
    p = "../"
    content = head(p, "Privacy Policy | Factory Area Festival", "/privacy/",
                   description="Informativa sul trattamento dei dati personali del sito factoryarea.it (Factory+ ETS).") + f"""
<body class="page-privacy">
{nav(p, None)}
  <main id="contenuto" class="page legal">
    <h1 class="t-h2">Informativa privacy</h1>
    <div class="legal__body">
      <p class="legal__updated">Ultimo aggiornamento: 4 novembre 2026</p>

      <h2>Titolare del trattamento</h2>
      <p>{ORG['name']} ({ORG['legal']}), {ORG_ADDRESS}, codice fiscale {ORG['cf']}, partita IVA {ORG['piva']}, iscritta al RUNTS (repertorio n. {ORG['runts']}). Puoi contattarci per posta all'indirizzo della sede legale.</p>

      <h2>Quali dati trattiamo</h2>
      <p><strong>Dati di navigazione.</strong> Il sito è ospitato da GitHub Pages (GitHub, Inc.), che registra per motivi tecnici e di sicurezza alcuni dati delle visite, come indirizzo IP, browser e pagine richieste.</p>
      <p><strong>Dati che ci invii.</strong> Se ci scrivi (per posta o tramite i nostri profili social), trattiamo i tuoi dati di contatto e le informazioni contenute nel messaggio.</p>

      <h2>Perché li trattiamo</h2>
      <p>I dati di navigazione servono a far funzionare il sito e a proteggerlo (legittimo interesse, art. 6, par. 1, lett. f del Regolamento UE 2016/679, GDPR). I dati dei messaggi servono solo a risponderti (art. 6, par. 1, lett. b GDPR). Non usiamo i dati per finalità di marketing e non li cediamo a terzi.</p>

      <h2>Chi riceve i dati</h2>
      <p>Il sito è ospitato da GitHub; i messaggi inviati tramite i social sono gestiti anche dalle rispettive piattaforme. Questi fornitori possono trattare i dati anche fuori dall'Unione Europea, con le garanzie previste dal GDPR (per esempio le clausole contrattuali standard).</p>

      <h2>Per quanto tempo li conserviamo</h2>
      <p>Conserviamo i messaggi per il tempo necessario a gestire la richiesta e comunque non oltre 24 mesi, salvo obblighi di legge.</p>

      <h2 id="cookie">Cookie</h2>
      <p>Il sito non installa cookie, né tecnici né di profilazione, e non usa altri strumenti di tracciamento o di statistica (per esempio la memoria locale del browser). Per questo non ti chiediamo alcun consenso e non trovi un banner dei cookie.</p>
      <p>Il sito non incorpora contenuti di terze parti: font, foto e video sono ospitati direttamente sul sito. I link verso altri siti (per esempio la biglietteria Xceed o i nostri profili social) si aprono in una nuova scheda; su quei siti valgono le rispettive informative sulla privacy e sui cookie.</p>
      <p>Se in futuro aggiungeremo cookie o strumenti che richiedono il tuo consenso, aggiorneremo questa informativa e te lo chiederemo prima di attivarli.</p>

      <h2>I tuoi diritti</h2>
      <p>Puoi chiedere in qualsiasi momento l'accesso ai tuoi dati, la rettifica, la cancellazione, la limitazione del trattamento, la portabilità e opporti al trattamento (artt. 15-22 GDPR), scrivendo per posta all'indirizzo della sede legale. Hai anche il diritto di presentare reclamo al <a href="https://www.garanteprivacy.it" {EXT}>Garante per la protezione dei dati personali</a>.</p>
    </div>
  </main>
{footer(p)}
</body>
</html>
"""
    page(["privacy", "index.html"], content)


# ---------------------------------------------------------------------------
# 404
# ---------------------------------------------------------------------------

def build_404():
    p = "/"
    content = head(p, "Pagina non trovata | Factory Area Festival", "/404.html", abs_assets=True,
                   robots="noindex") + f"""
<body class="page-404">
{nav(p, None)}
  <main id="contenuto" class="page notfound">
    <h1 class="t-display" data-reveal data-trigger="load" style="--ry:40px">Pagina non trovata</h1>
    <a class="link-line" href="/">Torna alla home</a>
  </main>
{footer(p)}
</body>
</html>
"""
    page(["404.html"], content)


def build_misc():
    urls = [("/", "weekly", "1.0"), ("/eventi/", "monthly", "0.8")]
    urls += [(f"/eventi/{e['slug']}/", "yearly", "0.7") for e in PUBLIC]
    urls += [("/about-us/", "yearly", "0.6"), ("/privacy/", "yearly", "0.2")]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u, freq, prio in urls:
        sm.append(f"  <url><loc>{DOMAIN}{u}</loc><lastmod>{TODAY}</lastmod><changefreq>{freq}</changefreq><priority>{prio}</priority></url>")
    sm.append("</urlset>")
    page(["sitemap.xml"], "\n".join(sm) + "\n")
    page(["robots.txt"], f"User-agent: *\nAllow: /\n\nSitemap: {DOMAIN}/sitemap.xml\n")
    manifest = {
        "name": "Factory Area Festival",
        "short_name": "Factory Area",
        "lang": "it",
        "start_url": "/",
        "display": "browser",
        "background_color": BRAND_BLUE,
        "theme_color": BRAND_BLUE,
        "icons": [
            {"src": "/assets/img/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/assets/img/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "/assets/img/favicon.svg", "sizes": "any", "type": "image/svg+xml"},
        ],
    }
    page(["site.webmanifest"], json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    page(["CNAME"], "factoryarea.it\n")


if __name__ == "__main__":
    build_home()
    build_events()
    for e in EDITIONS:
        build_edition(e)
    build_about()
    build_privacy()
    build_404()
    build_misc()
    print("OK")
