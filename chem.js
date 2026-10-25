// Renders chemistry notation with KaTeX + mhchem.
// Author formulas/equations as <span class="chem">\ce{C10H16O}</span> (or any KaTeX in data-tex="...").
// This self-loads KaTeX + the mhchem extension from CDN, then renders every .chem element in place,
// so a lab only needs one <script src=".../shared/chem.js"></script> — no build step.
(function () {
  "use strict";
  var V = "0.16.9";
  var CDN = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/" + V;

  function injectCss() {
    if (document.querySelector('link[data-katex]')) return;
    var l = document.createElement("link");
    l.rel = "stylesheet"; l.href = CDN + "/katex.min.css"; l.setAttribute("data-katex", "");
    l.crossOrigin = "anonymous"; l.referrerPolicy = "no-referrer";
    document.head.appendChild(l);
  }
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src; s.crossOrigin = "anonymous"; s.referrerPolicy = "no-referrer";
    s.onload = cb; s.onerror = cb;
    document.head.appendChild(s);
  }
  function render() {
    if (!window.katex) return;
    document.querySelectorAll(".chem").forEach(function (el) {
      if (el.getAttribute("data-chem-done")) return;
      var tex = el.getAttribute("data-tex") || el.textContent;
      try {
        window.katex.render(tex, el, { throwOnError: false, displayMode: false });
        el.setAttribute("data-chem-done", "1");
      } catch (e) { /* leave original text on failure */ }
    });
  }
  function start() {
    if (!document.querySelector(".chem")) return; // nothing to render
    injectCss();
    loadScript(CDN + "/katex.min.js", function () {
      loadScript(CDN + "/contrib/mhchem.min.js", render);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
