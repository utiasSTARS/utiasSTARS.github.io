/* gr-vamp-results: G-RRT* in VAMP on MotionBenchMaker, against AORRTC, FCIT* and RRT-Connect.
 * Per robot, the percentage of runs solved and the median cost relative to the best known cost against time,
 * for the planner output or after VAMP's simplification (its time included), with the time to the first
 * solution of each planner as the headline. The table and the readout show both costs, with the planners in
 * the order of their final cost after simplification. Data from _tools/grrtstar/build_vamp_results.py. */
import { el, segmented } from "./util.js";
import { ensureCSS, getJSON, keys, lineSwatch, TimeChart, fmtMs, tickMs, dec, niceTicks, onWidth, pctText, cell, bestOf, td, readoutHTML, listOf, nameCell } from "./results-chart.js";

// Legend order. grrt_up (G-RRT* before the changes, dashed) is drawn only if the data file holds it.
const ORDER = ["grrt_new", "grrt_up", "aorrtc", "fcit", "rrtc"];
const MODES = [
  { value: "raw", label: "Planner output", title: "Cost of the path the planner returns" },
  { value: "simp", label: "After simplification", title: "Cost after VAMP simplifies the path, counting the time that takes" }
];

export async function init(root) {
  const [, data, palette] = await Promise.all([ensureCSS("../css/vampresults.css"), getJSON("vampresults/curves.json"), getJSON("omplresults/palette.json")]);

  // The card is built off the page and put in place in one step, so that nothing moves inside it
  const card = el("div", { class: "gr-card gr-res" });
  const bar = el("div", { class: "gr-toolbar" }, card);
  const gRobot = el("div", { class: "gr-group" }, bar);
  el("span", { class: "lbl", text: "Robot" }, gRobot);
  const robotSeg = el("div", {}, gRobot);
  const gMode = el("div", { class: "gr-group" }, bar);
  el("span", { class: "lbl", text: "Cost" }, gMode);
  const modeSeg = el("div", {}, gMode);
  const sum = el("div", { class: "gr-res-sum" }, card);
  const eyebrow = el("div", { class: "gr-lbl" }, sum);
  const keysHost = el("div", {}, sum);
  const chart = new TimeChart(card, [130, 230]);
  const foot = el("div", { class: "gr-res-foot" }, card);
  const meta = el("span", { class: "gr-res-meta" }, foot);
  const toggle = el("button", { class: "gr-linkbtn", type: "button", "aria-expanded": "false", text: "Show as a table" }, foot);
  const caption = el("p", { class: "gr-caption", text: "We run every valid MotionBenchMaker problem for the Panda, UR5 and Fetch, and 105 problems for Baxter, twice per planner with VAMP's default settings. " +
    "We divide each cost by the best cost that any planner found on the problem." });

  const robots = data.robots;
  // Colours and labels from the page palette (the paper's colours), keyed by the run records' planner ids
  const PLANNERS = ORDER.filter((id) => data.planners.includes(id)).map((id) => {
    const c = palette.planners[palette.vamp_ids[id]];
    return { id, label: id === "grrt_up" ? "G-RRT* before" : c.label, color: c.color, dash: c.dash || null, width: id === "grrt_new" ? 2.4 : 1.7 };
  });
  const state = { robot: robots[0].key, mode: "raw", table: false, visible: new Set(PLANNERS.map((p) => p.id)) };
  segmented(robotSeg, robots.map((r) => ({ value: r.key, html: r.label + " <small>" + r.dof + " DoF</small>" })),
    state.robot, (v) => { state.robot = v; update(); }, { label: "Robot" });
  segmented(modeSeg, MODES, state.mode, (v) => { state.mode = v; update(); }, { label: "Cost" });
  const legend = keys(keysHost, PLANNERS, state.visible, () => update(), (id) => chart.emphasize(id), true);
  keysHost.style.setProperty("--n", PLANNERS.length);
  toggle.addEventListener("click", () => {
    state.table = !state.table;
    chart.showTable(state.table);
    legend.enable(!state.table);
    // The table holds both costs and the time to the initial solution, so the cost toggle and the tiles step aside
    gMode.hidden = sum.hidden = state.table;
    root.classList.toggle("gr-res-tableview", state.table);   // the slot drops its reserved (chart) height
    toggle.textContent = state.table ? "Show the chart" : "Show as a table";
    toggle.setAttribute("aria-expanded", String(state.table));
  });

  const budgetOf = (R) => tickMs(R.budget_ms);
  const solvedPct = (d) => (100 * d.solved_runs) / d.runs;
  const finalCost = (R, p, mode) => { const a = R.planners[p.id].at["cost_" + mode]; return a[a.length - 1]; };
  /* The planners of a robot from the lowest to the highest median final cost after simplification (no median
   * last), then by the planner output. One order per robot, for the table and the readout. */
  const ranked = (R) => {
    const key = (p, mode) => { const v = finalCost(R, p, mode); return v === null ? Infinity : v; };
    return PLANNERS.filter((p) => R.planners[p.id])
      .map((p, i) => ({ p, i }))
      .sort((a, b) => key(a.p, "simp") - key(b.p, "simp") || key(a.p, "raw") - key(b.p, "raw") || a.i - b.i)
      .map((x) => x.p);
  };

  /* The headline in the legend keys (time to the first solution, from the call) and the line under the chart. */
  function headline(R, mode) {
    const first = mode === "raw" ? "first" : "first_simp";
    eyebrow.textContent = "Time to initial " + (mode === "raw" ? "" : "simplified ") + "solution, median";
    PLANNERS.filter((p) => R.planners[p.id]).forEach((p) => {
      const d = R.planners[p.id];
      const p90 = d[first + "_p90"];
      legend.setBody(p.id, '<span class="v">' + (d[first + "_median"] === null ? "over " + budgetOf(R) : fmtMs(d[first + "_median"])) + '</span><span class="d">' +
        (p90 === null ? "solves " + pctText(solvedPct(d)) + " of runs" : "90% within " + fmtMs(p90)) + "</span>");
    });
    meta.textContent = R.label + ", " + R.dof + " DoF. " + R.problems + " problems × " + R.seeds + " seeds, " + budgetOf(R) + " per run." +
      (R.unsolved_by_all ? " No planner solves " + R.unsolved_by_all + " of the problems." : "");
  }

  /* Planners as rows, from the lowest final cost after simplification, and both costs side by side. It does not
   * follow the chart's cost toggle. The best value of each column is bold (unless more than half of the rows
   * share it), and the G-RRT* row is tinted. */
  function table(R) {
    const rows = ranked(R);
    const budget = budgetOf(R);
    const cols = [
      { dir: "max", cells: rows.map((p) => cell.pct(solvedPct(R.planners[p.id]))) },
      { dir: "min", cells: rows.map((p) => cell.ms(R.planners[p.id].first_median)) },
      { dir: "min", cells: rows.map((p) => cell.cost(finalCost(R, p, "raw"))) },
      { dir: "min", cells: rows.map((p) => cell.cost(finalCost(R, p, "simp"))) }
    ];
    cols.forEach((c) => { c.best = bestOf(c.cells, c.dir); });
    let html = '<table class="gr-table gr-res-rows"><thead><tr class="grp"><th colspan="3"></th><th colspan="2">Median cost ÷ best at ' + budget + "</th></tr>" +
      "<tr><th>Planner</th><th>Runs solved by " + budget + "</th><th>Median time to initial solution</th><th>Planner output</th><th>After simpli&shy;fication</th></tr></thead><tbody>";
    rows.forEach((p, r) => {
      html += "<tr" + (p.id === "grrt_new" ? ' class="ours"' : "") + ">" + nameCell(p) + cols.map((c) => td(c.cells[r], c.best)).join("") + "</tr>";
    });
    // planners without a median say why ("solves no runs" when none is solved)
    const none = rows.filter((p) => finalCost(R, p, "simp") === null), zero = none.every((p) => R.planners[p.id].solved_runs === 0);
    return html + '</tbody></table><p class="gr-res-tnote">AORRTC simplifies each solution before it reports it.' +
      (none.length ? " " + listOf(none.map((p) => p.label)) + (none.length > 1 ? " solve " : " solves ") + (zero ? "no runs" : "fewer than half of the runs") +
        ", so " + (none.length > 1 ? "they have" : "it has") + " no median." : "") + "</p>";
  }

  function update() {
    const R = robots.find((r) => r.key === state.robot);
    const [lo, hi, n] = R.grid;
    const t = Array.from({ length: n }, (_, i) => lo + ((hi - lo) * i) / (n - 1));
    const shown = PLANNERS.filter((p) => R.planners[p.id] && state.visible.has(p.id));
    const mode = state.mode;
    const budget = budgetOf(R);

    // Cost axis from 1 up to a top that keeps the converged planners apart; lines above it are named
    const final = (p) => last(R.planners[p.id]["cost_" + mode]);
    const finals = shown.map(final).filter((v) => v !== null);
    const top = finals.length ? Math.min(2, Math.max(1.25, 1 + 2.5 * (Math.max(...finals) - 1))) : 2;
    const yt = niceTicks(1, top, 4);
    const notes = [];
    shown.forEach((p) => {
      const v = final(p);
      if (v === null) notes.push("no median for " + p.label, "(" + pctText(solvedPct(R.planners[p.id])) + " of runs solved)");
      else if (v > yt.ticks[yt.ticks.length - 1]) notes.push("↑ " + p.label + " " + dec(v) + " at " + budget);
    });
    const order = [...shown].reverse(); // G-RRT* drawn last, on top
    const rows = ranked(R).filter((p) => state.visible.has(p.id));
    chart.set({
      x: { lo: -2, hi },
      t,
      tick: tickMs,
      extraTicks: [R.budget_ms],
      xTitle: "Time from the call",
      panels: [
        { label: "Runs solved (%)", hint: "a dot marks all runs solved", endAt: 100, y: { lo: 0, hi: 100, ticks: [0, 25, 50, 75, 100], fmt: (v) => String(v) },
          series: order.map((p) => ({ id: p.id, color: p.color, dash: p.dash, width: p.width, values: R.planners[p.id]["solved_" + mode] })) },
        { label: "Median cost ÷ best known" + (mode === "simp" ? ", after simplification" : ""),
          y: { lo: 1, hi: yt.ticks[yt.ticks.length - 1], ticks: yt.ticks, fmt: (v) => v.toFixed(Math.max(1, yt.decimals)) },
          series: order.map((p) => ({ id: p.id, color: p.color, dash: p.dash, width: p.width, values: R.planners[p.id]["cost_" + mode] })), notes, notesAt: "left" }
      ],
      // Runs solved as drawn in the upper panel, and both costs, in the table's order
      readout: (i) => readoutHTML(fmtMs(Math.pow(10, t[i])),
        [{ head: "solved", dir: "max" }, { head: "planner<br>output", dir: "min" }, { head: "after<br>simplification", dir: "min" }],
        rows.map((p) => {
          const d = R.planners[p.id];
          return { name: lineSwatch(p) + p.label, cells: [cell.pct(d["solved_" + mode][i]), cell.cost(d.cost_raw[i]), cell.cost(d.cost_simp[i])] };
        })),
      aria: R.label + ", " + R.dof + " degrees of freedom. Percentage of runs solved and median cost relative to the best known cost against time, " +
        (mode === "raw" ? "for the planner output" : "after simplification") + ", for " + shown.map((p) => p.label).join(", ") +
        ". Use the left and right arrow keys to read values, or show the numbers as a table."
    });
    headline(R, mode);
    chart.setTable(table(R));
  }

  /* One height at every width in the chart view: the headline row and the line under the chart are as tall as
   * their tallest content over all robots and both cost modes. The table view takes its own height. */
  function settle() {
    const hidden = sum.hidden;
    sum.hidden = false;                       // measured also while the table is shown
    sum.style.minHeight = meta.style.minHeight = "";
    let hs = 0, hm = 0;
    robots.forEach((R) => ["raw", "simp"].forEach((mode) => {
      headline(R, mode);
      hs = Math.max(hs, sum.getBoundingClientRect().height);
      hm = Math.max(hm, meta.getBoundingClientRect().height);
    }));
    sum.style.minHeight = Math.ceil(hs) + "px";
    meta.style.minHeight = Math.ceil(hm) + "px";
    sum.hidden = hidden;
    update();
  }

  root.replaceChildren(card, caption);
  settle();
  onWidth(card, settle);
}

const last = (a) => a[a.length - 1];
