/* Convergence chart of the live demo: path length against time (log scale) for each planner, drawn as
 * steps through the solutions the planner reported, live while it plans. White, inside the card; the
 * drawing follows the width of its host at a fixed height, so text keeps its size in pixels. */
import { sv, showTip, hideTip, fmtNum } from "./util.js";

const HEIGHT = 208;                          // px, at every width: the chart never changes the card's height (live.js CHART_HEIGHT)
const M = { l: 32, r: 12, t: 26, b: 36 };

/* Times and lengths in the page's number format (fmtNum): 9.1 µs, 0.091 ms, 0.31 ms, 12 ms, 1.2 s; 8.71 rad.
 * The unit follows the size, so that no time needs a power of ten (fmtNum writes one below 0.01). */
export function fmtTime(ms, sig = 2) {
  if (!isFinite(ms)) return "–";
  if (ms >= 999.5) return fmtNum(ms / 1000, sig) + " s";
  if (ms < 0.01) return fmtNum(ms * 1000, sig) + " µs";
  return fmtNum(ms, sig) + " ms";
}
export const fmtLen = (x) => fmtNum(x, 3);

const tickLabel = (ms) => fmtTime(ms, 1);

function niceStep(span, n) {
  const raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
}

export class Chart {
  constructor(host, { planners, colors, labels }) {
    this.host = host;
    this.planners = planners;
    this.colors = colors;
    this.labels = labels;
    this.data = null;
    this.svg = sv("svg", { class: "gr-chart", role: "img", "aria-label": "Path length against planning time for each planner" }, host);
    if ("ResizeObserver" in window) new ResizeObserver(() => { if (this.data && this.width() !== this.W) this.draw(this.data); }).observe(host);
    let timer = 0;
    const show = (e) => {
      const html = this.tipAt(e);
      if (!html) { hideTip(); return; }
      showTip(html, e.clientX, e.clientY);
      clearTimeout(timer);
      if (e.pointerType === "touch") timer = setTimeout(hideTip, 2500);
    };
    this.svg.addEventListener("pointermove", (e) => { if (e.pointerType !== "touch") show(e); });
    this.svg.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch") show(e); });
    this.svg.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") hideTip(); });
  }

  width() {
    return Math.max(140, Math.round(this.host.clientWidth) || 360);     // one unit is one pixel, so text keeps its size
  }

  /* Time and each planner's path length under the pointer, as tooltip markup */
  tipAt(e) {
    const s = this.scale;
    if (!s || !this.data) return "";
    const r = this.svg.getBoundingClientRect();
    const x = (e.clientX - r.left) * (this.W / r.width);
    if (x < M.l - 2 || x > this.W - M.r + 2) return "";
    const t = Math.pow(10, s.l0 + (x - M.l) / (this.W - M.l - M.r) * (s.l1 - s.l0));
    const rows = this.planners.map((p) => {
      const d = this.data.series[p];
      if (!d || !d.points.length) return "";
      let c = null;
      for (const [ti, ci] of d.points) { if (ti <= t) c = ci; else break; }
      const end = d.stops ? Infinity : Math.max(d.end || 0, d.points[d.points.length - 1][0]);
      if (c !== null && t > end * 1.02) return "";
      const v = c === null ? '<b class="muted">no solution yet</b>' : `<b>${fmtLen(c)} rad</b>`;
      return `<div class="row"><span><i class="ln" style="color:${this.colors[p]}"></i>${this.labels[p]}</span>${v}</div>`;
    }).join("");
    return rows ? `<span class="t">after ${fmtTime(t)}</span>${rows}` : "";
  }

  /* data: {budget, lower, series: {planner: {points: [[t, c], ...], end, stops}}} */
  draw(data) {
    this.data = data;
    const svg = this.svg;
    const W = this.W = this.width(), H = HEIGHT;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = "";
    // The time axis starts at half the earliest first solution, so that its marker stands clear of the y axis.
    // A running planner may report a time of zero (the browser's clock is coarse): that one does not count.
    let first = Infinity;
    Object.values(data.series).forEach((s) => { if (s.points.length && s.points[0][0] > 0) first = Math.min(first, s.points[0][0]); });
    const tmax = Math.max(data.budget, 1);
    const tmin = Math.min(tmax / 100, isFinite(first) ? Math.max(1e-3, first / 2) : 0.05);
    let cmin = Infinity, cmax = -Infinity;
    Object.values(data.series).forEach((s) => s.points.forEach(([, c]) => { cmin = Math.min(cmin, c); cmax = Math.max(cmax, c); }));
    const empty = !isFinite(cmin);
    if (isFinite(data.lower)) cmin = Math.min(cmin, data.lower);
    if (!isFinite(cmax)) { cmax = isFinite(cmin) ? cmin + 5 : 9; if (!isFinite(cmin)) cmin = 4; }
    if (cmax - cmin < 0.5) cmax = cmin + 0.5;
    // Room under the lowest value for the label of the straight line (it sits below its line, clear of the curves)
    const pad = (cmax - cmin) * 0.08;
    const y0 = Math.max(0, cmin - pad * 1.6), y1 = cmax + pad;
    const l0 = Math.log10(tmin), l1 = Math.log10(tmax);
    this.scale = empty ? null : { l0, l1 };
    const X = (t) => M.l + (Math.log10(Math.min(tmax, Math.max(tmin, t))) - l0) / (l1 - l0) * (W - M.l - M.r);
    const Y = (c) => M.t + (1 - (c - y0) / (y1 - y0)) * (H - M.t - M.b);
    const text = (attrs, cls) => sv("text", Object.assign(cls ? { class: cls } : {}, attrs), svg);

    // Axes and grid; a decade gets a label when the labels have room (every other one on a narrow chart)
    const perDecade = (W - M.l - M.r) / (l1 - l0);
    const every = perDecade >= 46 ? 1 : perDecade >= 23 ? 2 : 3;
    for (let e = -4; e <= 4; e++) {
      [1, 2, 5].forEach((k) => {
        const t = k * Math.pow(10, e);
        if (t < tmin * 0.999 || t > tmax * 1.001) return;
        const x = X(t);
        if (k === 1) {
          sv("line", { class: "grid", x1: x, x2: x, y1: M.t, y2: H - M.b }, svg);
          if ((((e % every) + every) % every) === 0 && x > M.l + 12 && x < W - M.r - 10) text({ x, y: H - M.b + 14, "text-anchor": "middle", text: tickLabel(t) });
        } else if (perDecade >= 46) {
          sv("line", { class: "axis", x1: x, x2: x, y1: H - M.b, y2: H - M.b + 3 }, svg);
        }
      });
    }
    const step = niceStep(y1 - y0, 4);
    for (let c = Math.ceil(y0 / step) * step; c <= y1 + 1e-9; c += step) {
      const y = Y(c);
      sv("line", { class: "grid", x1: M.l, x2: W - M.r, y1: y, y2: y }, svg);
      text({ x: M.l - 6, y: y + 4, "text-anchor": "end", text: fmtNum(c, step < 1 ? 2 : c >= 10 ? 2 : 1) });
    }
    sv("line", { class: "axis", x1: M.l, x2: W - M.r, y1: H - M.b, y2: H - M.b }, svg);
    sv("line", { class: "axis", x1: M.l, x2: M.l, y1: M.t, y2: H - M.b }, svg);
    text({ x: (M.l + W - M.r) / 2, y: H - 5, "text-anchor": "middle", text: "Planning time" }, "gr-axis-title");
    text({ x: 2, y: 12, "text-anchor": "start", text: "Path length (rad)" }, "gr-axis-title");

    // The straight line in joint space bounds every path length from below
    if (isFinite(data.lower) && data.lower >= y0) {
      const y = Y(data.lower);
      sv("line", { stroke: "#9a96a1", "stroke-dasharray": "3 3", x1: M.l, x2: W - M.r, y1: y, y2: y }, svg);
      const below = H - M.b - y >= 13;
      text({ x: M.l + 5, y: below ? y + 11 : y - 5, "text-anchor": "start", text: "straight line" });
    }

    // One step line per planner; RRT-Connect stops at its first solution (dotted afterwards)
    this.planners.forEach((p) => {
      const s = data.series[p];
      if (!s || !s.points.length) return;
      const pts = s.points;
      let d = `M${X(pts[0][0]).toFixed(1)},${Y(pts[0][1]).toFixed(1)}`;
      for (let i = 1; i < pts.length; i++) d += `H${X(pts[i][0]).toFixed(1)}V${Y(pts[i][1]).toFixed(1)}`;
      const end = Math.min(tmax, Math.max(pts[pts.length - 1][0], s.end || pts[pts.length - 1][0]));
      d += `H${X(end).toFixed(1)}`;
      sv("path", { d, fill: "none", stroke: this.colors[p], "stroke-width": 2, "stroke-linejoin": "round" }, svg);
      if (s.stops) {
        const y = Y(pts[pts.length - 1][1]).toFixed(1);
        sv("path", { d: `M${X(end).toFixed(1)},${y}H${X(tmax).toFixed(1)}`, fill: "none", stroke: this.colors[p], "stroke-width": 1.5, "stroke-dasharray": "2 3" }, svg);
      }
      sv("circle", { cx: X(pts[0][0]), cy: Y(pts[0][1]), r: 3.4, fill: "#fff", stroke: this.colors[p], "stroke-width": 1.8 }, svg);
    });
  }
}
