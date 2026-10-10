/* Page entry point.  Every widget starts lazily when it scrolls near the viewport. */
import { DATA, fetchJSON, whenNear, webglAvailable, failSoft } from "./util.js";
import { renderStatic } from "./math.js";

function initCopy(btn) {
  btn.addEventListener("click", () => {
    const pre = document.getElementById("dg-bibtex");
    const text = pre.textContent;
    const done = () => {
      btn.textContent = "Copied";
      setTimeout(() => { btn.textContent = "Copy"; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => {});
    } else {
      const r = document.createRange();
      r.selectNodeContents(pre);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
      document.execCommand("copy");
      done();
    }
  });
}

/* Lazy sections and the functions that start them early (see stableScroll). */
const starters = new Map();

function lazy(id, loader, what, needsGL) {
  const root = document.getElementById(id);
  if (!root) return;
  starters.set(root, whenNear(root, async () => {
    try {
      if (needsGL && !webglAvailable()) throw new Error("WebGL unavailable");
      const manifest = await fetchJSON(DATA + "manifest.json");
      const mod = await loader();
      await mod.init(root, manifest);
    } catch (err) {
      failSoft(root.querySelector("[data-role=stage]") || root, err, what);
    }
  }));
}

/* The lazy widgets grow by about 2600 px when they load. Two guards keep that from moving the reader.
 * (1) After an in-page link (the Video button, a heading anchor) or a fresh visit to a #hash, every lazy section
 *     above the target starts at once, and the target stays at the top while they grow, until the reader
 *     scrolls, presses a key or goes back. Nothing above is then left to grow when the reader scrolls up.
 * (2) Browsers without CSS scroll anchoring (Safari) get it by hand: a section that starts above the viewport and
 *     grows scrolls the page by the same amount. */
function stableScroll(root, sections) {
  let target = null, until = 0;
  const release = () => { target = null; };
  const go = (hash) => {
    let t = null;
    try { t = hash && document.getElementById(decodeURIComponent(hash.slice(1))); } catch (err) { return; }
    if (!t || !root.contains(t)) return;
    target = t;
    until = performance.now() + 4000;
    starters.forEach((start, el) => { if (el.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING) start(); });
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
      if (r.top < 0) shift += r.height - h0;                      // it starts above the viewport: keep what follows it in place
    }
    if (target && performance.now() <= until) { target.scrollIntoView({ block: "start", behavior: "instant" }); return; }
    target = null;
    if (manual && shift) scrollBy(0, shift);
  });
  ro.observe(root);
  sections.forEach((el) => ro.observe(el));
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach((ev) => addEventListener(ev, release, { passive: true, capture: true }));
  addEventListener("popstate", () => { if (target && location.hash !== "#" + target.id) release(); });   // Back or Forward; a link click fires popstate too
  document.addEventListener("click", (e) => {
    if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a) go(a.getAttribute("href"));
  });
  const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (location.hash && (!nav || nav.type === "navigate")) go(location.hash);
}

function boot() {
  const dg = document.getElementById("dg");
  renderStatic(dg);
  const copy = document.querySelector(".dg-bib [data-role=copy]");
  if (copy) initCopy(copy);

  const teaser = document.getElementById("dg-teaser");
  if (teaser) {
    starters.set(teaser, whenNear(teaser, async () => {
      const stage = teaser.querySelector("[data-role=stage]");
      const fallback = () => {
        teaser.querySelector("[data-role=fallback]").hidden = false;
        teaser.querySelector("[data-role=loading]").classList.add("done");
        stage.classList.add("static");
      };
      if (!webglAvailable()) { fallback(); return; }
      try {
        const manifest = await fetchJSON(DATA + "manifest.json");
        const mod = await import("./teaser.js");
        await mod.init(teaser, manifest);
      } catch (err) {
        console.warn("teaser", err);
        fallback();
      }
    }, "200px"));
  }

  lazy("dg-family", () => import("./family.js"), "The constraint table", false);
  lazy("dg-walk", () => import("./latent.js"), "The latent-space widget", true);
  lazy("dg-knobs", () => import("./knobs.js"), "The intrinsic-dimension widget", true);
  lazy("dg-idchart", () => import("./results.js"), "The results chart", false);
  lazy("dg-interp", () => import("./results.js").then((m) => ({ init: m.initInterp })), "The interpolation table", false);
  lazy("dg-reel", () => import("./media.js").then((m) => ({ init: m.initReel })), "The real-robot videos", false);
  if ("ResizeObserver" in window) stableScroll(dg, [...starters.keys()]);

  if (/[?&]debug\b/.test(location.search)) {
    import("./robot.js").then((robot) => {
      /* In-browser forward-kinematics check, used by _tools/diffusion-ik-geometry/fk_check.py --browser.
         cases: [{robot, q, pos, R}] with R row-major; returns the worst position (m) and rotation (rad)
         errors of RobotModel.fk and of the posed scene graph (Robot.eePose). */
      async function fkCheck(cases) {
        let fkPos = 0, fkRot = 0, sgPos = 0, sgRot = 0;
        const rotErr = (m, R) => {
          const e = m.elements;
          let tr = 0;
          for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) tr += e[4 * j + i] * R[i][j];
          return Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));
        };
        for (const c of cases) {
          const model = await robot.loadModel(c.robot);
          const T = model.fk(c.q);
          const e = T.elements;
          fkPos = Math.max(fkPos, Math.hypot(e[12] - c.pos[0], e[13] - c.pos[1], e[14] - c.pos[2]));
          fkRot = Math.max(fkRot, rotErr(T, c.R));
          const r = new robot.Robot(model).setQ(c.q);
          const pose = r.eePose();
          sgPos = Math.max(sgPos, pose.position.distanceTo({ x: c.pos[0], y: c.pos[1], z: c.pos[2] }));
          sgRot = Math.max(sgRot, rotErr(pose.matrix, c.R));
        }
        return { n: cases.length, fkPos, fkRot, sceneGraphPos: sgPos, sceneGraphRot: sgRot };
      }
      window.DIKG = { robot, fkCheck, manifest: () => fetchJSON(DATA + "manifest.json") };
    });
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
