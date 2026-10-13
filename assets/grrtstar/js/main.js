/* Page entry point. Every widget starts lazily when its root comes near the viewport:
 * main.js imports ./<module>.js and calls `await mod.init(root)` once. A missing or failing module
 * leaves a quiet message in its slot and never stops the rest of the page.
 *
 * Slot states (data-state on the root, styled by page.css):
 *   (none)   waiting, a sized placeholder
 *   loading  the module is being fetched
 *   running  init(root) has been called; the placeholder is gone
 *   ready    init resolved
 * A slot keeps its reserved height (the measured final height of its widget) in every state.
 *   failed   the module could not be loaded or init threw */
import { whenNear, failSoft, loadKatexCss, reducedMotion } from "./util.js";

/* [slot id, module, name for the failure message, start margin]. The 3D viewer fetches three.js and a robot
 * model (about 380 kB), so it waits until it is within 200 px; the others start 400 px ahead. */
const WIDGETS = [
  ["gr-informed", "informed", "The informed-set figure", "400px"],
  ["gr-dimension", "dimension", "The dimension figure", "400px"],
  ["gr-search", "search", "The G-RRT* search figure", "400px"],
  ["gr-live", "live", "The in-browser planner", "400px"],
  ["gr-mbm", "mbm", "The MotionBenchMaker viewer", "200px"],
  ["gr-vamp-results", "vampresults", "The VAMP results", "400px"],
  ["gr-vamp-eps0", "vampeps0", "The ε = 0 comparison", "400px"],          // Round 7 block (CONTRACT.md)
  ["gr-ompl-results", "omplresults", "The OMPL results", "400px"]
];

/* Lazy sections and the functions that start them. */
const starters = new Map();

/* Start a widget once its slot is near the viewport and the page is at rest (the scroll position has
 * not changed for 100 ms), or has stayed near through 700 ms of scrolling. A jump that scrolls smoothly
 * past a widget therefore does not start it. Returns a function that starts it now. */
function whenSettledNear(root, init, margin) {
  let done = false, timer = 0, since = 0, y = 0, moved = 0, io = null;
  const run = () => {
    if (done) return;
    done = true;
    if (io) io.disconnect();
    clearTimeout(timer);
    init(root);
  };
  const check = () => {
    const now = performance.now();
    if (window.scrollY !== y) { y = window.scrollY; moved = now; }
    if (now - moved < 100 && now - since < 700) timer = setTimeout(check, 50);
    else run();
  };
  if (!("IntersectionObserver" in window)) { run(); return run; }
  io = new IntersectionObserver((entries) => {
    clearTimeout(timer);
    if (!entries[entries.length - 1].isIntersecting) return;
    since = moved = performance.now();
    y = window.scrollY;
    timer = setTimeout(check, 50);
  }, { rootMargin: margin });
  io.observe(root);
  return run;
}

function slot(id, module, what, margin) {
  const root = document.getElementById(id);
  if (!root) return;
  starters.set(root, whenSettledNear(root, async () => {
    root.dataset.state = "loading";
    let mod;
    try {
      mod = await import("./" + module + ".js");
      if (!mod || typeof mod.init !== "function") throw new Error(module + ".js has no init()");
    } catch (err) {
      root.dataset.state = "failed";
      failSoft(root, err, what);
      return;
    }
    root.dataset.state = "running";
    try {
      await mod.init(root);
      root.dataset.state = "ready";
    } catch (err) {
      root.dataset.state = "failed";
      failSoft(root, err, what);
    }
  }, margin));
}

function teaser() {
  const fig = document.getElementById("gr-teaser");
  if (!fig) return;
  starters.set(fig, whenNear(fig, async () => {
    try {
      const mod = await import("./teaser.js");
      await mod.init(fig);
    } catch (err) {
      console.warn("teaser", err);
      fig.classList.add("gr-static");
    }
  }, "200px"));
}

/* Math. The formulas are typeset in the HTML ahead of time (_tools/grrtstar/page/prerender_math.mjs,
 * with their widths from measure_math.py), so no script is needed, only the KaTeX stylesheet and its
 * fonts. They load when a formula has come within 400 px of the viewport and the page is at rest. */
function math(root) {
  let loaded = false;
  const load = () => {
    if (loaded) return;
    loaded = true;
    loadKatexCss();
  };
  root.querySelectorAll(".katex").forEach((n) => whenSettledNear(n, load, "400px"));
}

/* The BibTeX entry, one element per line, so that a line that wraps on a narrow screen keeps a hanging
 * indent (page.css). Returns the entry's text for the Copy button. */
function bibLines(pre) {
  const text = pre.textContent.replace(/\n+$/, "");
  pre.textContent = "";
  for (const line of text.split("\n")) {
    const span = document.createElement("span");
    span.className = "l";
    span.textContent = line + "\n";
    pre.appendChild(span);
  }
  return text;
}

function initCopy(btn) {
  const pre = document.getElementById("gr-bibtex");
  const text = bibLines(pre);
  btn.addEventListener("click", () => {
    const done = (ok) => {
      btn.textContent = ok ? "Copied" : /Mac|iPhone|iPad/.test(navigator.platform) ? "Press ⌘C" : "Press Ctrl+C";
      setTimeout(() => { btn.textContent = "Copy"; }, 1600);
    };
    const select = () => {
      const r = document.createRange();
      r.selectNodeContents(pre);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => done(true), () => { select(); done(false); });
    } else {
      select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      done(ok);
    }
  });
}

/* Every slot keeps its widget's final height from the start, so a jump to an anchor needs nothing above
 * the target to load. Two guards remain for what can still change height above the reader (text that is
 * restyled when a stylesheet or a font arrives, a widget that fails).
 * (1) After an in-page link or a fresh visit to a #hash, the target stays at the top for a few seconds,
 *     until the reader scrolls, presses a key or goes back.
 * (2) Browsers without CSS scroll anchoring get it by hand: a section above the viewport that changes
 *     height scrolls the page by the same amount. */
function stableScroll(root, sections) {
  let target = null, until = 0;
  const release = () => { target = null; };
  const go = (hash) => {
    let t = null;
    try { t = hash && document.getElementById(decodeURIComponent(hash.slice(1))); } catch (err) { return; }
    if (!t || !root.contains(t)) return;
    target = t;
    until = performance.now() + 4000;
  };
  const manual = !(window.CSS && CSS.supports("overflow-anchor: auto"));
  const heights = new Map();
  const ro = new ResizeObserver((entries) => {
    let shift = 0;
    for (const { target: el } of entries) {
      if (el === root) continue;
      const r = el.getBoundingClientRect();
      const h0 = heights.has(el) ? heights.get(el) : r.height;
      heights.set(el, r.height);
      if (r.top < 0) shift += r.height - h0;
    }
    if (target && performance.now() <= until) { target.scrollIntoView({ block: "start", behavior: "instant" }); return; }
    target = null;
    if (manual && shift) scrollBy(0, shift);
  });
  ro.observe(root);
  sections.forEach((el) => ro.observe(el));
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach((ev) => addEventListener(ev, release, { passive: true, capture: true }));
  addEventListener("popstate", () => { if (target && location.hash !== "#" + target.id) release(); });
  document.addEventListener("click", (e) => {
    if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a) go(a.getAttribute("href"));
  });
  const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (location.hash && (!nav || nav.type === "navigate")) go(location.hash);
}

function boot() {
  const root = document.getElementById("gr");
  if (!root) return;
  document.documentElement.classList.add("gr-js");
  if (reducedMotion()) document.documentElement.classList.add("gr-reduced");
  const copy = root.querySelector(".gr-bib [data-role=copy]");
  if (copy) initCopy(copy);
  teaser();
  WIDGETS.forEach(([id, module, what, margin]) => slot(id, module, what, margin));
  math(root);
  if ("ResizeObserver" in window) {
    stableScroll(root, [...starters.keys()]);
    // The reserved slot heights follow the column width (the inline script in the page holds the table).
    let width = root.clientWidth;
    new ResizeObserver(() => {
      if (root.clientWidth === width) return;
      width = root.clientWidth;
      if (window.grReserve) window.grReserve();
    }).observe(root);
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
