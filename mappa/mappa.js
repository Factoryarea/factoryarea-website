/* Mappa della musica dal vivo. Generato da sorgente/mappa/genera_mappa.py: non modificare a mano. */
"use strict";
/* ===================== CONFIGURAZIONE =====================
   ID_FOGLIO: l'identificativo del foglio Google (la parte dell'indirizzo tra /d/ e /edit).
   Il foglio deve essere condiviso come "Chiunque abbia il link: Visualizzatore".
   Se il foglio non è raggiungibile, la mappa usa la copia interna dei dati qui sotto. */
const CONFIG = {
  ID_FOGLIO: "1uyPMJnodXrHayUxTRTMg9XjCBhb-MwLRFV4CND_KkkI",
  NOME_SCHEDA: "Luoghi",
  DATA_COPIA: "12/11/2026",
  SITO: true,       /* true nella versione pubblicata su factoryarea.it: niente lettura via script esterno */
  EMAIL: false      /* false sul sito: niente indirizzi email (regola del sito per Google for Nonprofits) */
};
const COLONNE = ["Nome","Tipologia","Pubblico/Privato","Generi","Capienza","Nota capienza","Indirizzo","CAP","Città","Provincia","Regione","Latitudine","Longitudine","Instagram","Facebook","Sito web","Email","Telefono","Note","Fonte dati"];
const CHIAVI  = ["nome","tipo","pp","generi","cap","capNota","indirizzo","cp","citta","prov","regione","lat","lon","ig","fb","web","email","tel","note","fonte"];
const DATI_INTERNI = (window.FA_DATI || []);

/* ===================== UTILITÀ ===================== */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm = s => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const numIt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
function urlSicuro(u){ u = String(u || "").trim(); if(!u) return ""; if(!/^https?:\/\//i.test(u)) u = "https://" + u.replace(/^\/+/, ""); try{ const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ""; }catch(e){ return ""; } }
function urlSocial(v, base){ v = String(v || "").trim(); if(!v) return ""; if(/^https?:\/\//i.test(v) || /^(www\.)?(instagram|facebook|fb)\.com/i.test(v)) return urlSicuro(v); return base + encodeURIComponent(v.replace(/^@/, "").replace(/\/+$/, "")) + "/"; }
function nomeSocial(v){ v = String(v || "").trim().replace(/\/+$/, ""); const m = v.match(/(?:instagram|facebook|fb)\.com\/([^/?#]+)/i); return "@" + (m ? m[1] : v.replace(/^@/, "")); }

const FAMIGLIE = {club:["Locali e club","var(--f-club)","#0024ff"], teatro:["Teatri e auditorium","var(--f-teatro)","#8a2be2"], grande:["Grandi venue","var(--f-grande)","#ff4b1f"], aperto:["All'aperto","var(--f-aperto)","#00a676"], sociale:["Circoli e spazi culturali","var(--f-sociale)","#f5a800"], altro:["Altro","var(--f-altro)","#6b7280"]};
function famiglia(tipo){ const t = norm(tipo);
  if(/club|bar|pub|locale|discoteca/.test(t)) return "club";
  if(/teatro|auditorium|sala/.test(t)) return "teatro";
  if(/palazzetto|arena|stadio|palasport/.test(t)) return "grande";
  if(/aperto|anfiteatro|piazza|parco|festival/.test(t)) return "aperto";
  if(/circolo|sociale|culturale|associazione/.test(t)) return "sociale";
  return "altro"; }
const FASCE = [["fino a 300", c => c > 0 && c <= 300], ["300–1.000", c => c > 300 && c <= 1000], ["1.000–5.000", c => c > 1000 && c <= 5000], ["5.000–20.000", c => c > 5000 && c <= 20000], ["oltre 20.000", c => c > 20000], ["non disponibile", c => !c]];

/* ===================== LETTURA DATI ===================== */
function leggiCSV(testo){
  const righe = []; let riga = [], campo = "", dentro = false;
  for(let i = 0; i < testo.length; i++){ const c = testo[i];
    if(dentro){ if(c === '"'){ if(testo[i+1] === '"'){ campo += '"'; i++; } else dentro = false; } else campo += c; }
    else if(c === '"') dentro = true;
    else if(c === ","){ riga.push(campo); campo = ""; }
    else if(c === "\n"){ riga.push(campo); righe.push(riga); riga = []; campo = ""; }
    else if(c !== "\r") campo += c; }
  if(campo !== "" || riga.length){ riga.push(campo); righe.push(riga); }
  return righe;
}
function daFoglio(testo){
  const righe = leggiCSV(testo.replace(/^﻿/, ""));
  const iTesta = righe.findIndex(r => r.some(c => norm(c) === "nome"));
  if(iTesta < 0) throw new Error("intestazioni non trovate");
  const mappa = {}; const attese = COLONNE.map(norm);
  righe[iTesta].forEach((c, i) => { const k = attese.indexOf(norm(c)); if(k >= 0) mappa[CHIAVI[k]] = i; });
  if(mappa.nome == null) throw new Error("colonna Nome mancante");
  return righe.slice(iTesta + 1).filter(r => (r[mappa.nome] || "").trim()).map(r => { const o = {}; CHIAVI.forEach(k => o[k] = mappa[k] != null ? (r[mappa[k]] || "").trim() : ""); return o; });
}
function prepara(lista){
  return lista.map((o, i) => { const l = Object.assign({}, o); l.id = i;
    let la = String(l.lat ?? "").trim(), lo = String(l.lon ?? "").trim();
    const coppia = la.match(/^(-?\d+[.,]\d+)\s*[,;\s]\s*(-?\d+[.,]\d+)$/); if(coppia && !lo){ la = coppia[1]; lo = coppia[2]; }
    l.lat = parseFloat(la.replace(",", ".")); l.lon = parseFloat(lo.replace(",", "."));
    l.haPos = isFinite(l.lat) && isFinite(l.lon) && Math.abs(l.lat) <= 90 && Math.abs(l.lon) <= 180;
    l.capN = parseInt(String(l.cap ?? "").replace(/[^\d]/g, ""), 10) || 0;
    l.gen = String(l.generi || "").split(/[,;]/).map(s => s.trim()).filter(Boolean);
    l.tipo = String(l.tipo || "").trim() || "Altro"; l.pp = String(l.pp || "").trim();
    l.fam = famiglia(l.tipo);
    l.igUrl = urlSocial(l.ig, "https://www.instagram.com/"); l.fbUrl = urlSocial(l.fb, "https://www.facebook.com/"); l.webUrl = urlSicuro(l.web);
    if(!CONFIG.EMAIL) l.email = "";
    l.cerca = norm([l.nome, l.citta, l.prov, l.regione, l.tipo, l.indirizzo].join(" "));
    return l; });
}
async function scarica(url, ms){ const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try{ const r = await fetch(url, {signal: ctl.signal, redirect: "follow", cache: "no-store", credentials: "omit"}); if(!r.ok) throw new Error("HTTP " + r.status); const tx = await r.text(); if(/^\s*<(!doctype|html)/i.test(tx)) throw new Error("foglio non condiviso"); return tx; } finally{ clearTimeout(t); } }
function viaScript(id, ms){
  /* Lettura senza fetch (funziona anche aprendo il file con un doppio clic): il foglio risponde chiamando una funzione. */
  return new Promise((ok, ko) => { const nome = "__faDati" + Date.now(); const s = document.createElement("script");
    const fine = () => { clearTimeout(t); try{ delete window[nome]; }catch(e){ window[nome] = undefined; } s.remove(); };
    const t = setTimeout(() => { fine(); ko(new Error("tempo scaduto")); }, ms);
    window[nome] = d => { fine(); try{
        if(!d || d.status === "error" || !d.table) throw new Error("risposta non valida");
        const attese = COLONNE.map(norm); const idx = d.table.cols.map(c => attese.indexOf(norm(c.label || "")));
        if(!idx.includes(0)) throw new Error("colonna Nome mancante");
        ok(d.table.rows.map(r => { const o = {}; CHIAVI.forEach(k => o[k] = "");
          (r.c || []).forEach((c, i) => { const k = idx[i]; if(k < 0 || !c || c.v == null) return; const ch = CHIAVI[k]; o[ch] = (ch === "lat" || ch === "lon") ? String(c.v) : String(c.f != null ? c.f : c.v).trim(); });
          return o; }).filter(o => o.nome));
      }catch(e){ ko(e); } };
    s.onerror = () => { fine(); ko(new Error("foglio non raggiungibile")); };
    s.src = "https://docs.google.com/spreadsheets/d/" + encodeURIComponent(id) + "/gviz/tq?tqx=out:json;responseHandler:" + nome + "&headers=1&sheet=" + encodeURIComponent(CONFIG.NOME_SCHEDA) + "&_=" + Date.now();
    document.head.appendChild(s); });
}
async function caricaDati(){
  const id = CONFIG.ID_FOGLIO;
  if(id && !id.startsWith("__")){
    if(location.protocol !== "file:"){
      const base = "https://docs.google.com/spreadsheets/d/" + encodeURIComponent(id);
      for(const u of [base + "/export?format=csv", base + "/gviz/tq?tqx=out:csv&headers=1&sheet=" + encodeURIComponent(CONFIG.NOME_SCHEDA)]){ try{ const lista = daFoglio(await scarica(u, 9000)); if(lista.length) return {lista, fonte: "foglio"}; }catch(e){ console.warn("Foglio non letto:", e.message); } }
    }
    if(!CONFIG.SITO){ try{ const lista = await viaScript(id, 9000); if(lista.length) return {lista, fonte: "foglio"}; }catch(e){ console.warn("Foglio non letto:", e.message); } }
  }
  const lista = DATI_INTERNI.map(r => { const o = {}; CHIAVI.forEach((k, i) => o[k] = r[i] ?? ""); return o; });
  return {lista, fonte: "interna"};
}

/* ===================== STATO E FILTRI ===================== */
let LUOGHI = [], visibili = [], attivo = null;
const filtro = {q: "", regione: "", tipo: new Set(), genere: new Set(), pp: new Set(), cap: new Set(), cont: new Set()};
const CONTATTI = {social: ["Con Instagram o Facebook", l => !!(l.igUrl || l.fbUrl)], email: ["Con email", l => !!l.email], sito: ["Con sito web", l => !!l.webUrl]};
if(!CONFIG.EMAIL) delete CONTATTI.email;
const fascia = l => FASCE.findIndex(f => f[1](l.capN));
/* "salta" esclude un gruppo di filtri: serve a contare quanti luoghi offrirebbe ogni opzione di quel gruppo, dati gli altri filtri. */
function passa(l, salta){
  if(filtro.q && !filtro.q.split(" ").every(p => l.cerca.includes(p))) return false;
  if(salta !== "regione" && filtro.regione && l.regione !== filtro.regione) return false;
  if(salta !== "tipo" && filtro.tipo.size && !filtro.tipo.has(l.tipo)) return false;
  if(salta !== "genere" && filtro.genere.size && !l.gen.some(g => filtro.genere.has(g))) return false;
  if(salta !== "pp" && filtro.pp.size && !filtro.pp.has(l.pp)) return false;
  if(salta !== "cap" && filtro.cap.size && !filtro.cap.has(fascia(l))) return false;
  for(const c of filtro.cont) if(!CONTATTI[c][1](l)) return false;
  return true;
}
function nFiltri(){ return (filtro.regione ? 1 : 0) + filtro.tipo.size + filtro.genere.size + filtro.pp.size + filtro.cap.size + filtro.cont.size; }

/* ===================== MAPPA ===================== */
const mappa = L.map("mappa", {zoomControl: false, minZoom: 5, maxZoom: 19, worldCopyJump: true}).setView([42.3, 12.6], 6);
L.control.zoom({position: "topright"}).addTo(mappa);
mappa.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a>');
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 19, className: "sfondo", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'}).addTo(mappa);
const gruppi = L.markerClusterGroup({maxClusterRadius: 46, showCoverageOnHover: false, spiderfyOnMaxZoom: true, chunkedLoading: true,
  iconCreateFunction: g => { const n = g.getChildCount(); const d = n < 10 ? 34 : n < 50 ? 40 : 48; return L.divIcon({html: String(n), className: "gruppo-segn", iconSize: [d, d]}); }});
mappa.addLayer(gruppi);
/* Confini: Stato, regioni e comuni che ospitano almeno un luogo (dati ISTAT rielaborati da openpolis/geojson-italy). */
const CONFINI = {stato: (window.FA_CONFINI || {}).stato, regioni: (window.FA_CONFINI || {}).regioni, comuni: (window.FA_CONFINI || {}).comuni};
const ZOOM_COMUNI = 9, accesi = {stato: true, regioni: true, comuni: true};
mappa.createPane("confini"); mappa.getPane("confini").style.zIndex = 350; mappa.getPane("confini").style.pointerEvents = "none";
const stileRegione = f => ({color: "#0024ff", weight: 1.4, opacity: .7, fillColor: "#0024ff", fillOpacity: filtro.regione && f.properties.n === filtro.regione ? .1 : 0});
const strati = {
  regioni: CONFINI.regioni && L.geoJSON(CONFINI.regioni, {pane: "confini", interactive: false, style: stileRegione}),
  stato: CONFINI.stato && L.geoJSON(CONFINI.stato, {pane: "confini", interactive: false, style: {color: "#0024ff", weight: 2.8, opacity: .95, fill: false}}),
  comuni: CONFINI.comuni && L.geoJSON(CONFINI.comuni, {pane: "confini", interactive: false, style: {color: "#0a0a0f", weight: 1.2, opacity: .65, dashArray: "5 4", fill: false}})
};
function disegnaConfini(){ for(const k of ["regioni", "stato", "comuni"]){ const ly = strati[k]; if(!ly) continue; const si = accesi[k] && (k !== "comuni" || mappa.getZoom() >= ZOOM_COMUNI); if(si && !mappa.hasLayer(ly)) ly.addTo(mappa); if(!si && mappa.hasLayer(ly)) mappa.removeLayer(ly); } }
function evidenziaRegione(){ if(strati.regioni) strati.regioni.setStyle(stileRegione); }
mappa.on("zoomend", disegnaConfini); disegnaConfini();
const ctlConfini = L.control({position: "topright"});
ctlConfini.onAdd = () => { const d = L.DomUtil.create("details", "ctl-confini"); d.open = !window.matchMedia("(max-width:820px)").matches;
  d.innerHTML = '<summary>Confini</summary><label><input type="checkbox" data-k="stato" checked><i></i>Stato</label><label><input type="checkbox" data-k="regioni" checked><i class="r"></i>Regioni</label><label title="Confini dei comuni che ospitano almeno un luogo: compaiono ingrandendo la mappa"><input type="checkbox" data-k="comuni" checked><i class="c"></i>Città <small>(ingrandendo)</small></label>';
  L.DomEvent.disableClickPropagation(d); L.DomEvent.disableScrollPropagation(d);
  d.addEventListener("change", e => { const k = e.target.dataset.k; if(k){ accesi[k] = e.target.checked; disegnaConfini(); } }); return d; };
ctlConfini.addTo(mappa);
const segnalini = new Map();
function raggio(c){ return !c ? 13 : c <= 300 ? 13 : c <= 1000 ? 16 : c <= 5000 ? 19 : c <= 20000 ? 23 : 27; }
function creaSegnalino(l){
  const d = raggio(l.capN);
  const m = L.marker([l.lat, l.lon], {title: l.nome, icon: L.divIcon({className: "", iconSize: [d, d], html: '<div class="segn" style="width:' + d + 'px;height:' + d + 'px;background:' + FAMIGLIE[l.fam][2] + '"></div>'})});
  m.bindPopup(() => scheda(l), {maxWidth: 330, autoPanPaddingTopLeft: [20, 20], autoPanPaddingBottomRight: [20, 20]});
  m.on("popupopen", () => segnaAttivo(l.id, false)); m.on("popupclose", () => { if(attivo === l.id) segnaAttivo(null, false); });
  return m;
}
function scheda(l){
  const ind = [l.indirizzo, [l.cp, l.citta, l.prov ? "(" + l.prov + ")" : ""].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const righe = [];
  righe.push(["Capienza", l.capN ? "<strong>" + numIt(l.capN) + "</strong>" + (l.capNota ? " <small>· " + esc(l.capNota) + "</small>" : "") : "<small>non disponibile</small>"]);
  if(ind) righe.push(["Indirizzo", esc(ind) + (l.regione ? "<br><small>" + esc(l.regione) + "</small>" : "")]);
  if(l.pp) righe.push(["Gestione", esc(l.pp)]);
  if(l.gen.length) righe.push(["Generi", '<div class="gen">' + l.gen.map(g => "<span>" + esc(g) + "</span>").join("") + "</div>"]);
  if(l.email) righe.push(["Email", l.email.split(/[;,\s]+/).filter(e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)).map(e => '<a href="mailto:' + esc(e) + '">' + esc(e) + "</a>").join("<br>")]);
  if(l.tel) righe.push(["Telefono", '<a href="tel:' + esc(l.tel.replace(/[^\d+]/g, "")) + '">' + esc(l.tel) + "</a>"]);
  const az = [];
  if(l.igUrl) az.push('<a href="' + esc(l.igUrl) + '" target="_blank" rel="noopener noreferrer">Instagram ' + esc(nomeSocial(l.ig)) + "</a>");
  else if(l.fbUrl) az.push('<a href="' + esc(l.fbUrl) + '" target="_blank" rel="noopener noreferrer">Facebook</a>');
  if(l.igUrl && l.fbUrl) az.push('<a class="sec" href="' + esc(l.fbUrl) + '" target="_blank" rel="noopener noreferrer">Facebook</a>');
  if(!l.igUrl && !l.fbUrl) az.push('<a class="sec" href="https://www.google.com/search?q=' + encodeURIComponent(l.nome + " " + l.citta + " instagram") + '" target="_blank" rel="noopener noreferrer" title="Nessun profilo verificato: cerca su Google">Cerca profilo social</a>');
  if(l.webUrl) az.push('<a class="sec" href="' + esc(l.webUrl) + '" target="_blank" rel="noopener noreferrer">Sito web</a>');
  if(l.haPos) az.push('<a class="sec" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(l.nome + " " + l.citta) + '" target="_blank" rel="noopener noreferrer">Google Maps</a>');
  return '<div class="sch"><h2>' + esc(l.nome) + '</h2><div class="tipo"><i style="background:' + FAMIGLIE[l.fam][2] + '"></i>' + esc(l.tipo) + "</div><dl>" + righe.map(r => "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>").join("") + '</dl><div class="azioni">' + az.join("") + "</div>" + (l.note ? '<div class="nota">' + esc(l.note) + "</div>" : "") + "</div>";
}

/* ===================== ELENCO ===================== */
function ordina(a){ const o = $("#ordina").value, t = (x, y) => x.localeCompare(y, "it", {sensitivity: "base"});
  const f = {nome: (x, y) => t(x.nome, y.nome), citta: (x, y) => t(x.citta, y.citta) || t(x.nome, y.nome), regione: (x, y) => t(x.regione, y.regione) || t(x.citta, y.citta) || t(x.nome, y.nome),
    "cap-desc": (x, y) => (y.capN - x.capN) || t(x.nome, y.nome), "cap-asc": (x, y) => ((x.capN || 1e12) - (y.capN || 1e12)) || t(x.nome, y.nome)}[o];
  return a.slice().sort(f); }
function aggiorna(spostaMappa){
  visibili = LUOGHI.filter(l => passa(l));
  gruppi.clearLayers(); gruppi.addLayers(visibili.filter(l => l.haPos).map(l => segnalini.get(l.id)));
  if(spostaMappa){ const p = visibili.filter(l => l.haPos).map(l => [l.lat, l.lon]); if(p.length) mappa.fitBounds(p, {padding: [40, 40], maxZoom: 14}); }
  const n = nFiltri(); $("#n-filtri").hidden = !n; $("#n-filtri").textContent = n;
  aggiornaConteggi(); disegnaAttivi(); evidenziaRegione(); disegnaElenco();
}
function disegnaElenco(){
  let a = visibili; const soloVista = $("#solo-vista").checked;
  if(soloVista){ const b = mappa.getBounds(); a = a.filter(l => l.haPos && b.contains([l.lat, l.lon])); }
  a = ordina(a);
  $("#conta").textContent = numIt(a.length); $("#conta-et").textContent = (a.length === 1 ? "luogo" : "luoghi") + (a.length !== LUOGHI.length ? " su " + numIt(LUOGHI.length) : "");
  const ul = $("#lista");
  if(!a.length){ ul.innerHTML = '<li class="vuoto">Nessun luogo corrisponde ai filtri. Prova ad allargare la ricerca o ad azzerare i filtri.</li>'; return; }
  ul.innerHTML = a.map(l => '<li><button type="button" class="voce' + (l.id === attivo ? " attiva" : "") + '" data-id="' + l.id + '"><span class="pall" style="background:' + FAMIGLIE[l.fam][2] + '"></span><span><span class="n">' + esc(l.nome) + '</span><div class="s">' + esc([l.citta + (l.prov ? " (" + l.prov + ")" : ""), l.tipo].filter(Boolean).join(" · ")) + (l.haPos ? "" : " · senza coordinate") + '</div></span><span class="c">' + (l.capN ? numIt(l.capN) + "<small>posti</small>" : "<small>n.d.</small>") + "</span></button></li>").join("");
}
function segnaAttivo(id, scorri){ attivo = id; document.querySelectorAll(".voce.attiva").forEach(e => e.classList.remove("attiva"));
  if(id == null) return; const el = document.querySelector('.voce[data-id="' + id + '"]'); if(el){ el.classList.add("attiva"); if(scorri !== false) el.scrollIntoView({block: "nearest"}); else el.scrollIntoView({block: "nearest", behavior: "smooth"}); } }
function apri(id){ const l = LUOGHI[id]; if(!l || !l.haPos) return; const m = segnalini.get(id);
  if(window.matchMedia("(max-width:820px)").matches) vista("mappa");
  gruppi.zoomToShowLayer(m, () => { m.openPopup(); }); }
$("#lista").addEventListener("click", e => { const b = e.target.closest(".voce"); if(b) apri(+b.dataset.id); });
mappa.on("moveend", () => { if($("#solo-vista").checked) disegnaElenco(); });
$("#solo-vista").addEventListener("change", disegnaElenco);
$("#ordina").addEventListener("change", disegnaElenco);

/* ===================== COMANDI ===================== */
function chips(id, voci, insieme, numerico, colori){
  const el = $(id);
  el.innerHTML = voci.map(v => '<button type="button" class="chip" aria-pressed="false" data-v="' + esc(v[0]) + '">' + (colori ? '<i style="background:' + colori(v[0]) + '"></i>' : "") + esc(v[1]) + ' <span class="cnt"></span></button>').join("");
  el.addEventListener("click", e => { const b = e.target.closest(".chip"); if(!b || b.disabled) return; const v = numerico ? +b.dataset.v : b.dataset.v; if(insieme.has(v)) insieme.delete(v); else insieme.add(v); aggiorna(true); });
}
function conta(f){ const m = new Map(); LUOGHI.forEach(l => [].concat(f(l)).forEach(v => { if(v) m.set(v, (m.get(v) || 0) + 1); })); return m; }
function costruisciFiltri(){
  const reg = conta(l => l.regione); const sel = $("#f-regione");
  [...reg.keys()].sort((a, b) => a.localeCompare(b, "it")).forEach(r => { const o = document.createElement("option"); o.value = r; o.textContent = r; sel.appendChild(o); });
  sel.addEventListener("change", () => { filtro.regione = sel.value; aggiorna(true); });
  const ordFam = Object.keys(FAMIGLIE); const tipi = conta(l => l.tipo);
  chips("#f-tipo", [...tipi.keys()].sort((a, b) => (ordFam.indexOf(famiglia(a)) - ordFam.indexOf(famiglia(b))) || a.localeCompare(b, "it")).map(v => [v, v]), filtro.tipo, false, v => FAMIGLIE[famiglia(v)][2]);
  const gen = conta(l => l.gen); chips("#f-genere", [...gen.keys()].sort((a, b) => gen.get(b) - gen.get(a)).map(v => [v, v]), filtro.genere, false);
  const pp = conta(l => l.pp); chips("#f-pp", [...pp.keys()].sort((a, b) => pp.get(b) - pp.get(a)).map(v => [v, v]), filtro.pp, false);
  chips("#f-cap", FASCE.map((f, i) => [i, f[0]]), filtro.cap, true);
  chips("#f-cont", Object.keys(CONTATTI).map(k => [k, CONTATTI[k][0]]), filtro.cont, false);
}
/* I numeri accanto a ogni opzione dicono quanti luoghi resterebbero scegliendola, tenendo conto degli altri filtri attivi. */
function aggiornaConteggi(){
  const defs = {tipo: ["#f-tipo", l => [l.tipo], filtro.tipo, false], genere: ["#f-genere", l => l.gen, filtro.genere, false], pp: ["#f-pp", l => [l.pp], filtro.pp, false], cap: ["#f-cap", l => [fascia(l)], filtro.cap, true]};
  for(const g in defs){ const [id, val, ins, num] = defs[g]; const m = new Map();
    LUOGHI.forEach(l => { if(passa(l, g)) val(l).forEach(v => m.set(String(v), (m.get(String(v)) || 0) + 1)); });
    document.querySelectorAll(id + " .chip").forEach(b => { const n = m.get(b.dataset.v) || 0, on = ins.has(num ? +b.dataset.v : b.dataset.v); b.querySelector(".cnt").textContent = n; b.setAttribute("aria-pressed", on); b.disabled = !n && !on; }); }
  document.querySelectorAll("#f-cont .chip").forEach(b => { const on = filtro.cont.has(b.dataset.v), n = visibili.filter(CONTATTI[b.dataset.v][1]).length; b.querySelector(".cnt").textContent = n; b.setAttribute("aria-pressed", on); b.disabled = !n && !on; });
  const mr = new Map(); LUOGHI.forEach(l => { if(l.regione && passa(l, "regione")) mr.set(l.regione, (mr.get(l.regione) || 0) + 1); });
  const sel = $("#f-regione"); [...sel.options].forEach(o => { if(!o.value) return; const n = mr.get(o.value) || 0; o.textContent = o.value + " (" + n + ")"; o.disabled = !n && o.value !== filtro.regione; }); sel.value = filtro.regione;
}
/* Riga dei filtri attivi: un clic su una voce la toglie. */
function disegnaAttivi(){
  const a = [];
  if(filtro.q) a.push(["q", "", "\u201c" + $("#q").value.trim() + "\u201d"]);
  if(filtro.regione) a.push(["regione", "", filtro.regione]);
  filtro.tipo.forEach(v => a.push(["tipo", v, v])); filtro.genere.forEach(v => a.push(["genere", v, v])); filtro.pp.forEach(v => a.push(["pp", v, v]));
  filtro.cap.forEach(v => a.push(["cap", v, "Capienza " + FASCE[v][0]])); filtro.cont.forEach(v => a.push(["cont", v, CONTATTI[v][0]]));
  const el = $("#attivi"); el.hidden = !a.length; $("#azzera").hidden = !a.length;
  el.innerHTML = a.map(x => '<button type="button" class="att" data-g="' + x[0] + '" data-v="' + esc(x[1]) + '" title="Togli questo filtro"><span>' + esc(x[2]) + '</span><b aria-hidden="true">×</b></button>').join("");
}
function svuotaRicerca(){ filtro.q = ""; $("#q").value = ""; $("#cerca").classList.remove("pieno"); }
$("#attivi").addEventListener("click", e => { const b = e.target.closest(".att"); if(!b) return; const g = b.dataset.g, v = b.dataset.v;
  if(g === "q") svuotaRicerca(); else if(g === "regione") filtro.regione = ""; else filtro[g].delete(g === "cap" ? +v : v); aggiorna(true); });
$("#azzera").addEventListener("click", () => { svuotaRicerca(); filtro.regione = ""; ["tipo", "genere", "pp", "cap", "cont"].forEach(k => filtro[k].clear()); aggiorna(true); });
let tQ; $("#q").addEventListener("input", e => { clearTimeout(tQ); $("#cerca").classList.toggle("pieno", !!e.target.value); tQ = setTimeout(() => { filtro.q = norm(e.target.value); aggiorna(true); }, 160); });
$("#q").addEventListener("keydown", e => { if(e.key === "Escape" && $("#q").value){ e.stopPropagation(); clearTimeout(tQ); svuotaRicerca(); aggiorna(true); } });
$("#q-x").addEventListener("click", () => { clearTimeout(tQ); svuotaRicerca(); aggiorna(true); $("#q").focus(); });
$("#apri-filtri").addEventListener("click", e => { const a = $("#filtri").classList.toggle("aperti"); e.currentTarget.setAttribute("aria-expanded", a); });
function vista(v){ const app = $("#app"); app.classList.toggle("vista-mappa", v === "mappa"); app.classList.toggle("vista-elenco", v !== "mappa"); $("#cambia").textContent = v === "mappa" ? "Vedi l'elenco" : "Vedi la mappa"; if(v === "mappa") setTimeout(() => mappa.invalidateSize(), 50); }
$("#cambia").addEventListener("click", () => vista($("#app").classList.contains("vista-mappa") ? "elenco" : "mappa"));

/* ===================== ESPORTAZIONE ===================== */
$("#esporta").addEventListener("click", () => {
  const cella = v => { v = String(v ?? ""); if(/^[=+\-@\t\r]/.test(v) && !/^[+\-]?\d/.test(v)) v = "'" + v; return /[";\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const righe = [COLONNE.join(";")].concat(ordina(visibili).map(l => CHIAVI.map(k => { if(k === "lat" || k === "lon") return l.haPos ? String(l[k]).replace(".", ",") : ""; if(k === "cap") return l.capN || ""; if(k === "ig") return l.igUrl; if(k === "fb") return l.fbUrl; if(k === "web") return l.webUrl; return cella(l[k]); }).join(";")));
  const blob = new Blob(["﻿" + righe.join("\r\n")], {type: "text/csv;charset=utf-8"}); const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "luoghi-musica-dal-vivo-" + new Date().toISOString().slice(0, 10) + ".csv"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});

/* ===================== AVVIO ===================== */
(async () => {
  const {lista, fonte} = await caricaDati();
  LUOGHI = prepara(lista);
  LUOGHI.forEach(l => { if(l.haPos) segnalini.set(l.id, creaSegnalino(l)); });
  costruisciFiltri(); aggiorna(true);
  const st = $("#stato"); const senza = LUOGHI.filter(l => !l.haPos).length;
  if(fonte === "foglio"){ st.innerHTML = "<i></i>Dati dal foglio Google" + (senza ? " · " + senza + " senza coordinate" : ""); }
  else { st.classList.add("riserva"); st.innerHTML = "<i></i>Copia interna dei dati" + (CONFIG.DATA_COPIA.startsWith("__") ? "" : " del " + esc(CONFIG.DATA_COPIA)); st.title = "Il foglio Google non è collegato o non è raggiungibile: la mappa usa i dati salvati nel file."; }
  if(CONFIG.ID_FOGLIO && !CONFIG.ID_FOGLIO.startsWith("__")){ const a = $("#link-foglio"); a.href = "https://docs.google.com/spreadsheets/d/" + encodeURIComponent(CONFIG.ID_FOGLIO) + "/edit"; a.hidden = false; }
})();
