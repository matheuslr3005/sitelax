/* =========================================================
   LAXA — hero3d.js (experimental)
   Cena 3D real (Three.js/WebGL) pro fundo do hero: o logo
   LAX com um anel de luz, câmera orbitando devagar e poeira
   ambiente. Entra no lugar do fundo de auroras em CSS quando
   o navegador suporta WebGL e o usuário não pediu movimento
   reduzido. Fallback automático pras auroras em qualquer
   outro caso (mobile, sem WebGL, reduced-motion).
   ========================================================= */
import * as THREE from "./vendor/three.module.min.js";

(function () {
  "use strict";

  function supportsWebGL() {
    try {
      var canvas = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
    } catch (e) {
      return false;
    }
  }

  function init() {
    var hero = document.querySelector(".hero");
    var canvas = document.getElementById("heroWebgl");
    if (!hero || !canvas) return;

    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var isNarrow = window.innerWidth < 640;
    if (prefersReducedMotion || isNarrow || !supportsWebGL()) return;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    scene.add(new THREE.AmbientLight(0x404040, 0.6));
    var keyLight = new THREE.PointLight(0xffffff, 1.3, 20);
    keyLight.position.set(2, 3, 4);
    scene.add(keyLight);
    var rimLight = new THREE.PointLight(0xc4272c, 2, 20);
    rimLight.position.set(-3, -1, -2);
    scene.add(rimLight);

    function makeGlowTexture() {
      var size = 256;
      var cnv = document.createElement("canvas");
      cnv.width = cnv.height = size;
      var ctx = cnv.getContext("2d");
      var grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.05, size / 2, size / 2, size * 0.5);
      grad.addColorStop(0, "rgba(245,243,241,0.5)");
      grad.addColorStop(0.4, "rgba(196,39,44,0.14)");
      grad.addColorStop(1, "rgba(196,39,44,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(cnv);
    }

    /* grupo com logo + anel + brilho, deslocado pra cima pra
       ficar centralizado atrás do título (não do bloco inteiro
       de texto, que é puxado pra baixo pelos tiles de serviço) */
    var heroGroup = new THREE.Group();
    heroGroup.position.y = 0.6;
    scene.add(heroGroup);

    var glowSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture(),
        color: 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    glowSprite.scale.set(1.8, 1.8, 1);
    glowSprite.position.set(0, 0, -0.3);
    glowSprite.material.opacity = 0.65;
    heroGroup.add(glowSprite);

    var ring = new THREE.Mesh(
      new THREE.RingGeometry(1.05, 1.08, 64),
      new THREE.MeshBasicMaterial({ color: 0xf5f3f1, transparent: true, opacity: 0.42, side: THREE.DoubleSide })
    );
    ring.position.set(0, 0, -0.25);
    heroGroup.add(ring);

    var ringGlow = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 1.14, 64),
      new THREE.MeshBasicMaterial({
        color: 0xf5f3f1,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    ringGlow.position.set(0, 0, -0.26);
    heroGroup.add(ringGlow);

    var loader = new THREE.TextureLoader();
    var logoTex = loader.load("assets/img/logo/lax-color.png");
    if ("colorSpace" in logoTex) logoTex.colorSpace = THREE.SRGBColorSpace;
    var aspect = 1569 / 789;
    var logoW = 1.9;
    var logoGeo = new THREE.PlaneGeometry(logoW, logoW / aspect);
    var logoMesh = new THREE.Mesh(
      logoGeo,
      new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, opacity: 0.8 })
    );
    heroGroup.add(logoMesh);

    var dustCount = 90;
    var dustGeo = new THREE.BufferGeometry();
    var dustPos = new Float32Array(dustCount * 3);
    for (var i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 10;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    var dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ color: 0xf5f3f1, size: 0.015, transparent: true, opacity: 0.3 })
    );
    scene.add(dust);

    var mouseX = 0;
    var mouseY = 0;
    if (window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener(
        "mousemove",
        function (e) {
          mouseX = e.clientX / window.innerWidth - 0.5;
          mouseY = e.clientY / window.innerHeight - 0.5;
        },
        { passive: true }
      );
    }

    function resize() {
      var rect = hero.getBoundingClientRect();
      var w = rect.width || window.innerWidth;
      var h = rect.height || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    var running = false;
    var clock = new THREE.Clock();

    function tick() {
      if (!running) return;
      requestAnimationFrame(tick);
      var t = clock.getElapsedTime();

      var radius = 4.6;
      var angle = Math.sin(t * 0.16) * 0.5;
      camera.position.x = Math.sin(angle) * radius + mouseX * 0.35;
      camera.position.z = Math.cos(angle) * radius;
      camera.position.y = 0.1 + Math.sin(t * 0.28) * 0.07 - mouseY * 0.25;
      camera.lookAt(0, 0, 0);

      logoMesh.rotation.y = Math.sin(t * 0.22) * 0.07;
      ring.rotation.z = t * 0.045;
      glowSprite.material.opacity = 0.6 + Math.sin(t * 1.1) * 0.08;
      dust.rotation.y = t * 0.018;

      renderer.render(scene, camera);
    }

    function start() {
      if (running) return;
      running = true;
      clock.start();
      tick();
    }
    function stop() {
      running = false;
    }

    /* só roda enquanto o hero estiver visível, pra não gastar
       bateria/CPU à toa depois que o usuário rola a página */
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) start();
            else stop();
          });
        },
        { threshold: 0.05 }
      );
      observer.observe(hero);
    } else {
      start();
    }

    hero.classList.add("has-hero-webgl");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
