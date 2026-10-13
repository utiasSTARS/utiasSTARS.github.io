/* gr-informed: the informed set and the greedy informed set on a 2D toy problem, with one message (Round 11 of
 * CONTRACT.md): the greedy informed set contains the optimal path when the current solution is in the optimal path's
 * homotopy class, and might not include it otherwise. The reader drags the path's points, its ends and the blocks;
 * both ellipses, the state x_max with the largest f^ on the path and the optimal path follow live. Canvas at device
 * pixel ratio with HTML labels on top. */
import * as G from "./informed-geom.js";
import { el, segmented, reducedMotion, throttle, clamp, loadKatexCss, COLORS, MATH } from "./util.js";

const B = [-1, -0.625, 1, 0.625];                       // the state space [x0, y0, x1, y1]
const NARROW = [-0.72, -0.6, 0.72, 0.6];               // the part shown on small screens
/* The paper's palette (page tokens): dashed grey informed set, green greedy informed set, amber path,
 * crimson start, green goal, near-black blocks. */
const C = {
  ink: COLORS.ink, informed: COLORS.informed, informedFill: COLORS.informedFill, greedy: COLORS.grrt, greedyFill: COLORS.greedyFill,
  path: COLORS.path, start: COLORS.start, goal: COLORS.goal, obs: COLORS.obstacle, bad: "#c0392b",
  string: "rgba(79,146,22,0.6)"
};
const END_PAD = 12, WP_PAD = 8;                         // px kept between a dragged point and the edge
const S0 = [-0.45, 0], G0 = [0.45, 0];

/* Presets. Paths list the interior waypoints only; boxes are [x0, y0, x1, y1]. */
const PRESETS = [
  { value: "zigzag", label: "Zigzag", s: S0, g: G0,
    boxes: [[-0.05, -0.625, 0.05, 0.06], [-0.05, 0.14, 0.05, 0.42]],
    wps: [[-0.37, -0.12], [-0.27, 0.1], [-0.17, -0.08], [-0.075, 0.1], [0.075, 0.1], [0.17, -0.1], [0.27, 0.12], [0.36, -0.07]] },
  { value: "detour", label: "Detour", s: S0, g: G0,
    boxes: [[-0.05, -0.625, 0.05, 0.25]],
    wps: [[-0.2, 0.25], [-0.04, 0.33], [0.12, 0.31], [0.3, 0.14]] },
  { value: "straight", label: "Nearly straight", s: S0, g: G0,
    boxes: [[-0.05, -0.03, 0.07, 0.14], [-0.3, 0.2, -0.16, 0.36], [0.2, -0.36, 0.34, -0.2]],
    wps: [[-0.22, -0.035], [-0.04, -0.055], [0.1, -0.04], [0.28, -0.015]] },
  { value: "slalom", label: "Slalom", s: S0, g: G0,
    boxes: [[-0.3, -0.1, -0.22, 0.34], [-0.12, -0.4, -0.04, 0.1], [0.04, -0.1, 0.12, 0.34], [0.22, -0.4, 0.3, 0.1]],
    wps: [[-0.31, -0.13], [-0.21, -0.13], [-0.13, 0.13], [-0.03, 0.13], [0.03, -0.13], [0.13, -0.13], [0.21, 0.13], [0.31, 0.13]] }
];

const copy = (p) => ({ s: p.s.slice(), g: p.g.slice(), boxes: p.boxes.map((b) => b.slice()), wps: p.wps.map((w) => w.slice()) });

function loadCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return Promise.resolve();
  return new Promise((res) => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    l.onload = l.onerror = () => res();
    document.head.appendChild(l);
    setTimeout(res, 2500);
  });
}

/* The kit's inline math is set in the KaTeX fonts. Wait for them, briefly, while the slot is still hidden, so
 * that their arrival does not move anything the reader already sees. */
function mathFonts(ms = 1500) {
  loadKatexCss();
  const link = document.querySelector('link[data-gr="katex"]');
  const sheet = new Promise((res) => {
    if (!link || link.sheet) res();
    else ["load", "error"].forEach((ev) => link.addEventListener(ev, res, { once: true }));
  });
  const fonts = sheet.then(() => document.fonts && Promise.all(["italic 1em KaTeX_Math", "1em KaTeX_Main", "bold 1em KaTeX_Main"].map((f) => document.fonts.load(f)))).catch(() => {});
  return Promise.race([fonts, new Promise((res) => setTimeout(res, ms))]);
}

export async function init(root) {
  await Promise.all([loadCSS(new URL("../css/informed.css", import.meta.url).href), mathFonts()]);
  root.classList.add("gr-inf");
  /* ---------------------------------------------------------------- DOM */
  // The card, with the caption below it (the page's own caption stays if it wrote one into the slot).
  const own = root.querySelector(":scope > .gr-caption");
  const card = el("div", { class: "gr-card" });
  root.replaceChildren(card, own || el("p", { class: "gr-caption", html:
    `The informed set grows with the cost ${MATH.ci} of the current solution. The greedy informed set reaches only as far as ` +
    `${MATH.xmax}, the state on the path with the maximum heuristic cost.` }));

  const bar = el("div", { class: "gr-toolbar" }, card);
  const group = (label) => {
    const g = el("div", { class: "gr-group" }, bar);
    el("span", { class: "lbl", text: label }, g);
    return el("div", null, g);
  };
  const presetSeg = segmented(group("Scene"), PRESETS, "zigzag", (v) => applyPreset(v, true), { label: "Scene" });

  const stage = el("div", { class: "gr-inf-stage" }, card);
  const canvas = el("canvas", { class: "gr-inf-canvas", tabindex: "0", role: "application",
    "aria-label": "Planning problem with a path to drag. Arrow keys move the selected point, Enter selects the next point, Plus adds a point after it and Delete removes it." }, stage);
  const labels = el("div", { class: "gr-inf-labels" }, stage);
  const lab = {};
  for (const [key, html] of [["s", MATH.xI], ["g", MATH.xG], ["m", MATH.xmax]]) {
    lab[key] = el("span", { class: "gr-inf-lab gr-inf-lab-" + key, html }, labels);
  }
  const status = el("span", { class: "gr-status gr-inf-chip" }, stage);
  // How to interact, as the stage's hint: what is left to try, in the words of the reader's pointer.
  const hintEl = el("span", { class: "gr-hint" }, stage);
  const tried = { drag: false, toggle: false };
  const twice = window.matchMedia && matchMedia("(pointer: coarse)").matches ? "double tap" : "double click";
  function hintText() {
    hintEl.textContent = tried.drag ? `A ${twice} adds or removes a point` : tried.toggle ? "Drag the points and the obstacles" : `Drag to move, ${twice} to add or remove a point`;
    hintEl.classList.toggle("gone", tried.drag && tried.toggle);
  }
  hintText();
  el("div", { class: "gr-legend", html:
    '<span class="it"><i class="ell informed"></i>informed set</span><span class="it"><i class="ell greedy"></i>greedy informed set</span>' +
    '<span class="it"><i class="ln" style="color:var(--gr-path)"></i>current path</span><span class="it"><i class="ln dotted" style="color:var(--gr-ink)"></i>optimal path</span>' }, card);
  const live = el("div", { class: "gr-inf-sr", "aria-live": "polite" }, card);

  const read = el("div", { class: "gr-inf-read" }, card);
  const tile = (key, sym, desc) => {
    const t = el("div", { class: "gr-stat" }, read);
    el("span", { class: "k", html: key }, t);
    const v = el("span", { class: "v", html: (sym ? sym + ' <span class="gr-m"><span class="rm">=</span></span> ' : "") + '<span class="num"></span>' }, t);
    return { v, n: v.querySelector(".num"), d: el("span", { class: "d", text: desc }, t) };
  };
  const tI = tile('<i class="ell informed"></i>Path cost', MATH.ci, "bounds the informed set");
  const tG = tile('<i class="ell greedy"></i>Max heuristic cost', MATH.fmax, "bounds the greedy informed set");

  /* ---------------------------------------------------------------- state */
  let st = copy(PRESETS[0]);
  let anim = null;                                      // preset morph in progress
  let drag = null, hover = null, sel = 1, focused = false;
  let down = null, lastTap = null, lastType = "mouse";  // for taps and double taps
  let W = 0, H = 0, dpr = 1, k = 1, V = B;
  const chip = { r: 0, b: 0 };                          // the status chip's right and bottom edge in the stage, px
  const ctx = canvas.getContext("2d");
  if (!ctx) { stage.textContent = "This figure needs a canvas, which this browser does not provide."; return; }

  const toPx = (p) => [(p[0] - V[0]) * k, (V[3] - p[1]) * k];
  const toW = (x, y) => [x / k + V[0], V[3] - y / k];
  const pathOf = (s) => [s.s, ...s.wps, s.g];
  // A point stays `pad` px inside the stage and out from under the status chip at its top left.
  const inView = (p, pad) => {
    const m = pad / k, x = clamp(p[0], V[0] + m, V[2] - m);
    let y = clamp(p[1], V[1] + m, V[3] - m);
    if ((x - V[0]) * k < chip.r + pad) y = Math.min(y, V[3] - (chip.b + pad) / k);
    return [x, y];
  };

  // The stylesheet gives the stage its shape (1.6, and 1.2 on a narrow column); the view follows it.
  function resize(width, height) {
    W = Math.max(1, width); H = Math.max(1, height);
    V = W / H < 1.4 ? NARROW : B;
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    k = W / (V[2] - V[0]);
    // a point left outside the smaller view comes back in
    st.s = inView(st.s, END_PAD); st.g = inView(st.g, END_PAD); st.wps = st.wps.map((p) => inView(p, WP_PAD));
    chip.r = Math.min(chip.r, W);
    draw();
  }

  /* Everything the picture and the readout need, from a state. */
  function measure(s) {
    const path = pathOf(s);
    const cmin = G.dist(s.s, s.g);
    const c = G.pathLength(path);
    const gc = G.greedyCost(path, s.s, s.g);
    const hits = G.pathHits(path, s.boxes);
    const startBad = s.boxes.some((b) => G.inBox(s.s, b) || G.inBox(s.g, b));
    const opt = startBad ? null : G.shortestPath(s.s, s.g, s.boxes, B);
    const optF = opt ? Math.max(...opt.pts.map((p) => G.fhat(p, s.s, s.g))) : NaN;
    return { path, cmin, c, f: gc.cost, xmax: gc.index, hits, collides: startBad || hits.some(Boolean), opt, optInside: opt && optF <= gc.cost + 1e-9 };
  }

  /* ---------------------------------------------------------------- drawing */
  let raf = 0;
  const draw = () => { if (!raf) raf = requestAnimationFrame(render); };

  function ellipsePath(E) {
    ctx.beginPath();
    const [x, y] = toPx([E.cx, E.cy]);
    ctx.ellipse(x, y, Math.max(E.a * k, 0.01), Math.max(E.b * k, 0.01), -E.rot, 0, 2 * Math.PI);
  }

  function polyline(pts) {
    ctx.beginPath();
    pts.forEach((p, i) => { const [x, y] = toPx(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  }

  function dot(p, r, fill, stroke, lw) {
    const [x, y] = toPx(p);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lw || 1.5; ctx.strokeStyle = stroke; ctx.stroke(); }
  }

  function render() {
    raf = 0;
    if (!W) return;
    let s = st, morph = false;
    if (anim) {
      const t = Math.min(1, (performance.now() - anim.t0) / anim.dur);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      morph = t < 1;
      if (morph) { s = anim.at(e); draw(); } else anim = null;
    }
    const m = measure(s);
    const EI = G.ellipse(s.s, s.g, m.c), EG = G.ellipse(s.s, s.g, m.f);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);

    // the two sets (the greedy informed set over white, not over the grey tint), then the blocks
    ellipsePath(EI); ctx.fillStyle = C.informedFill; ctx.fill();
    ellipsePath(EG); ctx.fillStyle = "#fff"; ctx.fill(); ctx.fillStyle = C.greedyFill; ctx.fill();
    for (const b of s.boxes) {
      const [x0, y1] = toPx([b[0], b[1]]), [x1, y0] = toPx([b[2], b[3]]);
      ctx.fillStyle = C.obs;
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      if ((drag && drag.box === b) || (hover && hover.box === b)) {
        ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 1.5;   // the block under the pointer
        ctx.strokeRect(x0 + 2, y0 + 2, x1 - x0 - 4, y1 - y0 - 4);
      }
    }
    ellipsePath(EI); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5; ctx.strokeStyle = C.informed; ctx.stroke(); ctx.setLineDash([]);
    ellipsePath(EG); ctx.lineWidth = 1.5; ctx.strokeStyle = C.greedy; ctx.stroke();

    // optimal path
    if (m.opt) {
      polyline(m.opt.pts);
      ctx.setLineDash([1.5, 4.5]); ctx.lineCap = "round"; ctx.lineWidth = 2.4; ctx.strokeStyle = "rgba(39,38,43,0.72)"; ctx.stroke();
      ctx.setLineDash([]);
    }
    // f^(x_max) as a string from x_I over x_max to x_G
    const xm = m.path[m.xmax];
    polyline([s.s, xm, s.g]);
    ctx.lineCap = "butt"; ctx.lineWidth = 1; ctx.strokeStyle = C.string; ctx.stroke();

    // current path, amber and thicker than the other lines, with a white casing so it reads over the clouds
    polyline(m.path);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.lineWidth = 5; ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = C.path; ctx.stroke();
    m.hits.forEach((h, i) => {
      if (!h) return;
      polyline([m.path[i], m.path[i + 1]]);
      ctx.setLineDash([5, 4]); ctx.lineWidth = 2.6; ctx.strokeStyle = C.bad; ctx.stroke(); ctx.setLineDash([]);
    });

    // handles
    const last = m.path.length - 1;
    const active = (i) => (drag && drag.i === i) || (hover && hover.i === i) || (focused && sel === i);
    m.path.forEach((p, i) => {
      if (i === 0 || i === last || morph) return;
      const on = active(i);
      dot(p, on ? 6 : 4.4, "#fff", C.ink, on ? 2 : 1.6);
    });
    dot(xm, 9, null, C.greedy, 2);
    dot(s.s, active(0) ? 8.5 : 7, C.start, "#fff", 2);
    dot(s.g, active(last) ? 8.5 : 7, C.goal, "#fff", 2);
    if (focused && !morph) dot(m.path[Math.min(sel, last)], 12, null, "rgba(114,83,237,0.85)", 1.5);

    placeLabels(s, m, xm, EG);
    readout(m);
  }

  /* Labels sit next to their points and move to another side where the edge of the stage is in the way. */
  function placeLabels(s, m, xm, EG) {
    const put = (n, p, sides, gap) => {
      if (!n._w) return;                               // not measured yet (see the observer at the end)
      const [x, y] = toPx(p);
      let best = null;
      for (const [sx, sy] of sides) {
        const lx = sx < 0 ? x - gap - n._w : sx > 0 ? x + gap : x - n._w / 2;
        const ly = sy < 0 ? y - gap - n._h : sy > 0 ? y + gap : y - n._h / 2;
        const fits = lx >= 2 && ly >= 2 && lx + n._w <= W - 2 && ly + n._h <= H - 2 && !(lx < chip.r + 2 && ly < chip.b + 2);
        if (!best || fits) best = [lx, ly];
        if (fits) break;
      }
      n.style.transform = `translate(${clamp(best[0], 2, W - 2 - n._w).toFixed(1)}px, ${clamp(best[1], 2, H - 2 - n._h).toFixed(1)}px)`;
      n.style.visibility = "visible";
    };
    put(lab.s, s.s, [[-1, 1], [1, 1], [-1, -1], [1, -1]], 8);
    put(lab.g, s.g, [[1, 1], [-1, 1], [1, -1], [-1, -1]], 8);
    // x_max: outward from the centre of the ellipses, so that it sits outside the greedy informed set
    const ux = Math.sign(Math.round((xm[0] - EG.cx) * 8 / (EG.a || 1))), uy = Math.sign(Math.round((xm[1] - EG.cy) * 8 / (EG.b || 1)));
    const out = [ux, -uy || 1];
    put(lab.m, xm, [out, [out[0], -out[1]], [-out[0], out[1]], [-out[0], -out[1]]], 11);
    lab.m.style.opacity = m.xmax === 0 || m.xmax === m.path.length - 1 ? "0" : "1";
  }

  let lastLive = "";
  const readout = throttle((m) => {
    tI.n.textContent = m.c.toFixed(3);
    tG.n.textContent = m.f.toFixed(3);
    let cls, msg;
    if (m.collides) { cls = "warn"; msg = "The path crosses an obstacle"; }
    else if (m.optInside) { cls = "in"; msg = "Optimal path inside the greedy informed set"; }
    else { cls = "out"; msg = "Optimal path outside the greedy informed set"; }
    canvas.dataset.points = m.path.length - 2;        // for tests: the number of waypoints and where the two ends are
    canvas.dataset.ends = JSON.stringify([toPx(m.path[0]), toPx(m.path[m.path.length - 1])].map((q) => q.map((v) => +v.toFixed(1))));
    if (status.dataset.msg !== msg) {
      status.dataset.msg = msg;
      status.className = "gr-status gr-inf-chip " + cls;
      status.textContent = msg;
      status.prepend(el("i", { class: "gr-inf-dot" }));
    }
    const txt = `Path cost ${m.c.toFixed(2)}, maximum heuristic cost ${m.f.toFixed(2)}. ${msg}.`;
    if (!drag && !anim && txt !== lastLive) { live.textContent = txt; lastLive = txt; }
  });

  /* ---------------------------------------------------------------- presets */
  function applyPreset(id, animate) {
    const p = PRESETS.find((q) => q.value === id) || PRESETS[0];
    presetSeg.set(p.value);
    const from = st, to = copy(p);
    st = to;
    sel = Math.min(sel, to.wps.length + 1);
    if (!animate || reducedMotion()) { anim = null; draw(); return; }
    const M = Math.max(24, from.wps.length + 2, to.wps.length + 2);
    const pa = G.resample(pathOf(from), M), pb = G.resample(pathOf(to), M);
    const nb = Math.max(from.boxes.length, to.boxes.length);
    const shrink = (b) => { const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2; return [cx, cy, cx, cy]; };
    const ba = [], bb = [];
    for (let i = 0; i < nb; i++) {
      const a = from.boxes[i], b = to.boxes[i];
      ba.push(a || shrink(b));
      bb.push(b || shrink(a));
    }
    const L = (x, y, t) => x + (y - x) * t;
    anim = {
      t0: performance.now(), dur: 520,
      at: (t) => {
        const path = pa.map((q, i) => [L(q[0], pb[i][0], t), L(q[1], pb[i][1], t)]);
        return {
          s: path[0], g: path[M - 1], wps: path.slice(1, -1),
          boxes: ba.map((a, i) => a.map((v, j) => L(v, bb[i][j], t))).filter((b) => b[2] - b[0] > 1e-4 && b[3] - b[1] > 1e-4)
        };
      }
    };
    draw();
  }
  const edited = () => presetSeg.set(null);

  /* ---------------------------------------------------------------- interaction */
  function pick(px, py, touch) {
    const R = touch ? 22 : 12;
    const path = pathOf(st);
    let best = null, bd = R * R;
    path.forEach((p, i) => {
      const [x, y] = toPx(p);
      const d = (x - px) ** 2 + (y - py) ** 2;
      // the ends win ties so they can always be grabbed
      if (d < bd || (d === bd && (i === 0 || i === path.length - 1))) { bd = d; best = { i }; }
    });
    if (best) return best;
    const [wx, wy] = toW(px, py);
    for (let j = st.boxes.length - 1; j >= 0; j--) {
      const b = st.boxes[j];
      if (wx >= b[0] && wx <= b[2] && wy >= b[1] && wy <= b[3]) return { box: b };
    }
    return null;
  }

  const local = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

  function setPoint(i, p) {
    const n = st.wps.length + 2;
    if (i === 0) st.s = inView(p, END_PAD); else if (i === n - 1) st.g = inView(p, END_PAD); else st.wps[i - 1] = inView(p, WP_PAD);
  }

  /* The point of the path within `reach` px of (px, py), as {i: segment, p: world point}, or null. */
  function onPath(px, py, reach) {
    const path = pathOf(st);
    let best = null, bd = reach * reach;
    for (let i = 0; i < path.length - 1; i++) {
      const [ax, ay] = toPx(path[i]), [bx, by] = toPx(path[i + 1]);
      const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
      const t = clamp(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1);
      const d = (ax + t * dx - px) ** 2 + (ay + t * dy - py) ** 2;
      if (d < bd) { bd = d; best = { i, p: toW(ax + t * dx, ay + t * dy) }; }
    }
    return best;
  }

  /* Remove the waypoint at (px, py), or add one where the path passes (double click, double tap). */
  function toggleAt(px, py, touch) {
    if (anim) anim = null;
    const h = pick(px, py, touch);
    if (h && h.i != null) {
      if (h.i > 0 && h.i < st.wps.length + 1) { st.wps.splice(h.i - 1, 1); sel = Math.min(h.i, st.wps.length + 1); edited(); }
      else return;
    } else {
      const on = h ? null : onPath(px, py, touch ? 20 : 10);
      if (!on) return;
      st.wps.splice(on.i, 0, on.p); sel = on.i + 1; edited();
    }
    tried.toggle = true; hintText();
    draw();
  }

  canvas.addEventListener("pointerdown", (e) => {
    const [px, py] = local(e);
    lastType = e.pointerType;
    down = { x: px, y: py };
    if (anim) anim = null;
    const h = pick(px, py, e.pointerType === "touch");
    if (!h) return;
    const [wx, wy] = toW(px, py), p = h.box || pathOf(st)[h.i];
    drag = { box: h.box, i: h.i, off: [wx - p[0], wy - p[1]], moved: false };
    if (h.i != null) sel = h.i;
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
    draw();
  });
  // On touch screens, keep the page from scrolling only when the finger lands on something draggable.
  canvas.addEventListener("touchstart", (e) => {
    const t = e.touches[0], r = canvas.getBoundingClientRect();
    if (e.touches.length === 1 && pick(t.clientX - r.left, t.clientY - r.top, true)) e.preventDefault();
  }, { passive: false });
  canvas.addEventListener("pointermove", (e) => {
    const [px, py] = local(e);
    if (!drag) {
      const h = e.pointerType === "mouse" ? pick(px, py, false) : null;
      const same = (h && hover && h.i === hover.i && h.box === hover.box) || (!h && !hover);
      if (!same) { hover = h; draw(); }
      // grab a point, move a block, and a plus over the bare path, where a double click adds a point
      canvas.style.cursor = h ? (h.box ? "move" : "grab") : e.pointerType === "mouse" && onPath(px, py, 10) ? "copy" : "default";
      return;
    }
    if (!drag.moved) {                                  // a tap wobbles by a few pixels; that is not a drag
      if (Math.hypot(px - down.x, py - down.y) < 4) return;
      drag.moved = true;
      stage.classList.add("dragging");
      tried.drag = true; hintText();
      edited();
    }
    const [wx, wy] = toW(px, py);
    if (drag.box) {
      const b = drag.box, w = b[2] - b[0], h = b[3] - b[1];
      const x0 = clamp(wx - drag.off[0], V[0] - w * 0.75, V[2] - w * 0.25), y0 = clamp(wy - drag.off[1], V[1] - h * 0.75, V[3] - h * 0.25);
      b[0] = x0; b[1] = y0; b[2] = x0 + w; b[3] = y0 + h;
    } else {
      setPoint(drag.i, [wx - drag.off[0], wy - drag.off[1]]);
    }
    draw();
  });
  const endDrag = () => { const d = drag; drag = null; stage.classList.remove("dragging"); if (d) draw(); return d; };
  canvas.addEventListener("pointerup", (e) => {
    const d = endDrag();
    if (e.pointerType === "mouse" || !down) return;     // the mouse has dblclick
    const [px, py] = local(e);
    if ((d && d.moved) || Math.hypot(px - down.x, py - down.y) > 10) { lastTap = null; return; }
    if (lastTap && e.timeStamp - lastTap.t < 450 && Math.hypot(px - lastTap.x, py - lastTap.y) < 30) {
      lastTap = null;
      toggleAt(px, py, true);
    } else lastTap = { t: e.timeStamp, x: px, y: py };
  });
  canvas.addEventListener("pointercancel", () => { endDrag(); lastTap = null; });
  canvas.addEventListener("pointerleave", () => { if (hover && !drag) { hover = null; canvas.style.cursor = "default"; draw(); } });
  canvas.addEventListener("dblclick", (e) => {
    if (lastType !== "mouse") return;                   // double taps are handled above
    const [px, py] = local(e);
    toggleAt(px, py, false);
  });

  canvas.addEventListener("focus", () => { focused = canvas.matches(":focus-visible"); draw(); });
  canvas.addEventListener("blur", () => { focused = false; draw(); });
  canvas.addEventListener("keydown", (e) => {
    const n = st.wps.length + 2;
    sel = Math.min(sel, n - 1);
    const done = () => { e.preventDefault(); focused = true; anim = null; draw(); };
    if (e.key === "Enter" || e.key === " ") { sel = (sel + (e.shiftKey ? n - 1 : 1)) % n; return done(); }
    if (e.key === "Delete" || e.key === "Backspace") {
      if (sel > 0 && sel < n - 1) { st.wps.splice(sel - 1, 1); edited(); tried.toggle = true; hintText(); }
      return done();
    }
    if (e.key === "+" || e.key === "=" || e.key === "Insert") {
      const path = pathOf(st), i = Math.min(sel, n - 2);
      st.wps.splice(i, 0, [(path[i][0] + path[i + 1][0]) / 2, (path[i][1] + path[i + 1][1]) / 2]);
      sel = i + 1; edited(); tried.toggle = true; hintText();
      return done();
    }
    const step = e.shiftKey ? 0.05 : 0.01;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
    if (!d) return;
    const p = pathOf(st)[sel];
    setPoint(sel, [p[0] + d[0], p[1] + d[1]]);
    edited();
    done();
  });

  /* Sizes come from observers (the stage, the three labels, the status chip), so nothing here forces a layout. */
  let rzq = 0, stageW = 0, stageH = 0;
  const box = (e) => (e.borderBoxSize && e.borderBoxSize[0] ? [e.borderBoxSize[0].inlineSize, e.borderBoxSize[0].blockSize] : [e.contentRect.width, e.contentRect.height]);
  const ro = new ResizeObserver((es) => {
    for (const e of es) {
      const [w, h] = box(e);
      if (e.target === stage) { stageW = e.contentRect.width; stageH = e.contentRect.height; if (!rzq) rzq = requestAnimationFrame(() => { rzq = 0; resize(stageW, stageH); }); }
      else if (e.target === status) { chip.r = Math.max(chip.r, 8 + w); chip.b = 8 + h; }      // the chip sits 8 px from the corner
      else { e.target._w = w; e.target._h = h; }
    }
    draw();
  });
  [stage, status, ...Object.values(lab)].forEach((n) => ro.observe(n));
  readout(measure(st));                                 // the text is there before the first frame, so nothing shifts
}
