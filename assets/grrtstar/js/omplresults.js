/* gr-ompl-results: the paper's OMPL benchmarks (the runs behind its Figures 7, 10, 11 and Tables 1, 2).
 * Per problem, the percentage of runs solved and the median cost against time, each with its 99% confidence
 * interval, for nine planners, and the paper's table values. Data from
 * _tools/grrtstar/build_ompl_results.py: index.json holds the problems and their table values, and the
 * curves of a problem load when it is selected. The paper simplified only the initial and the final solution
 * of each run, so the curves are the cost before simplification; the readout shows them next to the final
 * cost after simplification of the paper's tables, and lists the planners (as the table rows) in the order of
 * that final cost. */
import { el, chips, MATH } from "./util.js";
import { ensureCSS, getJSON, keys, lineSwatch, TimeChart, dec, listOf, niceTicks, onWidth, pctText, cell, bestOf, td, readoutHTML, nameCell } from "./results-chart.js";

/* The 15 problems in six families, named as in the paper. A wide column shows every family with its
 * variants; a narrow one (under 40rem) shows the families and the variants of the chosen one. */
const FAMILIES = [
  { key: "rr", label: "Many homotopy classes", chip: (p) => MATH.R(p.dim), name: (p) => "Many homotopy classes in " + MATH.R(p.dim) },
  { key: "wg", label: "Narrow passage gap", chip: (p) => MATH.R(p.dim), name: (p) => "Narrow passage gap in " + MATH.R(p.dim) },
  { key: "de", label: "Double enclosure", chip: (p) => MATH.R(p.dim), name: (p) => "Double enclosure in " + MATH.R(p.dim) },
  { key: "panda", label: "Panda", chip: (p) => p.label, name: (p) => p.label + " for the Panda (" + MATH.R(p.dim) + ")" },
  { key: "fetch", label: "Fetch", chip: (p) => p.label, name: (p) => p.label + " for the Fetch (" + MATH.R(p.dim) + ")" },
  { key: "dual", label: "Dual arm", chip: () => "Cage", name: (p) => "Dual-arm cage in " + MATH.R(p.dim) }
];
// Legend order on the page: G-RRT* first, then the planners the paper discusses most
const LEGEND = ["grrtstar", "aorrtc", "rrtconnect", "rrtstar", "rrtstarconnect", "bitstar", "aitstar", "eitstar", "blitstar"];

export async function init(root) {
  const [, , palette, index] = await Promise.all([ensureCSS("../css/vampresults.css"), ensureCSS("../css/omplresults.css"),
    getJSON("omplresults/palette.json"), getJSON("omplresults/index.json")]);
  const PLANNERS = LEGEND.filter((id) => palette.planners[id]).map((id) => ({
    id, label: palette.planners[id].label, color: palette.planners[id].color, width: id === "grrtstar" ? 2.4 : 1.6
  }));
  const conf = Math.round(100 * index.confidence);
  const problems = index.problems;
  const familyOf = (p) => FAMILIES.find((f) => f.key === p.family);
  const state = { key: problems[0].key, table: false, visible: new Set(PLANNERS.map((p) => p.id)) };
  const cache = new Map();
  const load = (key) => {
    if (!cache.has(key)) cache.set(key, getJSON("omplresults/" + key + ".json").then((P) => decode(P, index.confidence)));
    return cache.get(key);
  };
  const first = await load(state.key);

  // The card is built off the page and put in place in one step, so that nothing moves inside it
  const card = el("div", { class: "gr-card gr-res gr-ompl" });
  const fams = el("div", { class: "gr-ompl-fams" }, card);
  const bar = el("div", { class: "gr-toolbar gr-ompl-problems" }, card);
  const sum = el("div", { class: "gr-res-sum" }, card);
  const tiles = ["Runs solved by G-RRT*", "Final cost of G-RRT*, simplified"].map((k) => {
    const t = el("div", { class: "gr-stat" }, sum);
    el("span", { class: "k", text: k }, t);
    return { v: el("span", { class: "v" }, t), d: el("span", { class: "d" }, t) };
  });
  const chart = new TimeChart(card, [120, 230]);
  const keysHost = el("div", {}, card);
  const foot = el("div", { class: "gr-res-foot" }, card);
  const meta = el("span", { class: "gr-res-meta" }, foot);
  const toggle = el("button", { class: "gr-linkbtn", type: "button", "aria-expanded": "false", text: "Show as a table" }, foot);
  const caption = el("p", { class: "gr-caption", text: "We run nine OMPL planners 50 times on each abstract problem and on the dual-arm cage, and five times on each of the 100 problems in a MotionBenchMaker scene. " +
    "Lines show the median cost with its " + conf + "% confidence interval." });

  // Problem picker: one pressed variant across the six families
  const groups = new Map();
  const famCtl = chips(fams, FAMILIES.map((f) => ({ value: f.key, label: f.label })), familyOf(problems[0]).key, (v) => {
    // keep the dimension or the scene when it exists in the new family
    const cur = problems.find((p) => p.key === state.key), list = problems.filter((p) => p.family === v);
    pick((list.find((p) => (v === "panda" || v === "fetch" ? p.label === cur.label : p.dim === cur.dim)) || list[0]).key);
  }, { label: "Problem family" });
  FAMILIES.forEach((F) => {
    const list = problems.filter((p) => p.family === F.key);
    if (!list.length) return;
    const g = el("div", { class: "gr-group" }, bar);
    el("span", { class: "lbl", text: F.label }, g);
    groups.set(F.key, { node: g, ctl: chips(el("div", {}, g), list.map((p) => ({ value: p.key, html: F.chip(p) })), state.key, pick, { label: F.label }) });
  });
  const legend = keys(keysHost, PLANNERS, state.visible, () => show(), (id) => chart.emphasize(id));
  toggle.addEventListener("click", () => {
    state.table = !state.table;
    chart.showTable(state.table);
    legend.enable(!state.table);
    // The table holds the numbers of the G-RRT* tiles and names each planner with its dot, so the tiles and the
    // legend keys (inactive without the chart) step aside; the problem picker stays
    sum.hidden = keysHost.hidden = state.table;
    root.classList.toggle("gr-res-tableview", state.table);   // the slot drops its reserved (chart) height
    toggle.textContent = state.table ? "Show the chart" : "Show as a table";
    toggle.setAttribute("aria-expanded", String(state.table));
  });

  function pick(key) {
    state.key = key;
    select(problems.find((p) => p.key === key));
    show();
  }

  /* Pressed states of the picker. */
  function select(info) {
    famCtl.set(info.family);
    groups.forEach((g, k) => {
      g.ctl.set(info.key);
      g.node.classList.toggle("on", k === info.family);
    });
  }

  const mbm = (info) => info.family === "panda" || info.family === "fetch";
  const solved = (info, p) => info.planners[p.id].solved / info.planners[p.id].runs;
  const pct = (info, p) => pctText(100 * solved(info, p));
  /* The planners of a problem from the lowest to the highest median final cost after simplification (the
   * paper's c_final; no median last, in legend order). One order per problem, for the table and the readout. */
  const ranked = (info) => {
    const key = (p) => (info.planners[p.id].c_final === null ? Infinity : info.planners[p.id].c_final);
    return PLANNERS.filter((p) => info.planners[p.id]).map((p, i) => ({ p, i }))
      .sort((a, b) => key(a.p) - key(b.p) || a.i - b.i).map((x) => x.p);
  };

  /* Headline tiles (G-RRT* against the best other planner) and the line under the chart, from the index. */
  function headline(info) {
    const all = PLANNERS.filter((p) => info.planners[p.id]);
    const g = all.find((p) => p.id === "grrtstar"), others = all.filter((p) => p.id !== "grrtstar");
    const cf = (p) => info.planners[p.id].c_final;
    const bs = others.reduce((b, p) => (b === null || solved(info, p) > solved(info, b) ? p : b), null);
    const bc = others.reduce((b, p) => (cf(p) !== null && (b === null || cf(p) < cf(b)) ? p : b), null);
    tiles[0].v.textContent = g ? pct(info, g) : "–";
    tiles[0].d.textContent = bs ? "best other planner " + bs.label + ", " + pct(info, bs) : "";
    tiles[1].v.textContent = !g || cf(g) === null ? "no median" : dec(cf(g));
    tiles[1].d.textContent = bc ? "best other planner " + bc.label + ", " + dec(cf(bc)) : "no other planner has a median";
    meta.innerHTML = familyOf(info).name(info) + ", " + (mbm(info) ? "100 problems × 5 seeds" : info.runs + " runs") + " per planner, " + fmtS(info.budget_s) + " each.";
  }

  /* The paper's table columns (Tables 1 and 2), with its units and rounding. Rows from the lowest final cost
   * after simplification; the best value of each column is bold (ties too, unless more than half of the rows
   * share it), and the G-RRT* row is tinted. */
  function table(info) {
    const rows = ranked(info);
    const T = (p) => info.planners[p.id];
    // RRT-Connect returns one path, so its first and final simplified costs are one value, as in the paper
    const cInit = (p) => (p.id === "rrtconnect" ? T(p).c_final : T(p).c_init);
    const cols = [
      { dir: "max", cells: rows.map((p) => cell.pct(100 * solved(info, p))) },
      { dir: "min", cells: rows.map((p) => cell.cost(T(p).t_init)) },
      { dir: "min", cells: rows.map((p) => cell.cost(cInit(p))) },
      { dir: "min", cells: rows.map((p) => cell.cost(T(p).c_final)) }
    ];
    cols.forEach((c) => { c.best = bestOf(c.cells, c.dir); });
    let html = '<table class="gr-table gr-res-rows"><thead><tr class="grp"><th colspan="3"></th><th colspan="2">After simplification</th></tr>' +
      "<tr><th>Planner</th><th>Runs solved</th><th>Time to initial solution (s)</th><th>Cost of initial solution</th><th>Final cost</th></tr></thead><tbody>";
    rows.forEach((p, r) => {
      html += "<tr" + (p.id === "grrtstar" ? ' class="ours"' : "") + ">" + nameCell(p) + cols.map((c) => td(c.cells[r], c.best, "∞")).join("") + "</tr>";
    });
    const short = rows.filter((p) => T(p).n < info.runs);
    const padded = short.filter((p) => T(p).runs === info.runs), kept = short.filter((p) => T(p).runs < info.runs);
    let note = "Medians over " + (mbm(info) ? "500" : info.runs) + " runs per planner";
    note += kept.length ? ", and over the " + listOf(kept.map((p) => T(p).n + " runs of " + p.label)) + " that returned, as in the paper's table." : ".";
    if (padded.length) note += " Some runs of " + listOf(padded.map((p) => p.label)) + " never returned and count as unsolved.";
    note += " The benchmark checks each planner every 10 ms, so no time is below 0.010\u00a0s.";
    return html + '</tbody></table><p class="gr-res-tnote">' + note + "</p>";
  }

  let ticket = 0;
  async function show() {
    const my = ++ticket;
    const info = problems.find((p) => p.key === state.key);
    headline(info);
    chart.setTable(table(info));
    let P;
    try {
      P = await load(state.key);
    } catch (err) {
      console.warn("gr-ompl-results", err);
      meta.textContent = "The curves of this problem did not load.";
      return;
    }
    if (my === ticket) draw(P, info);
  }

  function draw(P, info) {
    const n = P.grid[2];
    const t = Array.from({ length: n }, (_, i) => P.grid[0] + ((P.grid[1] - P.grid[0]) * i) / (n - 1));
    const shown = PLANNERS.filter((p) => P.planners[p.id] && state.visible.has(p.id));
    const order = [...shown].reverse(); // G-RRT* drawn last, on top
    const rows = ranked(info).filter((p) => P.planners[p.id] && state.visible.has(p.id));

    // Cost axis: round ticks that cover the medians shown, labelled at both ends
    let lo = Infinity, hi = -Infinity;
    shown.forEach((p) => P.planners[p.id].med.forEach((v) => {
      if (v !== null) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    }));
    if (!isFinite(lo)) { lo = 0; hi = 1; }
    const yt = niceTicks(lo, hi, 5);
    const none = shown.filter((p) => P.planners[p.id].med.every((v) => v === null)).map((p) => p.label);
    const notes = none.length ? [listOf(none), (none.length > 1 ? "have" : "has") + " no median (at most half solved)"] : [];
    const xlo = Math.abs(P.grid[0] - Math.round(P.grid[0])) < 0.03 ? Math.min(P.grid[0], Math.round(P.grid[0])) : P.grid[0];
    const cost = (p) => {
      const d = P.planners[p.id];
      // RRT-Connect returns one solution per run, so its interval is one bar at the end of its line
      return p.id === "rrtconnect"
        ? { id: p.id, color: p.color, width: p.width, values: d.med, whisker: [d.lo[n - 1], d.hi[n - 1]] }
        : { id: p.id, color: p.color, width: p.width, values: d.med, band: [d.lo, d.hi] };
    };
    chart.set({
      x: { lo: xlo, hi: P.grid[1] },
      t,
      tick: tickS,
      extraTicks: [P.budget_s],
      xTitle: "Computation time",
      panels: [
        { label: "Runs solved (%)", hint: "a dot marks all runs solved", endAt: 100, bandOpacity: 0.15, y: { lo: 0, hi: 100, ticks: [0, 25, 50, 75, 100], fmt: (v) => String(v) },
          series: order.map((p) => ({ id: p.id, color: p.color, width: p.width, values: P.planners[p.id].pct, band: [P.planners[p.id].plo, P.planners[p.id].phi] })) },
        { label: "Median cost (path length)", bandOpacity: 0.15, y: { lo: yt.ticks[0], hi: yt.ticks[yt.ticks.length - 1], ticks: yt.ticks, fmt: (v) => v.toFixed(yt.decimals) },
          series: order.map(cost), notes }
      ],
      // The curves are before simplification (the paper simplified only the initial and the final solution), so
      // the readout gives the median cost at this time next to the final cost after simplification of the table
      readout: (i) => readoutHTML(fmtS(Math.pow(10, t[i])),
        [{ head: "solved", dir: "max" }, { head: "before<br>simplification", dir: "min" }, { head: "final, after<br>simplification", dir: "min" }],
        rows.map((p) => {
          const d = P.planners[p.id];
          return { name: lineSwatch(p) + p.label, cells: [cell.pct(d.pct[i]), cell.cost(d.med[i]), cell.cost(info.planners[p.id].c_final)] };
        })),
      aria: plain(familyOf(info).name(info)) + ". Percentage of runs solved and median path cost against time for " + shown.length + " planners, with " + conf +
        "% confidence intervals. Use the left and right arrow keys to read values, or show the numbers as a table."
    });
  }

  /* One height at every width in the chart view: the picker, the headline tiles and the line under the chart
   * are as tall as their tallest content over the 15 problems. The table view takes its own height. */
  function settle() {
    const hidden = sum.hidden;
    sum.hidden = false;                       // measured also while the table is shown
    [bar, sum, meta].forEach((n) => { n.style.minHeight = ""; });
    const h = [0, 0, 0], tall = (k, n) => { h[k] = Math.max(h[k], n.getBoundingClientRect().height); };
    problems.forEach((info) => {
      select(info);
      headline(info);
      tall(0, bar); tall(1, sum); tall(2, meta);
    });
    [bar, sum, meta].forEach((n, k) => { n.style.minHeight = Math.ceil(h[k]) + "px"; });
    sum.hidden = hidden;
    const info = problems.find((p) => p.key === state.key);
    select(info);
    headline(info);
    chart.setTable(table(info));
  }

  root.replaceChildren(card, caption);
  settle();
  draw(first, problems[0]);
  onWidth(card, () => { settle(); show(); });
}

/* ---------------------------------------------------------------- data */

function expand(rle, n) {
  const out = new Array(n);
  for (let k = 0; k < rle.length; k += 2) {
    const end = k + 2 < rle.length ? rle[k + 2] : n;
    for (let i = rle[k]; i < end; i++) out[i] = rle[k + 1];
  }
  return out;
}

function decode(P, confidence) {
  const n = P.grid[2];
  const a = 1 - confidence;
  for (const id in P.planners) {
    const d = P.planners[id];
    d.med = expand(d.med, n);
    d.lo = expand(d.lo, n);
    d.hi = expand(d.hi, n);
    const k = expand(d.k, n);
    const memo = new Map();
    const cp = (kk) => {
      if (!memo.has(kk)) memo.set(kk, clopperPearson(kk, d.runs, a));
      return memo.get(kk);
    };
    d.pct = k.map((v) => (100 * v) / d.runs);
    d.plo = k.map((v) => 100 * cp(v)[0]);
    d.phi = k.map((v) => 100 * cp(v)[1]);
  }
  return P;
}

/* Clopper-Pearson interval for k successes in n runs, as runbench (scipy beta.ppf). */
function clopperPearson(k, n, alpha) {
  const lo = k > 0 ? betaInv(alpha / 2, k, n - k + 1) : 0;
  const hi = k < n ? betaInv(1 - alpha / 2, k + 1, n - k) : 1;
  return [lo, hi];
}

function lgamma(x) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, tmp = x + 5.5, ser = 1.000000000190015;
  tmp -= (x + 0.5) * Math.log(tmp);
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betacf(a, b, x) {
  const FP = 1e-300;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FP) d = FP;
  d = 1 / d;
  let hh = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FP) d = FP;
    c = 1 + aa / c; if (Math.abs(c) < FP) c = FP;
    d = 1 / d; hh *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FP) d = FP;
    c = 1 + aa / c; if (Math.abs(c) < FP) c = FP;
    d = 1 / d;
    const del = d * c;
    hh *= del;
    if (Math.abs(del - 1) < 3e-14) break;
  }
  return hh;
}

function ibeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}

function betaInv(p, a, b) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 64; i++) {
    const m = (lo + hi) / 2;
    if (ibeta(m, a, b) < p) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

/* ---------------------------------------------------------------- formatting */

const plain = (html) => html.replace(/<sup>/g, "^").replace(/<[^>]+>/g, "");

function tickS(s) {
  if (s < 1) return +(s * 1000).toPrecision(3) + " ms";
  return +s.toPrecision(3) + " s";
}

function fmtS(s) {
  if (s === null || s === undefined || !isFinite(s)) return "–";
  if (s < 1) return dec(s * 1000, s < 0.1 ? 1 : 0) + " ms";
  return dec(s, s < 10 ? 2 : 1).replace(/\.?0+$/, "") + " s";
}
