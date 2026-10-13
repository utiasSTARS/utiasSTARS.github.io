/* gr-dimension: for the same path, the greedy informed set becomes a much smaller part of the informed set as the
 * dimension grows (Round 11 of CONTRACT.md). One chart of log10 rho against n, where
 *   rho = lambda(greedy informed set) / lambda(informed set) = (f/c) ((f^2 - c_min^2) / (c^2 - c_min^2))^((n-1)/2)
 * (the closed form in the proof of the paper's Theorem 3), for the costs c = c_i and f = f^(x_max) of a robot's median
 * initial solution, with markers for G-RRT*'s initial solutions on MotionBenchMaker (data/dimension/mbm.json). The
 * robot buttons set the two costs and n; the dimension slider moves n along the same curve. */
import { el, segmented, showTip, hideTip, hint, rangeFill, throttle, fmtNum, fmtNumHTML, clamp, chartFont, CHART, COLORS, loadKatexCss, MATH } from "./util.js";

/* log10 rho with c_min = 1, C = c_i / c_min, F = f^(x_max) / c_min. */
export function logRho(C, F, n) {
  if (F >= C) return 0;
  if (F <= 1) return -Infinity;
  return Math.log10(F / C) + ((n - 1) / 2) * Math.log10((F * F - 1) / (C * C - 1));
}

/* The paper's palette (page tokens): the G-RRT* green for the curve, the markers and the chosen dimension, the
 * dashed grey of the informed set for its own line at a ratio of 1. */
const COL = { greedy: COLORS.grrt, informed: COLORS.informed, guide: "rgba(79,146,22,0.45)" };
const N_MIN = 2, N_MAX = 64;
const PAPER_N = [4, 8, 16];                            // dimensions of the paper's abstract problems
const ROBOTS = [["ur5", "UR5", 6], ["panda", "Panda", 7], ["fetch", "Fetch", 8], ["baxter", "Baxter", 14]];
const DEFAULT = "panda";
/* The Panda's median initial solution, for a page whose data file did not load. */
const FALLBACK = { id: "panda", label: "Panda", n: 7, pick: { C: 1.7089, F: 1.2759 } };

function loadCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return Promise.resolve();
  return new Promise((res) => {
    const l = document.createElement("link");
    l.rel = "stylesheet"; l.href = href;
    l.onload = l.onerror = () => res();
    document.head.appendChild(l);
    setTimeout(res, 2500);
  });
}

/* 10^lg in the page's number format, as text (canvas, aria) or as HTML. */
const num = (lg) => (isFinite(lg) ? fmtNum(Math.pow(10, lg)) : "0");
const numHTML = (lg) => (isFinite(lg) ? fmtNumHTML(Math.pow(10, lg)) : "0");
const pow10 = (e) => fmtNum(Math.pow(10, e), 1).replace(/^1\s×\s/, "");

/* The ratio as the readout says it: a percentage down to 0.1%, a power of ten below. Returns [html, text]. */
function share(lg) {
  const r = Math.pow(10, lg);
  if (r > 0.995) return ["nearly all of the volume", "nearly all of the volume"];
  if (r >= 0.000995) {
    const p = 100 * r, s = p >= 10 ? p.toFixed(0) : p >= 1 ? p.toFixed(1) : p.toPrecision(2);
    return [s + "% of the volume", s + "% of the volume"];
  }
  return [numHTML(lg) + " of the volume", num(lg) + " of the volume"];
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
  const [, , data] = await Promise.all([
    loadCSS(new URL("../css/dimension.css", import.meta.url).href), mathFonts(),
    fetch(new URL("../data/dimension/mbm.json", import.meta.url)).then((r) => (r.ok ? r.json() : null)).catch(() => null)
  ]);
  const mbm = (data && data.robots) || [];
  const robot = (id) => mbm.find((m) => m.id === id);
  const start = robot(DEFAULT) || FALLBACK;
  root.classList.add("gr-dim");

  /* ---------------------------------------------------------------- the card and the caption */
  const own = root.querySelector(":scope > .gr-caption");
  const card = el("div", { class: "gr-card" });
  root.replaceChildren(card, own || el("p", { class: "gr-caption", html:
    "The curve shows the volume ratio in each dimension for the costs of the selected robot's median initial solution. " +
    "The markers show the volume ratios at the initial solutions of <span class=\"nw\">G-RRT*</span> on each robot's MotionBenchMaker problems." }));

  /* ---------------------------------------------------------------- state and controls */
  const S = { n: start.n, C: start.pick.C, F: start.pick.F, robot: start.id };
  const ctl = el("div", { class: "gr-dim-ctl" }, card);
  const preGroup = el("div", { class: "gr-group gr-dim-pre" }, ctl);
  el("span", { class: "lbl", text: "Robot" }, preGroup);
  const preSeg = segmented(el("div", null, preGroup), ROBOTS.map(([value, label, n]) => ({ value, html: `${label} <small>${n} DoF</small>` })), S.robot,
    (id) => {
      const r = robot(id);
      if (!r) return;
      S.n = r.n; S.C = r.pick.C; S.F = r.pick.F; S.robot = r.id;
      changed();
    }, { label: "Set the dimension and the two costs to a robot's median initial solution of G-RRT*" });
  preSeg.buttons.forEach((b, i) => {
    const r = robot(ROBOTS[i][0]);
    b.disabled = !r;
    if (r) hint(b, `The ${r.label}'s MotionBenchMaker problem with the median volume ratio (${r.pick.problem.replace(/_/g, " ")} problem ${r.pick.index})`, { describe: false });
  });

  const box = el("label", { class: "gr-dim-slider" }, ctl);
  const top = el("span", { class: "top" }, box);
  el("span", { class: "key", html: `dimension ${MATH.n}` }, top);
  const nVal = el("b", { class: "val" }, top);
  const nPos = (n) => (1000 * Math.log(n / N_MIN)) / Math.log(N_MAX / N_MIN);
  const posN = (v) => Math.round(N_MIN * Math.pow(N_MAX / N_MIN, v / 1000));
  const nIn = el("input", { class: "gr-range", type: "range", min: 0, max: 1000, step: 1, "aria-label": "Dimension of the state space" }, box);
  const ticks = el("span", { class: "gr-dim-ticks", "aria-hidden": "true" }, box);
  for (const t of [2, 4, 8, 16, 32, 64]) {
    el("span", { class: PAPER_N.includes(t) ? "paper" : null, text: String(t), style: { left: (nPos(t) / 10).toFixed(2) + "%" } }, ticks);
  }
  const syncRange = rangeFill(nIn);

  /* ---------------------------------------------------------------- the chart */
  const panel = el("div", { class: "gr-dim-panel" }, card);
  el("span", { class: "gr-axis-title gr-dim-yt", text: "Volume of the greedy informed set ÷ volume of the informed set" }, panel);
  const chartWrap = el("div", { class: "gr-dim-canvas-wrap" }, panel);
  const chart = el("canvas", { class: "gr-dim-canvas", role: "img" }, chartWrap);
  el("span", { class: "gr-axis-title gr-dim-xt", html: `Dimension ${MATH.n}` }, chartWrap);
  el("div", { class: "gr-legend gr-dim-legend", html:
    '<span class="it"><i class="ln" style="color:var(--gr-grrt)"></i>the selected robot\'s median initial solution</span>' +
    '<span class="it"><i class="gr-dim-mk"></i><span>initial solutions of <span class="nw">G-RRT*</span></span></span>' }, panel);
  const read = el("p", { class: "gr-dim-read" }, card);
  const live = el("div", { class: "gr-dim-sr", "aria-live": "polite" }, card);

  const cv = { w: 0, h: 0 };
  let dpr = 1, font = "";
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (!font) font = chartFont(chart);
    if (!cv.w) return;
    chart.width = Math.round(cv.w * dpr); chart.height = Math.round(cv.h * dpr);
    drawChart();
  }

  /* Chart geometry: room on the left for the tick labels and below for the ticks and the x title. */
  const M = { l: 44, r: 10, t: 10, b: 38 };
  let yMin = -10, yMinTarget = -10, yAnim = 0;
  const STEPS = [-5, -10, -20, -40, -80, -160];
  const xOf = (n) => M.l + ((Math.log2(n) - 1) / 5) * (cv.w - M.l - M.r);
  const nOfX = (x) => Math.pow(2, 1 + (5 * (x - M.l)) / (cv.w - M.l - M.r));
  const yOf = (lg) => M.t + (lg / yMin) * (cv.h - M.t - M.b);

  function pickRange() {
    let lo = logRho(S.C, S.F, N_MAX);
    for (const r of mbm) lo = Math.min(lo, r.q[0]);
    if (!isFinite(lo)) lo = -160;
    for (const s of STEPS) if (lo >= s * 0.97) return s;
    return STEPS[STEPS.length - 1];
  }

  function drawChart() {
    const { w, h } = cv;
    if (!w) return;
    const ctx = chart.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const x0 = M.l, x1 = w - M.r, y0 = M.t, y1 = h - M.b;
    // grid and ticks
    ctx.lineWidth = 1;
    ctx.font = font;
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.fillStyle = CHART.tick;
    ctx.strokeStyle = CHART.grid;
    const step = Math.abs(yMinTarget) / 5;
    for (let lg = 0; lg >= yMin - 1e-9; lg -= step) {
      const y = Math.round(yOf(lg)) + 0.5;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      ctx.fillText(lg === 0 ? "1" : pow10(Math.round(lg)), x0 - 6, y);
    }
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    for (const n of [2, 4, 8, 16, 32, 64]) {
      const x = Math.round(xOf(n)) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
      ctx.fillText(String(n), x, y1 + 5);
    }
    ctx.strokeStyle = CHART.axis;
    ctx.beginPath(); ctx.moveTo(x0 + 0.5, y0); ctx.lineTo(x0 + 0.5, y1 + 0.5); ctx.lineTo(x1, y1 + 0.5); ctx.stroke();
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, y0 - 6, x1 - x0, y1 - y0 + 12); ctx.clip();
    // the informed set itself, a ratio of 1
    ctx.strokeStyle = COL.informed; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(x0, yOf(0)); ctx.lineTo(x1, yOf(0)); ctx.stroke(); ctx.setLineDash([]);
    ctx.textAlign = "right"; ctx.textBaseline = "top";
    ctx.fillText("informed set", x1 - 3, yOf(0) + 4);
    // the curve
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const n = Math.pow(2, 1 + (5 * i) / 120);
      const x = xOf(n), y = yOf(Math.max(logRho(S.C, S.F, n), yMin * 1.2));
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.strokeStyle = COL.greedy; ctx.lineWidth = 2.4; ctx.lineJoin = "round"; ctx.stroke();
    // G-RRT* initial solutions on MotionBenchMaker: 10th to 90th percentile, quartiles, median
    for (const r of mbm) {
      const x = xOf(r.n), on = S.robot === r.id;
      ctx.strokeStyle = COL.greedy; ctx.globalAlpha = on ? 1 : 0.6;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x, yOf(r.q[0])); ctx.lineTo(x, yOf(r.q[4])); ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x, yOf(r.q[1])); ctx.lineTo(x, yOf(r.q[3])); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(x, yOf(r.q[2]), on ? 4.2 : 3.4, 0, 2 * Math.PI);
      ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
    }
    ctx.restore();
    // the chosen dimension
    const lg = logRho(S.C, S.F, S.n), xn = xOf(S.n), yn = yOf(Math.max(lg, yMin));
    ctx.strokeStyle = COL.guide; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(xn, y1); ctx.lineTo(xn, yn); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(xn, yn, 5.5, 0, 2 * Math.PI);
    ctx.fillStyle = COL.greedy; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#fff"; ctx.stroke();
  }

  function stepY() {
    if (!yAnim) return;
    const t = Math.min(1, (performance.now() - yAnim.t0) / 260);
    const e = 1 - Math.pow(1 - t, 3);
    yMin = yAnim.from + (yMinTarget - yAnim.from) * e;
    if (t >= 1) { yMin = yMinTarget; yAnim = 0; }
    drawChart();
    if (yAnim) requestAnimationFrame(stepY);
  }

  /* ---------------------------------------------------------------- updates */
  const robotName = () => { const r = robot(S.robot); return r ? `the ${r.label}'s median initial solution` : "the chosen costs"; };
  const texts = throttle(() => {
    const lg = logRho(S.C, S.F, S.n), [html, text] = share(lg);
    nVal.textContent = String(S.n);
    read.innerHTML = `In ${MATH.R(S.n)}, the greedy informed set has ${html} of the informed set.`;
    chart.setAttribute("aria-label", `Volume of the greedy informed set divided by the volume of the informed set, against the dimension from 2 to 64, for ${robotName()}. At n = ${S.n} the ratio is ${num(lg)}.`);
    live.textContent = `In ${S.n} dimensions, the greedy informed set has ${text} of the informed set.`;
  });

  function changed() {
    S.n = clamp(Math.round(S.n), N_MIN, N_MAX);
    nIn.value = String(nPos(S.n));
    syncRange();
    [...ticks.children].forEach((t) => t.classList.toggle("on", +t.textContent === S.n));
    preSeg.set(S.robot);
    texts();
    const target = pickRange();
    if (target !== yMinTarget) {
      const from = yMin;
      yMinTarget = target;
      if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) yMin = target;
      else { const idle = !yAnim; yAnim = { t0: performance.now(), from }; if (idle) requestAnimationFrame(stepY); }
    }
    drawChart();
  }

  nIn.addEventListener("input", () => { S.n = posN(+nIn.value); changed(); });
  nIn.addEventListener("keydown", (e) => {
    const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 4, PageDown: -4 }[e.key];
    if (d) { e.preventDefault(); S.n += d; changed(); }
    else if (e.key === "Home" || e.key === "End") { e.preventDefault(); S.n = e.key === "Home" ? N_MIN : N_MAX; changed(); }
  });
  /* A finger that lands on the slider and then scrolls the page leaves the slider where it was. */
  let held = null;
  nIn.addEventListener("pointerdown", (e) => { held = e.pointerType === "touch" ? nIn.value : null; });
  nIn.addEventListener("pointercancel", () => {
    if (held === null || held === nIn.value) return;
    nIn.value = held;
    nIn.dispatchEvent(new Event("input", { bubbles: true }));
  });

  /* The chart: a mouse drags the dimension along it and hovers the markers; a finger only reads the markers with a
   * tap, so that a swipe over the chart scrolls the page and changes nothing. */
  let chartDrag = false, tipOn = false;
  const at = (e) => { const r = chart.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function tipAt(e, reach) {
    const [px, py] = at(e);
    const hit = mbm.find((m) => Math.abs(xOf(m.n) - px) < reach && py > yOf(m.q[4]) - reach && py < yOf(m.q[0]) + reach);
    tipOn = !!hit;
    if (!hit) { hideTip(); return; }
    const row = (k, v) => `<span class="row"><span class="muted">${k}</span><b>${v}</b></span>`;
    const rest = [hit.straight && `${hit.straight} solved by a straight line`, hit.problems - hit.solved && `${hit.problems - hit.solved} unsolved`].filter(Boolean);
    showTip(`<span class="t">${hit.label}, ${hit.n} DoF</span>` + row("median", numHTML(hit.q[2])) +
      row("quartiles", `${numHTML(hit.q[1])} to ${numHTML(hit.q[3])}`) + row("10th percentile", numHTML(hit.q[0])) + row("90th percentile", numHTML(hit.q[4])) +
      row("problems measured", `${hit.count} of ${hit.problems}`) + (rest.length ? `<span class="muted">${rest.join(", ")}</span>` : ""), e.clientX, e.clientY);
  }
  chart.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    chartDrag = true; chart.setPointerCapture(e.pointerId);
    hideTip();
    S.n = nOfX(at(e)[0]); changed();
  });
  chart.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    if (chartDrag) { S.n = nOfX(at(e)[0]); changed(); } else tipAt(e, 7);
  });
  chart.addEventListener("pointerup", (e) => { chartDrag = false; if (e.pointerType !== "mouse") tipAt(e, 14); });
  chart.addEventListener("pointercancel", () => { chartDrag = false; });
  chart.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hideTip(); });
  const dropTip = (e) => { if (tipOn && (!e || e.target !== chart)) { tipOn = false; hideTip(); } };
  addEventListener("scroll", () => dropTip(), { passive: true });
  addEventListener("pointerdown", dropTip, { passive: true, capture: true });
  new IntersectionObserver((es) => { if (!es.some((e) => e.isIntersecting)) dropTip(); }, { rootMargin: "100px" }).observe(root);

  // The canvas size comes from the observer's own measurement, so nothing here forces a layout.
  let rzq = 0;
  new ResizeObserver((es) => {
    for (const e of es) { cv.w = Math.max(1, e.contentRect.width); cv.h = Math.max(1, e.contentRect.height); }
    if (!rzq) rzq = requestAnimationFrame(() => { rzq = 0; size(); });
  }).observe(chartWrap);
  yMinTarget = yMin = pickRange();
  changed();
  texts.flush();
}
