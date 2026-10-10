/* Widget A, "Walk the latent space".
 * The pad is the plane through three DDIM-inverted IK solutions x_a, x_b, x_c at noise
 * level t-bar: x = x_a + u (x_b - x_a) + v (x_c - x_a).  Dragging the puck decodes that
 * latent code (precomputed grid, bilinear and angle-aware) into the arm. */
import * as THREE from "three";
import { Stage, GhostTrail, stillGhosts } from "./scene.js";
import { loadModel, Robot, ghostMaterial } from "./robot.js";
import { ConstraintGizmo, constraintError } from "./constraint.js";
import { loadInterpMeta, loadInterpLevel, segmentQ, gridQ, gridScalar, gridIndex } from "./data.js";
import { el, sv, clamp, segmented, fmtErr, ROBOT_COLOR, reducedMotion, smooth, TBAR } from "./util.js";
import { getSelection } from "./state.js";
import { conditionControls, levelSlider } from "./controls.js";
import { tex, setHTML, SvgLabels } from "./math.js";

const PAIRS = {
  ab: { from: [0, 0], to: [1, 0], label: "a → b", tex: "x_a \\to x_b", a: "a", b: "b" },
  ac: { from: [0, 0], to: [0, 1], label: "a → c", tex: "x_a \\to x_c", a: "a", b: "c" },
  bc: { from: [1, 0], to: [0, 1], label: "b → c", tex: "x_b \\to x_c", a: "b", b: "c" }
};
const PLAY_SECONDS = 3.2;
const DENSE = 121;          /* decoded samples the Play ghosts are picked from (README render style) */
const RASTER = 180;

/* Sequential ramps (light = small). */
const ERROR_STOPS = [[0, "#fdfcff"], [0.3, "#f0ebf9"], [0.45, "#dacff3"], [0.6, "#aa92dc"], [0.78, "#6a4bb0"], [1, "#2a1a50"]];
const JOINT_STOPS = [[0, "#f4f7fb"], [0.5, "#adc2dc"], [1, "#44699a"]];
const BRANCH_TINTS = ["#f4dde1", "#d48f99", "#ecc3c9", "#b65c68", "#f9e8eb", "#c7747f", "#e3aab2", "#a3434f"];

function ramp(stops) {
  const cols = stops.map(([t, c]) => [t, new THREE.Color(c)]);
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let k = 0;
    while (k < cols.length - 2 && t > cols[k + 1][0]) k++;
    const [t0, c0] = cols[k], [t1, c1] = cols[k + 1];
    const f = clamp((t - t0) / (t1 - t0), 0, 1);
    const c = c0.clone().lerp(c1, f);
    lut[3 * i] = Math.round(c.r * 255); lut[3 * i + 1] = Math.round(c.g * 255); lut[3 * i + 2] = Math.round(c.b * 255);
  }
  return lut;
}
const ERROR_LUT = ramp(ERROR_STOPS);
const JOINT_LUT = ramp(JOINT_STOPS);
const hexRGB = (h) => { const c = new THREE.Color(h); return [c.r * 255, c.g * 255, c.b * 255]; };
const BRANCH_RGB = BRANCH_TINTS.map(hexRGB);

function errorScale(unit) {
  return unit === "deg"
    ? { lo: 0.2, hi: 45, ticks: [0.2, 1, 3, 10, 30], unit: "\u00b0" }
    : { lo: 0.5, hi: 150, ticks: [1, 3, 10, 30, 100], unit: "mm" };
}
/* Branch at (u, v): the id with the largest bilinear weight among the four surrounding nodes,
 * which gives smooth boundaries instead of grid staircases. */
function branchAt(level, u, v) {
  const G = level.G;
  const [x, y] = gridIndex(level, u, v);
  const i = Math.min(G - 2, Math.floor(x)), k = Math.min(G - 2, Math.floor(y));
  const fx = x - i, fy = y - k;
  const w = new Map();
  [[i, k, (1 - fx) * (1 - fy)], [i + 1, k, fx * (1 - fy)], [i, k + 1, (1 - fx) * fy], [i + 1, k + 1, fx * fy]].forEach(([a, b, wt]) => {
    const id = level.branch[b * G + a] | 0;
    w.set(id, (w.get(id) || 0) + wt);
  });
  let best = 0, bw = -1;
  w.forEach((wt, id) => { if (wt > bw) { bw = wt; best = id; } });
  return best;
}
const logPos = (x, s) => clamp(Math.log(x / s.lo) / Math.log(s.hi / s.lo), 0, 1);

export async function init(root, manifest) {
  const toolbar = root.querySelector("[data-role=toolbar]");
  const padHost = root.querySelector("[data-role=pad]");
  const legend = root.querySelector("[data-role=legend]");
  const stageHost = root.querySelector("[data-role=stage]");
  const readout = root.querySelector("[data-role=readout]");

  const st = { robot: null, constraint: null, meta: null, level: null, t: null, pair: "ab", u: 0.35, v: 0, onSeg: true, alpha: 0.35, playing: false, token: 0 };

  conditionControls(toolbar, manifest, (sel) => load(sel.robot, sel.constraint), "walk");
  const tRow = el("div", { class: "dg-group", style: { flex: "1 1 15rem" } }, toolbar);
  const tSlider = levelSlider(tRow, { label: "Noise level", symbol: "t̄", symbolTex: "\\bar t", levels: [0, 95], value: 0, paper: 0, id: "walk-t", onInput: (t) => setT(t) });
  const actions = el("div", { class: "dg-group" }, toolbar);
  el("span", { class: "lbl", text: "Path", id: "walk-pair" }, actions);
  const pairHost = el("div", {}, actions);
  const pairSeg = segmented(pairHost, Object.entries(PAIRS).map(([k, p]) => ({ value: k, html: tex(p.tex), title: "Straight latent segment " + p.label })), st.pair, (v) => setPair(v), { label: "Straight segment" });
  const play = el("button", { type: "button", class: "dg-btn-play", "aria-label": "Play the straight latent path" }, actions);
  const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z"/></svg>';
  const PAUSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z"/></svg>';
  const setPlayLabel = (p) => { play.innerHTML = (p ? PAUSE_ICON : PLAY_ICON) + (p ? "Pause" : "Play"); play.setAttribute("aria-label", p ? "Pause" : "Play the straight latent path"); };
  setPlayLabel(false);
  play.addEventListener("click", () => (st.playing ? stopPlay() : startPlay()));
  if (manifest.mock) el("span", { class: "dg-tag", title: "Placeholder data until the code release exports the real latent planes", text: "preview data" }, toolbar);

  /* ---------------------------------------------------------------- pad */
  const canvas = el("canvas", { width: RASTER, height: RASTER, "aria-hidden": "true" }, padHost);
  const ctx = canvas.getContext("2d");
  const overlay = sv("svg", { viewBox: "0 0 1000 1000", preserveAspectRatio: "none", "aria-hidden": "true" }, padHost);
  const status = el("div", { class: "dg-pad-status" }, padHost);
  const anchorLabels = new SvgLabels(overlay);
  const puck = el("div", { class: "dg-puck", tabindex: "0", role: "slider", "aria-label": "Position in the latent plane. Arrow keys move it; Home and End jump to the endpoints." }, padHost);
  const padLabel = el("span", { class: "sr-only", "aria-live": "polite" }, padHost);

  const toX = (u) => ((u - st.meta.range[0]) / (st.meta.range[1] - st.meta.range[0])) * 1000;
  const toY = (v) => 1000 - ((v - st.meta.range[0]) / (st.meta.range[1] - st.meta.range[0])) * 1000;

  function drawOverlay() {
    overlay.innerHTML = "";
    const pts = { a: [0, 0], b: [1, 0], c: [0, 1] };
    sv("path", { class: "tri", d: "M" + toX(0) + "," + toY(0) + " L" + toX(1) + "," + toY(0) + " L" + toX(0) + "," + toY(1) + " Z" }, overlay);
    const P = PAIRS[st.pair];
    const seg = "M" + toX(P.from[0]) + "," + toY(P.from[1]) + " L" + toX(P.to[0]) + "," + toY(P.to[1]);
    sv("path", { class: "seg-halo", d: seg }, overlay);
    sv("path", { class: "seg", d: seg }, overlay);
    Object.entries(pts).forEach(([k, [u, v]]) => {
      const g = sv("g", { class: "anchor" }, overlay);
      sv("circle", { cx: toX(u), cy: toY(v), r: 17 }, g);
    });
    anchorLabels.set(Object.entries(pts).map(([k, [u, v]]) => ({
      x: toX(u) + (k === "b" ? 30 : -30), y: toY(v) + (k === "c" ? -30 : 44),
      anchor: k === "b" ? "start" : "end", html: tex("x_" + k), cls: "dg-anchor-label"
    })), 1000, 1000);
  }

  function drawRaster() {
    const { level, meta } = st;
    const img = ctx.createImageData(RASTER, RASTER);
    const d = img.data;
    const [lo, hi] = meta.range;
    const scale = errorScale(meta.error_unit);
    const q = new Float64Array(meta.n);
    let jLo = Infinity, jHi = -Infinity;
    if (meta.color_mode === "selfmotion") {
      for (let k = 0; k < level.G * level.G; k++) {
        const v = level.gridQ[k * meta.n + meta.n - 1];
        jLo = Math.min(jLo, v); jHi = Math.max(jHi, v);
      }
      st.jointRange = [jLo, jHi];
    }
    for (let y = 0; y < RASTER; y++) {
      const v = hi - ((y + 0.5) / RASTER) * (hi - lo);
      for (let x = 0; x < RASTER; x++) {
        const u = lo + ((x + 0.5) / RASTER) * (hi - lo);
        const o = 4 * (y * RASTER + x);
        let r, g, b;
        if (meta.color_mode === "branch") {
          const id = branchAt(level, u, v);
          [r, g, b] = BRANCH_RGB[id % BRANCH_RGB.length];
        } else if (meta.color_mode === "selfmotion") {
          gridQ(level, u, v, q);
          const i = Math.round(255 * clamp((q[meta.n - 1] - jLo) / Math.max(1e-6, jHi - jLo), 0, 1));
          r = JOINT_LUT[3 * i]; g = JOINT_LUT[3 * i + 1]; b = JOINT_LUT[3 * i + 2];
        } else {
          const e = gridScalar(level, level.gridErr, u, v);
          const i = Math.round(255 * logPos(e, scale));
          r = ERROR_LUT[3 * i]; g = ERROR_LUT[3 * i + 1]; b = ERROR_LUT[3 * i + 2];
        }
        d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
      }
    }
    if (meta.color_mode === "branch") {
      const ids = new Int16Array(RASTER * RASTER);
      for (let y = 0; y < RASTER; y++) for (let x = 0; x < RASTER; x++) {
        const u = lo + ((x + 0.5) / RASTER) * (hi - lo), v = hi - ((y + 0.5) / RASTER) * (hi - lo);
        ids[y * RASTER + x] = branchAt(level, u, v);
      }
      for (let y = 1; y < RASTER; y++) for (let x = 1; x < RASTER; x++) {
        const i = y * RASTER + x;
        if (ids[i] !== ids[i - 1] || ids[i] !== ids[i - RASTER]) {
          d[4 * i] = 255; d[4 * i + 1] = 255; d[4 * i + 2] = 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function drawLegend() {
    const meta = st.meta;
    legend.innerHTML = "";
    if (meta.color_mode === "branch") {
      el("span", { class: "title", text: "Decoded IK branch" }, legend);
      const chips = el("span", { class: "chips" }, legend);
      const used = new Set(Array.from(st.level.branch).map((x) => x | 0));
      Array.from(used).sort((a, b) => a - b).forEach((i) => {
        const c = el("span", { class: "chip" }, chips);
        el("i", { style: { background: BRANCH_TINTS[i % BRANCH_TINTS.length] } }, c);
        c.appendChild(document.createTextNode(String(i + 1)));
      });
      return;
    }
    const wrap = el("div", { class: "bar-wrap" }, legend);
    const bar = el("div", { class: "bar" }, wrap);
    const ticks = el("div", { class: "bar-ticks" }, wrap);
    if (meta.color_mode === "selfmotion") {
      el("span", { class: "title", text: "Joint 7 angle (rad)" }, legend).style.order = -1;
      bar.style.background = "linear-gradient(90deg," + JOINT_STOPS.map(([t, c]) => c + " " + t * 100 + "%").join(",") + ")";
      const [a, b] = st.jointRange;
      [[0, a], [0.5, (a + b) / 2], [1, b]].forEach(([p, v]) => {
        const s = el("span", { text: v.toFixed(2), class: p === 0 ? "first" : p === 1 ? "last" : "" }, ticks);
        s.style.left = p * 100 + "%";
      });
      return;
    }
    const s = errorScale(meta.error_unit);
    el("span", { class: "title", text: (meta.error_unit === "deg" ? "Orientation" : "Position") + " error (" + s.unit + ")" }, legend).style.order = -1;
    bar.style.background = "linear-gradient(90deg," + ERROR_STOPS.map(([t, c]) => c + " " + t * 100 + "%").join(",") + ")";
    s.ticks.forEach((v) => {
      const p = logPos(v, s);
      const sp = el("span", { text: String(v), class: p < 0.02 ? "first" : p > 0.98 ? "last" : "" }, ticks);
      sp.style.left = p * 100 + "%";
    });
  }

  /* ---------------------------------------------------------------- 3D */
  const stage = new Stage(stageHost, { label: "The arm at the decoded configuration", grid: { half: 1.1 } });
  const robots = {};
  let robot = null, trail = null, gizmo = null, endpoints = [], eeTrail = null;
  const q = new Float64Array(7);

  async function getRobot(name) {
    if (!robots[name]) {
      const model = await loadModel(name);
      const r = new Robot(model);
      const tr = new GhostTrail(stage, r, ROBOT_COLOR[name].ghost);
      const eps = ["a", "b", "c"].map(() => r.ghost(ghostMaterial(ROBOT_COLOR[name].ghost, 0.12)));
      robots[name] = { model, robot: r, trail: tr, eps };
    }
    return robots[name];
  }

  /* ---------------------------------------------------------------- state updates */
  function projectAlpha(P, u, v) {
    const dx = P.to[0] - P.from[0], dy = P.to[1] - P.from[1];
    return ((u - P.from[0]) * dx + (v - P.from[1]) * dy) / (dx * dx + dy * dy);
  }

  function configAt(u, v, out) {
    if (st.onSeg && st.pair === "ab") return segmentQ(st.level, st.alpha, out);
    return gridQ(st.level, u, v, out);
  }

  function place(u, v, { snap = true, fromPlay = false } = {}) {
    if (!st.level) return;
    const [lo, hi] = st.meta.range;
    u = clamp(u, lo, hi); v = clamp(v, lo, hi);
    const P = PAIRS[st.pair];
    const a = projectAlpha(P, u, v);
    const pu = P.from[0] + clamp(a, 0, 1) * (P.to[0] - P.from[0]), pv = P.from[1] + clamp(a, 0, 1) * (P.to[1] - P.from[1]);
    const tol = (12 / Math.max(120, padHost.clientWidth)) * (hi - lo);
    st.onSeg = fromPlay || (snap && Math.hypot(u - pu, v - pv) < tol && a > -0.02 && a < 1.02);
    if (st.onSeg) { u = pu; v = pv; st.alpha = clamp(a, 0, 1); }
    st.u = u; st.v = v;
    puck.style.left = (toX(u) / 10) + "%";
    puck.style.top = (toY(v) / 10) + "%";
    puck.classList.toggle("on-seg", st.onSeg);
    const n = st.meta.n;
    const qq = q.subarray(0, n);
    configAt(u, v, qq);
    robot.setQ(qq);
    const ee = robot.model.eePosition(qq);
    gizmo.update(ee, stage.camera);
    const err = constraintError(robot.model, qq, st.meta.target);
    renderReadout(err);
    const pos = "u " + u.toFixed(2) + ", v " + v.toFixed(2);
    puck.setAttribute("aria-valuetext", pos + (st.onSeg ? ", on the segment at alpha " + st.alpha.toFixed(2) : ""));
    padLabel.textContent = "";
    stage.invalidate();
  }

  let stats = null;
  function renderReadout(err) {
    if (!stats) {
      readout.innerHTML = "";
      const box = (label) => {
        const b = el("div", { class: "dg-stat" }, readout);
        const k = el("span", { class: "k" }, b);
        k.innerHTML = label;
        return { b, k, v: el("span", { class: "v" }, b) };
      };
      stats = [box("Error"), box("Latent point"), box("Path")];
    }
    const [e1, e2, e3] = stats;
    const parts = [];
    if (err.pos !== null) parts.push('<span class="part">' + fmtErr(err.pos) + "<small>mm</small></span>");
    if (err.orn !== null) parts.push('<span class="part">' + fmtErr(err.orn) + "<small>°</small></span>");
    setHTML(e1.v, parts.join('<span class="sep">·</span>'));
    const good = (err.pos === null || err.pos < 5) && (err.orn === null || err.orn < 2);
    const bad = (err.pos !== null && err.pos > 20) || (err.orn !== null && err.orn > 8);
    e1.b.classList.toggle("good", good);
    e1.b.classList.toggle("bad", bad);
    setHTML(e2.v, '<span class="part">' + tex("u = " + st.u.toFixed(2)) + ',</span><span class="part">' + tex("v = " + st.v.toFixed(2)) + "</span>");
    setHTML(e3.k, "Path " + tex(PAIRS[st.pair].tex));
    setHTML(e3.v, st.onSeg ? tex("\\alpha = " + st.alpha.toFixed(2)) : '<span style="color:var(--dg-faint)">off the path</span>');
  }

  function setStatus() {
    const paper = st.t === st.meta.t_default;
    setHTML(status, tex("\\bar t = " + st.t) + (paper ? " · paper" : ""));
  }

  /* ---------------------------------------------------------------- loading */
  async function load(robotName, constraint) {
    if (robotName === st.robot && constraint === st.constraint) return;
    const token = ++st.token;
    stopPlay(true);
    const meta = await loadInterpMeta(manifest, robotName, constraint);
    const t = meta.t_default;
    const [R, level] = await Promise.all([getRobot(robotName), loadInterpLevel(manifest, robotName, constraint, meta, t)]);
    if (token !== st.token) return;
    Object.assign(st, { robot: robotName, constraint, meta, level, t });
    root.dataset.robot = robotName;

    if (robot && robot !== R.robot) {
      stage.scene.remove(robot, trail.group);
      endpoints.forEach((g) => stage.scene.remove(g));
    }
    robot = R.robot; trail = R.trail; endpoints = R.eps;
    stage.scene.add(robot, trail.group);
    trail.clear();
    ["a", "b", "c"].forEach((k, i) => {
      endpoints[i].setQ(meta.anchors[k]);
      stage.scene.add(endpoints[i]);
      endpoints[i].visible = true;
    });
    if (gizmo) gizmo.dispose(stage.scene);
    const ckey = manifest.constraints.find((c) => c.key === constraint);
    const xs = [];
    ["a", "b", "c"].forEach((k) => xs.push(R.model.eePosition(meta.anchors[k]).x));
    for (let i = 0; i <= 12; i++) xs.push(R.model.eePosition(segmentQ(level, i / 12)).x);
    gizmo = new ConstraintGizmo(stage, ckey.gizmo, meta.target, ROBOT_COLOR[robotName].main, { span: [Math.min(...xs), Math.max(...xs)] });
    stage.scene.add(gizmo.group);

    tSlider.reset(meta.t_levels, t, meta.t_default);
    drawOverlay();
    drawRaster();
    drawLegend();
    setStatus();

    const pts = [];
    ["a", "b", "c"].forEach((k) => pts.push(...R.model.keyPoints(meta.anchors[k])));
    for (let i = 0; i <= 8; i++) pts.push(...R.model.keyPoints(segmentQ(level, i / 8)));
    pts.push(new THREE.Vector3(...meta.target.pos));
    stage.fit(pts, { azimuth: robotName === "ur5" ? -0.75 : -0.95, elevation: 0.38, margin: 1.24, pad: 0.08 });

    place(st.pair === "ab" ? 0.35 : st.u, st.pair === "ab" ? 0 : st.v);
  }

  async function setT(t) {
    const token = ++st.token;
    const level = await loadInterpLevel(manifest, st.robot, st.constraint, st.meta, t);
    if (token !== st.token) return;
    st.level = level;
    st.t = t;
    drawRaster();
    if (st.meta.color_mode !== "error") drawLegend();
    setStatus();
    if (trail.ghosts.length) buildTrail(1);
    place(st.u, st.v, { snap: st.onSeg });
  }

  function setPair(p) {
    stopPlay(true);
    st.pair = p;
    drawOverlay();
    const P = PAIRS[p];
    place(P.from[0] + 0.35 * (P.to[0] - P.from[0]), P.from[1] + 0.35 * (P.to[1] - P.from[1]));
  }

  /* ---------------------------------------------------------------- play */
  let trailAlpha = [];
  function pathQ(a, out) {
    const P = PAIRS[st.pair];
    if (st.pair === "ab") return segmentQ(st.level, a, out);
    return gridQ(st.level, P.from[0] + a * (P.to[0] - P.from[0]), P.from[1] + a * (P.to[1] - P.from[1]), out);
  }
  /* Six ghosts spaced evenly by link displacement, opacity 0.08 to 0.6; the arm itself is the final pose. */
  function buildTrail() {
    const dense = Array.from({ length: DENSE }, (_, k) => pathQ(k / (DENSE - 1), new Float64Array(st.meta.n)));
    const idx = stillGhosts(robot.model, dense);
    trailAlpha = idx.map((i) => i / (DENSE - 1));
    trail.set(idx.map((i) => dense[i]));
    endpoints.forEach((g) => { g.visible = false; });
  }

  let stopAnim = null;
  function startPlay() {
    stopPlay(true);
    st.playing = true;
    setPlayLabel(true);
    buildTrail();
    const P = PAIRS[st.pair];
    const go = (a) => {
      trail.reveal(trailAlpha.filter((x) => x < a).length);
      st.alpha = a;
      place(P.from[0] + a * (P.to[0] - P.from[0]), P.from[1] + a * (P.to[1] - P.from[1]), { fromPlay: true });
    };
    if (reducedMotion()) {
      go(1);
      trail.reveal(trailAlpha.length);
      st.playing = false;
      setPlayLabel(false);
      return;
    }
    let s = 0;
    const fn = (dt) => {
      if (!st.playing) return false;
      s = Math.min(1, s + dt / PLAY_SECONDS);
      go(s);
      if (s >= 1) {
        trail.reveal(trailAlpha.length);
        st.playing = false;
        setPlayLabel(false);
        return false;
      }
      return true;
    };
    stopAnim = stage.animate(fn);
  }

  function stopPlay(clearTrail) {
    st.playing = false;
    setPlayLabel(false);
    if (stopAnim) { stopAnim(); stopAnim = null; }
    if (clearTrail && trail) {
      trail.clear();
      endpoints.forEach((g) => { g.visible = true; });
    }
  }

  /* ---------------------------------------------------------------- input */
  function fromPointer(e) {
    const r = padHost.getBoundingClientRect();
    const [lo, hi] = st.meta.range;
    const u = lo + ((e.clientX - r.left) / r.width) * (hi - lo);
    const v = hi - ((e.clientY - r.top) / r.height) * (hi - lo);
    return [u, v];
  }
  let dragging = false;
  padHost.addEventListener("pointerdown", (e) => {
    if (!st.level || e.button > 0) return;
    e.preventDefault();
    dragging = true;
    padHost.classList.add("dragging");
    padHost.setPointerCapture(e.pointerId);
    stopPlay(true);
    puck.focus({ preventScroll: true });
    place(...fromPointer(e));
  });
  padHost.addEventListener("pointermove", (e) => { if (dragging) place(...fromPointer(e)); });
  const end = () => { dragging = false; padHost.classList.remove("dragging"); };
  padHost.addEventListener("pointerup", end);
  padHost.addEventListener("pointercancel", end);
  puck.addEventListener("keydown", (e) => {
    if (!st.level) return;
    const step = e.shiftKey ? 0.1 : 0.025;
    const P = PAIRS[st.pair];
    let u = st.u, v = st.v, snap = st.onSeg;
    if (st.onSeg && (e.key === "ArrowRight" || e.key === "ArrowLeft") && st.pair !== "ac") {
      const a = clamp(st.alpha + (e.key === "ArrowRight" ? step : -step) * (st.pair === "bc" ? -1 : 1), 0, 1);
      u = P.from[0] + a * (P.to[0] - P.from[0]); v = P.from[1] + a * (P.to[1] - P.from[1]);
    } else if (e.key === "ArrowRight") u += step;
    else if (e.key === "ArrowLeft") u -= step;
    else if (e.key === "ArrowUp") { v += step; snap = false; }
    else if (e.key === "ArrowDown") { v -= step; snap = false; }
    else if (e.key === "Home") { u = P.from[0]; v = P.from[1]; snap = true; }
    else if (e.key === "End") { u = P.to[0]; v = P.to[1]; snap = true; }
    else return;
    e.preventDefault();
    stopPlay(true);
    place(u, v, { snap });
  });

  const sel = getSelection();
  await load(sel.robot, sel.constraint);
}
