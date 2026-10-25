// Highlights the current section's link in the sticky .tocbar as you scroll.
(function () {
  "use strict";
  function ready() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.tocbar a[href^="#"]'));
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) {
      var sec = document.getElementById(a.getAttribute("href").slice(1));
      if (sec) map[sec.id] = a;
    });
    function setActive(id) {
      links.forEach(function (a) { a.classList.toggle("active", map[id] === a); });
    }
    var io = new IntersectionObserver(function (entries) {
      var vis = entries.filter(function (e) { return e.isIntersecting; });
      if (!vis.length) return;
      vis.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      setActive(vis[0].target.id);
    }, { rootMargin: "-64px 0px -62% 0px", threshold: 0 });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
