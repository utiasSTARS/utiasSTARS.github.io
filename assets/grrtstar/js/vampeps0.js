/* gr-vamp-eps0: the greedy informed set ablation in VAMP on MotionBenchMaker. G-RRT* (ε = 0.9) against the same
 * planner with ε = 0, which samples only the informed set and prunes with the cost of the current path. One small
 * chart per robot (UR5, Panda, Fetch, Baxter, by joints), each with its own cost scale: the median planner-output
 * cost over time divided by the best cost either version reached on the problem, with the 99% confidence interval
 * of the median. The readout adds the runs solved and the median cost after simplification. One table for the
 * four robots, shown in place of the charts, gives the medians at 10% of the budget and at the budget, robot by
 * robot. Data from _tools/grrtstar/build_vamp_eps0.py (a slim copy of
 * eps0.json, the data of eps0.py's figure, with the simplified medians from the run records).
 * A self-contained block (CONTRACT.md, Round 7, lists the steps that remove it). */
import { el, COLORS, MATH } from "./util.js";
import { ensureCSS, getJSON, lineSwatch, TimeChart, fmtMs, niceTicks, onWidth, cell, bestOf, td, readoutHTML } from "./results-chart.js";

const EPS0 = MATH.eps + " = 0";
const PLANNERS = [
  { id: "grrt", label: "G-RRT*", html: "G-RRT*", color: COLORS.grrt, width: 2.2 },
  { id: "eps0", label: "ε = 0 (informed set only)", html: EPS0 + " (informed set only)", short: EPS0, color: COLORS.informed, dash: "5 4", width: 1.9 }   // the dashed informed set's grey and dash
];
const FRACTIONS = ["0.1", "1.0"];   // the table: 10% of the budget and the budget

/* One robot's chart: the shared TimeChart (crosshair, readout, keyboard, table view) laid out for a small
 * multiple, with tighter margins and a plot height that follows the width. */
class SmallChart extends TimeChart {
  /* `narrow` follows the card (a phone layout), not the small chart, so that a desktop reads beside the crosshair. */
  layout() {
    const w = Math.max(120, Math.round(this.stage.clientWidth || 300));
    const card = this.stage.closest(".gr-card");
    return { w, narrow: (card ? card.clientWidth : w) < 520, m: { l: 34, r: 9, title: 22, gap: 14, axis: 40 } };
  }
  /* On a phone the shared placement (above the plot). Otherwise beside the crosshair, level with the top of the
   * plot, on the side with room, and inside the card. */
  place() {
    if (this.narrow) return super.place();
    const tip = this.tip, B = this.boxes[0], wr = this.wrap.getBoundingClientRect();
    const card = (this.wrap.closest(".gr-card") || this.wrap).getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight, pad = 8;
    const xv = wr.left + this.X(this.spec.t[this.index]);
    let left = xv + 12;
    if (left + tw > card.right - pad) left = xv - tw - 12;
    left = Math.max(card.left + pad, Math.min(card.right - tw - pad, left));
    const top = Math.max(6, Math.min(innerHeight - th - 6, wr.top + B.top + 6));
    tip.style.left = left - wr.left + "px";
    tip.style.top = top - wr.top + "px";
  }
  size() {
    const { w, m } = this.layout();
    const h = Math.round(Math.min(210, Math.max(160, 1.05 * w)));     // about square in a row of four, wider in two columns
    return { hs: [h], H: m.title + h + m.axis };
  }
}

/* "1", "10", "1000": milliseconds on the time axis, whose title carries the unit. Without a thousands separator, as
 * eps0.py's figure, so that "100" and "1000" both fit a 126 px axis; readouts and tables keep the page's format. */
const tick = (ms) => (ms >= 1 ? String(Math.round(ms)) : String(+ms.toPrecision(2)));

export async function init(root) {
  const [, , data] = await Promise.all([ensureCSS("../css/vampresults.css"), ensureCSS("../css/vampeps0.css"), getJSON("vampeps0/curves.json")]);

  // The card is built off the page and put in place in one step, so that nothing moves inside it
  const card = el("div", { class: "gr-card gr-res gr-eps0" });
  const keys = el("div", { class: "gr-legend gr-eps0-keys", html: PLANNERS.map((p) => '<span class="it">' + lineSwatch(p) + p.html + "</span>").join("") +
    '<span class="it gr-eps0-note">median and 99% CI</span>' }, card);
  const grid = el("div", { class: "gr-eps0-grid" }, card);
  const tableBox = el("div", { class: "gr-res-tablebox gr-eps0-table", hidden: true }, card);
  const foot = el("div", { class: "gr-res-foot" }, card);
  const meta = el("span", { class: "gr-res-meta", text: "Each panel has its own cost scale." }, foot);
  const toggle = el("button", { class: "gr-linkbtn", type: "button", "aria-expanded": "false", text: "Show as a table" }, foot);
  const caption = el("p", { class: "gr-caption", text: "Lines show the median cost divided by the best cost either version reached on the problem, before or after simplification. Bands show the 99% confidence interval of the median." });

  const charts = data.robots.map((R) => {
    const box = el("figure", { class: "gr-eps0-panel" }, grid);
    return { R, chart: new SmallChart(box, [160]) };
  });
  let table = false;
  toggle.addEventListener("click", () => {
    table = !table;
    // one table in place of the four charts, at its own height; the chart legend and note step aside
    charts.forEach(({ chart }) => chart.hide());
    grid.hidden = keys.hidden = meta.hidden = table;
    tableBox.hidden = !table;
    root.classList.toggle("gr-res-tableview", table);   // the slot drops its reserved (chart) height
    toggle.textContent = table ? "Show the charts" : "Show as a table";
    toggle.setAttribute("aria-expanded", String(table));
  });

  const timeLabel = (ms) => (ms < 1000 ? Math.round(ms) + " ms" : +(ms / 1000).toPrecision(3) + " s");
  /* One table for the four robots: a pair of rows per robot (G-RRT* tinted, then ε = 0), each pair in its own
   * <tbody>, with the median planner-output cost, as in the charts, at 10% of the budget and at the budget. The
   * two versions of a robot are compared with each other: the lower value of a pair is bold (not on a tie). */
  function tableAll() {
    let html = '<table class="gr-table gr-res-rows gr-eps0-tbl"><thead><tr class="grp"><th colspan="2"></th><th colspan="2">Median cost ÷ best</th></tr>' +
      "<tr><th>Robot</th><th>Version</th><th>At 10% of the budget</th><th>At the budget</th></tr></thead>";
    data.robots.forEach((R) => {
      const cols = FRACTIONS.map((f) => {
        const cells = PLANNERS.map((p) => cell.cost(R.at[f][p.id][0]));
        return { cells, best: bestOf(cells, "min") };
      });
      html += "<tbody>";
      PLANNERS.forEach((p, r) => {
        html += "<tr" + (p.id === "grrt" ? ' class="ours"' : "") + ">" + (r ? "<td></td>" : '<th scope="rowgroup">' + R.label + ", " + timeLabel(R.budget_ms).replace(" ", "\u00a0") + "</th>") +
          '<th scope="row"><span class="gr-legend"><span class="it"><i class="dot" style="background:' + p.color + '"></i><span>' + (p.short || p.html) + "</span></span></span></th>" +
          cols.map((c) => td(c.cells[r], c.best)).join("") + "</tr>";
      });
      html += "</tbody>";
    });
    return html + "</table>";
  }

  function draw() {
    charts.forEach(({ R, chart }) => {
      // the cost axis of eps0.py's figure, from 1 (not 0.995) to y_top, labelled at round costs inside it
      let yt = niceTicks(1, R.y_top, 4);
      if (yt.ticks.filter((v) => v <= R.y_top + 1e-9).length > 6) yt = niceTicks(1, R.y_top, 3);
      const ticks = yt.ticks.filter((v) => v <= R.y_top + 1e-9);
      const series = [...PLANNERS].reverse().map((p) => ({ id: p.id, color: p.color, dash: p.dash || null, width: p.width, values: R[p.id].med, band: [R[p.id].lo, R[p.id].hi] }));
      // the readout lists the lower final cost after simplification first (one order per robot)
      const fin = (p) => { const v = R[p.id].simp[R[p.id].simp.length - 1]; return v === null ? Infinity : v; };
      const rows = [...PLANNERS].sort((a, b) => fin(a) - fin(b));
      chart.set({
        x: { lo: R.x[0], hi: R.x[1] },
        t: R.t,
        tick,
        extraTicks: [R.budget_ms],
        xTitle: "Time (ms)",
        panels: [{ label: R.label + ", " + R.dof + " DoF", bandOpacity: 0.16,
          y: { lo: 1, hi: R.y_top, ticks, fmt: (v) => v.toFixed(Math.max(1, yt.decimals)) }, series }],
        readout: (i) => readoutHTML(R.label + ", " + fmtMs(Math.pow(10, R.t[i])),
          [{ head: "solved", dir: "max" }, { head: "planner<br>output", dir: "min" }, { head: "after<br>simplification", dir: "min" }],
          rows.map((p) => ({ name: lineSwatch(p) + (p.short || p.html), cells: [cell.pct(R[p.id].solved[i]), cell.cost(R[p.id].med[i]), cell.cost(R[p.id].simp[i])] }))),
        aria: R.label + ", " + R.dof + " degrees of freedom. Median cost relative to the best known cost against time for G-RRT* and its ε = 0 version, with 99% confidence intervals. " +
          "Use the left and right arrow keys to read values, or show the numbers as a table."
      });
    });
  }

  tableBox.innerHTML = tableAll();
  const settle = draw;

  root.replaceChildren(card, caption);
  settle();
  onWidth(card, settle);
}
