/* =========================================================
   LAXA — intro3d.js
   Portal de entrada: duas mãos wireframe (Three.js) que
   rastreiam o cursor e se encontram no botão de play central.
   GSAP cuida da entrada e da transição de saída.
   ========================================================= */
import * as THREE from "./vendor/three.module.min.js";

(function () {
  "use strict";

  var gate = document.getElementById("introGate");
  if (!gate) return;

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    gate.remove();
    return;
  }

  var canvas = document.getElementById("introCanvas");
  var playBtn = document.getElementById("introPlay");
  var overlayEl = gate.querySelector(".intro-gate-overlay");
  if (!canvas || !playBtn) {
    gate.remove();
    return;
  }

  var gsap = window.gsap;
  var body = document.body;
  var isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (e) {
    gate.remove();
    return;
  }

  body.classList.add("intro-locked");

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 9);

  function sizeRenderer() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  sizeRenderer();

  /* -----------------------------------------------------
     Partículas de fundo (espaço profundo, sutil)
     ----------------------------------------------------- */
  var starCount = window.innerWidth < 700 ? 200 : 420;
  var starGeo = new THREE.BufferGeometry();
  var starPos = new Float32Array(starCount * 3);
  for (var i = 0; i < starCount; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 40;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 24;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  var starMat = new THREE.PointsMaterial({ color: 0x5a5a5a, size: 0.05, transparent: true, opacity: 0.6 });
  var stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  /* -----------------------------------------------------
     Mão wireframe (geometria procedural, sem asset externo)
     ----------------------------------------------------- */
  function buildHand(color) {
    var group = new THREE.Group();
    var mat = new THREE.MeshBasicMaterial({ color: color, wireframe: true });

    var palm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.5, 3, 2, 1), mat);
    group.add(palm);

    var finger = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 2.2, 8, 2), mat);
    finger.rotation.z = Math.PI / 2;
    finger.position.set(1.85, 0.1, 0);
    group.add(finger);

    [
      { x: -0.5, y: 0.75, s: 0.75 },
      { x: -0.1, y: 0.82, s: 0.72 },
      { x: 0.3, y: 0.78, s: 0.66 },
    ].forEach(function (p) {
      var f = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, p.s, 4, 8), mat);
      f.position.set(p.x, p.y, 0);
      f.rotation.z = 0.15;
      group.add(f);
    });

    var thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.9, 4, 8), mat);
    thumb.position.set(-0.65, -0.55, 0.25);
    thumb.rotation.z = Math.PI / 2.6;
    group.add(thumb);

    return group;
  }

  var rightHand = buildHand(0xc4272c); /* --color-brand-red */
  var leftHand = buildHand(0xf1dbd0); /* --color-accent-sand */
  leftHand.scale.x = -1; /* mesma peça, espelhada de verdade */
  scene.add(rightHand);
  scene.add(leftHand);

  var REST_RIGHT = { x: 2.1, y: -0.6, z: 0 };
  var REST_LEFT = { x: -2.1, y: 0.6, z: 0 };
  var START_RIGHT = { x: 9, y: -4, z: -2 };
  var START_LEFT = { x: -9, y: 4, z: -2 };

  rightHand.position.set(START_RIGHT.x, START_RIGHT.y, START_RIGHT.z);
  rightHand.rotation.z = -0.35;
  leftHand.position.set(START_LEFT.x, START_LEFT.y, START_LEFT.z);
  leftHand.rotation.z = 0.35;

  /* -----------------------------------------------------
     Rastreamento de cursor (mão direita segue o mouse,
     mão esquerda espelha com atraso — sensação de gravidade)
     ----------------------------------------------------- */
  var introSettled = false;
  var pointerActive = false;
  var target = { x: REST_RIGHT.x, y: REST_RIGHT.y };

  function onPointerMove(e) {
    pointerActive = true;
    var nx = (e.clientX / window.innerWidth) * 2 - 1;
    var ny = -(e.clientY / window.innerHeight) * 2 + 1;
    target.x = REST_RIGHT.x * 0.4 + nx * 2.6;
    target.y = REST_RIGHT.y * 0.4 + ny * 1.6;
  }

  if (!isCoarsePointer) {
    window.addEventListener("mousemove", onPointerMove, { passive: true });
  }

  /* -----------------------------------------------------
     Entrada (GSAP)
     ----------------------------------------------------- */
  if (gsap) {
    gsap.to(rightHand.position, {
      x: REST_RIGHT.x,
      y: REST_RIGHT.y,
      z: REST_RIGHT.z,
      duration: 1.7,
      ease: "power3.out",
      delay: 0.25,
    });
    gsap.to(rightHand.rotation, { z: -0.12, duration: 1.7, ease: "power3.out", delay: 0.25 });
    gsap.to(leftHand.position, {
      x: REST_LEFT.x,
      y: REST_LEFT.y,
      z: REST_LEFT.z,
      duration: 1.7,
      ease: "power3.out",
      delay: 0.4,
      onComplete: function () {
        introSettled = true;
      },
    });
    gsap.to(leftHand.rotation, { z: 0.12, duration: 1.7, ease: "power3.out", delay: 0.4 });
    if (overlayEl) gsap.to(overlayEl, { opacity: 1, duration: 0.6, delay: 1.5 });
  } else {
    rightHand.position.set(REST_RIGHT.x, REST_RIGHT.y, REST_RIGHT.z);
    leftHand.position.set(REST_LEFT.x, REST_LEFT.y, REST_LEFT.z);
    introSettled = true;
    if (overlayEl) overlayEl.style.opacity = "1";
  }

  /* -----------------------------------------------------
     Loop de render
     ----------------------------------------------------- */
  var clock = new THREE.Clock();
  var rafId = null;
  var dismissed = false;

  function animate() {
    rafId = requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    if (introSettled) {
      if (!pointerActive) {
        target.x = REST_RIGHT.x + Math.sin(t * 0.6) * 0.5;
        target.y = REST_RIGHT.y + Math.cos(t * 0.5) * 0.3;
      }
      rightHand.position.x += (target.x - rightHand.position.x) * 0.08;
      rightHand.position.y += (target.y - rightHand.position.y) * 0.08;
      var wantRotZ = -0.12 - (target.x - REST_RIGHT.x) * 0.05;
      rightHand.rotation.z += (wantRotZ - rightHand.rotation.z) * 0.08;

      var mirrorX = -rightHand.position.x;
      var mirrorY = rightHand.position.y;
      leftHand.position.x += (mirrorX - leftHand.position.x) * 0.045;
      leftHand.position.y += (mirrorY - leftHand.position.y) * 0.045;
      var wantLeftRotZ = 0.12 + (rightHand.position.x - REST_RIGHT.x) * 0.05;
      leftHand.rotation.z += (wantLeftRotZ - leftHand.rotation.z) * 0.045;
    }

    stars.rotation.y = t * 0.01;

    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    sizeRenderer();
  }
  window.addEventListener("resize", onResize, { passive: true });

  /* -----------------------------------------------------
     Saída: clique no play revela o site
     ----------------------------------------------------- */
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    window.removeEventListener("mousemove", onPointerMove);
    window.removeEventListener("resize", onResize);

    function finish() {
      if (rafId) cancelAnimationFrame(rafId);
      renderer.dispose();
      body.classList.remove("intro-locked");
      gate.remove();
    }

    if (gsap) {
      var tl = gsap.timeline({ onComplete: finish });
      if (overlayEl) tl.to(overlayEl, { opacity: 0, duration: 0.35, ease: "power2.in" }, 0);
      tl.to(canvas, { opacity: 0, scale: 1.06, duration: 0.7, ease: "power2.inOut" }, 0);
    } else {
      finish();
    }
  }

  playBtn.addEventListener("click", dismiss);
  window.setTimeout(function () {
    playBtn.focus();
  }, 1900);
  window.setTimeout(dismiss, 9000);
})();
