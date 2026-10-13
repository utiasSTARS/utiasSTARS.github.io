/* gr-live: real-time motion planning in the reader's browser with VAMP compiled to WebAssembly.
 *
 * init(root) draws the card with a poster, one sentence and a "Start the live demo" button in its stage,
 * and the caption under it. That is all a phone column (under 30rem) shows before Start; the press of the
 * button builds the rest of the card at once (in the same task, so that the card has its full height
 * before anything else loads, and nothing moves later) and it stays there. A wider column builds the
 * controls and results from the beginning, inert and dimmed, so that the widget keeps one height before
 * and after Start.
 *
 * The root tells the page which height to reserve: data-live="idle" from the first line of init, and
 * data-live="started" from the press of the button on (the two heights differ only on a phone column).
 *
 * The card's markup is built here, with the kit's helpers, so that it needs no module of its own. Nothing
 * heavy loads before the reader presses the button: then ./live-app.js (three.js, the robot, the scene and
 * the planner workers) brings the card to life, and ./live-chart.js draws the convergence chart (a wide
 * column loads it with the card, for the empty axes). The WebAssembly module (data/live/panda_wasm.*) is
 * built by _tools/grrtstar/build_wasm.sh, the scene (data/live/scene.json) by _tools/grrtstar/live_scene.py. */
import { el, segmented, playButton, rangeFill, radioRows, COLORS, webglAvailable, wasmAvailable } from "./util.js";

const BASE = new URL("../", import.meta.url).href;
const ICON_START = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const nw = (s) => `<span class="nw">${s}</span>`;

function addCss() {
  const href = BASE + "css/live.css";
  if ([...document.querySelectorAll("link[rel=stylesheet]")].some((l) => l.href === href)) return Promise.resolve();
  return new Promise((resolve) => {
    const link = el("link", { rel: "stylesheet", href }, document.head);
    link.addEventListener("load", resolve);
    link.addEventListener("error", resolve);
  });
}

function moduleWorkers() {
  // Module workers: Chrome 80, Safari 15, Firefox 114. Probe with a blob that is never run.
  let ok = false;
  try {
    const opts = { get type() { ok = true; return "module"; } };
    const url = URL.createObjectURL(new Blob([""], { type: "text/javascript" }));
    new Worker(url, opts).terminate();
    URL.revokeObjectURL(url);
  } catch (e) {
    return false;
  }
  return ok;
}

/* The page's "phone column" is @container gr (max-width: 30rem). live.css passes the answer on in a custom
 * property, so that this script and the stylesheets never decide differently. */
const phone = (wrap) => getComputedStyle(wrap).getPropertyValue("--gr-live-phone").trim() === "1";

export async function init(root) {
  root.dataset.live = "idle";
  await addCss();

  /* ------------------------------------------------------------ the card: stage with the poster */
  root.innerHTML = "";
  const ui = { root, base: BASE, handlers: {} };
  const wrap = ui.wrap = el("div", { class: "gr-live" }, root);
  const card = ui.card = el("div", { class: "gr-card gr-live-card", "data-state": "idle" }, wrap);
  const stage = ui.stage = el("div", { class: "gr-live-stage", "data-role": "stage", tabindex: -1 }, card);
  ui.poster = el("img", {
    class: "gr-live-poster", src: BASE + "data/live/poster.webp", alt: "", width: 1356, height: 762, decoding: "async"
  }, stage);
  ui.poster.addEventListener("error", () => ui.poster.classList.add("missing"));
  const box = ui.startBox = el("div", { class: "gr-live-start" }, stage);
  el("p", { html: `Move the obstacles, pick a goal and watch ${nw("RRT-Connect")}, AORRTC and ${nw("G-RRT*")} plan for a Panda arm in your browser.` }, box);

  ui.caption = el("p", {
    class: "gr-caption",
    html: `VAMP runs ${nw("RRT-Connect")}, AORRTC and ${nw("G-RRT*")} one after the other in your browser, each with the same time budget and random seed. AORRTC simplifies each solution before it reports it, so tick Simplified to compare all three on equal terms.`
  }, wrap);

  /* ------------------------------------------------------------ the rest of the card, built once */
  let built = false;
  ui.build = () => { if (!built) { built = true; build(ui); } };
  if (!phone(wrap)) ui.build();
  else if ("ResizeObserver" in window) {
    // A phone turned to landscape while the poster shows: the wide layout needs the whole card
    const ro = new ResizeObserver(() => { if (!phone(wrap)) { ro.disconnect(); ui.build(); } });
    ro.observe(root);
  }

  const fail = (text) => el("div", { class: "gr-live-msg", role: "status", text }, box);
  const missing = !wasmAvailable() ? "WebAssembly" : !webglAvailable() ? "WebGL" : !moduleWorkers() ? "module workers" : null;
  if (missing) {
    fail(`This browser does not support ${missing}, so the live demo cannot run here.`);
    return;
  }
  const btn = el("button", { type: "button", class: "gr-btn", "data-role": "start", html: ICON_START + "Start the live demo" }, box);
  const note = el("span", { class: "note", text: "Loads about 140 kB of WebAssembly and a 3D Panda model." }, box);
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    root.dataset.live = "started";                 // the page reserves the started height from here on
    card.dataset.state = "loading";
    box.hidden = true;
    ui.build();                                    // a phone column: the card takes its full height now
    stage.focus({ preventScroll: true });          // the button is gone: keep the keyboard in the card
    try {
      const app = await import("./live-app.js");
      await app.start(ui, { base: BASE });
    } catch (err) {
      console.warn("gr-live", err);
      root.dataset.live = "idle";
      card.dataset.state = "idle";
      stage.querySelectorAll(".gr-live-loading").forEach((n) => n.remove());
      box.hidden = false;
      btn.remove();
      note.remove();
      fail("The live demo could not start in this browser.");
    }
  }, { once: true });
}

/* ---------------------------------------------------------------- the rest of the card
 * Status and hint chips over the stage, legend, transport, view options, scene controls, results table and
 * convergence chart. Built once and never rebuilt. Nothing here needs three.js, the robot or WebAssembly:
 * live-app.js brings these elements to life. */
export const PLANNERS = ["rrtc", "aorrtc", "grrtstar"];      // the order of every control, row and legend, and of the runs
export const LABELS = { rrtc: "RRT-Connect", grrtstar: "G-RRT*", aorrtc: "AORRTC" };
export const COLOR = { rrtc: COLORS.rrtc, grrtstar: COLORS.grrt, aorrtc: COLORS.aorrtc };
export const BUDGETS = [100, 500, 1000, 2000];     // ms
export const BUDGET0 = 500;
export const LAYOUTS = 4, GOALS = 6;               // as written by _tools/grrtstar/live_scene.py
const CHART_HEIGHT = 208;                          // live-chart.js HEIGHT

const ICON = {
  shuffle: '<svg class="ln" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4.5h2.5c2.5 0 4 7 6.5 7H14M2 11.5h2.5c1 0 1.8-1 2.5-2.2M9.2 6.7c.6-1.2 1.2-2.2 1.8-2.2H14M12 2.5l2 2-2 2M12 9.5l2 2-2 2"/></svg>',
  dice: '<svg class="ln" viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="2.5" width="11" height="11" rx="2.2"/><circle cx="5.7" cy="5.7" r=".9" class="dot"/><circle cx="10.3" cy="10.3" r=".9" class="dot"/><circle cx="8" cy="8" r=".9" class="dot"/></svg>',
  again: '<svg class="ln" viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v3h-3"/></svg>'
};

const swatch = (p) => `<i class="sw" style="background:${COLOR[p]}"></i>`;

function build(ui) {
  const fire = (name) => (v) => { if (ui.handlers[name]) ui.handlers[name](v); };
  const { stage, card } = ui;

  /* ------------------------------------------------------------ over the stage (shown once it runs) */
  ui.hud = el("div", { class: "gr-live-hud", "aria-live": "polite", hidden: true }, stage);
  ui.pill = el("div", { class: "gr-status", "data-role": "status" }, ui.hud);
  ui.warn = el("div", { class: "gr-status warn", "data-role": "warning", hidden: true }, ui.hud);
  ui.again = el("button", {
    type: "button", class: "gr-btn ghost small gr-live-again", "data-role": "again", hidden: true, disabled: true,
    html: ICON.again + "Plan again", "aria-label": "Plan again with a new random seed"
  }, stage);
  ui.again.addEventListener("click", () => fire("again")());
  ui.hint = el("span", { class: "gr-hint", hidden: true, text: "Drag an object, or drag elsewhere to orbit" }, stage);

  /* Everything below the stage is inert until the demo runs */
  const body = ui.body = el("div", { class: "gr-live-body", inert: true, "aria-hidden": "true" }, card);

  /* ------------------------------------------------------------ what the stage shows */
  ui.legend = el("div", {
    class: "gr-legend gr-live-legend",
    html: '<span class="it"><i class="dot" style="background:var(--gr-start)"></i>Start</span>' +
      // The goal: a robot drawn in green lines, with the goal dot at its gripper, as on the stage
      '<span class="it"><svg class="gr-live-goalmk" viewBox="0 0 22 14" aria-hidden="true" style="color:var(--gr-goal)">' +
      '<path d="M3 12.6V7.4L10 3.4l7 3.4" stroke="currentColor" stroke-width="4.6"/><path d="M3 12.6V7.4L10 3.4l7 3.4" stroke="#fff" stroke-width="2"/>' +
      '<circle cx="17.4" cy="6.9" r="2.5" fill="currentColor"/></svg>Goal</span>' +
      `<span class="it">${PLANNERS.map((p) => `<i class="ln" style="color:${COLOR[p]}"></i>`).join("")}End-effector paths</span>`
  }, body);

  const transport = el("div", { class: "gr-transport gr-live-transport" }, body);
  ui.play = playButton({ what: "the motions", parent: transport, onClick: fire("play") });
  ui.scrub = el("input", { type: "range", class: "gr-range", min: 0, max: 1000, value: 0, step: 1, "aria-label": "Position along the motions" }, transport);
  ui.syncScrub = rangeFill(ui.scrub);
  ui.scrub.addEventListener("input", () => fire("scrub")(+ui.scrub.value / 1000));
  ui.readout = el("span", { class: "gr-readout", text: "" }, transport);

  const view = el("div", { class: "gr-toolbar gr-live-view" }, body);
  ui.plannerSeg = segmented(el("div", { "data-role": "planner" }, view),
    PLANNERS.map((p) => ({ value: p, html: swatch(p) + LABELS[p] })), "grrtstar", fire("planner"), { label: "Planner shown" });
  ui.variantSeg = segmented(el("div", { "data-role": "variant" }, view),
    [{ value: "first", label: "Initial solution" }, { value: "best", label: "Best" }], "best", fire("variant"), { label: "Solution shown" });
  const check = (text, checked, name) => {
    const lab = el("label", { class: "gr-check" }, view);
    const box = el("input", { type: "checkbox", checked }, lab);
    el("span", { text }, lab);
    box.addEventListener("change", () => fire(name)(box.checked));
    return box;
  };
  ui.simplified = check("Simplified", false, "simplified");
  ui.ghosts = check("Ghosts", true, "ghosts");

  /* ------------------------------------------------------------ the planning problem */
  const controls = ui.controls = el("div", { class: "gr-toolbar gr-live-controls", "data-role": "controls" }, body);
  const group = (label, key) => {
    const g = el("div", { class: "gr-group", "data-group": key }, controls);
    el("span", { class: "lbl", text: label }, g);
    return g;
  };
  const gLayout = group("Obstacles", "layout");
  ui.layoutSeg = segmented(el("div", {}, gLayout),
    Array.from({ length: LAYOUTS }, (_, i) => ({ value: i, label: String(i + 1) })), 0, fire("layout"), { label: "Obstacle layout" });
  ui.shuffle = el("button", { type: "button", class: "gr-btn ghost small", html: ICON.shuffle + "Shuffle", "aria-label": "Shuffle the objects on the table" }, gLayout);
  ui.shuffle.addEventListener("click", () => fire("shuffle")());
  const gGoal = group("Goal", "goal");
  ui.goalSeg = segmented(el("div", {}, gGoal),
    Array.from({ length: GOALS }, (_, i) => ({ value: i, label: String(i + 1) })), 0, fire("goal"), { label: "Goal" });
  ui.random = el("button", { type: "button", class: "gr-btn ghost small", html: ICON.dice + "Random", "aria-label": "A random goal over the table" }, gGoal);
  ui.random.addEventListener("click", () => fire("random")());
  const gBudget = group("Time budget", "budget");
  ui.budgetSeg = segmented(el("div", {}, gBudget),
    BUDGETS.map((b) => ({ value: b, label: b / 1000 + " s" })), BUDGET0, fire("budget"), { label: "Time budget per planner" });

  /* ------------------------------------------------------------ results: table and convergence chart */
  const results = el("div", { class: "gr-live-results" }, body);
  const table = ui.table = el("table", { class: "gr-table selectable gr-live-table" }, results);
  el("caption", { class: "gr-live-sr", text: "Time to initial solution and path lengths of each planner" }, table);
  const cols = el("colgroup", {}, table);
  ["name", "time", "len", "len"].forEach((c) => el("col", { class: c }, cols));
  const thead = el("thead", {}, table);
  const h1 = el("tr", {}, thead);
  el("th", { rowspan: 2, scope: "col", text: "Planner" }, h1);
  ui.thTime = el("th", { rowspan: 2, scope: "col", text: "Time to initial solution" }, h1);
  el("th", { colspan: 2, scope: "colgroup", class: "span", text: "Path length (rad)" }, h1);
  const h2 = el("tr", {}, thead);
  el("th", { scope: "col", text: "initial solution" }, h2);
  el("th", { scope: "col", text: "best" }, h2);
  const tbody = el("tbody", {}, table);
  ui.rows = {};
  const cell = (tr) => {
    const td = el("td", {}, tr);
    const box = el("div", { class: "c" }, td);          // a fixed box: value, and a small note under it
    return { td, v: el("span", { class: "v", text: "–" }, box), sub: el("span", { class: "sub" }, box) };
  };
  PLANNERS.forEach((p) => {
    const tr = el("tr", {}, tbody);
    tr.style.setProperty("--c", COLOR[p]);
    el("th", { scope: "row", html: `<div class="c">${swatch(p)}<span>${LABELS[p]}</span></div>` }, tr);
    ui.rows[p] = { tr, t: cell(tr), c0: cell(tr), c1: cell(tr) };
  });
  // The rows choose the planner shown, like the segmented control under the stage
  ui.rowSel = radioRows(PLANNERS.map((p) => ui.rows[p].tr), PLANNERS, "grrtstar", fire("planner"), { label: "Planner shown" });
  // Until the chart module is in, its host holds the chart's exact height: the SVG is CHART_HEIGHT units
  // tall in a viewBox as wide as the host's rounded width (live-chart.js), drawn at the host's width
  const host = ui.chartHost = el("div", { class: "gr-live-chart" }, results);
  const w = host.getBoundingClientRect().width;
  if (w > 0) host.style.minHeight = (CHART_HEIGHT * w) / Math.max(140, Math.round(w)) + "px";
  ui.chartReady = import("./live-chart.js").then(({ Chart }) => {
    ui.chart = new Chart(host, { planners: PLANNERS, colors: COLOR, labels: LABELS });
    ui.chart.draw({ budget: BUDGET0, lower: NaN, series: {} });
    host.style.minHeight = "";
    return ui.chart;
  });
  ui.chartReady.catch(() => {});        // live-app.js waits for it and reports a failure

  return ui;
}
