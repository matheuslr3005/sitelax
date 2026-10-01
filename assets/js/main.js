/* =========================================================
   LAXA — main.js
   Landing page única: cursor custom, reveal on scroll,
   switchers (hero / formatos), navegação por seção e
   formulário de contato.
   ========================================================= */
(function () {
  "use strict";

  var body = document.body;
  var mainEl = document.getElementById("main");
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var revealObserver = null;
  var heroAutoplayTimer = null;

  /* -----------------------------------------------------
     Custom cursor
     ----------------------------------------------------- */
  function initCursor() {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    body.classList.add("has-fine-pointer");

    var dot = document.querySelector(".cursor-dot");
    var ring = document.querySelector(".cursor-ring");
    if (!dot || !ring) return;

    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var ringX = mouseX;
    var ringY = mouseY;

    window.addEventListener("mousemove", function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = "translate3d(" + mouseX + "px," + mouseY + "px,0) translate(-50%,-50%)";
    });

    function loop() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = "translate3d(" + ringX + "px," + ringY + "px,0) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    document.addEventListener("mouseover", function (e) {
      if (e.target.closest("a, button, .service-tile, [data-cursor-active]")) {
        body.classList.add("cursor-active");
      }
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest("a, button, .service-tile, [data-cursor-active]")) {
        body.classList.remove("cursor-active");
      }
    });
  }

  /* -----------------------------------------------------
     Nav sólida ao rolar
     ----------------------------------------------------- */
  function initNavScroll() {
    var nav = document.querySelector(".site-nav");
    if (!nav) return;
    var ticking = false;

    function update() {
      nav.classList.toggle("is-scrolled", window.scrollY > 40);
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
  }

  /* -----------------------------------------------------
     Mobile menu
     ----------------------------------------------------- */
  function initMobileMenu() {
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.getElementById("mobileMenu");
    if (!toggle || !menu) return;

    toggle.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.documentElement.style.overflow = isOpen ? "hidden" : "";
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.documentElement.style.overflow = "";
      });
    });
  }

  /* -----------------------------------------------------
     Reveal on scroll
     ----------------------------------------------------- */
  function initReveal() {
    if (revealObserver) revealObserver.disconnect();
    var items = mainEl.querySelectorAll("[data-reveal]");
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    items.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* -----------------------------------------------------
     Switcher genérico: chips flutuantes + painel de prévia
     (usado pelo laboratório de formatos)
     ----------------------------------------------------- */
  function createSwitcher(root, opts) {
    var chips = root.querySelectorAll(opts.chipSelector);
    var panels = root.querySelectorAll(opts.panelSelector);
    if (!chips.length || !panels.length) return null;

    var current = 0;
    var timer = null;

    function activate(index) {
      var chip = chips[index];
      if (!chip) return;
      current = index;
      var key = chip.getAttribute(opts.chipKeyAttr);

      chips.forEach(function (c) {
        c.setAttribute("aria-pressed", "false");
      });
      chip.setAttribute("aria-pressed", "true");

      panels.forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute(opts.panelKeyAttr) === key);
      });
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      if (prefersReducedMotion || chips.length < 2 || !opts.autoplayDelay) return;
      stop();
      timer = setInterval(function () {
        activate((current + 1) % chips.length);
      }, opts.autoplayDelay);
    }

    chips.forEach(function (chip, index) {
      chip.addEventListener("mouseenter", function () {
        stop();
        activate(index);
      });
      chip.addEventListener("focus", function () {
        stop();
        activate(index);
      });
      chip.addEventListener("click", function () {
        stop();
        activate(index);
      });
    });

    activate(0);
    start();
    root.addEventListener("mouseleave", start);

    return { activate: activate, stop: stop, start: start };
  }

  /* -----------------------------------------------------
     Hero: switcher de serviços (troca tema + paralaxe)
     ----------------------------------------------------- */
  function initHeroSwitcher() {
    var hero = mainEl.querySelector(".hero");
    if (!hero) return;

    var aurora = hero.querySelector(".hero-aurora");
    var buttons = hero.querySelectorAll(".service-tile");
    var current = 0;

    function activate(index) {
      var btn = buttons[index];
      if (!btn) return;
      current = index;

      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", "false");
      });
      btn.setAttribute("aria-pressed", "true");
    }

    buttons.forEach(function (btn, index) {
      btn.addEventListener("mouseenter", function () {
        stopAutoplay();
        activate(index);
      });
      btn.addEventListener("focus", function () {
        stopAutoplay();
        activate(index);
      });
      btn.addEventListener("click", function () {
        stopAutoplay();
        activate(index);
      });
    });

    function stopAutoplay() {
      if (heroAutoplayTimer) {
        clearInterval(heroAutoplayTimer);
        heroAutoplayTimer = null;
      }
    }

    function startAutoplay() {
      if (prefersReducedMotion || buttons.length < 2) return;
      stopAutoplay();
      heroAutoplayTimer = setInterval(function () {
        activate((current + 1) % buttons.length);
      }, 4200);
    }

    activate(0);
    startAutoplay();

    hero.addEventListener("mouseleave", startAutoplay);

    /* paralaxe do fundo (auroras): segue o cursor e reage ao scroll */
    if (aurora && !prefersReducedMotion) {
      var px = 0;
      var py = 0;
      var tx = 0;
      var ty = 0;
      var scrollShift = 0;

      if (window.matchMedia("(pointer: fine)").matches) {
        hero.addEventListener("mousemove", function (e) {
          var rect = hero.getBoundingClientRect();
          px = (e.clientX - rect.left) / rect.width - 0.5;
          py = (e.clientY - rect.top) / rect.height - 0.5;
        });
      }

      window.addEventListener(
        "scroll",
        function () {
          scrollShift = window.scrollY * 0.08;
        },
        { passive: true }
      );

      (function parallaxLoop() {
        tx += (px - tx) * 0.04;
        ty += (py - ty) * 0.04;
        aurora.style.transform = "translate(" + tx * 30 + "px, " + (ty * 20 + scrollShift) + "px)";
        requestAnimationFrame(parallaxLoop);
      })();
    }
  }

  /* -----------------------------------------------------
     Laboratório de formatos — chip + prévia
     ----------------------------------------------------- */
  function initFormatLab() {
    var lab = mainEl.querySelector(".format-lab");
    if (!lab) return;
    createSwitcher(lab, {
      chipSelector: ".format-chip",
      panelSelector: ".format-preview-panel",
      chipKeyAttr: "data-format",
      panelKeyAttr: "data-panel",
      autoplayDelay: 3200,
    });
  }

  /* -----------------------------------------------------
     Efeitos de scroll: profundidade 3D
     Cards e elementos decorativos reagem à posição de scroll
     (tilt sutil em rotateX + leve deslocamento de paralaxe).
     ----------------------------------------------------- */
  function initScrollFX() {
    if (prefersReducedMotion) return;

    var tiltItems = Array.prototype.slice.call(mainEl.querySelectorAll("[data-tilt]"));
    var driftItems = Array.prototype.slice.call(mainEl.querySelectorAll("[data-parallax]"));
    if (!tiltItems.length && !driftItems.length) return;

    var ticking = false;

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function update() {
      var vh = window.innerHeight;
      var vCenter = vh / 2;

      tiltItems.forEach(function (el) {
        var maxDeg = parseFloat(el.dataset.tilt) || 5;
        var rect = el.getBoundingClientRect();
        var progress = clamp((vCenter - (rect.top + rect.height / 2)) / vh, -1, 1);
        el.style.transform = "perspective(1400px) rotateX(" + (-progress * maxDeg).toFixed(2) + "deg)";
      });

      driftItems.forEach(function (el) {
        var speed = parseFloat(el.dataset.parallax) || 0.08;
        var rect = el.getBoundingClientRect();
        var offset = (rect.top + rect.height / 2 - vCenter) * speed;
        el.style.transform = "translate3d(0, " + offset.toFixed(1) + "px, 0)";
      });

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  /* -----------------------------------------------------
     Mascote: astronauta que desce a página com o scroll
     ----------------------------------------------------- */
  function initAstronaut() {
    var wrap = document.getElementById("astroWrap");
    if (!wrap) return;

    var docEl = document.documentElement;
    var ticking = false;
    var bounceTimer = null;

    var ZIGZAG_CYCLES = 5;
    var ZIGZAG_AMPLITUDE = 30;

    function update() {
      var maxScroll = docEl.scrollHeight - window.innerHeight;
      var progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      var vh = window.innerHeight;
      var topMargin = 100;
      var bottomMargin = 110;
      var travel = Math.max(0, vh - topMargin - bottomMargin);
      var y = topMargin + progress * travel;
      var x = Math.sin(progress * ZIGZAG_CYCLES * Math.PI * 2) * ZIGZAG_AMPLITUDE;
      wrap.style.transform = "translate(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px)";
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    function bounce() {
      wrap.classList.remove("is-bouncing");
      void wrap.offsetWidth;
      wrap.classList.add("is-bouncing");
      window.clearTimeout(bounceTimer);
      bounceTimer = window.setTimeout(function () {
        wrap.classList.remove("is-bouncing");
      }, 800);
    }

    wrap.addEventListener("click", bounce);
    wrap.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        bounce();
      }
    });
  }

  /* -----------------------------------------------------
     Globo Brasil ⇄ Europa (Quem somos)
     Meridianos em SVG "giram" conforme a posição de scroll,
     truque clássico de achatar/expandir elipses pra simular
     uma esfera girando sem precisar de WebGL.
     ----------------------------------------------------- */
  function initGlobe() {
    var wrap = mainEl.querySelector(".globe-wrap");
    if (!wrap || prefersReducedMotion) return;

    var meridians = Array.prototype.slice.call(wrap.querySelectorAll(".globe-meridian"));
    if (!meridians.length) return;

    var R = 88;
    var ticking = false;

    function update() {
      var rect = wrap.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = 1 - Math.max(0, Math.min(1, (rect.top + rect.height / 2) / vh));
      var t = progress * Math.PI * 2.4;

      meridians.forEach(function (el) {
        var phase = parseFloat(el.dataset.phase) || 0;
        var c = Math.cos(phase + t);
        var rx = Math.max(2, Math.abs(R * c));
        el.setAttribute("rx", rx.toFixed(1));
        el.style.opacity = c > 0 ? (0.25 + 0.45 * c).toFixed(2) : (0.08 + 0.12 * (1 + c)).toFixed(2);
      });

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  /* -----------------------------------------------------
     Barra de progresso de scroll
     ----------------------------------------------------- */
  function initScrollProgress() {
    var fill = document.querySelector(".scroll-progress-fill");
    if (!fill) return;

    var docEl = document.documentElement;
    var ticking = false;

    function update() {
      var max = docEl.scrollHeight - window.innerHeight;
      var progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      fill.style.width = (progress * 100).toFixed(2) + "%";
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  /* -----------------------------------------------------
     Cards interativos: brilho + inclinação 3D seguindo o
     cursor (pillar, role, founder, empty-slot e service-tile,
     este último só com o brilho pra não brigar com seu
     próprio translateY de hover).
     ----------------------------------------------------- */
  function initInteractiveCards() {
    if (prefersReducedMotion || !window.matchMedia("(pointer: fine)").matches) return;

    var cards = Array.prototype.slice.call(
      mainEl.querySelectorAll(".pillar-card, .role-card, .founder-card, .empty-slot, .service-tile")
    );
    if (!cards.length) return;

    cards.forEach(function (card) {
      var hasTilt = !card.classList.contains("service-tile");
      var tiltMax = 7;
      var raf = null;

      function onMove(e) {
        if (raf) return;
        raf = window.requestAnimationFrame(function () {
          var rect = card.getBoundingClientRect();
          var px = (e.clientX - rect.left) / rect.width;
          var py = (e.clientY - rect.top) / rect.height;
          card.style.setProperty("--spot-x", (px * 100).toFixed(1) + "%");
          card.style.setProperty("--spot-y", (py * 100).toFixed(1) + "%");
          if (hasTilt) {
            card.style.setProperty("--tilt-x", ((0.5 - py) * tiltMax * 2).toFixed(2) + "deg");
            card.style.setProperty("--tilt-y", ((px - 0.5) * tiltMax * 2).toFixed(2) + "deg");
          }
          raf = null;
        });
      }

      card.addEventListener("mouseenter", function () {
        card.classList.add("is-interactive-hover");
        card.addEventListener("mousemove", onMove);
      });
      card.addEventListener("mouseleave", function () {
        card.removeEventListener("mousemove", onMove);
        card.classList.remove("is-interactive-hover");
        if (hasTilt) {
          card.style.setProperty("--tilt-x", "0deg");
          card.style.setProperty("--tilt-y", "0deg");
        }
      });
    });
  }

  /* -----------------------------------------------------
     Botões magnéticos: CTAs puxam sutilmente na direção
     do cursor enquanto o mouse estiver sobre eles.
     ----------------------------------------------------- */
  function initMagneticButtons() {
    if (prefersReducedMotion || !window.matchMedia("(pointer: fine)").matches) return;

    var targets = Array.prototype.slice.call(document.querySelectorAll(".btn, .nav-cta"));
    if (!targets.length) return;

    var MAX_PULL = 10;

    targets.forEach(function (el) {
      var raf = null;

      function onMove(e) {
        if (raf) return;
        raf = window.requestAnimationFrame(function () {
          var rect = el.getBoundingClientRect();
          var px = Math.max(-1, Math.min(1, (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)));
          var py = Math.max(-1, Math.min(1, (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)));
          el.style.transform = "translate(" + (px * MAX_PULL).toFixed(1) + "px, " + (py * MAX_PULL).toFixed(1) + "px)";
          raf = null;
        });
      }

      el.addEventListener("mouseenter", function () {
        el.addEventListener("mousemove", onMove);
      });
      el.addEventListener("mouseleave", function () {
        el.removeEventListener("mousemove", onMove);
        el.style.transform = "";
      });
    });
  }

  /* -----------------------------------------------------
     Formulário de contato (Netlify Forms via fetch)
     ----------------------------------------------------- */
  function initContactForm() {
    var form = mainEl.querySelector("#contactForm");
    if (!form) return;
    var success = mainEl.querySelector("#formSuccess");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var body = new URLSearchParams();
      data.forEach(function (value, key) {
        body.append(key, value);
      });

      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      })
        .then(function () {
          form.reset();
          form.hidden = true;
          if (success) success.classList.add("is-visible");
        })
        .catch(function () {
          form.submit();
        });
    });
  }

  /* -----------------------------------------------------
     Navegação por seção: nav superior + dots laterais
     + atalhos de teclado, pensados pra apresentar ao vivo
     ----------------------------------------------------- */
  var SECTION_META = {
    "quem-somos": { tone: "var(--color-surface)", num: "01", label: "Quem somos" },
    servicos: { tone: "var(--color-surface-raised)", num: "02", label: "O que fazemos" },
    metodo: { tone: "var(--color-surface)", num: "03", label: "Como trabalhamos" },
    cases: { tone: "var(--color-surface-raised)", num: "04", label: "Cases" },
    time: { tone: "var(--color-surface)", num: "05", label: "Time" },
    contato: { tone: "var(--color-surface-wine)", num: "06", label: "Contato" },
  };

  function initSectionNav() {
    var sections = Array.prototype.slice.call(mainEl.querySelectorAll(".story-section[id]"));
    if (!sections.length) return;

    var trackedLinks = Array.prototype.slice.call(document.querySelectorAll("[data-section]"));
    var chapterMarker = document.querySelector(".chapter-marker");
    var chapterNumEl = chapterMarker && chapterMarker.querySelector(".chapter-marker-num");
    var chapterLabelEl = chapterMarker && chapterMarker.querySelector(".chapter-marker-label");
    var currentChapterId = null;

    function swapChapter(meta) {
      if (prefersReducedMotion) {
        chapterNumEl.textContent = meta.num;
        chapterLabelEl.textContent = meta.label;
        return;
      }
      chapterMarker.classList.add("is-out");
      window.setTimeout(function () {
        chapterNumEl.textContent = meta.num;
        chapterLabelEl.textContent = meta.label;
        chapterMarker.classList.remove("is-out");
        chapterMarker.classList.add("is-entering");
        void chapterMarker.offsetWidth;
        chapterMarker.classList.remove("is-entering");
      }, 260);
    }

    function setActive(id) {
      trackedLinks.forEach(function (link) {
        if (link.dataset.section === id) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });

      var meta = SECTION_META[id];
      body.style.backgroundColor = meta ? meta.tone : "";

      if (chapterMarker) {
        if (meta) {
          chapterMarker.classList.add("is-visible");
          if (id !== currentChapterId) {
            swapChapter(meta);
            currentChapterId = id;
          }
        } else {
          chapterMarker.classList.remove("is-visible");
          currentChapterId = null;
        }
      }
    }

    if (trackedLinks.length && "IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) setActive(entry.target.id);
          });
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
      );
      sections.forEach(function (s) {
        observer.observe(s);
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;
      var activeLink = document.querySelector(".section-nav a[aria-current='true']");
      var idx = activeLink ? sections.findIndex(function (s) { return s.id === activeLink.dataset.section; }) : 0;
      if (idx < 0) idx = 0;

      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        var next = sections[Math.min(idx + 1, sections.length - 1)];
        next.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        var prev = sections[Math.max(idx - 1, 0)];
        prev.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
      }
    });
  }

  /* -----------------------------------------------------
     Boot
     ----------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    initCursor();
    initNavScroll();
    initMobileMenu();
    initReveal();
    initHeroSwitcher();
    initFormatLab();
    initContactForm();
    initSectionNav();
    initScrollFX();
    initGlobe();
    initAstronaut();
    initScrollProgress();
    initInteractiveCards();
    initMagneticButtons();

    window.requestAnimationFrame(function () {
      body.classList.add("is-loaded");
    });
  });
})();
