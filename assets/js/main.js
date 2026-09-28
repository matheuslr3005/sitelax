/* =========================================================
   LAXA — main.js
   Cursor custom, transição de página (pjax leve), marquee,
   reveal on scroll, hero service switcher, formulário.
   ========================================================= */
(function () {
  "use strict";

  var body = document.body;
  var curtain = document.getElementById("curtain");
  var mainEl = document.getElementById("main");
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var revealObserver = null;
  var panelObserver = null;
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
     Nav sólida ao rolar (evita colidir com o conteúdo)
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
     Nav active state
     ----------------------------------------------------- */
  function updateNavActive() {
    var page = mainEl.dataset.page;
    document.querySelectorAll(".nav-links a, .mobile-menu a, .nav-cta").forEach(function (link) {
      if (link.dataset.page === page) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
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
     Hero service switcher (home)
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
     Service panels (servicos.html) — invertem cor ao entrar em foco
     ----------------------------------------------------- */
  function initServicePanels() {
    var panels = mainEl.querySelectorAll(".service-panel");
    if (!panels.length) return;
    if (panelObserver) panelObserver.disconnect();

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      panels.forEach(function (p) {
        p.classList.add("is-active");
      });
      return;
    }

    panelObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("is-active", entry.isIntersecting);
        });
      },
      { threshold: 0.45 }
    );
    panels.forEach(function (p) {
      panelObserver.observe(p);
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
     Case de exemplo (trabalhos.html): contador de números
     e barra de trajetória (antes/depois)
     ----------------------------------------------------- */
  function initCaseStats() {
    var statsEl = mainEl.querySelector(".case-stats");
    if (!statsEl) return;
    var values = statsEl.querySelectorAll(".stat-value");
    var animated = false;

    function formatNumber(value, decimals) {
      return value.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }

    function animate() {
      if (animated) return;
      animated = true;

      values.forEach(function (el) {
        var target = parseFloat(el.dataset.countTo);
        var decimals = parseInt(el.dataset.decimals || "0", 10);
        var suffix = el.dataset.suffix || "";
        if (isNaN(target)) return;

        if (prefersReducedMotion) {
          el.textContent = formatNumber(target, decimals) + suffix;
          return;
        }

        var duration = 1400;
        var start = null;

        function step(timestamp) {
          if (start === null) start = timestamp;
          var progress = Math.min((timestamp - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = formatNumber(target * eased, decimals) + suffix;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      animate();
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(statsEl);
  }

  function initTrajectory() {
    var el = mainEl.querySelector(".trajectory");
    if (!el) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      el.classList.add("is-filled");
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            el.classList.add("is-filled");
            observer.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
  }

  /* -----------------------------------------------------
     Inicialização por página
     ----------------------------------------------------- */
  function scrollToTarget(rawUrl) {
    var hash = "";
    try {
      hash = new URL(rawUrl, window.location.origin).hash;
    } catch (e) {
      hash = "";
    }
    var target = hash ? document.querySelector(hash) : null;
    if (target) {
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    } else {
      window.scrollTo(0, 0);
    }
  }

  function initPage(targetUrl) {
    updateNavActive();
    initReveal();
    initHeroSwitcher();
    initServicePanels();
    initCaseStats();
    initTrajectory();
    initContactForm();
    scrollToTarget(targetUrl || window.location.href);
  }

  /* -----------------------------------------------------
     Router leve (troca só o #main, com transição)
     ----------------------------------------------------- */
  var isAnimating = false;

  function isRoutable(link) {
    if (!link || !link.href) return false;
    if (link.origin !== window.location.origin) return false;
    if (link.target && link.target !== "" && link.target !== "_self") return false;
    if (link.hasAttribute("download")) return false;
    if (link.hash && link.pathname === window.location.pathname) return false;
    if (/^(mailto:|tel:)/i.test(link.getAttribute("href") || "")) return false;
    return true;
  }

  function navigateTo(url, push) {
    if (isAnimating) return;
    if (url === window.location.href && push) return;
    isAnimating = true;

    var duration = prefersReducedMotion ? 0 : 500;

    function afterCover() {
      fetch(url, { headers: { "X-Requested-With": "laxa-router" } })
        .then(function (res) {
          if (!res.ok) throw new Error("fetch failed");
          return res.text();
        })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, "text/html");
          var newMain = doc.getElementById("main");
          if (!newMain) throw new Error("no #main in response");

          document.title = doc.title;
          mainEl.innerHTML = newMain.innerHTML;
          mainEl.dataset.page = newMain.dataset.page || "";

          if (push) {
            window.history.pushState({}, "", url);
          }

          initPage(url);
          reveal();
        })
        .catch(function () {
          window.location.href = url;
        });
    }

    function reveal() {
      if (!curtain || prefersReducedMotion) {
        isAnimating = false;
        return;
      }
      curtain.classList.remove("is-covering");
      curtain.classList.add("is-revealing");
      window.setTimeout(function () {
        curtain.classList.remove("is-revealing");
        isAnimating = false;
      }, duration);
    }

    if (!curtain || prefersReducedMotion) {
      afterCover();
      return;
    }

    curtain.classList.add("is-covering");
    window.setTimeout(afterCover, duration);
  }

  function initRouter() {
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var link = e.target.closest("a");
      if (!isRoutable(link)) return;
      e.preventDefault();
      navigateTo(link.href, true);
    });

    window.addEventListener("popstate", function () {
      navigateTo(window.location.href, false);
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
    initRouter();
    initPage();
    window.requestAnimationFrame(function () {
      body.classList.add("is-loaded");
    });
  });
})();
