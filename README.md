# Factory Area — sito ufficiale

Codice sorgente del sito **factoryarea.it**, ricostruito dal vecchio sito Framer
(`factoryareafestival.framer.website`) con stessi contenuti, link e animazioni.

È un sito **statico**: solo HTML, CSS e JavaScript, senza framework e senza installazioni.
È pubblicato gratis con **GitHub Pages**. A ogni modifica salvata su GitHub il sito
si aggiorna da solo in un paio di minuti.

---

## Struttura

```
index.html                 Home
eventi/index.html          Elenco delle edizioni
eventi/quintaed/           Edizione 2025 (Factory Area Festival 5)
eventi/quartaed/           Edizione 2024
eventi/terzaed/            Edizione 2023
eventi/secondaed/          Edizione 2022
eventi/primaed/            Edizione 2021
about-us/index.html        Chi siamo, valori, partner
contatti/index.html        Testo e modulo contatti
privacy/index.html         Informativa privacy
404.html                   Pagina "non trovata"

assets/css/style.css       Tutto lo stile (colori, misure, animazioni CSS)
assets/js/main.js          Animazioni, menu mobile, cursore, modulo contatti
assets/js/lenis.min.js     Libreria per lo scroll fluido (licenza MIT)
assets/fonts/              Font Inter (licenza SIL OFL), ospitato nel sito
assets/img/                Foto, icone e immagine di anteprima per i social

scripts/scarica_immagini.py      Scarica e ottimizza le foto dal vecchio sito Framer
.github/workflows/pubblica.yml   Pubblicazione automatica su GitHub Pages
CNAME, robots.txt, sitemap.xml   Dominio e indicizzazione
```

Gli indirizzi sono gli stessi del sito Framer (`/eventi`, `/eventi/quintaed`,
`/about-us`, `/contatti`), così i link già condivisi continuano a funzionare.

---

## Modificare i contenuti

Il modo più semplice è modificare i file direttamente su github.com: apri il file,
clicca la matita ✏️, modifica e premi **Commit changes**. Il sito si aggiorna da solo.

| Cosa | Dove |
| --- | --- |
| Testi della home | `index.html` |
| Testi di un'edizione | `eventi/<edizione>/index.html` |
| Chi siamo, valori, partner | `about-us/index.html` |
| Testo dei contatti | `contatti/index.html` |
| Informativa privacy | `privacy/index.html` |
| Dati di Factory+ ETS (C.F., P. IVA, RUNTS, sede) | footer di ogni pagina, sezione "Factory+ ETS" in `about-us/index.html`, `privacy/index.html` e dati strutturati per Google in `index.html` e `about-us/index.html` |
| Colori e font | variabili all'inizio di `assets/css/style.css` |

**Menu e footer** sono ripetuti in ogni pagina. Se cambi un link (per esempio quello
dei biglietti, che inizia con `https://xceed.me/...`) va cambiato in tutte le pagine:
su GitHub puoi cercarlo con la ricerca del repository.

### Foto

Le foto delle edizioni sono in `assets/img/edizioni/<anno>/`:

| File | Dove compare |
| --- | --- |
| `copertina` | foto grande in cima alla pagina dell'edizione, anteprima nell'elenco eventi (la copertina 2025 è anche la foto della home) |
| `foto-1` | prima foto larga nella pagina dell'edizione e foto dell'anno in home |
| `foto-2` | foto verticale accanto al secondo testo |
| `foto-3` | seconda foto larga |
| `foto-4` | foto verticale accanto al terzo testo |

Ogni foto esiste in due misure: `-1024.jpg` (lato lungo 1024 px, per i telefoni) e
`-2048.jpg` (lato lungo 2048 px, per gli schermi grandi). Per sostituirne una basta
caricare due JPEG con lo stesso nome e le stesse misure. Se cambiano le proporzioni,
aggiorna anche `width` e `height` nel tag `<img>`.

---

## Aggiungere una nuova edizione (es. 2026)

1. Copia la cartella `eventi/quintaed/` in una nuova cartella, per esempio `eventi/sestaed/`,
   e aggiorna titolo, venue, data, lineup e i tre testi.
2. Carica le foto in `assets/img/edizioni/2026/` con i nomi della tabella sopra.
3. In `eventi/index.html` aggiungi la nuova card in cima alla griglia e aggiorna il
   numero tra parentesi.
4. In `index.html` aggiungi il nuovo anno in cima alle foto impilate (`.stack__card`).
   Puoi anche aggiornare la foto della hero.
5. Aggiorna i blocchi "Next Projects" delle altre edizioni e aggiungi il nuovo indirizzo
   in `sitemap.xml`.

---

## Pubblicazione su GitHub Pages

1. Il repository deve essere **pubblico** (requisito del piano gratuito di GitHub).
2. Vai in **Settings → Pages** e alla voce *Source* scegli **GitHub Actions**.
3. A ogni modifica parte da solo il flusso **"Pubblica il sito"** (scheda *Actions*).
   La prima volta scarica anche le foto dal vecchio sito Framer e le salva in
   `assets/img`. Fino ad allora non cancellare il progetto su Framer.
4. Sempre in **Settings → Pages**, alla voce *Custom domain* scrivi `factoryarea.it`
   e premi **Save**.
5. Quando il dominio funziona, spunta **Enforce HTTPS**.

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

## Modulo contatti

GitHub Pages non può ricevere messaggi, quindi il modulo usa **Web3Forms**:
gratuito fino a 250 messaggi al mese e senza registrazione.

1. Vai su <https://web3forms.com>, inserisci l'email che deve ricevere i messaggi e
   copia la *Access Key* che ti arriva per email.
2. In `contatti/index.html` sostituisci `INSERISCI-LA-TUA-CHIAVE-WEB3FORMS` con la chiave.

La chiave può stare nel codice pubblico: serve solo a indirizzare i messaggi alla tua
casella. Contro lo spam c'è un campo nascosto (honeypot).

---

## Anteprima sul computer

Le pagine usano indirizzi a cartelle, quindi per provarle in locale serve un piccolo
server. Dal Terminale, nella cartella del progetto:

```
python3 -m http.server 8000
```

Poi apri <http://localhost:8000>.

---

## Correzioni rispetto al sito Framer

- Il link "2021" della home apriva l'edizione 2025: ora apre l'edizione 2021.
- Tolto "FreeLab" (residuo del template) dai titoli delle pagine. Ogni pagina ha
  titolo e descrizione propri.
- Corretti alcuni refusi: "Fcatory" → "Factory", "Osservatorio Marree" → "Maree",
  "che reinterpretato" → "che ha reinterpretato", "è un'opera" → "e un'opera",
  "l'evento,Sewo" → "l'evento, Sewo", "Inviaci una messaggio" → "un messaggio".
- Su telefono il testo della home veniva tagliato: ora si legge per intero.
- La pagina contatti usa un solo testo per tutti gli schermi (Framer ne mostrava due
  diversi tra computer e telefono).
- Aggiunti testi alternativi alle foto (prima "Yellow Flower", "Orange Flower"…).
- Corrette le date delle edizioni 1, 2 e 3 (2021, 2022 e 2023: su Framer risultavano tutte nel 2025).
- Aggiunti i dati ufficiali di Factory+ ETS (footer, pagina About) e la pagina Privacy,
  utili anche per la verifica di Google Workspace for Nonprofits.

---

## Note tecniche

- **Animazioni** (in `assets/js/main.js` e `assets/css/style.css`): scroll fluido
  (Lenis), testi che compaiono riga per riga o lettera per lettera, foto della home che
  restano ferme e si impilano rimpicciolendosi, testo che si "accende" scorrendo, logo
  che si riduce scorrendo nelle pagine interne, cursore "Explore" e freccia, menu mobile
  a tutto schermo.
- Se nel sistema è attiva l'opzione **riduci movimento**, le animazioni si disattivano
  e i contenuti sono subito visibili.
- Il font è ospitato nel sito: nessuna richiesta a Google Fonts.
- Il sito non usa cookie né strumenti di tracciamento. Se in futuro aggiungete
  statistiche (es. Google Analytics), andranno riviste privacy e banner cookie.
- Licenze: Inter (SIL Open Font License, `assets/fonts/OFL-Inter.txt`), Lenis (MIT,
  `assets/js/LICENSE-lenis.txt`).
