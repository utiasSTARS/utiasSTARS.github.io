/* Widget B, "Count the knobs".
 * Top: the singular spectrum of the score matrix S at noise level t, one column per
 * singular direction, with a slider (a knob) under each column.  Knobs move the latent sample
 * along that direction (at t = 15) and decode it: tangent knobs slide the arm along the
 * constraint manifold, normal knobs are pulled back and barely move it. */
import * as THREE from "three";
import { Stage, GhostTrail, stillGhosts } from "./scene.js";
import { loadModel, Robot, ghostMaterial, lerpQ } from "./robot.js";
import { ConstraintGizmo, constraintError } from "./constraint.js";
import { loadKnobs } from "./data.js";
import { el, sv, clamp, segmented, fmtErr, ROBOT_COLOR, reducedMotion, smooth, wrapAngle, showTip, hideTip } from "./util.js";
import { getSelection } from "./state.js";
import { conditionControls, levelSlider } from "./controls.js";
import { tex, setHTML, SvgLabels } from "./math.js";

const NORMAL_BAR = "#b3afba";

/* Joint vector along a sampled 1-D sweep at value x in [-1, 1]. */
/* d-hat of the sample the spectrum is drawn for (falls back to the median curve). */
function dhatAt(K, ti) {
  return K.dhat_anchor_dagger ? K.dhat_anchor_dagger[ti] : K.dhat_dagger[ti];
}
function leadKnob(K) {
  if (K.knobs.lead !== undefined && K.knobs.lead !== null) return K.knobs.lead;
  return K.knobs.dirs.findIndex((d) => d.kind === "tangent");
}

function sweepQ(amps, qs, x, out) {
  const n = qs[0].length;
  out = out || new Float64Array(n);
  let i = 0;
  while (i < amps.length - 2 && x > amps[i + 1]) i++;
  const f = clamp((x - amps[i]) / (amps[i + 1] - amps[i]), 0, 1);
  for (let j = 0; j < n; j++) out[j] = qs[i][j] + wrapAngle(qs[i + 1][j] - qs[i][j]) * f;
  return out;
}

/* Range of a normal knob around zero over which the decoded arm moves continuously (steps of at most SNAP rad).
 * Far out along a normal direction the pull-back can land on another part of the manifold (Franka Line, knobs 4
 * and 9, beyond |0.8|); the arm then holds at the last continuous sample. */
const SNAP = 0.1;
const spans = new WeakMap();
function normalSpan(amps, qs) {
  let s = spans.get(qs);
  if (s) return s;
  const step = (i) => Math.max(...qs[i].map((v, j) => Math.abs(wrapAngle(qs[i + 1][j] - v))));
  const c = amps.reduce((b, a, i) => (Math.abs(a) < Math.abs(amps[b]) ? i : b), 0);
  let lo = c, hi = c;
  while (lo > 0 && step(lo - 1) <= SNAP) lo--;
  while (hi < amps.length - 1 && step(hi) <= SNAP) hi++;
  s = [amps[lo], amps[hi]];
  spans.set(qs, s);
  return s;
}

function pad2dQ(p, a, b, out) {
  const m = p.amps.length, n = p.q[0].length;
  out = out || new Float64Array(n);
  const fx = ((clamp(a, -1, 1) + 1) / 2) * (m - 1), fy = ((clamp(b, -1, 1) + 1) / 2) * (m - 1);
  const i = Math.min(m - 2, Math.floor(fx)), k = Math.min(m - 2, Math.floor(fy));
  const ux = fx - i, uy = fy - k;
  const Q = (ii, kk) => p.q[kk * m + ii];
  for (let j = 0; j < n; j++) {
    const q00 = Q(i, k)[j];
    const q10 = q00 + wrapAngle(Q(i + 1, k)[j] - q00);
    const q01 = q00 + wrapAngle(Q(i, k + 1)[j] - q00);
    const q11 = q00 + wrapAngle(Q(i + 1, k + 1)[j] - q00);
    out[j] = (q00 * (1 - ux) + q10 * ux) * (1 - uy) + (q01 * (1 - ux) + q11 * ux) * uy;
  }
  return out;
}

export async function init(root, manifest) {
  const toolbar = root.querySelector("[data-role=toolbar]");
  const consoleHost = root.querySelector("[data-role=console]");
  const note = root.querySelector("[data-role=console-note]");
  const stageHost = root.querySelector("[data-role=stage]");
  const readout = root.querySelector("[data-role=readout]");
  const side = root.querySelector("[data-role=side]");

  const st = { robot: null, constraint: null, K: null, t: 15, values: [], active: -1, branch: -1, pad: [0, 0], token: 0 };

  conditionControls(toolbar, manifest, (sel) => load(sel.robot, sel.constraint), "knobs");
  const tRow = el("div", { class: "dg-group", style: { flex: "1 1 16rem" } }, toolbar);
  const T_LEVELS = Array.from({ length: 20 }, (_, i) => 5 * i);
  const tSlider = levelSlider(tRow, { label: "Score noise level", symbol: "t", symbolTex: "t", levels: T_LEVELS, value: 15, paper: 15, id: "knobs-t", ticks: [0, 25, 50, 75, 95], onInput: (t) => setT(t) });
  if (manifest.mock) el("span", { class: "dg-tag", title: "Placeholder spectra and knob sweeps until the code release exports the real ones; the d-hat curves are the paper's", text: "preview data" }, toolbar);

  /* ---------------------------------------------------------------- console */
  const specWrap = el("div", { class: "dg-svgwrap" }, consoleHost);
  const svg = sv("svg", { role: "img" }, specWrap);
  const specLabels = new SvgLabels(svg);
  const faderRow = el("div", { class: "dg-faders", role: "group", "aria-label": "One knob per singular direction" }, consoleHost);
  let faders = [];
  const SPEC_H = 132, TOP = 26, BOT = 18;

  function geometry() {
    const W = Math.max(280, Math.round(consoleHost.clientWidth));
    const m = st.K.ambient;
    const col = W / (m + 0.7);
    return { W, m, col };
  }

  function drawSpectrum() {
    const K = st.K;
    const { W, m, col } = geometry();
    const ti = K.t_levels.indexOf(st.t);
    const s = K.spectra[ti];
    const d = Math.floor(dhatAt(K, ti) + 0.5);
    const color = ROBOT_COLOR[st.robot].main;
    svg.setAttribute("viewBox", "0 0 " + W + " " + SPEC_H);
    svg.setAttribute("aria-label", "Singular values of the score matrix at t = " + st.t + ". The largest drop leaves " + d + " small values, the estimated intrinsic dimension.");
    svg.innerHTML = "";
    const colLabels = [];
    const H = SPEC_H - TOP - BOT;
    const y = (v) => TOP + H * (1 - v);
    for (let k = 0; k <= 4; k++) sv("line", { x1: 0, x2: W, y1: y(k / 4), y2: y(k / 4), stroke: k === 0 ? "#dedae3" : "#f2f0f4" }, svg);
    const bw = Math.min(26, col * 0.56);
    s.forEach((v, i) => {
      const x = col * (i + 0.5);
      const tangent = i >= m - d;
      const h = Math.max(1.5, H * v);
      const r = sv("rect", { class: "bar", x: x - bw / 2, y: TOP + H - h, width: bw, height: h, rx: 2, fill: tangent ? color : NORMAL_BAR }, svg);
      const hit = sv("rect", { x: x - col / 2, y: TOP, width: col, height: H + BOT, fill: "transparent" }, svg);
      const html = tex("\\sigma_{" + (i + 1) + "} = " + v.toFixed(3) + "\\,\\sigma_1") + "<br>" + (tangent ? "tangent direction (free)" : "normal direction (pulled back)");
      hit.addEventListener("pointerenter", (e) => showTip(html, e.clientX, e.clientY));
      hit.addEventListener("pointermove", (e) => showTip(html, e.clientX, e.clientY));
      hit.addEventListener("pointerleave", hideTip);
      void r;
      colLabels.push({ x, y: SPEC_H - 8, html: tex(String(i + 1)), cls: "dg-col-label" });
    });
    const xz = col * (m + 0.35);
    sv("rect", { x: xz - bw * 0.35, y: y(0) - 1.5, width: bw * 0.7, height: 1.5, fill: "none", stroke: "#9a96a1", "stroke-dasharray": "2 2" }, svg);
    colLabels.push({ x: xz, y: SPEC_H - 8, html: tex("0^\\dagger"), cls: "dg-col-label" });
    specLabels.set(colLabels, W, SPEC_H);
    const gx = d > 0 ? col * (m - d) : col * m + (xz - col * m) * 0.2;
    const g = sv("g", { class: "gap" }, svg);
    sv("line", { x1: gx, x2: gx, y1: 18, y2: TOP + H }, g);
    sv("text", { x: gx + 5, y: TOP + H * 0.42, text: "gap" }, g);
    if (m - d > 0) sv("text", { class: "brace", x: (col * (m - d)) / 2, y: 12, "text-anchor": "middle", fill: "#8f8b96", text: (m - d) + " normal" }, svg);
    if (d > 0) {
      const narrowCols = col * d < 70;
      sv("text", { class: "brace", x: narrowCols ? W - 2 : col * (m - d / 2), y: 12, "text-anchor": narrowCols ? "end" : "middle", fill: color, text: d + " tangent" }, svg);
    }
  }

  function buildFaders() {
    const K = st.K;
    const { m, col, W } = geometry();
    faderRow.innerHTML = "";
    faderRow.style.gridTemplateColumns = "repeat(" + m + ", " + col + "px)";
    faderRow.style.width = W + "px";
    faders = K.knobs.dirs.map((dir, i) => {
      const f = el("div", {
        class: "dg-fader " + dir.kind,
        tabindex: "0",
        role: "slider",
        "aria-orientation": "vertical",
        "aria-valuemin": "-1",
        "aria-valuemax": "1",
        "aria-valuenow": "0",
        "aria-label": "Knob " + (i + 1) + ", " + dir.kind + " direction"
      }, faderRow);
      const fill = el("div", { class: "fill" }, f);
      const thumb = el("div", { class: "thumb" }, f);
      const setVisual = (x) => {
        const top = 0.6 * 16, h = f.clientHeight - 2 * top;
        const yv = top + ((1 - x) / 2) * h;
        const y0 = top + h / 2;
        thumb.style.top = yv + "px";
        fill.style.top = Math.min(yv, y0) + "px";
        fill.style.height = Math.abs(yv - y0) + "px";
        f.setAttribute("aria-valuenow", x.toFixed(2));
        f.setAttribute("aria-valuetext", (x >= 0 ? "+" : "") + x.toFixed(2));
      };
      const fromEvent = (e) => {
        const r = f.getBoundingClientRect();
        const top = 0.6 * 16, h = r.height - 2 * top;
        return clamp(1 - (2 * (e.clientY - r.top - top)) / h, -1, 1);
      };
      let drag = false;
      f.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        drag = true;
        f.setPointerCapture(e.pointerId);
        f.focus({ preventScroll: true });
        setKnob(i, fromEvent(e));
      });
      f.addEventListener("pointermove", (e) => { if (drag) setKnob(i, fromEvent(e)); });
      f.addEventListener("pointerup", () => { drag = false; });
      f.addEventListener("pointercancel", () => { drag = false; });
      f.addEventListener("dblclick", () => setKnob(i, 0));
      f.addEventListener("keydown", (e) => {
        const v = st.values[i];
        const step = e.shiftKey ? 0.25 : 0.1;
        let x = null;
        if (e.key === "ArrowUp" || e.key === "ArrowRight") x = v + step;
        else if (e.key === "ArrowDown" || e.key === "ArrowLeft") x = v - step;
        else if (e.key === "PageUp") x = v + 0.5;
        else if (e.key === "PageDown") x = v - 0.5;
        else if (e.key === "Home") x = 1;
        else if (e.key === "End") x = -1;
        else if (e.key === "0" || e.key === "Escape") x = 0;
        if (x === null) return;
        e.preventDefault();
        setKnob(i, clamp(x, -1, 1));
      });
      requestAnimationFrame(() => setVisual(0));
      return { el: f, setVisual, dir };
    });
  }

  /* ---------------------------------------------------------------- side panel */
  const est = el("div", { class: "dg-estimate" }, side);
  const estBig = el("div", { class: "big" }, est);
  const estTxt = el("div", { class: "txt" }, est);
  const estCheck = el("div", { class: "check", "aria-hidden": "true" }, est);
  const dhatHost = el("div", { class: "dg-dhat" }, side);
  const dhatCap = el("div", { class: "dg-dhat-cap" }, dhatHost);
  dhatCap.innerHTML = "Estimated dimension " + tex("\\hat d") + " against the noise level " + tex("t") + ' <span class="muted">(click to set ' + tex("t") + ")</span>";
  const dhatWrap = el("div", { class: "dg-svgwrap" }, dhatHost);
  const dhatSvg = sv("svg", { role: "img" }, dhatWrap);
  const dhatLabels = new SvgLabels(dhatSvg);
  const dhatLegend = el("div", { class: "dg-dhat-legend" }, dhatHost);
  const extra = el("div", {}, side);

  function drawEstimate() {
    const K = st.K;
    const ti = K.t_levels.indexOf(st.t);
    const d = dhatAt(K, ti), med = K.dhat_dagger[ti];
    const n = manifest.robots[st.robot].n, k = n - K.id_true;
    const ok = Math.round(d) === K.id_true;
    const f1 = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
    setHTML(estBig, tex("\\hat d = " + f1(d)));
    estTxt.innerHTML = "<b>Score-SVD" + tex("^\\dagger") + "</b> estimate at " + tex("t = " + st.t) +
      "<br>analytical " + tex("n - k = " + n + " - " + k + " = " + K.id_true) +
      '<br><span class="muted">median over targets ' + tex(f1(med)) + "</span>";
    estCheck.textContent = ok ? "✓" : "✗";
    estCheck.classList.toggle("miss", !ok);
    est.setAttribute("aria-label", "Estimated dimension " + d + ", analytical " + K.id_true + (ok ? ", match" : ", mismatch"));
  }

  function drawDhat() {
    const K = st.K;
    const W = Math.max(240, Math.round(dhatHost.clientWidth || 300)), H = 140, L = 28, R = 10, T = 8, B = 24;
    const m = K.ambient;
    const X = (t) => L + (t / 95) * (W - L - R);
    const Y = (d) => T + (1 - d / m) * (H - T - B);
    const color = ROBOT_COLOR[st.robot].main, light = ROBOT_COLOR[st.robot].light;
    dhatSvg.setAttribute("viewBox", "0 0 " + W + " " + H);
    dhatSvg.setAttribute("aria-label", "Estimated intrinsic dimension against the noise level t. Click to set t.");
    dhatSvg.innerHTML = "";
    const grid = sv("g", { class: "grid" }, dhatSvg), axis = sv("g", { class: "axis" }, dhatSvg);
    const labels = [];
    [0, Math.round(m / 2), m].forEach((v) => {
      sv("line", { x1: L, x2: W - R, y1: Y(v), y2: Y(v) }, grid);
      labels.push({ x: L - 6, y: Y(v), anchor: "end", html: tex(String(v)), cls: "dg-axis-label" });
    });
    [0, 25, 50, 75, 95].forEach((t) => labels.push({ x: X(t), y: H - 11, html: tex(String(t)), cls: "dg-axis-label" }));
    dhatLabels.set(labels, W, H);
    void axis;
    sv("line", { x1: X(15), x2: X(15), y1: T, y2: H - B, stroke: "#b9b5c0", "stroke-dasharray": "1 3" }, dhatSvg);
    sv("line", { x1: X(0), x2: X(95), y1: Y(K.id_true), y2: Y(K.id_true), stroke: "#27262b", "stroke-dasharray": "5 4", "stroke-width": 1.2 }, dhatSvg);
    const path = (vals) => vals.map((v, i) => (i ? "L" : "M") + X(K.t_levels[i]).toFixed(1) + "," + Y(v).toFixed(1)).join("");
    if (K.dhat_dagger_band) {
      const [lo, hi] = K.dhat_dagger_band;
      const top = hi.map((v, i) => (i ? "L" : "M") + X(K.t_levels[i]).toFixed(1) + "," + Y(v).toFixed(1)).join("");
      const bot = lo.map((v, i) => "L" + X(K.t_levels[i]).toFixed(1) + "," + Y(v).toFixed(1)).reverse().join("");
      sv("path", { d: top + bot + "Z", fill: light, "fill-opacity": 0.18, stroke: "none" }, dhatSvg);
    }
    sv("path", { d: path(K.dhat_svd), fill: "none", stroke: light, "stroke-width": 1.6, "stroke-dasharray": "1.5 3", "stroke-linecap": "round" }, dhatSvg);
    sv("path", { d: path(K.dhat_dagger), fill: "none", stroke: color, "stroke-width": 2.2, "stroke-linejoin": "round" }, dhatSvg);
    const ti = K.t_levels.indexOf(st.t);
    sv("line", { x1: X(st.t), x2: X(st.t), y1: T - 4, y2: H - B, stroke: "#5b3f9e", "stroke-width": 1.4 }, dhatSvg);
    sv("circle", { cx: X(st.t), cy: Y(dhatAt(K, ti)), r: 4.5, fill: "#fff", stroke: color, "stroke-width": 2 }, dhatSvg);
    dhatLegend.innerHTML =
      '<span class="it"><i style="border-top:2.2px solid ' + color + '"></i><span>Score-SVD' + tex("^\\dagger") + ', median over targets</span></span>' +
      '<span class="it"><i style="border-top:2px dotted ' + light + '"></i>Score-SVD</span>' +
      '<span class="it"><i style="border-top:1.5px dashed #27262b"></i>' + tex("n - k") + '</span>' +
      '<span class="it"><i style="border:2px solid ' + color + ';width:7px;height:7px;border-radius:50%"></i>this sample</span>';
    const pick = (e) => {
      const r = dhatSvg.getBoundingClientRect();
      const t = clamp(((e.clientX - r.left) / r.width * W - L) / (W - L - R) * 95, 0, 95);
      const snapped = 5 * Math.round(t / 5);
      if (snapped !== st.t) { tSlider.set(snapped); setT(snapped); }
    };
    dhatSvg.onpointerdown = (e) => { dhatSvg.setPointerCapture(e.pointerId); pick(e); dhatSvg.onpointermove = pick; };
    dhatSvg.onpointerup = () => { dhatSvg.onpointermove = null; };
  }

  /* ---------------------------------------------------------------- 3D */
  const stage = new Stage(stageHost, { label: "The arm at the decoded knob setting", grid: { half: 1.1 } });
  const robots = {};
  let R = null, gizmo = null;
  const q = new Float64Array(7);

  async function getRobot(name) {
    if (!robots[name]) {
      const model = await loadModel(name);
      const robot = new Robot(model);
      const base = robot.ghost(ghostMaterial(ROBOT_COLOR[name].ghost, 0.16));
      const range = new GhostTrail(stage, robot, ROBOT_COLOR[name].ghost);
      robots[name] = { model, robot, base, range };
    }
    return robots[name];
  }

  function currentQ(out) {
    const K = st.K;
    const n = K.q0.length;
    const base = st.branch >= 0 ? K.branches[st.branch] : K.q0;
    for (let j = 0; j < n; j++) out[j] = base[j];
    const pd = K.pad2d;
    const tangentIdx = K.knobs.dirs.map((d, i) => (d.kind === "tangent" ? i : -1)).filter((i) => i >= 0);
    if (st.active === -2 && pd) {
      const qq = pad2dQ(pd, st.pad[0], st.pad[1]);
      for (let j = 0; j < n; j++) out[j] = qq[j];
      return out;
    }
    if (st.active >= 0) {
      const dir = K.knobs.dirs[st.active];
      const v = st.values[st.active];
      const qq = sweepQ(K.knobs.amps, dir.q, dir.kind === "tangent" ? v : clamp(v, ...normalSpan(K.knobs.amps, dir.q)));
      for (let j = 0; j < n; j++) out[j] = base[j] + wrapAngle(qq[j] - K.q0[j]);
    }
    void tangentIdx;
    return out;
  }

  let stats = null;
  function update() {
    const K = st.K;
    const n = K.q0.length;
    const qq = q.subarray(0, n);
    currentQ(qq);
    R.robot.setQ(qq);
    const ee = R.model.eePosition(qq);
    gizmo.update(ee, stage.camera);
    const err = constraintError(R.model, qq, K.target);
    let dq = 0;
    const base = st.branch >= 0 ? K.branches[st.branch] : K.q0;
    for (let j = 0; j < n; j++) dq += wrapAngle(qq[j] - base[j]) ** 2;
    dq = Math.sqrt(dq);
    if (!stats) {
      readout.innerHTML = "";
      stats = ["Knob", "Joint motion", "Error"].map((label) => {
        const b = el("div", { class: "dg-stat" }, readout);
        el("span", { class: "k", text: label }, b);
        return { b, v: el("span", { class: "v" }, b) };
      });
    }
    const [s1, s2, s3] = stats;
    const act = st.active === -2 ? "tangent pad" : st.active >= 0 ? "#" + (st.active + 1) + " · " + K.knobs.dirs[st.active].kind : "none";
    setHTML(s1.v, '<span class="part">' + act + "</span>");
    setHTML(s2.v, '<span class="part">' + dq.toFixed(2) + "<small>rad</small></span>");
    const parts = [];
    if (err.pos !== null) parts.push('<span class="part">' + fmtErr(err.pos) + "<small>mm</small></span>");
    if (err.orn !== null) parts.push('<span class="part">' + fmtErr(err.orn) + "<small>°</small></span>");
    setHTML(s3.v, parts.join('<span class="sep">·</span>'));
    s3.b.classList.toggle("good", (err.pos === null || err.pos < 5) && (err.orn === null || err.orn < 2));
    stage.invalidate();
  }

  function showRange(i) {
    const K = st.K;
    if (i < 0 || K.knobs.dirs[i].kind !== "tangent") { R.range.clear(); return; }
    const dir = K.knobs.dirs[i];
    const base = st.branch >= 0 ? K.branches[st.branch] : K.q0;
    const dense = Array.from({ length: 41 }, (_, k) => {
      const qq = sweepQ(K.knobs.amps, dir.q, -1 + k / 20);
      return qq.map((v, j) => base[j] + wrapAngle(v - K.q0[j]));
    });
    R.range.set(stillGhosts(R.model, dense).map((k) => dense[k]).concat([dense[40]]));
  }

  /* Return a fader's thumb to zero (animated), without affecting the arm. */
  function release(k) {
    const f = faders[k];
    const start = st.values[k];
    st.values[k] = 0;
    f.el.classList.remove("active");
    if (f.anim) f.anim();
    f.anim = null;
    if (!start || reducedMotion()) { f.setVisual(0); return; }
    let s = 0;
    const fn = (dt) => {
      if (fn.cancelled) return false;
      s = Math.min(1, s + dt / 0.28);
      f.setVisual(start * (1 - smooth(s)));
      return s < 1;
    };
    const stop = stage.animate(fn);
    f.anim = () => { fn.cancelled = true; stop(); };
  }

  function tangentIndices() {
    return st.K.knobs.dirs.map((d, i) => (d.kind === "tangent" ? i : -1)).filter((i) => i >= 0);
  }

  function padDirs() {
    const K = st.K;
    return K.pad2d && K.pad2d.dirs ? K.pad2d.dirs : tangentIndices().slice(0, 2);
  }

  function setKnob(i, x) {
    const prev = st.active;
    if (prev !== i) {
      if (prev >= 0) release(prev);
      if (prev === -2) {
        padDirs().forEach((k) => release(k));
        setPad(0, 0, false);
      }
      showRange(i);
    }
    if (faders[i].anim) { faders[i].anim(); faders[i].anim = null; }
    st.active = i;
    st.values[i] = x;
    faders[i].setVisual(x);
    faders[i].el.classList.add("active");
    update();
  }

  /* 2-D pad for the two leading tangent knobs. */
  let padEl = null, padPuck = null;
  function setPad(a, b, activate = true) {
    st.pad = [a, b];
    if (padPuck) {
      padPuck.style.left = ((a + 1) / 2) * 100 + "%";
      padPuck.style.top = ((1 - b) / 2) * 100 + "%";
      padPuck.setAttribute("aria-valuetext", "knob 1 " + a.toFixed(2) + ", knob 2 " + b.toFixed(2));
    }
    if (!activate) return;
    const t = padDirs();
    const lead2 = t;
    if (st.active >= 0 && lead2.indexOf(st.active) < 0) release(st.active);
    else if (st.active >= 0) faders[st.active].el.classList.remove("active");
    if (st.active !== -2) R.range.clear();
    st.active = -2;
    [0, 1].forEach((k) => {
      const f = faders[t[k]];
      if (f.anim) { f.anim(); f.anim = null; }
      st.values[t[k]] = k ? b : a;
      f.setVisual(k ? b : a);
      f.el.classList.add("active");
    });
    update();
  }

  function buildExtra() {
    const K = st.K;
    extra.innerHTML = "";
    padEl = padPuck = null;
    if (K.branches && K.id_true === 0) {
      const box = el("div", { class: "dg-branches" }, extra);
      el("p", { html: "With an estimate of 0 there is no tangent knob. The only freedom is discrete, a choice among the isolated IK branches of the target pose." }, box);
      const segHost = el("div", {}, box);
      segmented(segHost, [{ value: -1, label: "start" }].concat(K.branches.map((_, i) => ({ value: i, label: String(i + 1), title: "IK branch " + (i + 1) }))), -1, (v) => {
        st.branch = v;
        showRange(st.active);
        update();
      }, { label: "IK branch" });
      return;
    }
    if (K.pad2d) {
      const box = el("div", { class: "dg-pad2" }, extra);
      padEl = el("div", { class: "dg-pad", role: "presentation" }, box);
      const g = sv("svg", { viewBox: "0 0 100 100", preserveAspectRatio: "none" }, padEl);
      sv("line", { x1: 50, x2: 50, y1: 0, y2: 100 }, g);
      sv("line", { x1: 0, x2: 100, y1: 50, y2: 50 }, g);
      padPuck = el("div", { class: "dg-puck", tabindex: "0", role: "slider", "aria-label": "The two leading tangent knobs. Arrow keys move both." }, padEl);
      const t = padDirs();
      el("p", { html: "Drag to turn tangent knobs <b>#" + (t[0] + 1) + "</b> and <b>#" + (t[1] + 1) + "</b> together. The arm explores a two-dimensional patch of the manifold." }, box);
      const from = (e) => {
        const r = padEl.getBoundingClientRect();
        return [clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1), clamp(1 - ((e.clientY - r.top) / r.height) * 2, -1, 1)];
      };
      let drag = false;
      padEl.addEventListener("pointerdown", (e) => { e.preventDefault(); drag = true; padEl.setPointerCapture(e.pointerId); padPuck.focus({ preventScroll: true }); setPad(...from(e)); });
      padEl.addEventListener("pointermove", (e) => { if (drag) setPad(...from(e)); });
      padEl.addEventListener("pointerup", () => { drag = false; });
      padEl.addEventListener("pointercancel", () => { drag = false; });
      padPuck.addEventListener("keydown", (e) => {
        const s = e.shiftKey ? 0.25 : 0.1;
        let [a, b] = st.pad;
        if (e.key === "ArrowRight") a += s; else if (e.key === "ArrowLeft") a -= s;
        else if (e.key === "ArrowUp") b += s; else if (e.key === "ArrowDown") b -= s;
        else if (e.key === "Home" || e.key === "0") { a = 0; b = 0; } else return;
        e.preventDefault();
        setPad(clamp(a, -1, 1), clamp(b, -1, 1));
      });
      setPad(0, 0, false);
    } else {
      el("p", { class: "dg-motion", html: K.id_true === 1 ? "One tangent knob, the self-motion of the redundant arm. The elbow swings while the hand holds its pose." : "" }, extra);
    }
    const reset = el("button", { type: "button", class: "dg-reset", text: "Reset knobs" }, extra);
    reset.addEventListener("click", () => resetAll());
  }

  function resetAll() {
    st.values = st.K.knobs.dirs.map(() => 0);
    st.active = -1;
    faders.forEach((f) => { f.setVisual(0); f.el.classList.remove("active"); });
    if (padPuck) setPad(0, 0, false);
    R.range.clear();
    update();
  }

  function drawNote() {
    const K = st.K;
    const lead = leadKnob(K);
    const color = ROBOT_COLOR[st.robot].main;
    const tDec = K.t_dec !== undefined ? K.t_dec : K.t_canonical;
    if (K.id_true === 0) {
      note.innerHTML = "The slider under each bar is a knob. It moves the latent at noise level " + tex("t = " + tDec) + " along that bar\u2019s singular direction of the score matrix " + tex("S") + " at " + tex("t = 15") + ", and the arm shows the decoded configuration. " +
        "For the UR5 under a full " + tex("\\mathrm{SE}(3)") + " pose all " + K.ambient + " directions are normal, so the model pulls every knob back to the same IK branch. " +
        "The largest drop comes after the last singular value, which Score-SVD" + tex("^\\dagger") + " detects with a virtual zero (" + tex("0^\\dagger") + ").";
    } else {
      note.innerHTML = "The slider under each bar is a knob. It moves the latent at noise level " + tex("t = " + tDec) + " along that bar\u2019s singular direction of the score matrix " + tex("S") + " at " + tex("t = 15") + ", and the arm shows the decoded configuration. " +
        'Along the <b style="color:' + color + '">tangent directions</b> the arm slides over the constraint manifold with its end effector on the constraint. ' +
        'Along a grey <b style="color:#8f8b96">normal direction</b> the model pulls the sample back and the arm barely moves. Try knob ' + (lead + 1) + ".";
    }
  }

  /* ---------------------------------------------------------------- loading */
  async function load(robotName, constraint) {
    if (robotName === st.robot && constraint === st.constraint) return;
    const token = ++st.token;
    const [K, Rr] = await Promise.all([loadKnobs(manifest, robotName, constraint), getRobot(robotName)]);
    if (token !== st.token) return;
    if (R && R !== Rr) stage.scene.remove(R.robot, R.base, R.range.group);
    R = Rr;
    Object.assign(st, { robot: robotName, constraint, K, values: K.knobs.dirs.map(() => 0), active: -1, branch: -1, pad: [0, 0] });
    root.dataset.robot = robotName;
    stage.scene.add(R.robot, R.base, R.range.group);
    R.base.setQ(K.q0);
    R.range.clear();
    if (gizmo) gizmo.dispose(stage.scene);
    const ckey = manifest.constraints.find((c) => c.key === constraint);
    const xs = [R.model.eePosition(K.q0).x];
    K.knobs.dirs.forEach((d) => { if (d.kind === "tangent") [0, 10, 20].forEach((i) => xs.push(R.model.eePosition(d.q[i]).x)); });
    gizmo = new ConstraintGizmo(stage, ckey.gizmo, K.target, ROBOT_COLOR[robotName].main, { span: [Math.min(...xs), Math.max(...xs)] });
    stage.scene.add(gizmo.group);
    if (K.t_levels.indexOf(st.t) < 0) st.t = K.t_canonical;
    drawSpectrum();
    buildFaders();
    drawEstimate();
    drawDhat();
    drawNote();
    buildExtra();

    const pts = [...R.model.keyPoints(K.q0)];
    K.knobs.dirs.forEach((d) => { if (d.kind === "tangent") [0, 5, 10, 15, 20].forEach((i) => pts.push(...R.model.keyPoints(d.q[i]))); });
    (K.branches || []).forEach((b) => pts.push(...R.model.keyPoints(b)));
    stage.fit(pts, { azimuth: robotName === "ur5" ? -0.75 : -0.95, elevation: 0.36, margin: 1.2, pad: 0.08 });

    update();
  }

  function setT(t) {
    st.t = t;
    drawSpectrum();
    drawEstimate();
    drawDhat();
  }

  let lastW = 0;
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      const w = Math.round(consoleHost.clientWidth);
      if (st.K && Math.abs(w - lastW) > 2) {
        lastW = w;
        drawSpectrum();
        const values = st.values.slice(), active = st.active;
        buildFaders();
        faders.forEach((f, i) => { requestAnimationFrame(() => f.setVisual(values[i] || 0)); f.el.classList.toggle("active", i === active); });
        drawDhat();
      }
    }).observe(consoleHost);
  }

  const sel = getSelection();
  await load(sel.robot, sel.constraint);
}
