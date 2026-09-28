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

      var theme = btn.dataset.theme === "wine" ? "wine" : "dark";
      hero.classList.toggle("theme-wine", theme === "wine");
      hero.classList.toggle("theme-dark", theme !== "wine");
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

    /* leve paralaxe do fundo (auroras) conforme o cursor */
    if (aurora && window.matchMedia("(pointer: fine)").matches && !prefersReducedMotion) {
      var px = 0;
      var py = 0;
      var tx = 0;
      var ty = 0;
      hero.addEventListener("mousemove", function (e) {
        var rect = hero.getBoundingClientRect();
        px = (e.clientX - rect.left) / rect.width - 0.5;
        py = (e.clientY - rect.top) / rect.height - 0.5;
      });
      (function parallaxLoop() {
        tx += (px - tx) * 0.04;
        ty += (py - ty) * 0.04;
        aurora.style.transform = "translate(" + tx * 30 + "px, " + ty * 20 + "px)";
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
  function initSectionNav() {
    var sections = Array.prototype.slice.call(mainEl.querySelectorAll(".story-section[id]"));
    if (!sections.length) return;

    var trackedLinks = Array.prototype.slice.call(document.querySelectorAll("[data-section]"));

    function setActive(id) {
      trackedLinks.forEach(function (link) {
        if (link.dataset.section === id) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
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

    window.requestAnimationFrame(function () {
      body.classList.add("is-loaded");
    });
  });
})();
