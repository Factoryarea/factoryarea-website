/* ==========================================================================
   FACTORY AREA — script principale
   --------------------------------------------------------------------------
   1. Scroll fluido (Lenis)
   2. Testi animati (righe / parole / lettere) e comparse
   3. Navigazione: barra sfocata e menu mobile
   4. Effetti legati allo scroll (hero, edizioni impilate, testo che si accende)
   5. Video della home e colore della fascia in alto del browser
   6. Cursore personalizzato
   7. Anno nel footer
   Nessuna dipendenza oltre a Lenis (assets/js/lenis.min.js).
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var ANIM = root.classList.contains("anim");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var mqDesktop = window.matchMedia("(min-width: 1200px)");
  var mqPhone = window.matchMedia("(max-width: 809.98px)");

  window.__faReady = true;

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function num(value, fallback) {
    var n = parseFloat(value);
    return isNaN(n) ? fallback : n;
  }

  /* ------------------------------------------------------------------------
     1. SCROLL FLUIDO
     ------------------------------------------------------------------------ */
  var lenis = null;
  if (!reduceMotion && typeof window.Lenis === "function") {
    lenis = new window.Lenis({ duration: 1, anchors: true });
  }

  /* ------------------------------------------------------------------------
     2. TESTI ANIMATI E COMPARSE
     ------------------------------------------------------------------------ */

  // Divide un testo in parole (span.tok)
  function splitWords(el) {
    var tokens = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(" "));
            } else {
              var span = document.createElement("span");
              span.className = "tok";
              span.textContent = part;
              frag.appendChild(span);
              tokens.push(span);
            }
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          walk(child);
        }
      });
    })(el);
    return tokens;
  }

  // Divide un testo in lettere (span.tok) raggruppate per parola
  function splitChars(el) {
    var tokens = [];
    var text = el.textContent.trim().replace(/\s+/g, " ");
    el.textContent = "";
    text.split(" ").forEach(function (word, i, all) {
      var w = document.createElement("span");
      w.className = "word";
      w.style.whiteSpace = "nowrap";
      Array.from(word).forEach(function (ch) {
        var span = document.createElement("span");
        span.className = "tok";
        span.textContent = ch;
        w.appendChild(span);
        tokens.push(span);
      });
      el.appendChild(w);
      if (i < all.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return tokens;
  }

  // Divide un testo in righe (span.line), misurando dove va a capo
  function splitLines(el) {
    var blocks = el.querySelectorAll(".split-block");
    var targets = blocks.length ? Array.prototype.slice.call(blocks) : [el];
    var lines = [];
    targets.forEach(function (block) {
      var text = block.textContent.trim().replace(/\s+/g, " ");
      block.textContent = "";
      var words = text.split(" ").map(function (word, i, all) {
        var span = document.createElement("span");
        span.style.display = "inline-block";
        span.textContent = word;
        block.appendChild(span);
        if (i < all.length - 1) block.appendChild(document.createTextNode(" "));
        return span;
      });
      var groups = [];
      var top = null;
      words.forEach(function (w) {
        var t = w.offsetTop;
        if (top === null || Math.abs(t - top) > 3) {
          groups.push([]);
          top = t;
        }
        groups[groups.length - 1].push(w.textContent);
      });
      block.textContent = "";
      groups.forEach(function (g) {
        var line = document.createElement("span");
        line.className = "line";
        line.textContent = g.join(" ");
        block.appendChild(line);
        lines.push(line);
      });
    });
    return lines;
  }

  // Prepara un elemento [data-split] e restituisce la durata totale (in s)
  function prepareSplit(el) {
    if (el._split) return el._split;
    var original = el.innerHTML;
    var mode = el.getAttribute("data-split");
    var tokens = mode === "line" ? splitLines(el) : mode === "char" ? splitChars(el) : splitWords(el);
    var stagger = num(el.getAttribute("data-stagger"), 0.05);
    var start = num(el.getAttribute("data-delay"), 0);
    tokens.forEach(function (t, i) {
      t.style.setProperty("--td", (start + i * stagger).toFixed(3) + "s");
    });
    el.classList.add("is-split");
    var dur = num(getComputedStyle(el).getPropertyValue("--tdur"), 1);
    el._split = {
      total: start + Math.max(tokens.length - 1, 0) * stagger + dur,
      restore: function () {
        el.innerHTML = original;
        el.classList.add("is-done");
        el.classList.remove("is-split", "is-in");
      }
    };
    return el._split;
  }

  function playSplit(el) {
    var info = prepareSplit(el);
    void el.offsetWidth; // forza il calcolo dello stato iniziale
    el.classList.add("is-in");
    // A fine animazione rimette il testo originale (si adatta di nuovo alla larghezza)
    setTimeout(info.restore, (info.total + 0.4) * 1000);
  }

  function play(el) {
    if (el.hasAttribute("data-split")) {
      playSplit(el);
    } else {
      el.classList.add("is-in");
    }
  }

  var fontsReady = new Promise(function (resolve) {
    var done = false;
    function finish() {
      if (!done) {
        done = true;
        resolve();
      }
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(finish);
    setTimeout(finish, 1200);
  });

  if (ANIM) {
    var viewObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            viewObserver.unobserve(entry.target);
            play(entry.target);
          }
        });
      },
      { threshold: 0 }
    );

    fontsReady.then(function () {
      document.querySelectorAll("[data-split], [data-reveal]").forEach(function (el) {
        if (el.closest(".nav__menu")) return;
        var trigger = el.getAttribute("data-trigger") || "view";
        if (trigger === "load") {
          if (el.hasAttribute("data-split")) prepareSplit(el);
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              play(el);
            });
          });
        } else {
          viewObserver.observe(el);
        }
      });

      // Video (o foto) della hero: compare quando l'immagine di copertina è pronta
      var heroMedia = document.querySelector(".hero__video, .hero__img");
      if (heroMedia) {
        var start = function () {
          heroMedia.classList.add("is-in");
        };
        var ready;
        if (heroMedia.tagName === "VIDEO") {
          var poster = new Image();
          poster.src = heroMedia.getAttribute("poster");
          ready = poster.decode ? poster.decode() : Promise.resolve();
        } else {
          ready = heroMedia.decode ? heroMedia.decode() : Promise.resolve();
        }
        Promise.race([ready, new Promise(function (r) { setTimeout(r, 1500); })]).then(start, start);
      }
    });
  }

  /* ------------------------------------------------------------------------
     3. NAVIGAZIONE
     ------------------------------------------------------------------------ */
  var nav = document.querySelector("[data-nav]");
  var toggle = nav && nav.querySelector(".nav__toggle");
  var menu = nav && nav.querySelector(".nav__menu");
  var menuOpen = false;

  // In home la barra è trasparente sopra il video e diventa sfocata appena si scorre
  function updateNav(y) {
    if (nav) nav.classList.toggle("is-scrolled", y > 8);
  }

  function setMenu(open) {
    if (!menu || open === menuOpen) return;
    menuOpen = open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Chiudi" : "Menu";
    if (tintRefresh) tintRefresh();
    if (open) {
      menu.hidden = false;
      void menu.offsetWidth;
      nav.classList.add("is-open");
      root.classList.add("is-locked");
      if (lenis) lenis.stop();
    } else {
      nav.classList.remove("is-open");
      menu.hidden = true;
      root.classList.remove("is-locked");
      if (lenis) lenis.start();
    }
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      setMenu(!menuOpen);
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuOpen) {
        setMenu(false);
        toggle.focus();
      }
    });
    mqDesktop.addEventListener("change", function () {
      if (mqDesktop.matches) setMenu(false);
    });
  }

  /* ------------------------------------------------------------------------
     4. EFFETTI LEGATI ALLO SCROLL
     ------------------------------------------------------------------------ */
  var heroParallax = document.querySelector(".hero__parallax");
  var stack = document.querySelector(".stack");
  var cards = stack ? Array.prototype.slice.call(stack.querySelectorAll(".stack__card")) : [];
  var revealText = document.querySelector(".reveal-scroll");
  var revealChars = [];

  var layout = { docH: 0, vh: 0, stackTop: 0, stackH: 0 };

  function measure() {
    layout.vh = window.innerHeight;
    layout.docH = document.documentElement.scrollHeight;
    if (stack) {
      var r = stack.getBoundingClientRect();
      layout.stackTop = r.top + window.scrollY;
      layout.stackH = stack.offsetHeight;
    }
  }

  // Testo che si accende: divide in lettere
  if (revealText) {
    var text = revealText.textContent.trim().replace(/\s+/g, " ");
    revealText.setAttribute("aria-label", text);
    revealText.textContent = "";
    text.split(" ").forEach(function (word, i, all) {
      var w = document.createElement("span");
      w.className = "word";
      w.setAttribute("aria-hidden", "true");
      Array.from(word).forEach(function (ch) {
        var c = document.createElement("span");
        c.className = "ch";
        c.textContent = ch;
        w.appendChild(c);
        revealChars.push(c);
      });
      revealText.appendChild(w);
      if (i < all.length - 1) revealText.appendChild(document.createTextNode(" "));
    });
  }

  // Valori "morbidi" per le card impilate (imitano la molla di Framer)
  var smoothP = null;

  function cardTargets(card) {
    var phone = mqPhone.matches;
    return {
      scale: num(card.getAttribute(phone ? "data-scale-m" : "data-scale"), 0.7),
      y: num(card.getAttribute(phone ? "data-y-m" : "data-y"), -100)
    };
  }

  function applyCards(p) {
    cards.forEach(function (card) {
      var t = cardTargets(card);
      var s = 1 - p * (1 - t.scale);
      card.style.transform = "translate3d(0," + (t.y * p).toFixed(2) + "px,0) scale(" + s.toFixed(4) + ")";
    });
  }

  function updateReveal() {
    if (!revealText || !ANIM) return;
    var r = revealText.getBoundingClientRect();
    var vh = layout.vh;
    // da "cima del testo al 90% dello schermo" a "fondo del testo al 50%"
    var p = clamp((vh * 0.9 - r.top) / (vh * 0.4 + r.height), 0, 1);
    var n = revealChars.length;
    for (var i = 0; i < n; i++) {
      var local = clamp(p * n - i, 0, 1);
      var eased = local < 0.5 ? 2 * local * local : 1 - 2 * (1 - local) * (1 - local);
      revealChars[i].style.setProperty("--o", (0.1 + 0.9 * eased).toFixed(3));
    }
  }

  var lastTime = performance.now();

  function frame(now) {
    var dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    if (lenis) lenis.raf(now);

    var y = window.scrollY;
    updateNav(y);

    if (ANIM) {
      if (heroParallax) {
        var max = Math.max(layout.docH - layout.vh, 1);
        var hp = clamp(y / max, 0, 1);
        heroParallax.style.transform = "translate3d(0," + (-500 * hp).toFixed(2) + "px,0) scale(" + (1 + 0.15 * hp).toFixed(4) + ")";
      }

      if (stack && layout.stackH) {
        var target = clamp((y - layout.stackTop) / layout.stackH, 0, 1);
        if (smoothP === null) smoothP = target;
        smoothP += (target - smoothP) * (1 - Math.exp(-dt / 0.12));
        if (Math.abs(target - smoothP) < 0.0005) smoothP = target;
        applyCards(smoothP);
      }

      updateReveal();
    }

    if (stack) stack.classList.toggle("is-active", y >= layout.stackTop - 1);

    if (videoUpdate) videoUpdate(y);
    if (tintUpdate) tintUpdate(y);
    if (cursorUpdate) cursorUpdate(dt);
    requestAnimationFrame(frame);
  }

  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  fontsReady.then(measure);

  /* ------------------------------------------------------------------------
     5. VIDEO DELLA HOME
     ------------------------------------------------------------------------
     Parte da solo grazie all'attributo autoplay (con muted e playsinline).
     Lo script non chiama play() all'apertura della pagina (su Safari una
     chiamata troppo presto può essere rifiutata e annullare l'autoplay) e si
     occupa del resto:
     - ferma il video quando la hero è coperta o la scheda non è visibile, e
       lo fa ripartire quando torna in vista;
     - se l'autoplay non parte, ritenta qualche volta; se il dispositivo lo
       blocca (es. risparmio energetico) su Safari mostra il video come immagine
       animata; negli altri casi il pulsante diventa "riproduci" e il video parte
       al primo tocco sulla pagina;
     - se il file scelto dà errore, o il video resta fermo pur risultando in
       riproduzione con i dati già scaricati, passa al formato successivo
       (HEVC → AV1 → H.264). */
  var videoUpdate = null;
  var heroVideo = document.querySelector("[data-hero-video]");
  var videoToggle = document.querySelector("[data-video-toggle]");
  var dlog = function () {};

  // Diagnostica: aprendo la home con ?debug-video compare un riquadro con lo stato del video
  if (heroVideo && /[?&]debug-video\b/.test(location.search)) {
    var dbg = document.createElement("pre");
    dbg.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:999;max-height:50vh;overflow:auto;margin:0;padding:8px;background:rgba(0,0,0,.85);color:#7CFC00;font:11px/1.35 monospace;white-space:pre-wrap;border-radius:6px";
    dlog = function (m) {
      dbg.textContent += (performance.now() / 1000).toFixed(1) + "s " + m + "\n";
      dbg.scrollTop = dbg.scrollHeight;
    };
    // fotogrammi mostrati sullo schermo / decodificati
    var shownFrames = 0;
    var frameId = 0;
    if ("requestVideoFrameCallback" in heroVideo) {
      var countFrame = function () {
        shownFrames++;
        frameId = heroVideo.requestVideoFrameCallback(countFrame);
      };
      var watchFrames = function () {
        if (frameId && heroVideo.cancelVideoFrameCallback) heroVideo.cancelVideoFrameCallback(frameId);
        frameId = heroVideo.requestVideoFrameCallback(countFrame);
      };
      watchFrames();
      heroVideo.addEventListener("loadstart", watchFrames);
    }
    var decodedFrames = function () {
      try {
        return heroVideo.getVideoPlaybackQuality ? heroVideo.getVideoPlaybackQuality().totalVideoFrames : "?";
      } catch (e) {
        return "?";
      }
    };
    var dstate = function () {
      var e = heroVideo.error;
      return "src=" + (heroVideo.currentSrc.split("/").pop() || "-") + " rs=" + heroVideo.readyState +
        " ns=" + heroVideo.networkState + " paused=" + heroVideo.paused + " t=" + heroVideo.currentTime.toFixed(2) +
        " fotogrammi=" + shownFrames + "/" + decodedFrames() +
        " scaricato=" + (heroVideo.buffered.length ? heroVideo.buffered.end(heroVideo.buffered.length - 1).toFixed(1) + "s" : "0") +
        " opacità=" + getComputedStyle(heroVideo).opacity +
        (e ? " ERRORE=" + e.code + " " + (e.message || "") : "");
    };
    dlog(navigator.userAgent);
    dlog("canPlay hevc=" + heroVideo.canPlayType('video/mp4; codecs="hvc1.1.6.L93.90"') +
      " av1=" + heroVideo.canPlayType('video/mp4; codecs="av01.0.05M.10"') +
      " h264=" + heroVideo.canPlayType('video/mp4; codecs="avc1.640028"') +
      " | riduci movimento=" + reduceMotion);
    dlog("stato iniziale " + dstate());
    ["loadstart", "loadedmetadata", "loadeddata", "canplay", "play", "playing", "pause", "waiting", "stalled", "suspend", "error", "abort", "emptied"].forEach(function (ev) {
      heroVideo.addEventListener(ev, function () { dlog(ev + " " + dstate()); });
    });
    setInterval(function () { dlog("controllo " + dstate()); }, 3000);
    // pulsante per copiare il registro e incollarlo in un messaggio
    var copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = "Copia il registro";
    copy.style.cssText = "position:fixed;right:16px;top:76px;z-index:1000;padding:8px 14px;border:0;border-radius:999px;background:#7CFC00;color:#000;font:600 13px/1 sans-serif;cursor:pointer";
    copy.addEventListener("click", function () {
      var text = dbg.textContent;
      var done = function () { copy.textContent = "Copiato ✓"; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { selectLog(); });
      } else {
        selectLog();
      }
    });
    var selectLog = function () {
      var r = document.createRange();
      r.selectNodeContents(dbg);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
      copy.textContent = "Testo selezionato: copialo";
    };
    dbg.style.top = "120px";
    dbg.style.bottom = "auto";
    dbg.style.pointerEvents = "auto";
    document.body.appendChild(dbg);
    document.body.appendChild(copy);
  }

  if (heroVideo) {
    var userPaused = false;   // solo il pulsante lo cambia
    var playFailed = false;   // il browser ha rifiutato la riproduzione
    var heroVisible = true;
    var startTime = performance.now();
    var lastTry = startTime;
    var tries = 0;
    var switches = 0;         // cambi di formato già fatti
    var switching = false;
    var lastVideoTime = -1;
    var lastProgressAt = startTime;   // ultima volta in cui il tempo del video è avanzato
    var toggleState = null;

    // Pulsante: "pausa" mentre il video va (o sta partendo), "riproduci" quando è fermo.
    // Nei primi 3 secondi un video fermo è considerato "in partenza".
    /* Ripiego per Safari quando il telefono blocca l'avvio automatico dei video
       (risparmio energetico, dati ridotti...): Safari sa mostrare un MP4 anche dentro
       un <img>, come una GIF, e le immagini non sono soggette a quel blocco. Se il
       browser non lo supporta (Chrome, Firefox) l'immagine dà errore e resta tutto com'è. */
    var animImg = null;        // <img> con il video, se il ripiego è attivo
    var animImgTried = false;
    var animSrc = "";
    var posterSrc = heroVideo.getAttribute("poster") || "";
    var showAnimImg = function (on) {
      if (!animImg) return;
      var want = on ? animSrc : posterSrc;
      if (animImg.getAttribute("src") !== want) animImg.setAttribute("src", want);
    };
    var tryAnimatedImage = function () {
      if (animImgTried) return;
      animImgTried = true;
      var vertical = window.matchMedia && window.matchMedia("(max-aspect-ratio: 3/4)").matches;
      var base = posterSrc.replace(/[^\/]*$/, "");          // stessa cartella della copertina
      animSrc = base + (vertical ? "hero-verticale.mp4" : "hero.mp4");   // H.264
      var img = new Image();
      img.onload = function () {
        img.onload = null;
        if (!heroVideo.paused || animImg) return;          // nel frattempo il video è partito
        img.className = heroVideo.className;
        img.setAttribute("alt", "");
        img.setAttribute("aria-hidden", "true");
        heroVideo.parentNode.insertBefore(img, heroVideo);
        heroVideo.style.display = "none";
        animImg = img;
        dlog("video mostrato come immagine animata");
        showAnimImg(!userPaused && heroVisible);
        toggleState = null;
        setToggle();
      };
      img.onerror = function () { dlog("immagine animata non supportata da questo browser"); };
      img.src = animSrc;
    };

    var setToggle = function () {
      if (!videoToggle) return;
      var graceOver = performance.now() - startTime > 3000;
      var showPlay = animImg ? userPaused : heroVideo.paused && (userPaused || playFailed || graceOver);
      if (showPlay === toggleState) return;
      toggleState = showPlay;
      videoToggle.hidden = false;
      videoToggle.classList.toggle("is-paused", showPlay);
      videoToggle.setAttribute("aria-label", showPlay ? "Riproduci il video" : "Metti in pausa il video");
    };

    var wantsPlay = function () {
      return !userPaused && heroVisible && !document.hidden;
    };

    var tryPlay = function (why) {
      lastTry = performance.now();
      tries++;
      dlog("play() (" + why + ")");
      var pr = null;
      try {
        pr = heroVideo.play();
      } catch (e) {}
      if (pr && pr.then) {
        pr.then(function () {
          playFailed = false;
          setToggle();
        }, function (err) {
          dlog("play() rifiutato: " + err.name + " " + err.message);
          if (err && err.name === "NotAllowedError") {
            playFailed = true;
            tryAnimatedImage();
          }
          setToggle();
        });
      }
    };

    // Un'altra sorgente, diversa da quella in uso, che il browser può provare
    var canUse = function (s) {
      if (s.src === heroVideo.currentSrc) return false;
      var media = s.getAttribute("media");
      if (media && window.matchMedia && !window.matchMedia(media).matches) return false;
      var type = s.getAttribute("type");
      return !type || heroVideo.canPlayType(type) !== "";
    };

    // Passa al formato successivo: toglie il file che non va e ricarica il video
    var nextFormat = function (reason) {
      if (switching || switches >= 2) return;
      var current = heroVideo.currentSrc;
      var sources = Array.prototype.slice.call(heroVideo.querySelectorAll("source"));
      if (!current || !sources.some(canUse)) {
        dlog("nessun altro formato disponibile (" + reason + ")");
        switches = 2;
        return;
      }
      sources.forEach(function (s) {
        if (s.src === current) s.parentNode.removeChild(s);
      });
      switches++;
      switching = true;
      dlog("cambio formato (" + reason + ")");
      lastVideoTime = -1;
      lastProgressAt = performance.now();
      lastTry = lastProgressAt;
      tries = 0;
      heroVideo.load();   // ripete la scelta del file; l'autoplay torna attivo
      setTimeout(function () { switching = false; }, 1500);
    };

    heroVideo.addEventListener("error", function () {
      var code = heroVideo.error ? heroVideo.error.code : 0;
      // 3 = file non decodificabile, 4 = formato non supportato
      if (code === 3 || code === 4) nextFormat("errore " + code);
    });

    // Secondi di video già scaricati dopo il punto attuale
    var bufferedAhead = function () {
      var b = heroVideo.buffered;
      var t = heroVideo.currentTime;
      for (var i = 0; i < b.length; i++) {
        if (b.start(i) <= t + 0.1 && b.end(i) > t) return b.end(i) - t;
      }
      return 0;
    };

    var syncVideo = function () {
      if (animImg) {
        showAnimImg(wantsPlay());
        setToggle();
        return;
      }
      if (!wantsPlay()) {
        if (!heroVideo.paused) heroVideo.pause();
      } else if (heroVideo.paused && performance.now() - startTime > 2000) {
        tryPlay("ripresa");
      }
      setToggle();
    };

    heroVideo.addEventListener("playing", function () {
      playFailed = false;
      lastProgressAt = performance.now();
      setToggle();
    });
    heroVideo.addEventListener("play", setToggle);
    heroVideo.addEventListener("pause", setToggle);

    if (videoToggle) {
      videoToggle.addEventListener("click", function () {
        if (animImg) {
          userPaused = !userPaused;
          showAnimImg(!userPaused);
          setToggle();
          return;
        }
        if (heroVideo.paused) {
          userPaused = false;
          playFailed = false;
          tries = 0;
          tryPlay("pulsante");
        } else {
          userPaused = true;
          heroVideo.pause();
        }
        setToggle();
      });
    }
    // Se il telefono blocca l'avvio automatico (per esempio iPhone in risparmio
    // energetico), il video parte al primo tocco o tasto in qualsiasi punto della pagina
    // (e riparte così anche se dopo una pausa il telefono lo blocca di nuovo).
    var gestureEvents = ["touchend", "pointerup", "click", "keydown"];
    var onFirstGesture = function (ev) {
      if (animImg || !playFailed || userPaused || !heroVisible || !heroVideo.paused) return;
      if (videoToggle && ev.target && videoToggle.contains(ev.target)) return; // ci pensa il pulsante
      tries = 0;
      tryPlay("primo tocco sulla pagina");
    };
    gestureEvents.forEach(function (ev) {
      document.addEventListener(ev, onFirstGesture, { capture: true, passive: true });
    });

    document.addEventListener("visibilitychange", function () {
      tries = 0;
      lastProgressAt = performance.now();
      syncVideo();
    });

    videoUpdate = function (y) {
      var now = performance.now();
      var visible = y < (layout.vh || window.innerHeight) * 1.05;
      if (visible !== heroVisible) {
        heroVisible = visible;
        tries = 0;
        lastProgressAt = now;
        syncVideo();
        return;
      }
      if (animImg || !wantsPlay() || switching) return;

      if (heroVideo.paused) {
        // l'autoplay non è partito: dopo 2 secondi riprova, ogni 2 secondi, al massimo 5 volte
        if (tries < 5 && now - lastTry > 2000) tryPlay("autoplay non partito");
        setToggle();
        return;
      }

      // In riproduzione: il tempo del video avanza?
      if (heroVideo.currentTime !== lastVideoTime) {
        lastVideoTime = heroVideo.currentTime;
        lastProgressAt = now;
      }
      // Fermo da 4 secondi pur avendo i dati: il browser non riesce a usare questo formato
      if (now - lastProgressAt > 4000 && (heroVideo.readyState >= 3 || bufferedAhead() > 2)) {
        nextFormat("video fermo");
      }
    };

    setToggle();
  }

  /* Colore della fascia in alto del browser (solo home).
     Safari su iPhone (iOS 26) e su Mac colora la zona sopra la pagina con il colore
     degli elementi fissi sul bordo dello schermo; Chrome su Android e i Safari meno
     recenti usano il meta "theme-color". Finché la pagina è in cima, entrambi
     seguono il colore del bordo superiore del video, preso da una tabella
     calcolata in anticipo (un colore ogni mezzo secondo, già scurito come appare
     sotto la sfumatura della barra): nessuna lettura dei fotogrammi dal browser.
     Quando si scorre o si apre il menu tornano al blu. */
  var tintUpdate = null;
  var tintRefresh = null;
  var tintEl = document.querySelector("[data-tint]");
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  if (tintEl && heroVideo) {
    var brandColor = getComputedStyle(root).getPropertyValue("--bg").trim() || "#0024ff";
    var parseTimeline = function (attr) {
      return (heroVideo.getAttribute(attr) || "").split(",").filter(Boolean).map(function (h) {
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
      });
    };
    var timelineH = parseTimeline("data-tint-h");
    var timelineV = parseTimeline("data-tint-v");
    var tintRgb = (getComputedStyle(tintEl).backgroundColor.match(/\d+/g) || [110, 87, 69]).slice(0, 3).map(Number);
    var atTop = true;
    var lastTint = 0;

    var toHex = function (c) {
      return "#" + c.map(function (v) {
        var h = Math.round(clamp(v, 0, 255)).toString(16);
        return h.length < 2 ? "0" + h : h;
      }).join("");
    };

    tintRefresh = function () {
      var show = atTop && !menuOpen;
      // in cima segue il video; scorrendo o con il menu aperto torna blu (mai trasparente,
      // altrimenti Safari mostrerebbe sopra la barra il contenuto che ci scorre sotto)
      var color = show ? toHex(tintRgb) : brandColor;
      tintEl.style.backgroundColor = color;
      if (themeMeta) themeMeta.setAttribute("content", color);
    };

    tintUpdate = function (y) {
      var top = y <= 8;
      if (top !== atTop) {
        atTop = top;
        tintRefresh();
      }
      var now = performance.now();
      if (!atTop || menuOpen || now - lastTint < 250) return;
      lastTint = now;
      var timeline = /verticale/.test(heroVideo.currentSrc) ? timelineV : timelineH;
      if (!timeline.length || !heroVideo.currentSrc) return;
      var target = timeline[Math.min(timeline.length - 1, Math.floor(heroVideo.currentTime * 2))];
      var changed = false;
      tintRgb = tintRgb.map(function (v, k) {
        var nv = v + (target[k] - v) * 0.35;
        if (Math.abs(nv - v) > 0.5) changed = true;
        return nv;
      });
      if (changed) tintRefresh();
    };

    tintRefresh();
  }

  /* ------------------------------------------------------------------------
     6. CURSORE PERSONALIZZATO
     ------------------------------------------------------------------------ */
  var cursorUpdate = null;

  if (finePointer && document.querySelector("[data-cursor]")) {
    var cursor = document.createElement("div");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<div class="cursor__item cursor__item--explore">Explore</div>';
    document.body.appendChild(cursor);

    var exploreEl = cursor.querySelector(".cursor__item--explore");
    var cx = -200, cy = -200, tx = -200, ty = -200;
    var active = null;
    var offX = 20, offY = 60, height = 44;
    var hasPointer = false;

    var setActive = function (target) {
      if (target === active) return;
      active = target;
      if (target) {
        var variant = target.getAttribute("data-cursor");
        offX = num(target.getAttribute("data-cursor-x"), 20);
        offY = num(target.getAttribute("data-cursor-y"), 60);
        exploreEl.textContent = target.getAttribute("data-cursor-label") || "Explore";
        height = 44;
        cursor.setAttribute("data-variant", variant);
      } else {
        cursor.removeAttribute("data-variant");
      }
    };

    var hitTest = function () {
      if (!hasPointer) return;
      var el = document.elementFromPoint(tx, ty);
      setActive(el ? el.closest("[data-cursor]") : null);
    };

    document.addEventListener(
      "pointermove",
      function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        tx = e.clientX;
        ty = e.clientY;
        if (!hasPointer) {
          cx = tx;
          cy = ty;
          hasPointer = true;
        }
        setActive(e.target.closest ? e.target.closest("[data-cursor]") : null);
      },
      { passive: true }
    );

    document.documentElement.addEventListener("mouseleave", function () {
      setActive(null);
    });

    window.addEventListener("scroll", hitTest, { passive: true });

    cursorUpdate = function (dt) {
      var k = reduceMotion ? 1 : 1 - Math.exp(-dt / 0.06);
      cx += (tx - cx) * k;
      cy += (ty - cy) * k;
      cursor.style.transform = "translate3d(" + (cx + offX).toFixed(1) + "px," + (cy + offY - height).toFixed(1) + "px,0)";
    };
  }

  requestAnimationFrame(frame);

  /* ------------------------------------------------------------------------
     7. ANNO NEL FOOTER
     ------------------------------------------------------------------------ */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
