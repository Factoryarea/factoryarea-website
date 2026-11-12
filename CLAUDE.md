# Regole del progetto: sito factoryarea.it

Sito ufficiale di **Factory+ ETS** e di **Factory Area Festival** (festival multidisciplinare di
musica e arte in Calabria, dal 2021). Sito statico (HTML, CSS, JavaScript), pubblicato con
GitHub Pages. La guida completa per le persone è in `README.md`: leggila prima di lavorare.

## Come si modifica

- Le pagine HTML **sono generate** da `sorgente/genera.py`. Testi, edizioni, partner, dati
  dell'ente, menu e footer si cambiano lì, poi si lancia `python3 sorgente/genera.py` dalla
  cartella del repository. Non modificare a mano i file `.html`: alla generazione successiva le
  modifiche andrebbero perse. Se qualcuno li ha modificati direttamente su GitHub, riporta la
  modifica in `genera.py` prima di rigenerare (controlla con `git diff` dopo aver rigenerato).
- CSS, JavaScript, foto e video **non** sono generati: si modificano direttamente in `assets/`.
- Prima di pubblicare, guarda le pagine cambiate in un browser (computer e telefono, per
  esempio con Playwright e un server locale `python3 -m http.server`).
- Pubblicare = `git push` su `main`. Il flusso "Pubblica il sito" mette online in circa un
  minuto. `README.md`, `CLAUDE.md` e `sorgente/` non vengono pubblicati.
- Dopo ogni modifica rilevante aggiorna `README.md` (la guida) se cambia qualcosa che descrive.
- Messaggi di commit in italiano, che dicano cosa cambia per chi visita il sito.

## Regole da rispettare

- **Nessun indirizzo email sul sito** (né Gmail né PEC): lo chiede Google for Nonprofits.
  Quando sarà attivo Google Workspace si potrà aggiungere un indirizzo `@factoryarea.it`.
- **Dati dell'ente** (nel dizionario `ORG` di `genera.py`): devono restare visibili nel footer di
  ogni pagina e nella pagina Chi siamo, identici a quelli registrati (RUNTS, C.F., P.IVA, sede).
- La pagina **Chi siamo** deve mantenere missione, attività, storia, visione e obiettivi:
  servono alla verifica di Google for Nonprofits.
- **Nessun cookie e nessun servizio esterno** caricato dalle pagine (font, script, video,
  mappe, statistiche): il sito non ha banner dei cookie proprio per questo. Se in futuro serve,
  vanno aggiornati informativa privacy, banner e Content Security Policy.
- **Eccezione: la mappa interna `mappa/`** (factoryarea.it/mappa, strumento di lavoro, `noindex`,
  non collegata da nessuna pagina e fuori dalla sitemap: lasciala così). È l'unica pagina che carica
  servizi esterni (sfondo CARTO, foglio Google con i luoghi) ed è descritta nell'informativa privacy
  (`#mappa`). Si genera con `python3 sorgente/mappa/genera_mappa.py`, non con `genera.py`; ha una
  Content Security Policy propria. Sul sito non mostra le email dei locali (regola qui sopra).
- **Content Security Policy**: è nel `<head>` di ogni pagina (funzione `head()` di `genera.py`).
  L'impronta dello script in testa (`INLINE_JS`) è calcolata da sola. Se si aggiunge una risorsa
  esterna va autorizzata nella regola giusta.
- Link esterni sempre con `target="_blank" rel="noopener noreferrer"` (costante `EXT`).
- **Video della home**: non togliere `muted`, `playsinline` e la copertina `hero__cover`; su
  iPhone l'avvio automatico può essere bloccato dal telefono e il video parte al primo tocco.
  Diagnostica: `https://factoryarea.it/?debug-video`.

## Tono dei testi

Italiano, frasi brevi e chiare, caldo ma non enfatico ("leggermente emozionale" per i racconti
delle edizioni). Fatti verificati (date, luoghi, artisti, numeri): niente informazioni inventate.
Nomi: "Factory+ ETS" per l'associazione, "Factory Area Festival" per il festival.
