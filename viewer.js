// Generic orgolabs 3D viewer. A lab defines window.VIEWERS = [{ id, key }, ...]
// where `id` is the <div class="viewer" id="..."> and `key` is a key in window.STRUCTURES.
(function () {
  "use strict";

  var STYLE_SPECS = {
    stick:     { stick: { radius: 0.14 } },
    ballstick: { stick: { radius: 0.12 }, sphere: { scale: 0.25 } },
    sphere:    { sphere: {} }
  };
  var state = { style: "ballstick", spin: false, showH: true, highlightO: false };
  var viewers = [];

  function ready() {
    if (typeof window.$3Dmol === "undefined" || !window.STRUCTURES || !window.VIEWERS) {
      var fb = document.getElementById("viewer-fallback");
      if (fb) fb.hidden = false;
      return;
    }
    window.VIEWERS.forEach(function (m) {
      var el = document.getElementById(m.id);
      if (!el || !window.STRUCTURES[m.key]) return;
      // Consistent dark "instrument" backdrop in both themes so CPK colors
      // (incl. white H) always read — a white paper background would hide them.
      var v = window.$3Dmol.createViewer(el, { backgroundColor: "0x0d1512" });
      v.addModel(window.STRUCTURES[m.key], "sdf");
      viewers.push(v);
      applyStyle(v); v.zoomTo(); v.render();
    });
    window.addEventListener("resize", debounce(function () {
      viewers.forEach(function (v) { v.resize(); v.render(); });
    }, 150));
    wireControls();
  }

  function applyStyle(v) {
    v.setStyle({}, STYLE_SPECS[state.style]);
    if (!state.showH) v.setStyle({ elem: "H" }, {});
    if (state.highlightO) {
      var hi = { sphere: { scale: state.style === "sphere" ? 1.0 : 0.5, color: "magenta" } };
      if (state.style !== "sphere") hi.stick = { radius: 0.14 };
      v.setStyle({ elem: "O" }, hi);
    }
  }
  function renderAll() { viewers.forEach(function (v) { applyStyle(v); v.render(); }); }

  function wireControls() {
    document.querySelectorAll(".btn[data-style]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.style = btn.getAttribute("data-style");
        document.querySelectorAll(".btn[data-style]").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
        renderAll();
      });
    });
    bindToggle("spinBtn", function (on) { state.spin = on; viewers.forEach(function (v) { v.spin(on ? "y" : false); }); });
    bindToggle("hBtn", function (on) { state.showH = on; renderAll(); });
    bindToggle("ohBtn", function (on) { state.highlightO = on; renderAll(); });
  }
  function bindToggle(id, fn) {
    var btn = document.getElementById(id); if (!btn) return;
    btn.addEventListener("click", function () {
      var on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", String(on)); fn(on);
    });
  }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
