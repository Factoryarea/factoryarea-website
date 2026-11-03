# Factory Area — sito ufficiale

Codice sorgente del sito **factoryarea.it** di Factory Area Festival (Factory+ ETS),
nato dal vecchio sito Framer (`factoryareafestival.framer.website`) con gli stessi
contenuti, link e animazioni.

È un sito **statico**: solo HTML, CSS e JavaScript, senza framework e senza installazioni.
È pubblicato gratis con **GitHub Pages**. A ogni modifica salvata su GitHub il sito
si aggiorna da solo in un paio di minuti.

---

## Struttura

```
index.html                 Home (video, edizioni impilate, intro)
eventi/index.html          Elenco delle edizioni pubblicate
eventi/sestaed/            Edizione 2026 (Factory Area Festival 6)
eventi/quintaed/           Edizione 2025 (Factory Area Festival 5)
eventi/quartaed/           Edizione 2024
eventi/terzaed/            Edizione 2023
eventi/secondaed/          Edizione 2022
eventi/primaed/            Edizione 2021
about-us/index.html        Chi siamo, valori, partner, dati di Factory+ ETS
privacy/index.html         Informativa privacy
404.html                   Pagina "non trovata"

assets/css/style.css       Tutto lo stile (colori, misure, animazioni CSS)
assets/js/main.js          Animazioni, barra di navigazione, menu mobile, video, cursore
assets/js/lenis.min.js     Libreria per lo scroll fluido (licenza MIT)
assets/fonts/              Font Inter (licenza SIL OFL), ospitato nel sito
assets/img/                Foto delle edizioni, logo, icone, anteprima social
assets/video/              Video della home e immagine di copertina del video

favicon.ico, site.webmanifest    Icone del sito
.github/workflows/pubblica.yml   Pubblicazione automatica su GitHub Pages
CNAME, robots.txt, sitemap.xml   Dominio e indicizzazione
```

Gli indirizzi delle pagine sono gli stessi del sito Framer (`/eventi`, `/eventi/quintaed`,
`/about-us`), così i link già condivisi continuano a funzionare.

---

## Modificare i contenuti

Il modo più semplice è modificare i file direttamente su github.com: apri il file,
clicca la matita ✏️, modifica e premi **Commit changes**. Il sito si aggiorna da solo.

| Cosa | Dove |
| --- | --- |
| Testi della home | `index.html` |
| Testi di un'edizione | `eventi/<edizione>/index.html` |
| Chi siamo, valori, partner | `about-us/index.html` |
| Informativa privacy | `privacy/index.html` |
| Dati di Factory+ ETS (C.F., P. IVA, RUNTS, sede, PEC, email) | footer di ogni pagina, sezione "Factory+ ETS" in `about-us/index.html`, `privacy/index.html` e dati strutturati per Google in `index.html` e `about-us/index.html` |
| Link dei biglietti (Tickets) | barra di navigazione di ogni pagina (compare due volte: computer e telefono) |
| Colori, font, margini | variabili all'inizio di `assets/css/style.css` (sfondo: blu elettrico `#0024ff`, preso dalla foto profilo Instagram) |

**Barra di navigazione e footer** sono ripetuti in ogni pagina. Se cambi un link (per
esempio quello dei biglietti, che inizia con `https://xceed.me/...`) va cambiato in tutte
le pagine: su GitHub puoi cercarlo con la ricerca del repository.

I link verso altri siti si aprono in una nuova scheda e hanno sempre
`target="_blank" rel="noopener noreferrer"`: copia questi attributi se ne aggiungi di nuovi.

### Footer

In alto ci sono quattro colonne di link: per ora è usata solo "Social". Per aggiungere
un gruppo di link copia il blocco `<div class="footer__col">…</div>` dentro
`footer__cols`. Lo spazio in basso a destra (`footer__badges`) è libero per eventuali loghi.

### Foto

Le foto delle edizioni sono in `assets/img/edizioni/<anno>/`:

| File | Dove compare |
| --- | --- |
| `copertina` | foto grande in cima alla pagina dell'edizione, anteprima nell'elenco eventi (le copertine 2026 e 2025 sono anche le foto di quegli anni in home) |
| `foto-1` | prima foto larga nella pagina dell'edizione e foto dell'anno in home (dal 2024 in giù) |
| `foto-2` | foto verticale accanto al secondo testo |
| `foto-3` | seconda foto larga |
| `foto-4` | foto verticale accanto al terzo testo |

Ogni foto esiste in due misure: `-1024.jpg` (lato lungo 1024 px, per i telefoni) e
`-2048.jpg` (lato lungo 2048 px, per gli schermi grandi). Per sostituirne una basta
caricare due JPEG con lo stesso nome e le stesse misure. Se cambiano le proporzioni,
aggiorna anche `width` e `height` nel tag `<img>`.

### Video della home

Il video originale ("Reel con drone.mp4", 1276×718) è stato ripulito dal rumore,
ingrandito a 1920×1008 con un filtro di qualità (lanczos) e reso più nitido; le bande
nere ai bordi e i secondi neri finali sono stati tolti. I file sono in `assets/video/`,
in tre formati, in quest'ordine: ogni browser usa il primo che sa riprodurre.

| File | Per chi |
| --- | --- |
| `hero.hevc.mp4`, `hero-verticale.hevc.mp4` | HEVC: Safari su iPhone e Mac, e gli altri browser con decodifica HEVC |
| `hero.av1.mp4`, `hero-verticale.av1.mp4` | AV1, il più leggero: Chrome, Edge, Firefox, Android senza HEVC |
| `hero.mp4`, `hero-verticale.mp4` | H.264: tutti gli altri browser |
| `hero-poster.jpg` | primo fotogramma, mostrato mentre il video carica |

Se il formato scelto dà errore, o il video risulta in riproduzione ma resta fermo pur
avendo i dati già scaricati, lo script passa da solo al formato successivo.

Le versioni `-verticale` sono un ritaglio 3:4 al centro, usato dagli schermi in verticale
(telefoni). Il video parte sempre da solo (autoplay), senza audio (i browser permettono
la riproduzione automatica solo così) e in loop; si ferma quando la hero è coperta dalle
sezioni successive e riparte quando torna in vista. Il pulsante in basso a destra lo mette
in pausa. Il video è solo decorativo: non si può cliccare e i controlli del browser
(per esempio il grande "play" di Safari) sono nascosti.

Alcuni browser possono bloccare la riproduzione automatica: iPhone e Mac in risparmio
energetico, oppure Safari impostato su "Non riprodurre mai automaticamente" (Safari →
Impostazioni → Siti web → Riproduzione automatica). Se dopo 2 secondi il video non è
partito, lo script riprova; se il dispositivo continua a bloccarlo resta la copertina,
il pulsante in basso a destra mostra "riproduci" e il video parte al primo tocco in
qualsiasi punto della pagina (o sul pulsante). Su iPhone il caso tipico è il risparmio
energetico: il registro di diagnostica mostra `ns=0` (Safari non scarica nemmeno il video)
e `play() rifiutato: NotAllowedError`.

Se su un dispositivo il video non parte, apri <https://factoryarea.it/?debug-video>:
in basso compare un riquadro con il formato scelto dal browser, gli eventi del video,
i fotogrammi mostrati e decodificati, gli eventuali errori e i cambi di formato, utile
per capire il motivo. Il pulsante verde "Copia il registro" copia tutto il testo, da
incollare in un messaggio.

Per cambiare video basta anche un solo MP4 H.264 senza audio: caricalo come `hero.mp4`
e togli dalle pagine le righe `<source>` degli altri formati.

### Logo e icone

- `assets/img/logo-factory.svg`: logo ufficiale (dal press kit 2026), già ritagliato.
  Nella barra è inserito direttamente nel codice delle pagine, per poterlo colorare.
- `assets/img/logo-factory-nero.png`: logo nero su bianco, usato nei dati per Google.
- `favicon.ico`, `assets/img/favicon.svg`, `apple-touch-icon.png`, `icon-192.png`,
  `icon-512.png`: icone del sito (il "+" del logo, bianco su blu).

### Anteprima quando si condivide un link

L'immagine è `assets/img/og-factoryarea.png` (1200×630 px, logo bianco su blu).
WhatsApp, Facebook e LinkedIn la tengono in memoria per qualche giorno. Per aggiornarla
subito: Facebook → <https://developers.facebook.com/tools/debug/> ("Recupera di nuovo");
LinkedIn → <https://www.linkedin.com/post-inspector/>. WhatsApp si aggiorna da solo col tempo.

---

## Aggiungere una nuova edizione (es. 2027)

1. Copia la cartella di un'edizione (per esempio `eventi/sestaed/` in `eventi/settimaed/`),
   cambia testi, `<title>`, `description` e dati strutturati, e carica le foto in
   `assets/img/edizioni/2027/` con i nomi della tabella "Foto".
2. In `eventi/index.html` aggiungi la card in cima alla griglia e aggiorna il numero
   tra parentesi.
3. In `index.html` aggiungi l'anno in cima alle foto impilate (`.stack__card`).
4. Aggiorna i blocchi "Next Projects" delle altre edizioni e aggiungi l'indirizzo in
   `sitemap.xml`.

---

## Pubblicazione su GitHub Pages

1. Il repository deve essere **pubblico** (requisito del piano gratuito di GitHub).
2. In **Settings → Pages** la voce *Source* è **GitHub Actions**.
3. A ogni modifica parte da solo il flusso **"Pubblica il sito"** (scheda *Actions*).
4. In **Settings → Pages** il *Custom domain* è `factoryarea.it`, con **Enforce HTTPS**.

Consigliato: verifica il dominio anche nelle impostazioni del tuo account GitHub
(*Settings → Pages → Add a domain*). GitHub ti dà un record TXT da aggiungere su
Aruba. Così nessun altro può usare il tuo dominio su GitHub Pages.

---

## Collegare factoryarea.it (Aruba)

Prima imposta il dominio su GitHub (punto 4 della sezione precedente), poi i DNS.

Su <https://admin.aruba.it>: **Dominio → Gestione DNS e Name Server → Gestisci DNS**.
Nella scheda **Record** il dominio principale ha *Nome host* `@`. Imposta questi record
(con **Modifica** su quelli esistenti, **Aggiungi record** per i nuovi, TTL 1 ora):

| Tipo | Nome host | Valore |
| --- | --- | --- |
| A | @ | `185.199.108.153` |
| A | @ | `185.199.109.153` |
| A | @ | `185.199.110.153` |
| A | @ | `185.199.111.153` |
| AAAA *(facoltativi)* | @ | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| CNAME | www | `factoryarea.github.io` |

- Il vecchio record A `@` dell'hosting Aruba (`62.149.128.40`) va **modificato**, non
  lasciato accanto ai nuovi: se resta, GitHub non riesce a creare il certificato HTTPS.
- Il valore del CNAME si scrive senza punto finale, come gli altri del pannello.
- **Non toccare** gli altri record: `localhost`, i record A `mx`, i CNAME `admin`,
  `ftp` e `_domainconnect`, i record TXT e la scheda **Record MX**.
- Aruba applica le modifiche quasi subito, ma le cache in giro per Internet possono
  metterci qualche ora. Il certificato HTTPS arriva in genere entro un'ora da quando
  GitHub vede i DNS corretti (*Settings → Pages* mostra "DNS check successful").

### Google Workspace sullo stesso dominio

Sul dominio ci sono già i record di Google Workspace: TXT `google-site-verification`,
SPF (`v=spf1 include:_spf.google.com ~all`) e DKIM (`google._domainkey`). Restano
come sono: non hanno nulla a che fare con i record del sito.

---

## SEO

- Ogni pagina ha titolo, descrizione, indirizzo canonico e anteprima social propri.
- Dati strutturati (schema.org): ente (`NGO`) e sito (`WebSite`) in home e About,
  ogni edizione come `Festival` con date, luogo e artisti, percorso (`BreadcrumbList`).
- `sitemap.xml` elenca solo le pagine pubblicate; `robots.txt` la indica ai motori di ricerca.
- Consigliato: aggiungi il sito a Google Search Console
  (<https://search.google.com/search-console>, proprietà "Dominio" `factoryarea.it`) e
  invia la sitemap `https://factoryarea.it/sitemap.xml`.

---

## Anteprima sul computer

Le pagine usano indirizzi a cartelle, quindi per provarle in locale serve un piccolo
server. Dal Terminale, nella cartella del progetto:

```
python3 -m http.server 8000
```

Poi apri <http://localhost:8000>.

---

## Modifiche rispetto al sito Framer

- Il link "2021" della home apriva l'edizione 2025: ora apre l'edizione 2021.
- Tolto "FreeLab" (residuo del template) dai titoli delle pagine. Ogni pagina ha
  titolo e descrizione propri.
- Corretti alcuni refusi: "Fcatory" → "Factory", "Osservatorio Marree" → "Maree",
  "che reinterpretato" → "che ha reinterpretato", "è un'opera" → "e un'opera",
  "l'evento,Sewo" → "l'evento, Sewo".
- Su telefono il testo della home veniva tagliato: ora si legge per intero.
- Aggiunti testi alternativi alle foto (prima "Yellow Flower", "Orange Flower"…).
- Corrette le date delle edizioni 1, 2 e 3 (2021, 2022 e 2023: su Framer risultavano tutte nel 2025).
- Aggiunti i dati ufficiali di Factory+ ETS (footer, pagina About) e la pagina Privacy,
  utili anche per la verifica di Google Workspace for Nonprofits.
- Novembre 2026: logo ufficiale al posto della scritta, barra di navigazione sfocata con
  pulsante Tickets, video nella home, footer con dati legali e recapiti, anteprima social
  con il logo, pagina Contatti e modulo eliminati, pagina 2026; poi colore
  blu elettrico al posto del grigio-nero, favicon con il "+", video ingrandito e più nitido.

---

## Note tecniche

- **Animazioni** (in `assets/js/main.js` e `assets/css/style.css`): scroll fluido
  (Lenis), testi che compaiono riga per riga o lettera per lettera, foto della home che
  restano ferme e si impilano rimpicciolendosi, testo che si "accende" scorrendo,
  cursore "Explore", menu mobile a tutto schermo.
- **Barra di navigazione**: 16 px sopra e sotto, margini laterali uguali alle pagine
  (32 px su computer e tablet, 16 px su telefono, variabile `--gutter`). In home è
  trasparente sopra il video e appena si scorre sfoca ciò che passa sotto, senza
  colore di sfondo.
- **Barra di scorrimento** nascosta su tutte le pagine: su computer video e foto
  arrivano fino al bordo destro. Si scorre normalmente con rotella, trackpad e tastiera.
- Se nel sistema è attiva l'opzione **riduci movimento**, le animazioni si disattivano
  e i contenuti sono subito visibili (il video della home parte comunque).
- **Fascia in alto del browser**: da iOS 26 Safari ignora `theme-color` e colora la zona
  sopra la pagina con il colore degli elementi fissi in cima. In home un elemento
  invisibile (`.tint`) e il meta `theme-color` seguono il colore del bordo superiore del
  video finché la pagina è in cima; scorrendo o aprendo il menu tornano al blu. I colori
  sono calcolati in anticipo, due al secondo, e scritti nella pagina (attributi
  `data-tint-h` e `data-tint-v` del video): il browser non legge i fotogrammi. Se cambiate
  il video vanno ricalcolati (oppure si possono togliere i due attributi: la fascia resta
  del colore fisso indicato sull'elemento `.tint`). Il video vero e proprio non può
  comparire sotto l'orologio: in verticale Safari 26 non lo permette.
- Il font è ospitato nel sito: nessuna richiesta a Google Fonts.
- Il sito non usa cookie né strumenti di tracciamento. Se in futuro aggiungete
  statistiche (es. Google Analytics) o contenuti incorporati (es. post Instagram),
  andranno riviste privacy e banner cookie.
- Licenze: Inter (SIL Open Font License, `assets/fonts/OFL-Inter.txt`), Lenis (MIT,
  `assets/js/LICENSE-lenis.txt`).
