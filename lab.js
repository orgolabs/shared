// orgolabs lab engine — the single shared template.
// A lab provides window.LAB (config) + content.md (Markdown prose with $\ce{...}$).
// This builds the whole page chrome, renders the Markdown + chemistry, and mounts the
// 3D viewers / pathway / references / calculator from config. No build step.
//
// window.LAB = {
//   repo, labName, eyebrow, title, lede, reaction (mhchem),
//   content: "content.md",
//   viewers: [{id,key,role,name,iupac,note}],
//   pathway: [ {node:{img,name,sub,kind}} | {op:{cond,sub}} | {plus:true} ],
//   references: [{authors,title,meta,note,url,linkText,access}],
//   calculator: { intro, inputs:[{id,label,value,step,min,note,optional}],
//                 outputs:[{id,label,unit,kind}], compute: v=>({id:number}) },
//   docsPdf
// }
(function () {
  "use strict";
  var LAB = window.LAB || {};
  var SHARED = "https://orgolabs.github.io/shared";
  var MARKED = "https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js";
  var KV = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9";

  function elt(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function loadScript(src) { return new Promise(function (res) { var s = document.createElement("script"); s.src = src; s.crossOrigin = "anonymous"; s.referrerPolicy = "no-referrer"; s.onload = res; s.onerror = res; document.head.appendChild(s); }); }
  function loadCss(href) { var l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; l.crossOrigin = "anonymous"; document.head.appendChild(l); }

  // ---- chrome ----
  function brandbar() {
    return '<div class="brandbar"><div class="wrap">' +
      '<a class="brand" href="https://orgolabs.github.io/" target="_blank" rel="noopener">' +
      '<img src="' + SHARED + '/brand/orgolabs-icon.svg" alt="" width="28" height="28" />' +
      '<span class="brand-name"><b>orgo</b>labs</span></a>' +
      '<span class="brand-sep">/</span><span class="brand-lab">' + esc(LAB.labName) + '</span>' +
      (LAB.repo ? '<a class="brand-repo" href="https://github.com/orgolabs/' + esc(LAB.repo) + '" target="_blank" rel="noopener">View source ↗</a>' : '') +
      '</div></div>';
  }
  function hero() {
    return '<header class="hero"><div class="wrap">' +
      '<p class="eyebrow">' + esc(LAB.eyebrow) + '</p>' +
      '<h1>' + esc(LAB.title) + '</h1>' +
      '<p class="lede">' + (LAB.lede || "") + '</p>' +
      (LAB.reaction ? '<div class="reaction-strip" aria-label="Reaction summary"><span class="chem" data-display="1" data-tex="' + esc(LAB.reaction) + '"></span></div>' : '') +
      '</div></header>';
  }
  function footer() {
    return '<footer class="site-footer"><div class="wrap">' +
      '<p><strong>' + esc(LAB.title) + '</strong> — part of <a href="https://orgolabs.github.io/">orgolabs</a>. ' +
      'Content &amp; code under the <a href="LICENSE">MIT License</a>. Structure data © PubChem (public domain).</p>' +
      '<p class="fineprint">Static site for GitHub Pages. Not a substitute for a supervised laboratory SOP.</p>' +
      '</div></footer>';
  }

  // ---- widgets ----
  function viewersHtml() {
    var vs = LAB.viewers || [];
    var cards = vs.map(function (v) {
      var tagcls = v.kind === "major" ? "tag-major" : v.kind === "minor" ? "tag-minor" : "tag-start";
      return '<figure class="viewer-card">' +
        '<figcaption><span class="tag ' + tagcls + '">' + esc(v.role) + '</span><b>' + esc(v.name) + '</b></figcaption>' +
        (v.iupac ? '<p class="mol-sci">' + esc(v.iupac) + '</p>' : '') +
        '<div class="viewer" id="' + esc(v.id) + '"></div>' +
        (v.note ? '<p class="viewer-note">' + v.note + '</p>' : '') +
        '</figure>';
    }).join("");
    var controls = '<div class="viewer-controls" role="group" aria-label="3D display controls">' +
      '<div class="ctrl-group"><span class="ctrl-label">Style</span>' +
      '<button type="button" class="btn" data-style="stick">Stick</button>' +
      '<button type="button" class="btn is-active" data-style="ballstick">Ball &amp; stick</button>' +
      '<button type="button" class="btn" data-style="sphere">Space-fill</button></div>' +
      '<div class="ctrl-group">' +
      '<button type="button" class="btn toggle" id="spinBtn" aria-pressed="false">Spin</button>' +
      '<button type="button" class="btn toggle" id="hBtn" aria-pressed="true">Show H</button>' +
      '<button type="button" class="btn toggle" id="ohBtn" aria-pressed="false">Highlight O</button></div></div>';
    return controls + '<div class="viewer-grid' + (vs.length === 4 ? " grid-4" : "") + '">' + cards + "</div>" +
      '<p id="viewer-fallback" class="viewer-fallback" hidden>The 3D viewer library could not load from the CDN. Reload with a connection.</p>';
  }
  function pathwayHtml() {
    var items = (LAB.pathway || []).map(function (it) {
      if (it.plus) return '<div class="path-op plus"><span class="shaft" aria-hidden="true">+</span></div>';
      if (it.op) return '<div class="path-op"><span class="cond chem" data-tex="' + esc(it.op.cond) + '"></span><span class="shaft" aria-hidden="true">→</span>' + (it.op.sub ? '<span class="sub">' + esc(it.op.sub) + '</span>' : '') + '</div>';
      var n = it.node;
      return '<div class="path-node ' + (n.kind || "") + '">' +
        '<div class="path-card"><img src="' + SHARED + '/mol2d/' + esc(n.img) + '" alt="' + esc(n.name) + ' structure" loading="lazy"></div>' +
        '<p class="path-name">' + esc(n.name) + '</p><p class="path-sub">' + (n.sub || "") + '</p></div>';
    }).join("");
    return '<div class="pathway">' + items + "</div>" + (LAB.pathwayCaption ? '<p class="scheme-caption">' + LAB.pathwayCaption + "</p>" : "");
  }
  function referencesHtml() {
    var ol = (LAB.references || []).map(function (r) {
      var badge = '<span class="access ' + (r.access === "open" ? "open" : "paywall") + '">' + (r.access === "open" ? "open access" : "subscription") + "</span>";
      return "<li><span class=\"ref-title\">" + esc(r.authors) + "</span> “" + esc(r.title) + "” <span class=\"ref-meta\">" + esc(r.meta) + "</span> " + badge +
        "<br>" + esc(r.note) + ' <br><a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.linkText) + "</a></li>";
    }).join("");
    return '<ol class="refs">' + ol + "</ol>";
  }
  function calculatorHtml() {
    var c = LAB.calculator; if (!c) return "";
    var inputs = (c.inputs || []).map(function (i) {
      return '<label>' + esc(i.label) + (i.optional ? ' <span class="opt">optional</span>' : "") +
        '<input type="number" id="' + esc(i.id) + '" value="' + esc(i.value) + '"' + (i.min != null ? ' min="' + i.min + '"' : ' min="0"') + (i.step ? ' step="' + i.step + '"' : "") + ' />' +
        (i.note ? '<small>' + esc(i.note) + "</small>" : "") + "</label>";
    }).join("");
    var outs = (c.outputs || []).map(function (o) {
      return '<div class="out ' + (o.kind || "") + '"><span class="out-label">' + esc(o.label) + '</span><span class="out-val" id="' + esc(o.id) + '">—</span><span class="out-unit">' + esc(o.unit || "") + "</span></div>";
    }).join("");
    return (c.intro ? '<p class="section-intro">' + c.intro + "</p>" : "") +
      '<div class="calc"><div class="calc-inputs">' + inputs + '</div><div class="calc-outputs">' + outs + "</div></div>";
  }

  function wireCalculator() {
    var c = LAB.calculator; if (!c || !c.compute) return;
    var inputs = (c.inputs || []).map(function (i) { return i.id; });
    function num(id) { var el = document.getElementById(id); var v = el ? parseFloat(el.value) : NaN; return isFinite(v) && v >= 0 ? v : 0; }
    function run() {
      var vals = {}; inputs.forEach(function (id) { vals[id] = num(id); });
      var res = c.compute(vals) || {};
      (c.outputs || []).forEach(function (o) {
        var el = document.getElementById(o.id); if (!el) return;
        var val = res[o.id];
        el.textContent = (val === "" || val == null || (typeof val === "number" && !(val > 0))) ? "—" : val;
      });
    }
    inputs.forEach(function (id) { var el = document.getElementById(id); if (el) el.addEventListener("input", run); });
    run();
  }

  function wireControls() {
    window.VIEWERS = LAB.viewers || [];
  }

  // ---- build ----
  function groupSections(container, main) {
    // Walk rendered nodes; each <h2> starts a new .card section; build TOC.
    var toc = [], cur = null;
    Array.prototype.slice.call(container.childNodes).forEach(function (node) {
      if (node.nodeType === 1 && node.tagName === "H2") {
        var id = slug(node.textContent);
        cur = elt("section", "card"); cur.id = id;
        node.setAttribute("id", "");            // id lives on section
        cur.appendChild(node);
        main.appendChild(cur);
        toc.push({ id: id, label: node.textContent });
      } else if (cur) {
        cur.appendChild(node);
      } else {
        // content before first h2 (rare) — drop into a lead card
        cur = elt("section", "card"); main.appendChild(cur); cur.appendChild(node);
      }
    });
    return toc;
  }

  function run() {
    document.body.innerHTML =
      '<a class="skip-link" href="#main">Skip to content</a>' +
      brandbar() + hero() +
      '<nav class="tocbar" aria-label="Section navigation"><div class="wrap" id="toc"></div></nav>' +
      '<main id="main" class="wrap"></main>' + footer();

    loadCss(KV + "/katex.min.css");

    loadScript(MARKED).then(function () {
      return fetch(LAB.content || "content.md").then(function (r) { return r.text(); });
    }).then(function (md) {
      var tmp = elt("div");
      tmp.innerHTML = window.marked ? window.marked.parse(md) : md;
      var main = document.getElementById("main");
      var toc = groupSections(tmp, main);

      // TOC
      document.getElementById("toc").innerHTML = toc.map(function (t) { return '<a href="#' + t.id + '">' + esc(t.label.replace(/^[0-9]+\s*·\s*/, "")) + "</a>"; }).join("");

      // mounts
      var m;
      if ((m = main.querySelector('[data-mount="viewers"]'))) m.outerHTML = viewersHtml();
      if ((m = main.querySelector('[data-mount="pathway"]'))) m.outerHTML = pathwayHtml();
      if ((m = main.querySelector('[data-mount="references"]'))) m.outerHTML = referencesHtml();
      if ((m = main.querySelector('[data-mount="calculator"]'))) m.outerHTML = calculatorHtml();

      // style plain ordered lists as procedures; wrap tables for mobile scroll
      main.querySelectorAll(".card ol").forEach(function (ol) { if (!ol.classList.contains("refs")) ol.classList.add("procedure"); });
      main.querySelectorAll("table").forEach(function (t) { if (t.parentNode.classList.contains("table-scroll")) return; var w = elt("div", "table-scroll"); t.parentNode.insertBefore(w, t); w.appendChild(t); t.classList.add("facts"); });

      wireControls();
      wireCalculator();

      // 3D viewers (divs now exist) + scrollspy
      loadScript(SHARED + "/viewer.js");
      loadScript(SHARED + "/nav.js");

      // chemistry: KaTeX + mhchem + auto-render over $...$ and explicit .chem[data-tex]
      loadScript(KV + "/katex.min.js").then(function () {
        return loadScript(KV + "/contrib/mhchem.min.js");
      }).then(function () {
        return loadScript(KV + "/contrib/auto-render.min.js");
      }).then(function () {
        if (!window.katex) return;
        // explicit .chem spans (hero reaction, pathway conditions, data-tex)
        document.querySelectorAll(".chem").forEach(function (el) {
          var tex = el.getAttribute("data-tex") || el.textContent;
          try { window.katex.render(tex, el, { throwOnError: false, displayMode: el.getAttribute("data-display") === "1" }); } catch (e) {}
        });
        // inline $...$ in the prose
        if (window.renderMathInElement) {
          window.renderMathInElement(document.getElementById("main"), {
            delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }],
            throwOnError: false
          });
        }
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
