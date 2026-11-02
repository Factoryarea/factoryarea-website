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
     Il JavaScript NON chiama play() all'apertura della pagina: su Safari una
     chiamata troppo presto può essere rifiutata e, da regola HTML, annulla
     anche l'autoplay del browser. Interviene solo dopo: ferma il video quando
     la hero è coperta dalle sezioni successive o la scheda non è visibile,
     lo fa ripartire quando torna in vista e, se dopo un paio di secondi
     l'autoplay non è partito, ritenta qualche volta. Se il dispositivo lo
     blocca (es. risparmio energetico) resta la copertina e il pulsante in
     basso a destra diventa "riproduci". */
  var videoUpdate = null;
  var heroVideo = document.querySelector("[data-hero-video]");
  var videoToggle = document.querySelector("[data-video-toggle]");

  // Diagnostica: aprendo la home con ?debug-video compare un riquadro con lo stato del video
  if (heroVideo && /[?&]debug-video\b/.test(location.search)) {
    var dbg = document.createElement("pre");
    dbg.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:999;max-height:50vh;overflow:auto;margin:0;padding:8px;background:rgba(0,0,0,.85);color:#7CFC00;font:11px/1.35 monospace;white-space:pre-wrap;border-radius:6px";
    var dlog = function (m) {
      dbg.textContent += (performance.now() / 1000).toFixed(1) + "s " + m + "\n";
    };
    var dstate = function () {
      var e = heroVideo.error;
      return "src=" + (heroVideo.currentSrc.split("/").pop() || "-") + " rs=" + heroVideo.readyState +
        " ns=" + heroVideo.networkState + " paused=" + heroVideo.paused + " muted=" + heroVideo.muted +
        (e ? " ERRORE=" + e.code + " " + (e.message || "") : "");
    };
    dlog(navigator.userAgent);
    dlog("canPlay av1=" + heroVideo.canPlayType('video/mp4; codecs="av01.0.05M.10"') +
      " hevc=" + heroVideo.canPlayType('video/mp4; codecs="hvc1.1.6.L93.90"') +
      " h264=" + heroVideo.canPlayType('video/mp4; codecs="avc1.640028"'));
    dlog("riduci movimento=" + reduceMotion + " | stato iniziale " + dstate());
    ["loadstart", "loadedmetadata", "loadeddata", "canplay", "play", "playing", "pause", "waiting", "stalled", "suspend", "error", "abort", "emptied"].forEach(function (ev) {
      heroVideo.addEventListener(ev, function () { dlog(ev + " " + dstate()); });
    });
    var nativePlay = heroVideo.play;
    heroVideo.play = function () {
      dlog("play() chiamato dallo script");
      var pr = nativePlay.call(heroVideo);
      if (pr && pr.then) pr.then(function () { dlog("play() riuscito"); }, function (err) { dlog("play() rifiutato: " + err.name + " " + err.message); });
      return pr;
    };
    document.body.appendChild(dbg);
  }

  if (heroVideo) {
    var userPaused = false;   // solo il pulsante lo cambia
    var playFailed = false;   // il browser ha rifiutato la riproduzione
    var heroVisible = true;
    var lastTry = performance.now();
    var tries = 0;

    var setToggle = function () {
      if (!videoToggle) return;
      videoToggle.hidden = false;
      var showPlay = heroVideo.paused && (userPaused || playFailed);
      videoToggle.classList.toggle("is-paused", showPlay);
      videoToggle.setAttribute("aria-label", showPlay ? "Riproduci il video" : "Metti in pausa il video");
    };

    var wantsPlay = function () {
      return !userPaused && heroVisible && !document.hidden;
    };

    var tryPlay = function () {
      lastTry = performance.now();
      tries++;
      var pr = heroVideo.play();
      if (pr && pr.catch) {
        pr.catch(function () {
          playFailed = true;
          setToggle();
        });
      }
    };

    var syncVideo = function () {
      if (!wantsPlay()) {
        if (!heroVideo.paused) heroVideo.pause();
      } else if (heroVideo.paused && heroVideo.readyState >= 2) {
        tryPlay();
      }
      setToggle();
    };

    heroVideo.addEventListener("playing", function () {
      playFailed = false;
      setToggle();
    });
    heroVideo.addEventListener("pause", setToggle);

    if (videoToggle) {
      videoToggle.addEventListener("click", function () {
        if (heroVideo.paused) {
          userPaused = false;
          tries = 0;
          tryPlay();
        } else {
          userPaused = true;
          heroVideo.pause();
        }
        setToggle();
      });
    }
    document.addEventListener("visibilitychange", function () {
      tries = 0;
      syncVideo();
    });

    videoUpdate = function (y) {
      var visible = y < (layout.vh || window.innerHeight) * 1.05;
      if (visible !== heroVisible) {
        heroVisible = visible;
        tries = 0;
        syncVideo();
      } else if (wantsPlay() && heroVideo.paused && heroVideo.readyState >= 2 &&
                 tries < 5 && performance.now() - lastTry > 2000) {
        // l'autoplay del browser non è partito: ritenta (al massimo 5 volte)
        tryPlay();
      }
    };

    setToggle();
  }

  /* Colore della fascia in alto del browser (solo home).
     Safari su iPhone (iOS 26) e su Mac colora la zona sopra la pagina con il colore
     degli elementi fissi sul bordo dello schermo; Chrome su Android e i Safari meno
     recenti usano il meta "theme-color". Finché la pagina è in cima, entrambi
     seguono il colore del bordo superiore del video, scurito come appare sotto la
     sfumatura della barra; quando si scorre o si apre il menu tornano al blu. */
  var tintUpdate = null;
  var tintRefresh = null;
  var tintEl = document.querySelector("[data-tint]");
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  if (tintEl && heroVideo) {
    var brandColor = getComputedStyle(root).getPropertyValue("--bg").trim() || "#0024ff";
    var tintCanvas = document.createElement("canvas");
    tintCanvas.width = 8;
    tintCanvas.height = 8;
    var tintCtx = tintCanvas.getContext("2d", { willReadFrequently: true });
    var tintRgb = (getComputedStyle(tintEl).backgroundColor.match(/\d+/g) || [110, 87, 69]).slice(0, 3).map(Number);
    var atTop = true;

    var toHex = function (c) {
      return "#" + c.map(function (v) {
        var h = Math.round(clamp(v, 0, 255)).toString(16);
        return h.length < 2 ? "0" + h : h;
      }).join("");
    };

    tintRefresh = function () {
      var show = atTop && !menuOpen;
      tintEl.hidden = !show;
      if (show) tintEl.style.backgroundColor = toHex(tintRgb);
      if (themeMeta) themeMeta.setAttribute("content", show ? toHex(tintRgb) : brandColor);
    };

    var sampleTint = function () {
      if (!atTop || menuOpen || document.hidden || heroVideo.readyState < 2) return;
      try {
        tintCtx.drawImage(heroVideo, 0, 0, 8, 8);
        var d = tintCtx.getImageData(0, 0, 8, 1).data;
        var sum = [0, 0, 0];
        for (var i = 0; i < d.length; i += 4) {
          sum[0] += d[i];
          sum[1] += d[i + 1];
          sum[2] += d[i + 2];
        }
        tintRgb = tintRgb.map(function (v, k) {
          var target = (sum[k] / 8) * 0.55; // sotto la sfumatura nera al 45% della barra
          return v + (target - v) * 0.5;
        });
        tintRefresh();
      } catch (e) {
        // se il fotogramma non si può leggere resta il colore della copertina
      }
    };

    setInterval(sampleTint, 400);

    tintUpdate = function (y) {
      var top = y <= 8;
      if (top !== atTop) {
        atTop = top;
        tintRefresh();
      }
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
