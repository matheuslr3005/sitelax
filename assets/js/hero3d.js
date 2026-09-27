/* =========================================================
   LAXA — hero3d.js
   Flecha da marca em 3D (metal vermelho), girando/flutuando
   sozinha no hero. Usa Three.js (carregado via CDN antes
   deste arquivo). Exposto como window.LaxHero3D { mount, unmount }
   pra sobreviver às trocas de #main feitas pelo router do main.js.
   ========================================================= */
window.LaxHero3D = (function () {
  "use strict";

  var state = null;

  function buildArrowShape(THREE) {
    var theta = THREE.MathUtils.degToRad(58);
    var dx = Math.cos(theta);
    var dy = Math.sin(theta);
    var px = -dy;
    var py = dx;

    var shaftHalf = 0.16;
    var headHalf = 0.42;
    var shaftLen = 1.7;
    var headLen = 0.75;

    function pt(alongD, alongP) {
      return new THREE.Vector2(dx * alongD + px * alongP, dy * alongD + py * alongP);
    }

    var p1 = pt(0, -shaftHalf);
    var p6 = pt(shaftLen, -shaftHalf);
    var p5 = pt(shaftLen, -headHalf);
    var tip = pt(shaftLen + headLen, 0);
    var p4 = pt(shaftLen, headHalf);
    var p3 = pt(shaftLen, shaftHalf);
    var p2 = pt(0, shaftHalf);

    var shape = new THREE.Shape();
    shape.moveTo(p1.x, p1.y);
    shape.lineTo(p6.x, p6.y);
    shape.lineTo(p5.x, p5.y);
    shape.lineTo(tip.x, tip.y);
    shape.lineTo(p4.x, p4.y);
    shape.lineTo(p3.x, p3.y);
    shape.lineTo(p2.x, p2.y);
    shape.closePath();
    return shape;
  }

  function mount() {
    unmount();

    var THREE = window.THREE;
    var container = document.getElementById("heroObject");
    var canvas = document.getElementById("heroCanvas");
    if (!THREE || !container || !canvas) return;

    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var mq = window.matchMedia("(min-width: 901px)");

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10);
    camera.position.set(0, 0, 4.2);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var geometry = new THREE.ExtrudeGeometry(buildArrowShape(THREE), {
      depth: 0.34,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.045,
      bevelSegments: 4,
      curveSegments: 8,
    });
    geometry.center();

    var material = new THREE.MeshStandardMaterial({
      color: 0xc4272c,
      metalness: 0.82,
      roughness: 0.3,
      emissive: 0x1a0303,
      emissiveIntensity: 0.25,
    });

    var mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = THREE.MathUtils.degToRad(-18);
    mesh.rotation.z = THREE.MathUtils.degToRad(-4);
    scene.add(mesh);

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));

    var key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(2.5, 3, 3);
    scene.add(key);

    var fill = new THREE.PointLight(0xf1dbd0, 0.7, 10);
    fill.position.set(-3, -1.2, 2);
    scene.add(fill);

    var rim = new THREE.PointLight(0xffffff, 0.5, 10);
    rim.position.set(0, 2, -3);
    scene.add(rim);

    var clock = new THREE.Clock();
    var rafId = null;
    var running = false;

    function resize() {
      var w = container.clientWidth || 300;
      var h = container.clientHeight || 300;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    function renderStatic() {
      resize();
      mesh.rotation.y = THREE.MathUtils.degToRad(35);
      renderer.render(scene, camera);
    }

    function animate() {
      if (!running) return;
      var t = clock.getElapsedTime();
      mesh.rotation.y = t * 0.35;
      mesh.position.y = Math.sin(t * 0.6) * 0.12;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    }

    function start() {
      if (prefersReducedMotion) {
        renderStatic();
        return;
      }
      if (running) return;
      running = true;
      resize();
      clock.start();
      animate();
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    function evaluate() {
      if (mq.matches) {
        start();
      } else {
        stop();
      }
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!mq.matches) return;
          if (entry.isIntersecting) {
            start();
          } else {
            stop();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    function onMqChange() {
      evaluate();
    }
    function onResize() {
      if (mq.matches) resize();
    }

    if (mq.addEventListener) {
      mq.addEventListener("change", onMqChange);
    } else if (mq.addListener) {
      mq.addListener(onMqChange);
    }
    window.addEventListener("resize", onResize);

    state = {
      renderer: renderer,
      geometry: geometry,
      material: material,
      observer: observer,
      mq: mq,
      onMqChange: onMqChange,
      onResize: onResize,
      stop: stop,
    };

    evaluate();
  }

  function unmount() {
    if (!state) return;
    state.stop();
    if (state.observer) state.observer.disconnect();
    if (state.mq) {
      if (state.mq.removeEventListener) state.mq.removeEventListener("change", state.onMqChange);
      else if (state.mq.removeListener) state.mq.removeListener(state.onMqChange);
    }
    window.removeEventListener("resize", state.onResize);
    if (state.geometry) state.geometry.dispose();
    if (state.material) state.material.dispose();
    if (state.renderer) state.renderer.dispose();
    state = null;
  }

  return { mount: mount, unmount: unmount };
})();
