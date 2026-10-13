/* Shared pieces of the results widgets (gr-vamp-results, gr-vamp-eps0, gr-ompl-results): legend keys that
 * toggle planners, the readout and table cells (best value bold), and a stage of one fixed height that holds
 * either a time chart (stacked panels on a shared logarithmic time axis, crosshair readout for mouse, touch and
 * keyboard, SVG drawn at the container's pixel width) or the same numbers as a table. Controls, tooltip, table
 * and chart text come from the page's UI kit (page.css, util.js); this file adds only what the charts need.
 * No chart library. */
import { el, sv, fmtNum, hint } from "./util.js";

/* Add a widget stylesheet once. Resolves when it has loaded (or failed). */
export function ensureCSS(href) {
  const url = new URL(href, import.meta.url).href;
  if ([...document.querySelectorAll("link[rel=stylesheet]")].some((l) => l.href === url)) return Promise.resolve();
  return new Promise((resolve) => {
    const l = el("link", { rel: "stylesheet", href: url }, document.head);
    l.addEventListener("load", resolve);
    l.addEventListener("error", resolve);
  });
}

export const dataURL = (path) => new URL("../data/" + path, import.meta.url).href;

export async function getJSON(path) {
  const r = await fetch(dataURL(path));
  if (!r.ok) throw new Error(path + ": " + r.status);
  return r.json();
}

let uid = 0;
const nextId = (p) => p + "-" + ++uid;

/* Line sample in a planner's colour and dash, as in the page's legends (.ln, .ln.dashed, .ln.dotted). */
export const lineSwatch = (p) => '<i class="ln' + (p.dash === "dotted" ? " dotted" : p.dash ? " dashed" : "") + '" style="color:' + p.color + '"></i>';

/* Call fn when the width of `node` changes (not when it is first seen), and when a web font arrives
 * (text may then wrap differently, and the heights a widget has reserved must follow). */
export function onWidth(node, fn) {
  let w = Math.round(node.getBoundingClientRect().width);
  new ResizeObserver(() => {
    const now = Math.round(node.getBoundingClientRect().width);
    if (now && now !== w) { w = now; fn(); }
  }).observe(node);
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", () => { if (node.isConnected) fn(); });
}

/* Legend keys that show and hide planners (at least one stays on): the kit's .gr-key buttons in a
 * .gr-legend. With `tiles`, each key is a tile (.gr-res-tile) whose second part setBody(id, html) fills
 * (the VAMP widget puts its headline numbers there). Hovering or focusing a key calls onHover(id),
 * leaving it onHover(null). enable(false) makes the keys inactive (in the table view). */
export function keys(host, planners, visible, onChange, onHover, tiles = false) {
  host.innerHTML = "";
  host.classList.add("gr-legend", "gr-res-keys");
  host.classList.toggle("tiles", tiles);
  host.setAttribute("role", "group");
  host.setAttribute("aria-label", "Planners shown in the chart");
  const bodies = new Map(), buttons = [];
  planners.forEach((p) => {
    const b = el("button", { type: "button", class: tiles ? "gr-res-tile" : "gr-key", "aria-pressed": String(visible.has(p.id)) }, host);
    if (tiles) {
      el("span", { class: "it", html: lineSwatch(p) + "<span>" + p.label + "</span>" }, b);
      bodies.set(p.id, el("span", { class: "body" }, b));
    } else b.innerHTML = lineSwatch(p) + "<span>" + p.label + "</span>";
    buttons.push(b);
    hint(b, "Show or hide " + p.label + " in the chart", { describe: false });
    if (onHover) {
      b.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && !b.disabled && visible.has(p.id) && onHover(p.id));
      b.addEventListener("pointerleave", () => onHover(null));
      b.addEventListener("focus", () => b.matches(":focus-visible") && visible.has(p.id) && onHover(p.id));
      b.addEventListener("blur", () => onHover(null));
    }
    b.addEventListener("click", () => {
      if (visible.has(p.id)) {
        if (visible.size === 1) return;
        visible.delete(p.id);
        if (onHover) onHover(null);
      } else visible.add(p.id);
      b.setAttribute("aria-pressed", String(visible.has(p.id)));
      onChange();
    });
  });
  return {
    setBody: (id, html) => { const n = bodies.get(id); if (n) n.innerHTML = html; },
    enable: (on) => { host.classList.toggle("off", !on); buttons.forEach((b) => { b.disabled = !on; }); }
  };
}

/* ---------------------------------------------------------------- formatting */

/* A time in ms with three significant digits and its unit: 0.12 ms, 2.73 ms, 17.8 ms, 743 ms, 1.22 s. */
export function fmtMs(ms) {
  if (ms === null || ms === undefined || !isFinite(ms)) return "–";
  if (ms < 0.1) return fmtNum(ms * 1000, 2) + " µs";
  if (ms < 1000) return fmtNum(ms, ms < 1 ? 2 : 3) + " ms";
  return fmtNum(ms / 1000, 3) + " s";
}

/* Tick label for a time in ms (decades and the budget): 10 µs, 1 ms, 100 ms, 2 s. */
export function tickMs(ms) {
  if (ms < 1) return Math.round(ms * 1000) + " µs";
  if (ms < 1000) return Math.round(ms) + " ms";
  return +(ms / 1000).toPrecision(3) + " s";
}

/* A number with exactly `d` decimals in the page's format (0.442, 13.723, 1.004). */
export function dec(v, d = 3) {
  if (v === null || v === undefined || !isFinite(v)) return "–";
  return fmtNum(v, Math.max(1, d + 1 + Math.floor(Math.log10(Math.max(Math.abs(v), 1e-9)))));
}

/* A percentage of runs: whole numbers as they are, others with one decimal that never rounds to 0 or 100
 * (100%, 94.2%, 99.6%, 0.1%). */
export function pctText(x) {
  if (x === null || x === undefined || !isFinite(x)) return "–";
  if (Math.abs(x - Math.round(x)) < 1e-9) return Math.round(x) + "%";
  let s = x.toFixed(1);
  if (s === "100.0") s = "99.9";
  if (s === "0.0") s = "0.1";
  return s + "%";
}

/* ---------------------------------------------------------------- cells with the best value in bold
 * A cell is { t: text as shown, k: the number as shown } or null (no value). In each column the best value
 * at the precision shown is bold, and so is every value that ties with it, but only while at most half of the
 * rows share it (seven planners at 100% or at 0.010 s single out none). */
export const cell = {
  pct: (x) => (x === null || x === undefined || !isFinite(x) ? null : { t: pctText(x), k: parseFloat(pctText(x)) }),
  cost: (v) => (v === null || v === undefined || !isFinite(v) ? null : { t: dec(v), k: +dec(v).replace(/,/g, "") }),
  ms: (v) => (v === null || v === undefined || !isFinite(v) ? null : { t: fmtMs(v), k: +(+v).toPrecision(v < 1 ? 2 : 3) })
};
/* The best number in a column of cells ("max" or "min"), the value to make bold. null when no cell has a
 * value or when more than half of the rows (cells, with or without a value) share the best value. */
export function bestOf(cells, dir) {
  const ks = cells.filter((c) => c).map((c) => c.k);
  if (!ks.length) return null;
  const best = dir === "max" ? Math.max(...ks) : Math.min(...ks);
  return ks.filter((k) => k === best).length <= cells.length / 2 ? best : null;
}
const isBest = (c, best) => c && best !== null && c.k === best;
/* The row header of a planner in a results table: its dot and its name (the planner's identity, as in the
 * kit's legends). */
export const nameCell = (p) => '<th scope="row"><span class="gr-legend"><span class="it"><i class="dot" style="background:' + p.color + '"></i><span>' + p.label + "</span></span></span></th>";
/* A table cell: <td>, bold (.best) when it holds the best value of its column; `none` stands for no value. */
export const td = (c, best, none = "–") => "<td" + (isBest(c, best) ? ' class="best"' : "") + ">" + (c ? c.t : none) + "</td>";

/* The readout of a chart at one time: the time, a header row and one row per planner in the order given.
 * cols: [{ head (html), dir: "max" | "min" }]; rows: [{ name (html), cells: [cell | null] }]. Values are in
 * normal weight, and the best value of each column (ties included, see bestOf) is bold. */
export function readoutHTML(title, cols, rows, none = "no median") {
  const best = cols.map((c, j) => bestOf(rows.map((r) => r.cells[j]), c.dir));
  let html = '<span class="t">' + title + '</span><div class="gr-res-tg c' + (cols.length + 1) + '"><span></span>' +
    cols.map((c) => '<span class="h muted">' + c.head + "</span>").join("");
  rows.forEach((r) => {
    html += '<span class="n">' + r.name + "</span>" + r.cells.map((c, j) => (!c ? '<span class="muted">' + none + "</span>" : isBest(c, best[j]) ? "<b>" + c.t + "</b>" : "<span>" + c.t + "</span>")).join("");
  });
  return html + "</div>";
}

/* "FCIT*", "RRT* and BIT*", "RRT*, BIT* and AIT*". */
export function listOf(labels) {
  return labels.length <= 1 ? labels.join("") : labels.slice(0, -1).join(", ") + " and " + labels[labels.length - 1];
}

/* Evenly spaced round ticks that cover [lo, hi]: the first tick is at or below lo and the last at or
 * above hi, so that an axis drawn from the first to the last tick is labelled at both ends. */
export function niceTicks(lo, hi, count = 5) {
  const span = hi - lo;
  if (!(span > 0)) return { step: 1, ticks: [lo], decimals: 0 };
  const raw = span / count;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
  const ticks = [];
  for (let v = Math.floor(lo / step + 1e-9) * step; v < hi + step * (1 - 1e-9); v += step) ticks.push(+v.toFixed(10));
  return { step, ticks, decimals: Math.max(0, -Math.floor(Math.log10(step) + 1e-9)) };
}

/* ---------------------------------------------------------------- stage: chart or table, one height
 * spec = {
 *   x: { lo, hi },                  log10 of the axis ends, in the unit of `tick`
 *   t: [...],                       log10 times of the samples (shared by every series)
 *   tick: (v) => label,             label for a decade tick v (linear units)
 *   extraTicks: [v],                labelled ticks besides the decades (the budget)
 *   panels: [{ label, hint, y: { lo, hi, ticks: [v], fmt: (v) => "" },
 *              endAt,               a line stops, with a dot, where it first reaches this value
 *              bandOpacity,         fill opacity of the bands (the paper's plots use 0.15)
 *              series: [{ id, color, dash, width, values: [v|null], band: [[lo|null], [hi|null]],
 *                         whisker: [lo, hi] }],      interval drawn as an error bar at the right end
 *              notes: ["text"], notesAt }],  muted lines at the top right ("left": top left) of the panel
 *   readout: (i, narrow) => html,   content of the readout at sample i
 *   aria: "chart description"
 * }
 * The panel heights are fixed when the chart is made, so the chart has one height for a given width. The
 * table shown in its place (showTable) takes its own natural height: the reader asked for it, and the slot
 * reserves only the chart, the first view. */
export class TimeChart {
  constructor(host, heights = [130, 230]) {
    this.heights = heights;
    this.stage = el("div", { class: "gr-res-stage" }, host);
    this.wrap = el("div", { class: "gr-res-plot" }, this.stage);
    this.svg = sv("svg", { class: "gr-chart", role: "img", tabindex: "0", focusable: "true" }, this.wrap);
    this.tip = el("div", { class: "gr-tip in wide", "aria-hidden": "true" }, this.wrap);
    this.live = el("div", { class: "gr-res-sr", "aria-live": "polite" }, this.wrap);
    this.tableBox = el("div", { class: "gr-res-tablebox", hidden: true }, this.stage);
    this.spec = null;
    this.index = -1;
    this.width = 0;
    this.focus = null;
    this.clip = nextId("gr-res-clip");
    const ro = new ResizeObserver(() => {
      const w = Math.round(this.stage.clientWidth);
      if (w && w !== this.width) this.draw();
    });
    ro.observe(this.stage);
    this.bindPointer();
    this.stage.style.height = this.size().H + "px";
  }

  set(spec) {
    this.spec = spec;
    this.draw();
  }

  /* The table shown in place of the chart, at its natural height (the stage loses the chart's height). */
  setTable(html) { this.tableBox.innerHTML = html; }
  showTable(on) {
    this.tableBox.hidden = !on;
    this.wrap.hidden = on;
    if (on) this.hide();
    this.draw();
  }

  layout() {
    const w = Math.max(240, Math.round(this.stage.clientWidth || 640));
    const narrow = w < 520;
    return { w, narrow, m: { l: narrow ? 36 : 44, r: narrow ? 8 : 12, title: 20, gap: 14, axis: 42 } };
  }

  /* Panel heights and the height of the stage: they depend on the width only, never on the data shown. */
  size() {
    const { narrow, m } = this.layout();
    const hs = this.heights.map((h) => (narrow ? Math.round(h * 0.82) : h));
    const H = hs.reduce((a, h, i) => a + m.title + h + (i ? m.gap : 0), 0) + m.axis;
    return { hs, H };
  }

  draw() {
    const spec = this.spec;
    const { w, narrow, m } = this.layout();
    this.width = w;
    this.narrow = narrow;
    const { hs, H } = this.size();
    this.stage.style.height = this.wrap.hidden ? "" : H + "px";   // a table shown in its place sets its own height
    if (!spec || this.wrap.hidden) return;
    const svg = this.svg;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const pw = w - m.l - m.r;
    const X = (lv) => m.l + ((lv - spec.x.lo) / (spec.x.hi - spec.x.lo)) * pw;
    this.X = X;
    let y0 = 0;
    this.boxes = [];
    const defs = sv("defs", {}, svg);
    spec.panels.forEach((P, pi) => {
      const ph = hs[pi];
      const top = y0 + m.title, bot = top + ph, pad = 7;   // the value range sits 7px inside the frame
      const Y = (v) => bot - pad - ((v - P.y.lo) / (P.y.hi - P.y.lo)) * (ph - 2 * pad);
      this.boxes.push({ top, bot, Y });
      const g = sv("g", {}, svg);
      sv("text", { class: "gr-axis-title", x: 0, y: y0 + 13, text: P.label }, g);
      if (P.hint) sv("text", { class: "gr-res-hint", x: w - m.r, y: y0 + 13, "text-anchor": "end", text: P.hint }, g);
      // grid: decades and their subdivisions on the time axis, the value ticks
      const grid = sv("g", { class: "grid" }, g);
      for (let d = Math.floor(spec.x.lo); d <= Math.ceil(spec.x.hi); d++) {
        for (let k = 1; k < 10; k++) {
          const lv = d + Math.log10(k);
          if (lv < spec.x.lo - 1e-9 || lv > spec.x.hi + 1e-9) continue;
          sv("line", { class: k === 1 ? null : "minor", x1: X(lv), x2: X(lv), y1: top, y2: bot }, grid);
        }
      }
      P.y.ticks.forEach((v) => sv("line", { x1: m.l, x2: w - m.r, y1: Y(v), y2: Y(v) }, grid));
      sv("rect", { class: "gr-res-frame", x: m.l, y: top, width: pw, height: ph }, g);
      const ax = sv("g", { class: "axis" }, g);
      P.y.ticks.forEach((v) => sv("text", { x: m.l - 6, y: Y(v) + 4, "text-anchor": "end", text: P.y.fmt(v) }, ax));
      // series, clipped to the panel
      const cid = this.clip + "-" + pi;
      sv("rect", { x: m.l, y: top, width: pw + 1, height: ph }, sv("clipPath", { id: cid }, defs));
      const sg = sv("g", { "clip-path": "url(#" + cid + ")" }, g);
      const ends = P.series.map((S) => (P.endAt === undefined ? -1 : S.values.findIndex((v) => v !== null && v >= P.endAt)));
      P.series.forEach((S, k) => {
        if (!S.band) return;
        const d = bandPath(spec.t, S.band[0], S.band[1], X, Y, ends[k]);
        if (d) sv("path", { class: "gr-res-band", d, fill: S.color, "fill-opacity": P.bandOpacity || 0.13, "data-id": S.id }, sg);
      });
      P.series.forEach((S, k) => {
        const d = linePath(spec.t, S.values, X, Y, ends[k]);
        if (d) sv("path", { class: "gr-res-line", d, stroke: S.color, "stroke-width": S.width || 1.7, "stroke-dasharray": S.dash || null, "data-id": S.id }, sg);
      });
      // marks above the lines: the dot where a line ends, the interval bar of a planner with one solution
      const mg = sv("g", {}, g);
      P.series.forEach((S, k) => {
        if (ends[k] >= 0) sv("circle", { class: "gr-res-end", cx: X(spec.t[ends[k]]), cy: Y(S.values[ends[k]]), r: 3.2, fill: S.color, "data-id": S.id }, mg);
        if (S.whisker && ok(S.whisker[0]) && ok(S.whisker[1])) {
          const x = w - m.r - 6, a = Math.max(top + 1, Y(S.whisker[1])), b = Math.min(bot - 1, Y(S.whisker[0]));
          sv("path", { class: "gr-res-whisker", d: "M" + (x - 4) + " " + a.toFixed(1) + "h8M" + x + " " + a.toFixed(1) + "V" + b.toFixed(1) + "M" + (x - 4) + " " + b.toFixed(1) + "h8", stroke: S.color, "data-id": S.id }, mg);
        }
      });
      (P.notes || []).forEach((text, k) => sv("text", { class: "gr-res-note", x: P.notesAt === "left" ? m.l + 10 : w - m.r - 16, y: top + 16 + k * 14, "text-anchor": P.notesAt === "left" ? "start" : "end", text }, g));
      y0 = bot + (pi === spec.panels.length - 1 ? 0 : m.gap);
    });
    // time axis below the last panel
    const ax = sv("g", { class: "axis" }, svg);
    const ticks = [];
    for (let d = Math.ceil(spec.x.lo - 1e-9); d <= Math.floor(spec.x.hi + 1e-9); d++) ticks.push(d);
    (spec.extraTicks || []).forEach((v) => {
      const lv = Math.log10(v);
      if (!ticks.some((t) => Math.abs(t - lv) < 0.2)) ticks.push(lv);
    });
    const every = narrow && ticks.length > 5 ? 2 : 1;
    ticks.sort((a, b) => a - b);
    // Labels from the right, so that the last one (the budget) always shows. A decade label goes when it lies within
    // 44 px of a budget between two decades (the two would read as one). When the last tick is itself a decade, the
    // labels are evenly spaced, and one goes only if it would touch the label to its right.
    const lastLv = ticks[ticks.length - 1], lastIsDecade = Math.abs(lastLv - Math.round(lastLv)) < 1e-9;
    let rightNeighbour = Infinity;   // left edge of the nearest label placed to the right
    for (let k = ticks.length - 1; k >= 0; k--) {
      const lv = ticks[k], last = k === ticks.length - 1;
      if ((ticks.length - 1 - k) % every) continue;
      if (!last && !lastIsDecade && X(lastLv) - X(lv) < 44) continue;
      const label = sv("text", { x: X(lv), y: y0 + 17, "text-anchor": last && X(lv) > w - m.r - 20 ? "end" : X(lv) < m.l + 12 ? "start" : "middle", text: spec.tick(Math.pow(10, lv)) }, ax);
      if (lastIsDecade) {
        const b = label.getBBox();
        if (!last && b.x + b.width > rightNeighbour - 2) { label.remove(); continue; }   // 2 px apart at the least
        rightNeighbour = b.x;
      }
      sv("line", { x1: X(lv), x2: X(lv), y1: y0, y2: y0 + 4 }, ax);
    }
    sv("text", { class: "gr-axis-title", x: m.l + pw / 2, y: y0 + 36, "text-anchor": "middle", text: spec.xTitle || "Time" }, svg);
    svg.setAttribute("viewBox", "0 0 " + w + " " + H);
    svg.setAttribute("width", w);
    svg.setAttribute("height", H);
    svg.setAttribute("aria-label", spec.aria || "");
    this.cross = sv("g", { class: "gr-res-cross" }, svg);
    if (this.index >= 0) this.show(this.index, false, this.pointerY);
    this.emphasize(this.focus);
  }

  /* Bring one series forward and fade the others (legend hover); null restores all. */
  emphasize(id) {
    this.focus = id || null;
    this.svg.querySelectorAll("[data-id]").forEach((n) => {
      n.classList.toggle("gr-res-faded", !!this.focus && n.getAttribute("data-id") !== this.focus);
    });
  }

  bindPointer() {
    const svg = this.svg;
    const idxAt = (clientX) => {
      const spec = this.spec;
      if (!spec) return -1;
      const r = svg.getBoundingClientRect();
      const { m } = this.layout();
      const lv = spec.x.lo + ((clientX - r.left - m.l) / (this.width - m.l - m.r)) * (spec.x.hi - spec.x.lo);
      if (lv < spec.x.lo - 0.08 || lv > spec.x.hi + 0.08) return -1;
      return nearest(spec.t, lv);
    };
    // The mouse reads along the curves as it moves. A finger reads where it taps, and a swipe (which the
    // browser turns into a scroll, touch-action: pan-y) reads nothing and changes nothing.
    svg.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const i = idxAt(e.clientX);
      if (i < 0) this.hide();
      else this.show(i, false, e.clientY);
    });
    svg.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "mouse") this.hide();
    });
    svg.addEventListener("click", (e) => {
      const i = idxAt(e.clientX);
      if (i >= 0) this.show(i, false, e.clientY);
    });
    svg.addEventListener("keydown", (e) => {
      const spec = this.spec;
      if (!spec) return;
      const n = spec.t.length;
      let i = this.index < 0 ? Math.round(n / 2) : this.index;
      const step = e.shiftKey ? 10 : 2;
      if (e.key === "ArrowRight") i = Math.min(n - 1, i + step);
      else if (e.key === "ArrowLeft") i = Math.max(0, i - step);
      else if (e.key === "Home") i = 0;
      else if (e.key === "End") i = n - 1;
      else if (e.key === "Escape") { this.hide(); return; }
      else return;
      e.preventDefault();
      this.show(i, true);
    });
    svg.addEventListener("blur", () => this.hide());
    document.addEventListener("pointerdown", (e) => {
      if (this.index >= 0 && !this.wrap.contains(e.target)) this.hide();
    }, { passive: true });
    // While the page scrolls, the readout stays inside the viewport, and it goes when the chart has left
    let pending = false;
    addEventListener("scroll", () => {
      if (this.index < 0 || pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        if (this.index < 0) return;
        const r = this.wrap.getBoundingClientRect();
        if (r.bottom < 40 || r.top > innerHeight - 40) this.hide();
        else this.place();
      });
    }, { passive: true });
  }

  /* Put the readout beside the crosshair and inside the viewport. With a mouse it sits level with the
   * lower panel; on a phone it sits above the plot, or above the finger when the top of the plot is off
   * screen, or below the finger when there is no room above. */
  place() {
    const tip = this.tip, last = this.boxes[this.boxes.length - 1];
    const wr = this.wrap.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight, vw = document.documentElement.clientWidth, vh = innerHeight, pad = 6;
    const xv = wr.left + this.X(this.spec.t[this.index]);
    const yv = this.pointerY;
    let left, top;
    if (this.narrow) {
      left = xv - tw / 2;
      if (wr.top - th - pad >= pad) top = wr.top - th - pad;
      else if (yv !== undefined && yv - th - 16 >= pad) top = yv - th - 16;
      else top = (yv !== undefined ? yv : wr.top + last.top) + 20;
    } else {
      left = xv + 14;
      if (left + tw > vw - pad) left = xv - tw - 14;
      top = wr.top + last.top + 6;
    }
    left = Math.max(pad, Math.min(vw - tw - pad, left));
    top = Math.max(pad, Math.min(vh - th - pad, top));
    tip.style.left = left - wr.left + "px";
    tip.style.top = top - wr.top + "px";
  }

  show(i, announce, pointerY) {
    const spec = this.spec;
    if (!spec || !this.cross) return;
    this.index = i;
    this.pointerY = pointerY;
    const g = this.cross;
    while (g.firstChild) g.removeChild(g.firstChild);
    const x = this.X(spec.t[i]);
    const first = this.boxes[0], last = this.boxes[this.boxes.length - 1];
    sv("line", { x1: x, x2: x, y1: first.top, y2: last.bot }, g);
    spec.panels.forEach((P, pi) => {
      const B = this.boxes[pi];
      P.series.forEach((S) => {
        const v = S.values[i];
        if (!ok(v)) return;
        const y = B.Y(v);
        if (y < B.top - 1 || y > B.bot + 1) return;
        sv("circle", { cx: x, cy: y, r: 3.6, fill: S.color }, g);
      });
    });
    const tip = this.tip;
    tip.innerHTML = spec.readout(i, this.narrow);
    tip.classList.add("on");
    this.place();
    if (announce) this.live.textContent = tip.innerText.replace(/\s+/g, " ");
  }

  hide() {
    this.index = -1;
    this.tip.classList.remove("on");
    if (this.cross) while (this.cross.firstChild) this.cross.removeChild(this.cross.firstChild);
  }
}

function nearest(t, lv) {
  let lo = 0, hi = t.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (t[mid] < lv) lo = mid;
    else hi = mid;
  }
  return Math.abs(t[lo] - lv) <= Math.abs(t[hi] - lv) ? lo : hi;
}

const ok = (v) => v !== null && v !== undefined && isFinite(v);

function linePath(t, vals, X, Y, end) {
  let d = "", pen = false;
  const n = end >= 0 ? end + 1 : t.length;
  for (let i = 0; i < n; i++) {
    const v = vals[i];
    if (!ok(v)) { pen = false; continue; }
    d += (pen ? "L" : "M") + X(t[i]).toFixed(1) + " " + Y(v).toFixed(1);
    pen = true;
  }
  return d;
}

function bandPath(t, lo, hi, X, Y, end) {
  let d = "";
  let i = 0;
  const n = end >= 0 ? end + 1 : t.length;
  while (i < n) {
    while (i < n && !(ok(lo[i]) && ok(hi[i]))) i++;
    const a = i;
    while (i < n && ok(lo[i]) && ok(hi[i])) i++;
    if (i - a < 1) continue;
    let p = "M" + X(t[a]).toFixed(1) + " " + Y(hi[a]).toFixed(1);
    for (let k = a + 1; k < i; k++) p += "L" + X(t[k]).toFixed(1) + " " + Y(hi[k]).toFixed(1);
    for (let k = i - 1; k >= a; k--) p += "L" + X(t[k]).toFixed(1) + " " + Y(lo[k]).toFixed(1);
    d += p + "Z";
  }
  return d;
}
