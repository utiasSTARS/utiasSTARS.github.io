/* gr-search: the search of G-RRT* in 2D on the paper's three abstract problems, as in Figure 5 of the paper, replayed
 * from a recorded run of VAMP's G-RRT* (assets/grrtstar/data/search/<problem>.json, _tools/grrtstar/TRACE_FORMAT.md).
 * The page runs no planner. One panel shows the two trees, their connection and the first solution, then the
 * informed set (dashed grey) with the greedy informed set (green) inside it, the ringed path state with the largest
 * heuristic cost, the samples (toggle) and the path as it improves. The chart beside it plots the run's cost against
 * iterations over the median of 40 seeds and its 99% confidence interval. The scrubber is a cursor on the recording (trace.js): a jump
 * applies or undoes only the events it crosses. */
import { decode, Replay, ellipseOf, expandRLE } from "./trace.js";
import { el, chips, segmented, playButton, rangeFill, liveText, reducedMotion, whileVisible, fetchJSON, DATA, COLORS as K, CHART, chartFont, MATH, showTip, hideTip } from "./util.js";

/* The paper's order and names (Section 7.1). Each file holds the run on its problem's most typical seed. */
const PROBLEMS = [
  { value: "classes", label: "Many homotopy classes" },
  { value: "gap", label: "Narrow passage gap" },
  { value: "enclosure", label: "Double enclosure" }
];
const SPEEDS = [1, 2, 4];
const TICKS = 600;                        // scrubber resolution

/* Timeline in frames at 1x and 60 fps: 0.1 iterations per frame while the trees first reach for each other, then
 * 0.75% more per frame, which moves evenly along the chart's log axis. */
const SLOW = 0.1, GROW = 0.0075, I1 = SLOW / GROW, F1 = I1 / SLOW;
function timeline(cap) {
  const FT = F1 + Math.log(cap / I1) / GROW;
  return { FT, iterAt: (f) => (f >= FT ? cap : Math.floor((f <= F1 ? SLOW * f : I1 * Math.exp(GROW * (f - F1))) + 1e-9)) };
}

const DPR = () => Math.min(window.devicePixelRatio || 1, 2);

/* Colours by role, as in the paper's algorithm figures (CONTRACT, round 4): trees blue from the start and vermilion
 * from the goal, an amber path, a crimson start and a green goal, the informed set dashed grey, the greedy informed
 * set green, near-black obstacles. The chart is G-RRT* green. */
const PAL = {
  treeStart: K.treeStart, treeGoal: K.treeGoal, path: K.path, start: K.start, goal: K.goal, obstacle: K.obstacle,
  greedy: K.greedy, greedyFill: K.greedyFill, informed: K.informed, informedFill: K.informedFill, grrt: K.grrt, muted: K.muted
};
const MEDIAN = "rgba(79,146,22,0.6)", BAND = "rgba(79,146,22,0.15)";   // the 40-seed curve, behind this run's line
const TREE_W = 0.85, TREE_A = 0.72;       // thin, slightly translucent lines, so dense trees stay readable
const SAMPLES = 320;                      // samples shown (the most recent ones)
const fmtCost = (c) => c.toFixed(4);

/* ------------------------------------------------------------------ the panel: three stacked canvases
 * base: white, sampling-set fills, obstacles (redrawn when the solution changes). tree: edges (when the iteration
 * changes). over: set outlines, samples, pruned edges, path, x_max, start and goal (every drawn frame). */

class Panel {
  constructor(host) {
    this.fig = el("figure", { class: "gr-s-panel" }, host);
    const head = el("figcaption", { class: "gr-s-head" }, this.fig);
    el("span", { class: "gr-s-name", html: '<i class="gr-s-dot"></i>G-RRT*' }, head);
    this.stat = liveText(el("span", { class: "gr-s-stat" }, head));
    this.stage = el("div", { class: "gr-s-stage", role: "img" }, this.fig);
    this.cv = [0, 1, 2].map(() => el("canvas", {}, this.stage));
    this.ctx = this.cv.map((c) => c.getContext("2d"));
    this.status = el("span", { class: "gr-status gr-s-status", hidden: true }, this.stage);
    el("div", { class: "gr-legend gr-s-key", "aria-hidden": "true", html:
      '<span class="it"><i class="ell greedy"></i>greedy informed set</span>' +
      '<span class="it"><i class="ell informed"></i>informed set</span>' +
      `<span class="it"><i class="ring" style="color:${PAL.grrt}"></i>${MATH.xmax}</span>` }, this.fig);
    this.size = 0;
    this.dpr = 1;
    this.keys = {};
    this.calm();
  }
  resize() {
    const s = this.stage.clientWidth, dpr = DPR();
    if (!s || (s === this.size && dpr === this.dpr)) return false;
    this.size = s;
    this.dpr = dpr;
    for (const c of this.cv) { c.width = Math.round(s * dpr); c.height = Math.round(s * dpr); }
    this.project();
    return true;
  }
  set(f, d, R) {
    this.p = f.problem;
    this.d = d;
    this.R = R;
    const [x0, y0, x1, y1] = this.p.bounds;
    this.b = { x0, y0, x1, y1 };
    this.stage.setAttribute("aria-label", `Search of G-RRT* on the ${this.p.name} problem, replayed from a recorded VAMP run`);
    this.calm();
    this.flashCost = Infinity;
    this.lastSol = R.sol;
    this.project();
  }
  /* Nothing left over from a jump (scrubbing, a new problem): no fading edges, no glow. */
  calm() { this.fades = []; this.flash = -1e9; }
  /* Pixel positions of every node at the present size, so that a frame only draws. */
  project() {
    this.keys = {};
    if (!this.d || !this.size) return;
    const d = this.d;
    this.px = new Float32Array(d.n);
    this.py = new Float32Array(d.n);
    for (let i = 0; i < d.n; i++) { this.px[i] = this.X(d.x[i]); this.py[i] = this.Y(d.y[i]); }
  }
  X(x) { return ((x - this.b.x0) / (this.b.x1 - this.b.x0)) * this.size * this.dpr; }
  Y(y) { return ((this.b.y1 - y) / (this.b.y1 - this.b.y0)) * this.size * this.dpr; }
  ellipse(g, c) {
    const e = ellipseOf(this.p.start, this.p.goal, c), k = (this.size * this.dpr) / (this.b.x1 - this.b.x0);
    g.beginPath();
    g.ellipse(this.X(e.cx), this.Y(e.cy), e.a * k, Math.max(e.b * k, 0.5), -e.angle, 0, 2 * Math.PI);
  }
  /* The informed set tinted grey, the greedy informed set tinted green over white, then the obstacles. */
  drawBase() {
    const g = this.ctx[0], k = this.size * this.dpr, sol = this.R.solution;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = "#fff";
    g.fillRect(0, 0, k, k);
    if (sol) {
      this.ellipse(g, sol.cost);
      g.fillStyle = PAL.informedFill;
      g.fill();
      this.ellipse(g, sol.greedy);
      g.fillStyle = "#fff";
      g.fill();
      g.fillStyle = PAL.greedyFill;
      g.fill();
    }
    g.fillStyle = PAL.obstacle;
    for (const b of this.p.boxes) {
      const x0 = Math.round(this.X(b[0])), x1 = Math.round(this.X(b[2])), y0 = Math.round(this.Y(b[3])), y1 = Math.round(this.Y(b[1]));
      g.fillRect(x0, y0, Math.max(x1 - x0, 1), Math.max(y1 - y0, 1));
    }
  }
  /* Every existing edge, the goal tree first so that the start tree reads on top. */
  drawTree() {
    const g = this.ctx[1], R = this.R, d = this.d, px = this.px, py = this.py, k = this.size * this.dpr;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, k, k);
    g.lineWidth = TREE_W * this.dpr;
    g.lineCap = "round";
    g.globalAlpha = TREE_A;
    for (const [side, col] of [[1, PAL.treeGoal], [0, PAL.treeStart]]) {
      g.strokeStyle = col;
      g.beginPath();
      for (let i = 2; i < R.n; i++) {
        if (d.side[i] !== side || !R.alive(i)) continue;
        const q = R.parent[i];
        g.moveTo(px[q], py[q]);
        g.lineTo(px[i], py[i]);
      }
      g.stroke();
    }
    g.globalAlpha = 1;
  }
  /* After a step forward while playing: fade the edges of a pruning just passed, and glow the path when it
   * improves by 1% or more. */
  absorb(prev, now) {
    const R = this.R;
    const gone = R.prunedBetween(prev, R.t);
    if (gone.length) {
      const segs = [];
      for (const i of gone) segs.push(this.px[R.parent[i]], this.py[R.parent[i]], this.px[i], this.py[i], this.d.side[i]);
      this.fades.push({ segs, t0: now });
    }
    if (R.sol !== this.lastSol && R.solution && R.solution.cost <= 0.99 * this.flashCost) { this.flash = now; this.flashCost = R.solution.cost; }
  }
  busy(now) { return this.fades.length > 0 || now - this.flash < 700; }
  draw(now, showSamples) {
    if (!this.d || !this.size) return;
    const R = this.R;
    if (this.keys.sol !== R.sol) { this.keys.sol = R.sol; this.drawBase(); }
    if (this.keys.t !== R.t) { this.keys.t = R.t; this.drawTree(); }
    this.lastSol = R.sol;
    const g = this.ctx[2], d = this.dpr, k = this.size * d, sol = R.solution, D = this.d;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, k, k);
    // set outlines: informed set dashed grey, greedy informed set solid green
    if (sol) {
      g.lineWidth = 1.5 * d;
      this.ellipse(g, sol.cost);
      g.strokeStyle = PAL.informed;
      g.setLineDash([5 * d, 4 * d]);
      g.stroke();
      g.setLineDash([]);
      this.ellipse(g, sol.greedy);
      g.strokeStyle = PAL.greedy;
      g.stroke();
    }
    // the most recent samples, coloured by the set they came from (uniform samples before the first solution in
    // the informed set's grey, since the informed set is then the whole space)
    if (showSamples && R.t > 0) {
      const n1 = R.t, n0 = Math.max(0, n1 - SAMPLES);
      for (const greedy of [false, true]) {
        g.fillStyle = greedy ? PAL.greedy : PAL.informed;
        for (let i = n0; i < n1; i++) {
          if ((D.sset[i] === 2) !== greedy) continue;
          g.globalAlpha = 0.25 + 0.65 * ((i - n0 + 1) / (n1 - n0));
          g.beginPath();
          g.arc(this.X(D.sx[i]), this.Y(D.sy[i]), 1.6 * d, 0, 2 * Math.PI);
          g.fill();
        }
      }
      g.globalAlpha = 1;
    }
    // pruned edges fade out
    g.lineWidth = TREE_W * d;
    this.fades = this.fades.filter((f) => now - f.t0 < 900);
    for (const f of this.fades) {
      const a = 1 - (now - f.t0) / 900, s = f.segs;
      for (const side of [0, 1]) {
        g.beginPath();
        for (let j = 0; j < s.length; j += 5) if (s[j + 4] === side) { g.moveTo(s[j], s[j + 1]); g.lineTo(s[j + 2], s[j + 3]); }
        g.strokeStyle = side ? PAL.treeGoal : PAL.treeStart;
        g.globalAlpha = TREE_A * a * a;
        g.stroke();
      }
    }
    g.globalAlpha = 1;
    // the current path: amber, 2.75 px, on a 1 px white casing so that it reads on top of the trees, with a short
    // glow when it improves; then its state with the largest heuristic cost, ringed in green
    if (sol) {
      const P = sol.path;
      g.lineJoin = "round";
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(this.px[P[0]], this.py[P[0]]);
      for (let j = 1; j < P.length; j++) g.lineTo(this.px[P[j]], this.py[P[j]]);
      const t = Math.max(0, 1 - (now - this.flash) / 700);
      if (t > 0) { g.strokeStyle = PAL.path; g.globalAlpha = 0.3 * t; g.lineWidth = (6 + 6 * t) * d; g.stroke(); g.globalAlpha = 1; }
      g.strokeStyle = "#fff";
      g.lineWidth = 4.75 * d;
      g.stroke();
      g.strokeStyle = PAL.path;
      g.lineWidth = 2.75 * d;
      g.stroke();
      g.beginPath();
      g.arc(this.px[sol.xmax], this.py[sol.xmax], 4.4 * d, 0, 2 * Math.PI);
      g.fillStyle = "#fff";
      g.fill();
      g.lineWidth = 2 * d;
      g.strokeStyle = PAL.grrt;
      g.stroke();
    }
    for (const [pt, col] of [[this.p.start, PAL.start], [this.p.goal, PAL.goal]]) {
      g.beginPath();
      g.arc(this.X(pt[0]), this.Y(pt[1]), 5 * d, 0, 2 * Math.PI);
      g.fillStyle = col;
      g.fill();
      g.lineWidth = 2 * d;
      g.strokeStyle = "#fff";
      g.stroke();
    }
  }
  /* The cost of the current path and its greedy cost, as VAMP recorded them. */
  readout(settle) {
    const sol = this.R && this.R.solution;
    this.stat.html(sol
      ? `<span>${MATH.ci} <b>${fmtCost(sol.cost)}</b></span><span>${MATH.fmax} <b>${fmtCost(sol.greedy)}</b></span>`
      : "<i>growing two trees</i>");
    const c = sol ? String(sol.cost) : "";                // the recorded cost, for checks
    if (this.fig.dataset.cost !== c) this.fig.dataset.cost = c;
    if (settle) this.stat.flush();
  }
}

/* ------------------------------------------------------------------ cost chart (log iterations, linear cost)
 * Two canvases: the static layer (grid, the 40-seed median and its confidence band, the optimum) is drawn when the problem or the
 * size changes; the dynamic layer (this run's cost up to the playhead, its first solution, the playhead) per frame. */

class Chart {
  constructor(host) {
    this.side = el("div", { class: "gr-s-side" }, host);
    const inner = el("div", { class: "gr-s-side-in" }, this.side);
    this.wrap = el("div", { class: "gr-s-chart" }, inner);
    this.cs = el("canvas", { "aria-hidden": "true" }, this.wrap);
    this.cd = el("canvas", { role: "img" }, this.wrap);
    this.gs = this.cs.getContext("2d");
    this.gd = this.cd.getContext("2d");
    el("div", { class: "gr-legend gr-s-legend", "aria-hidden": "true", html:
      `<span class="it"><i class="ln" style="color:${PAL.grrt}"></i>this run</span>` +
      `<span class="it"><i class="dot" style="background:${PAL.grrt}"></i>initial solution</span>` +
      '<span class="it"><i class="gr-s-band"></i>median of 40 seeds, 99% CI</span>' }, inner);
    this.t = 0;
    // The mouse reads the chart as it moves; a tap (not a swipe, which scrolls the page) reads it for a moment.
    this.cd.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") this.tip(e); });
    this.cd.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hideTip(); });
    let timer = 0;
    this.cd.addEventListener("click", (e) => {
      this.tip(e);
      clearTimeout(timer);
      if (e.pointerType !== "mouse") timer = setTimeout(hideTip, 2500);
    });
  }
  resize() {
    const w = this.wrap.clientWidth, h = this.wrap.clientHeight, dpr = DPR();
    if (!w || !h || (w === this.w && h === this.h && dpr === this.dpr)) return false;
    this.w = w; this.h = h; this.dpr = dpr;
    for (const c of [this.cs, this.cd]) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    this.font = chartFont(this.cs);
    this.titleFont = chartFont(this.cs, CHART.labelSize, 600);
    this.drawStatic();
    return true;
  }
  /* The cost axis is fixed per problem: from just under the optimum to just over the costliest value shown (this
   * run's first solution, or the 40-seed curve where it starts). */
  set(f, d) {
    const st = f.stats, P = st.planners.grrt, cap = st.iters;
    this.cap = cap;
    this.opt = f.problem.opt;
    this.d = d;
    this.med = expandRLE(P.med, cap);
    this.lo = expandRLE(P.lo, cap);
    this.hi = expandRLE(P.hi, cap);
    this.k = expandRLE(P.k, cap);
    this.n = st.n;
    let top = d.sols.length ? d.sols[0].cost : this.opt * 1.25;
    for (const a of [this.med, this.hi]) for (let i = 1; i <= cap; i++) if (isFinite(a[i]) && a[i] > top) top = a[i];
    this.y0 = this.opt * 0.96;
    this.y1 = this.opt + (top - this.opt) * 1.08;
    this.cd.setAttribute("aria-label", `Path cost of this G-RRT* run against iterations. It decreases from ${fmtCost(d.sols[0].cost)} at its initial solution in iteration ${d.first} to ${fmtCost(d.summary.cost)}. ` +
      `The chart also shows the median of 40 seeds, with a final solution cost of ${fmtCost(P.final.med)}, and its 99% confidence interval. The shortest path has length ${fmtCost(this.opt)}.`);
    this.drawStatic();
  }
  frame() { return { L: 40, R: 10, T: 22, B: 36 }; }
  X(i) { const { L, R } = this.frame(); return L + (this.w - L - R) * (Math.log10(Math.max(i, 1)) / Math.log10(this.cap)); }
  Y(c) { const { T, B } = this.frame(); return T + (this.h - T - B) * (1 - (Math.min(c, this.y1) - this.y0) / (this.y1 - this.y0)); }
  /* A step function of iterations 1..cap (index 0 unused) as corner points, from its first finite value. */
  steps(a) {
    const pts = [], cap = this.cap;
    let i0 = 1;
    while (i0 <= cap && !isFinite(a[i0])) i0++;
    if (i0 > cap) return null;
    pts.push([i0, a[i0]]);
    for (let i = i0 + 1; i <= cap; i++) if (a[i] !== a[i - 1]) pts.push([i, a[i - 1]], [i, a[i]]);
    pts.push([cap, a[cap]]);
    return pts;
  }
  trace(g, pts) { pts.forEach(([i, c], j) => (j ? g.lineTo(this.X(i), this.Y(c)) : g.moveTo(this.X(i), this.Y(c)))); }
  drawStatic() {
    const g = this.gs, W = this.w, H = this.h;
    if (!W || !H || !this.cap) return;
    const { L, R, T, B } = this.frame(), y0 = this.y0, y1 = this.y1;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    g.font = this.font;
    g.textBaseline = "middle";
    g.lineWidth = 1;
    g.fillStyle = CHART.tick;
    g.strokeStyle = CHART.grid;
    // grid and ticks: decades of iterations, round costs
    g.textAlign = "center";
    for (const t of [1, 10, 100, 1000]) {
      const x = Math.round(this.X(t)) + 0.5;
      g.beginPath(); g.moveTo(x, T); g.lineTo(x, H - B); g.stroke();
      g.fillText(t.toLocaleString("en-US"), this.X(t), H - B + 11);
    }
    g.textAlign = "right";
    // round costs, at least three of them on the axis (a finer step on a short chart)
    let step = niceStep((y1 - y0) / Math.max(3, Math.round((H - T - B) / 48)));
    while (Math.floor(y1 / step + 1e-9) - Math.ceil(y0 / step - 1e-9) + 1 < 3) step = finerStep(step);
    const dec = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
    for (let v = Math.ceil(y0 / step) * step; v <= y1 + 1e-9; v += step) {
      const y = Math.round(this.Y(v)) + 0.5;
      g.beginPath(); g.moveTo(L, y); g.lineTo(W - R, y); g.stroke();
      g.fillText(v.toFixed(dec), L - 6, this.Y(v));
    }
    g.font = this.titleFont;
    g.fillStyle = CHART.label;
    g.textAlign = "left";
    g.fillText("Path cost", L, T - 12);
    g.textAlign = "center";
    g.fillText("Iterations", (L + W - R) / 2, H - 9);
    g.font = this.font;
    g.strokeStyle = CHART.axis;
    g.beginPath(); g.moveTo(L, H - B + 0.5); g.lineTo(W - R, H - B + 0.5); g.stroke();
    g.save();
    g.beginPath();
    g.rect(L, T - 1, W - L - R, H - T - B + 1);
    g.clip();
    // the 40-seed band, from where its lower bound is finite (an infinite upper bound reaches the top), and median
    const top = this.steps(this.hi.map((v, i) => (isFinite(this.lo[i]) ? Math.min(v, y1) : Infinity)));
    const bot = this.steps(this.lo);
    if (top && bot) {
      g.beginPath();
      this.trace(g, top.concat(bot.reverse()));
      g.closePath();
      g.fillStyle = BAND;
      g.fill();
    }
    const med = this.steps(this.med);
    if (med) {
      g.beginPath();
      this.trace(g, med);
      g.strokeStyle = MEDIAN;
      g.lineWidth = 1.25;
      g.lineJoin = "round";
      g.stroke();
    }
    // the optimum, labelled with its value at the left end, where no curve has started yet
    g.strokeStyle = PAL.muted;
    g.lineWidth = 1;
    g.setLineDash([4, 3]);
    const yo = Math.round(this.Y(this.opt)) + 0.5;
    g.beginPath(); g.moveTo(L, yo); g.lineTo(W - R, yo); g.stroke();
    g.setLineDash([]);
    g.restore();
    const label = "optimum " + fmtCost(this.opt);
    g.font = this.font;
    g.textAlign = "left";
    g.textBaseline = "alphabetic";
    g.lineJoin = "round";
    g.lineWidth = 3;
    g.strokeStyle = "#fff";
    g.strokeText(label, L + 5, yo - 4);
    g.fillStyle = CHART.tick;
    g.fillText(label, L + 5, yo - 4);
  }
  /* This run up to iteration t: its cost as a step function, a dot on its first solution, and the playhead. */
  draw(t) {
    this.t = t;
    const g = this.gd, W = this.w, H = this.h, d = this.d;
    if (!W || !H || !d) return;
    const { T, B } = this.frame();
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const x = Math.round(this.X(Math.max(t, 1))) + 0.5;
    g.strokeStyle = "rgba(39,38,43,0.28)";
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, T); g.lineTo(x, H - B); g.stroke();
    const S = d.sols;
    if (!S.length || S[0].iter > t) return;
    g.strokeStyle = g.fillStyle = PAL.grrt;
    g.lineWidth = 2.25;
    g.lineJoin = "round";
    g.beginPath();
    g.moveTo(this.X(S[0].iter), this.Y(S[0].cost));
    let c = S[0].cost;
    for (let j = 1; j < S.length && S[j].iter <= t; j++) {
      g.lineTo(this.X(S[j].iter), this.Y(c));
      c = S[j].cost;
      g.lineTo(this.X(S[j].iter), this.Y(c));
    }
    g.lineTo(this.X(Math.max(t, 1)), this.Y(c));
    g.stroke();
    g.beginPath();
    g.arc(this.X(S[0].iter), this.Y(S[0].cost), 3.5, 0, 2 * Math.PI);
    g.fill();
    g.lineWidth = 1.25;
    g.strokeStyle = "#fff";
    g.stroke();
  }
  /* The values at the iteration under the pointer. */
  tip(e) {
    if (!this.d || !this.w) return;
    const r = this.cd.getBoundingClientRect(), { L, R } = this.frame();
    const u = (e.clientX - r.left - L) / (this.w - L - R);
    if (u < -0.03 || u > 1.03) { hideTip(); return; }
    const i = Math.max(1, Math.min(this.cap, Math.round(Math.pow(10, Math.max(0, Math.min(1, u)) * Math.log10(this.cap)))));
    let c = Infinity;
    for (const s of this.d.sols) if (s.iter <= i) c = s.cost;
    const row = (k, v) => `<div class="row"><span>${k}</span><b>${v}</b></div>`;
    const val = (v) => (isFinite(v) ? fmtCost(v) : "none yet");
    let html = `<span class="t">iteration ${i.toLocaleString("en-US")}</span>`;
    if (i <= this.t) html += row(`<i class="ln" style="color:${PAL.grrt}"></i>this run`, val(c));
    html += row(`<i class="ln" style="color:${MEDIAN}"></i>median of 40`, val(this.med[i]));
    if (isFinite(this.lo[i])) html += row("99% CI of median", `${fmtCost(this.lo[i])} to ${isFinite(this.hi[i]) ? fmtCost(this.hi[i]) : "∞"}`);
    html += row("seeds solved", `${this.k[i]} of ${this.n}`);
    showTip(html, e.clientX, e.clientY);
  }
}

function niceStep(x) {
  const e = Math.pow(10, Math.floor(Math.log10(x))), m = x / e;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * e;
}
/* The next smaller step of the 1, 2, 5 sequence. */
function finerStep(step) {
  const e = Math.pow(10, Math.floor(Math.log10(step) + 1e-9)), m = Math.round(step / e);
  return (m === 1 ? 0.5 : m === 2 ? 1 : 2) * e;
}

/* ------------------------------------------------------------------ widget */

export async function init(root) {
  const css = new URL("../css/search.css", import.meta.url).href;
  if (!document.querySelector(`link[href="${css}"]`)) {
    const link = el("link", { rel: "stylesheet", href: css }, document.head);
    await new Promise((r) => { link.onload = link.onerror = r; setTimeout(r, 1500); });
  }
  root.classList.add("gr-search");
  root.innerHTML = "";
  const card = el("div", { class: "gr-card gr-s-card" }, root);
  const probe = document.createElement("canvas");
  if (!probe.getContext || !probe.getContext("2d")) {
    el("p", { class: "gr-s-fail", text: "This animation needs a browser with canvas support." }, card);
    return;
  }

  const reduced = reducedMotion();
  const state = { env: PROBLEMS[0].value, speed: 1, samples: false, playing: !reduced, visible: false, pos: 0 };
  try {                                                // ?search=<problem> for direct links
    const pr = PROBLEMS.find((x) => x.value === new URLSearchParams(location.search).get("search"));
    if (pr) state.env = pr.value;
  } catch (e) { /* ignore */ }

  // controls in focus order: problem, samples, then play, timeline and speed (search.css places them on a grid)
  chips(el("div", { class: "gr-s-problems" }, card), PROBLEMS, state.env, (v) => {
    state.env = v;
    show(v).catch((err) => { console.warn("gr-search", err); panel.status.textContent = "This problem could not be loaded"; panel.status.hidden = false; });
  }, { label: "Problem" });
  const tog = el("label", { class: "gr-check gr-s-samples" }, card);
  const chk = el("input", { type: "checkbox", onchange: () => { state.samples = chk.checked; redraw(); } }, tog);
  tog.append(" Samples");

  const main = el("div", { class: "gr-s-main" }, card);
  const panel = new Panel(main);
  const chart = new Chart(main);

  // transport: play, timeline, seed and iteration
  const tp = el("div", { class: "gr-transport gr-s-transport" }, card);
  const play = playButton({ what: "the search", parent: tp, onClick: (st) => {
    if (st === "replay") state.pos = 0;
    state.playing = st !== "pause";
    sync(); kick();
  } });
  const range = el("input", { type: "range", class: "gr-range", min: 0, max: TICKS, step: 1, value: 0, "aria-label": "Search timeline" }, tp);
  const fill = rangeFill(range);
  const readout = el("span", { class: "gr-readout gr-s-readout" }, tp);
  const seedText = el("span", { class: "gr-s-seedno" }, readout);
  const iterText = liveText(el("span", { class: "gr-s-iter" }, readout));
  let drag = false;
  range.addEventListener("pointerdown", () => { drag = true; });
  for (const t of ["pointerup", "pointercancel", "change"]) range.addEventListener(t, () => { drag = false; kick(); });
  range.addEventListener("input", () => { state.pos = (tl.FT * range.value) / TICKS; panel.calm(); sync(); render(performance.now(), true); kick(); });
  segmented(el("div", { class: "gr-s-speed" }, card), SPEEDS.map((v) => ({ value: v, label: v + "×" })), state.speed, (v) => { state.speed = v; }, { label: "Playback speed" });

  el("p", { class: "gr-caption", text:
    "Until the trees meet, G-RRT* grows exactly as RRT-Connect does, with one tree from the start and one from the goal. " +
    "After that, it samples from the greedy informed set with probability 0.9 and from the informed set otherwise. " +
    "The chart compares this recorded run with the median of 40 seeds and its 99% confidence interval." }, root);

  /* Recorded runs by problem: fetched once (the first when the widget starts, the others while it is idle). */
  const runs = new Map();
  const load = (key) => {
    if (!runs.has(key)) {
      const p = fetchJSON(DATA + "search/" + key + ".json").then((f) => ({ f, d: decode(f.runs.grrt, f.q) }));
      p.catch(() => runs.delete(key));
      runs.set(key, p);
    }
    return runs.get(key);
  };

  let R = null, tl = timeline(4000), raf = 0, last = 0, tick = -1, shown = "", token = 0;

  /* A problem: its recording from the start of the timeline (from its end under reduced motion). */
  async function show(key) {
    const my = ++token;
    const pending = setTimeout(() => {
      if (my !== token) return;
      panel.status.innerHTML = '<span class="gr-spinner"></span>Loading';
      panel.status.hidden = false;
    }, 150);
    let run;
    try { run = await load(key); } finally { clearTimeout(pending); }
    if (my !== token) return;
    panel.status.hidden = true;
    const { f, d } = run;
    R = new Replay(d);
    tl = timeline(d.iterations);
    panel.set(f, d, R);
    chart.set(f, d);
    seedText.textContent = "seed " + f.seed;
    state.pos = reduced ? tl.FT : 0;
    state.playing = !reduced;
    tick = -1;
    sync();
    render(performance.now(), true);
    kick();
  }

  const atEnd = () => state.pos >= tl.FT;
  /* Button and scrubber follow the state. */
  function sync() {
    if (state.playing && atEnd()) state.playing = false;
    const st = state.playing ? "pause" : atEnd() ? "replay" : "play";
    if (st !== shown) play.setState((shown = st));
    const v = Math.round((TICKS * state.pos) / tl.FT);
    if (v === tick) return;
    tick = v;
    range.setAttribute("aria-valuetext", "iteration " + tl.iterAt(state.pos).toLocaleString("en-US"));
    if (!drag) { range.value = v; fill(); }
  }
  /* Move the replay to the timeline's iteration and draw. A jump (scrubbing, a new problem) neither glows nor fades. */
  function render(now, jump) {
    if (!R) return;
    const prev = R.t;
    if (R.seek(tl.iterAt(state.pos)) && !jump && !reduced && R.t > prev) panel.absorb(prev, now);
    panel.draw(now, state.samples);
    chart.draw(R.t);
    const settle = jump || !state.playing;
    panel.readout(settle);
    iterText.html(`iteration <b>${R.t.toLocaleString("en-US")}</b>`);
    if (settle) iterText.flush();
  }
  function frame(now) {
    raf = 0;
    if (!state.visible) { last = 0; return; }
    const dt = last ? Math.min(now - last, 50) : 16.7;
    last = now;
    if (state.playing && !drag) state.pos = Math.min(tl.FT, state.pos + (state.speed * dt) / 16.667);
    sync();
    render(now, false);
    kick();
  }
  function kick() {
    if (raf || !state.visible) return;
    if (state.playing || panel.busy(performance.now())) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  const redraw = () => render(performance.now(), true);
  const fit = () => { const a = panel.resize(), b = chart.resize(); if (a || b) redraw(); };
  if ("ResizeObserver" in window) new ResizeObserver(fit).observe(card); else addEventListener("resize", fit);
  whileVisible(card, (v) => { state.visible = v; if (v) kick(); else { cancelAnimationFrame(raf); raf = 0; last = 0; } });

  panel.resize();
  chart.resize();
  await show(state.env);
  // the other problems, while the reader watches the first
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  idle(() => PROBLEMS.forEach((p) => load(p.value).catch(() => {})));
}
