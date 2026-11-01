/* ==========================================================================
   FACTORY AREA — script principale
   --------------------------------------------------------------------------
   1. Scroll fluido (Lenis)
   2. Testi animati (righe / parole / lettere) e comparse
   3. Navigazione: stato compatto e menu mobile
   4. Effetti legati allo scroll (hero, edizioni impilate, testo che si accende)
   5. Cursore personalizzato
   6. Modulo contatti
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

      // Foto della hero: parte quando l'immagine è pronta
      var heroImg = document.querySelector(".hero__img");
      if (heroImg) {
        var start = function () {
          heroImg.classList.add("is-in");
        };
        var ready = heroImg.decode ? heroImg.decode() : Promise.resolve();
        Promise.race([ready, new Promise(function (r) { setTimeout(r, 1500); })]).then(start, start);
      }

      // Linee sotto i campi del modulo
      var form = document.querySelector(".form");
      if (form) {
        var formObserver = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) {
            form.classList.add("is-in");
            formObserver.disconnect();
          }
        });
        formObserver.observe(form);
      }
    });
  }

  /* ------------------------------------------------------------------------
     3. NAVIGAZIONE
     ------------------------------------------------------------------------ */
  var nav = document.querySelector("[data-nav]");
  var navShrink = nav && nav.hasAttribute("data-shrink");
  var toggle = nav && nav.querySelector(".nav__toggle");
  var menu = nav && nav.querySelector(".nav__menu");
  var menuOpen = false;

  function updateNav(y) {
    if (!navShrink) return;
    // Come nel sito Framer: diventa compatta dopo il 10% dell'altezza dello schermo
    nav.classList.toggle("is-small", mqDesktop.matches && y >= window.innerHeight * 0.1);
  }

  function setMenu(open) {
    if (!menu || open === menuOpen) return;
    menuOpen = open;
    toggle.setAttribute("aria-expanded", String(open));
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

    if (cursorUpdate) cursorUpdate(dt);
    requestAnimationFrame(frame);
  }

  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  fontsReady.then(measure);

  /* ------------------------------------------------------------------------
     5. CURSORE PERSONALIZZATO
     ------------------------------------------------------------------------ */
  var cursorUpdate = null;

  if (finePointer && document.querySelector("[data-cursor]")) {
    var cursor = document.createElement("div");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML =
      '<div class="cursor__item cursor__item--explore">Explore</div>' +
      '<div class="cursor__item cursor__item--contact">' +
      '<svg viewBox="0 0 24 24" fill="currentColor"><path transform="translate(5.5 5.5)" d="M1 0v2h8.59L0 11.59 1.41 13 11 3.41V12h2V0z"/></svg>' +
      "</div>";
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
        if (variant === "explore") {
          exploreEl.textContent = target.getAttribute("data-cursor-label") || "Explore";
          height = 44;
        } else {
          height = 52;
        }
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
     6. MODULO CONTATTI
     ------------------------------------------------------------------------
     Il modulo invia i dati a un servizio gratuito (Web3Forms o Formspree).
     La configurazione è nella pagina contatti/index.html. */
  var contactForm = document.querySelector("[data-contact-form]");
  if (contactForm) {
    var button = contactForm.querySelector(".btn-submit");
    var buttonText = button.querySelector(".btn-submit__text");
    var status = contactForm.querySelector(".form__status");
    var defaultLabel = buttonText.textContent;

    var showState = function (state, label, message) {
      button.classList.remove("is-loading", "is-success", "is-error");
      if (state) button.classList.add("is-" + state);
      buttonText.textContent = label || defaultLabel;
      if (status) status.textContent = message || "";
    };

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var keyField = contactForm.querySelector('[name="access_key"]');
      var action = contactForm.getAttribute("action") || "";
      var notConfigured = !action || (keyField && /INSERISCI/i.test(keyField.value)) || /INSERISCI/i.test(action);
      if (notConfigured) {
        showState("error", "Modulo non ancora attivo", "Il modulo non è ancora collegato: vedi la guida nel README.");
        return;
      }
      showState("loading");
      button.disabled = true;

      fetch(action, {
        method: "POST",
        body: new FormData(contactForm),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          return res
            .json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              if (!res.ok || data.success === false) throw new Error("send failed");
            });
        })
        .then(function () {
          contactForm.reset();
          showState("success", "Grazie!", "Messaggio inviato: ti risponderemo al più presto.");
        })
        .catch(function () {
          showState("error", "Qualcosa è andato storto", "Invio non riuscito. Riprova tra qualche minuto.");
        })
        .then(function () {
          button.disabled = false;
          setTimeout(function () {
            if (!button.classList.contains("is-loading")) showState(null, null, status ? status.textContent : "");
          }, 4000);
        });
    });
  }

  /* ------------------------------------------------------------------------
     7. ANNO NEL FOOTER
     ------------------------------------------------------------------------ */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
