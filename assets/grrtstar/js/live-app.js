/* The live demo once the reader has pressed Start: scene, controls, planning, playback and results, in
 * the card that live.js has already drawn. Imported by live.js; brings in three.js (live-stage.js)
 * and the planner workers (live-planner.js). */
import { el, reducedMotion, whileVisible, liveText, throttle, showTip, hideTip, hint } from "./util.js";
import { Planners } from "./live-planner.js";
import { PLANNERS, LABELS, COLOR, BUDGET0 } from "./live.js";
import { fmtTime, fmtLen } from "./live-chart.js";

const SPEED = 1.8;            // rad/s of joint-space path length during playback
const HOLD0 = 0.4;            // s, pause at the start
const IDLE_MS = 30000;        // the workers stop after this long off screen or in a hidden tab

const clone = (x) => JSON.parse(JSON.stringify(x));
const dist = (a, b) => Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0));
const sceneName = (s) => String(s).replace(/_/g, " ").replace(/ \d+$/, "");   // "table pick", without the problem number

/* A piecewise-linear joint-space path parametrised by arc length; VAMP checks motions along these
 * straight segments, so playback interpolates linearly (no angle wrapping). */
class Path {
  constructor(flat, dof) {
    this.dof = dof;
    this.n = flat.length / dof;
    this.q = flat;
    this.s = new Float64Array(this.n);
    for (let i = 1; i < this.n; i++) {
      let d = 0;
      for (let j = 0; j < dof; j++) d += (flat[i * dof + j] - flat[(i - 1) * dof + j]) ** 2;
      this.s[i] = this.s[i - 1] + Math.sqrt(d);
    }
    this.length = this.s[this.n - 1] || 0;
    this.out = new Float64Array(dof);
  }

  at(s) {
    const { q, dof, n, out } = this;
    if (s <= 0 || n === 1) { for (let j = 0; j < dof; j++) out[j] = q[j]; return out; }
    if (s >= this.length) { for (let j = 0; j < dof; j++) out[j] = q[(n - 1) * dof + j]; return out; }
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (this.s[mid] <= s) lo = mid; else hi = mid; }
    const u = (s - this.s[lo]) / Math.max(1e-12, this.s[hi] - this.s[lo]);
    for (let j = 0; j < dof; j++) out[j] = q[lo * dof + j] + (q[hi * dof + j] - q[lo * dof + j]) * u;
    return out;
  }
}

/* Footprint radius of an obstacle in the horizontal plane (for shuffling without overlaps). */
function footprint(o) {
  if (o.kind === "sphere") return o.r;
  if (o.kind === "box") return Math.hypot(o.h[0], o.h[1]);
  return o.r + 0.5 * o.l * Math.abs(Math.sin(o.e[1] || 0)) + 0.5 * o.l * Math.abs(Math.sin(o.e[0] || 0));
}

/* The shared white tooltip (.gr-tip) on hover and keyboard focus; `get` is the text or a function giving
 * it. A tap shows it only where `touch` asks for it (a note in a table cell): a control that says what it
 * does needs no hint on touch, and a hint there would sit over its neighbours. */
const TOUCH_TIP_MS = 1800;
function tip(node, get, { touch = false } = {}) {
  let timer = 0;
  const text = () => (typeof get === "function" ? get() : get);
  const show = (e) => {
    const t = text();
    if (!t) { hideTip(); return; }
    const r = node.getBoundingClientRect();
    const pointer = e && e.type !== "focus" && e.clientX !== undefined;
    showTip(t, pointer ? e.clientX : r.left + r.width / 2, pointer ? e.clientY : r.top);
    clearTimeout(timer);
    if (e && e.pointerType === "touch") timer = setTimeout(hideTip, TOUCH_TIP_MS);
  };
  node.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch" || touch) show(e); });
  node.addEventListener("pointermove", (e) => { if (e.pointerType !== "touch") show(e); });
  node.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") hideTip(); });
  node.addEventListener("focus", (e) => { if (node.matches(":focus-visible")) show(e); });
  node.addEventListener("blur", hideTip);
}

/* The same for a group of buttons, found by position, so that a disabled button (which gets no pointer
 * events of its own) can still say why it is disabled. */
function tipGroup(host, buttons, get) {
  let timer = 0;
  const show = (e) => {
    const b = buttons.find((x) => { const r = x.getBoundingClientRect(); return !x.hidden && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; });
    const t = b && get(b);
    if (!t) { hideTip(); return; }
    showTip(t, e.clientX, e.clientY);
    clearTimeout(timer);
    if (e.pointerType === "touch") timer = setTimeout(hideTip, TOUCH_TIP_MS);
  };
  host.addEventListener("pointermove", (e) => { if (e.pointerType !== "touch") show(e); });
  // On touch, only an option that cannot be chosen explains itself
  host.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch") return;
    const b = buttons.find((x) => { const r = x.getBoundingClientRect(); return !x.hidden && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; });
    if (b && b.disabled) show(e);
  });
  host.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") hideTip(); });
  buttons.forEach((b) => {
    b.addEventListener("focus", () => { const t = get(b), r = b.getBoundingClientRect(); if (t && b.matches(":focus-visible")) showTip(t, r.left + r.width / 2, r.top); });
    b.addEventListener("blur", hideTip);
  });
}

export async function start(ui, { base }) {
  const reduced = reducedMotion();
  const debug = /[?&]debug\b/.test(location.search);
  const idleArg = debug && /[?&]idle=([\d.]+)/.exec(location.search);
  const idleMs = idleArg ? 1000 * +idleArg[1] : IDLE_MS;
  const { rows } = ui;

  /* ---------------------------------------------------------------- from poster to loading */
  ui.card.dataset.state = "loading";
  ui.startBox.hidden = true;
  const loading = el("div", { class: "gr-live-loading", role: "status" }, ui.stage);
  const loadingPill = el("span", { class: "gr-status" }, loading);
  el("span", { class: "gr-spinner", "aria-hidden": "true" }, loadingPill);
  const loadingText = el("span", { text: "Loading VAMP" }, loadingPill);
  const pillSpin = el("span", { class: "gr-spinner", "aria-hidden": "true", hidden: true }, ui.pill);
  const pillText = el("span", {}, ui.pill);

  const state = {
    scene: null, arrangement: 0, obstacles: [], goals: [], goal: null, goalOk: true, startOk: true,
    budget: BUDGET0, seed: 0, results: {}, selected: "grrtstar", variant: "best", simplified: false, ghosts: true,
    playing: false, t: 0, period: 0, stale: true, checking: false, recheck: false, planned: 0
  };
  let planners = null;
  const { LiveStage } = await import("./live-stage.js");
  const stage = new LiveStage(ui.stage, {
    colors: COLOR,
    canDrag: () => !!planners && ui.card.dataset.state === "ready",
    onPick: () => hideHint(),
    onDrag: () => {
      if (!state.dragging) {
        // The scene changes: the current paths no longer apply
        state.dragging = true;
        stopPlay();
        planners.cancel();
        markStale();
        setPill("Release to plan");
      }
      scheduleCheck();
    },
    onDrop: () => {
      if (!state.dragging) return;
      state.dragging = false;
      state.custom = true;
      ui.layoutSeg.set(-1);
      afterChange();
    }
  });
  stage.controls.addEventListener("start", () => hideHint());

  const [scene, created] = await Promise.all([
    fetch(base + "data/live/scene.json").then((r) => { if (!r.ok) throw new Error("scene.json " + r.status); return r.json(); }),
    Planners.create(base, (s) => { loadingText.textContent = s; }),
    stage.loadRobot(PLANNERS),
    ui.chartReady
  ]);
  loadingText.textContent = "Warming up";
  planners = created;
  state.scene = scene;
  const start = scene.start;
  stage.setStart(start);

  /* ---------------------------------------------------------------- controls */
  const setReadout = liveText(ui.readout);
  const drawChart = throttle(() => ui.chart.draw(chartData()), 100);
  /* Errors of a cancelled job are expected (a newer request took over); anything else is reported. */
  const guard = (fn) => (...a) => Promise.resolve().then(() => fn(...a)).catch((err) => { if (!err || !err.cancelled) console.warn("gr-live", err); });

  ui.handlers = {
    play: (st) => { if (st === "pause") stopPlay(); else { if (st === "replay") state.t = 0; startPlay(); } },
    scrub: (u) => { stopPlay(); state.t = u * state.period; applyTime(); stopPlay(); },
    planner: (p) => select(p),
    variant: (v) => { state.variant = v; refreshView(); },
    simplified: (on) => { state.simplified = on; refreshView(); },
    ghosts: (on) => { state.ghosts = on; refreshView(); },
    layout: (i) => setArrangement(i),
    goal: (k) => { state.goal = state.goals[k]; afterChange(); },
    budget: (b) => { state.budget = b; plan(); },
    shuffle: guard(() => shuffle()),
    random: guard(() => randomGoal()),
    again: () => { state.seed++; plan(); }
  };

  /* Hints: the kit tooltip on hover and keyboard focus (never a native title) */
  scene.arrangements.forEach((a, i) => {
    const b = ui.layoutSeg.buttons[i];
    if (!b) return;
    b.setAttribute("aria-label", `Layout ${i + 1}, from MotionBenchMaker's ${sceneName(a.name)} scene`);
    hint(b, `Layout ${i + 1}, from MotionBenchMaker's ${sceneName(a.name)} scene`, { describe: false });
  });
  tipGroup(ui.goalSeg.buttons[0].parentNode, ui.goalSeg.buttons, (b) => b.dataset.tip);
  hint(ui.shuffle, "Scatter the objects over the table", { describe: false });
  hint(ui.random, "A random collision-free goal with the gripper over the table");
  hint(ui.ghosts.parentNode, "The other two planners as translucent robots", { describe: false });
  hint(ui.again, "A new random seed for all three planners", { describe: false });
  hint(ui.simplified.parentNode, "Each path after VAMP's simplification", { describe: false });
  hint(ui.thTime, "Mean over repeats of the same search, timed from the call. RRT-Connect and G-RRT* search alike up to their initial solution, so their times differ only by bookkeeping and noise.", { describe: false });
  PLANNERS.forEach((p) => {
    tip(rows[p].t.td, () => rows[p].t.td.dataset.tip, { touch: true });
    tip(rows[p].c0.td, () => rows[p].c0.td.dataset.tip, { touch: true });
    tip(rows[p].c1.td, () => rows[p].c1.td.dataset.tip, { touch: true });
  });
  function hideHint() { ui.hint.classList.add("gone"); }

  /* Rendering stops off screen; the workers stop after a while off screen or in a hidden tab */
  whileVisible(ui.stage, (v) => {
    stage.setVisible(v);
    if (!v && state.playing) { stopPlay(); state.resume = true; }
    else if (v && state.resume) { state.resume = false; startPlay(); }
  }, "80px");
  let idleTimer = 0;
  whileVisible(ui.card, (v) => {
    clearTimeout(idleTimer);
    if (!v) {
      idleTimer = setTimeout(() => {
        planners.suspend();                              // frees both workers; the compiled module stays
        if (state.stale) setPill("Paused while out of view");
      }, idleMs);
    } else if (planners.suspended) {
      planners.resume().then(() => { if (state.stale && !state.dragging) plan(); }, () => {});
    }
  }, "0px");

  /* ---------------------------------------------------------------- scene */
  const tableTop = () => state.obstacles.find((o) => /table_top|^base$|shelf_bottom/.test(o.name));

  function frame() {
    const top = tableTop();
    const zmin = Math.min(...state.obstacles.map((o) => o.p[2] - (o.h ? o.h[2] : o.r || 0)));
    const c = top ? top.p : [0.4, 0.4, 0.2];
    stage.setGround(Math.min(zmin, -0.02), [c[0] * 0.5, c[1] * 0.5]);
    // Look from in front of the robot and to the side of the table, slightly from above
    const tx = c[0] * 0.45, ty = c[1] * 0.45;
    const az = Math.atan2(c[1], c[0]) - Math.PI / 2 + 0.3;
    stage.view({ target: [tx, ty, 0.2], azimuth: az, elevation: 0.55, distance: 3.6 });
  }

  function setArrangement(i) {
    state.arrangement = i;
    ui.layoutSeg.set(i);
    state.custom = false;
    const a = scene.arrangements[i];
    state.obstacles = clone(a.obstacles);
    state.goals = a.goals.map((g) => scene.goals[g].q);
    stage.setObstacles(state.obstacles);
    if (!state.framed) { frame(); state.framed = true; }
    ui.goalSeg.buttons.forEach((b, k) => {
      const g = scene.goals[a.goals[k]];
      b.hidden = !g;
      if (!g) return;
      b.dataset.name = `Goal ${k + 1}, from MotionBenchMaker's ${sceneName(g.problem)} scene`;
      b.setAttribute("aria-label", `Goal ${k + 1}, from MotionBenchMaker's ${sceneName(g.problem)} scene`);
    });
    ui.goalSeg.set(0);
    state.goal = state.goals[0];
    afterChange();
  }

  /* Bounds for dragging: the centre stays over the table top */
  stage.dragBounds = (i, p) => {
    const top = tableTop();
    if (!top) return p;
    const yaw = top.e ? top.e[2] : 0, cy = Math.cos(yaw), sy = Math.sin(yaw);
    const dx = p[0] - top.p[0], dy = p[1] - top.p[1];
    let u = dx * cy + dy * sy, v = -dx * sy + dy * cy;
    const m = 0.5 * footprint(state.obstacles[i]);
    u = Math.max(-top.h[0] + m, Math.min(top.h[0] - m, u));
    v = Math.max(-top.h[1] + m, Math.min(top.h[1] - m, v));
    return [top.p[0] + u * cy - v * sy, top.p[1] + u * sy + v * cy, p[2]];
  };

  /* ---------------------------------------------------------------- validity */
  async function validity() {
    // The start, the goal, and every goal on offer (those that collide in this scene are refused)
    const [s, g, ...offered] = await planners.check(state.obstacles, [start, state.goal, ...state.goals]);
    ui.goalSeg.buttons.forEach((b, k) => {
      const bad = !offered[k] || !offered[k].ok;
      b.disabled = bad && b.getAttribute("aria-pressed") !== "true";
      b.classList.toggle("bad", bad);
      b.dataset.tip = bad ? "This goal collides with an obstacle in this scene" : b.dataset.name || "";
    });
    state.startOk = s.ok;
    state.goalOk = g.ok;
    const hits = new Set([...s.hits, ...g.hits].filter((i) => i >= 0));
    stage.markHits(hits);
    stage.setGoal(state.goal, g.ok);
    if (!s.ok) showWarn("The start pose collides with an obstacle. Move it away.");
    else if (!g.ok) showWarn(g.hits.includes(-1) ? "This goal collides with the robot itself." : "The goal collides with an obstacle. Move it or pick another goal.");
    else showWarn(null);
    return s.ok && g.ok;
  }

  function scheduleCheck() {
    if (state.checking) { state.recheck = true; return; }
    state.checking = true;
    validity().catch(() => {}).finally(() => {
      state.checking = false;
      if (state.recheck) { state.recheck = false; scheduleCheck(); }
    });
  }

  function showWarn(text) {
    ui.warn.hidden = !text;
    ui.warn.textContent = text || "";
  }

  function setPill(text, { busy = false } = {}) {
    ui.pill.classList.toggle("busy", busy);
    pillSpin.hidden = !busy;
    pillText.textContent = text;
  }

  function afterChange() {
    stopPlay();
    planners.cancel();
    markStale();
    stage.setGoal(state.goal);
    plan();
  }

  /* ---------------------------------------------------------------- planning */
  function markStale() {
    state.stale = true;
    PLANNERS.forEach((p) => rows[p].tr.classList.add("stale"));
    ui.chartHost.classList.add("stale");
    stage.showRobots(null);
    stage.setTraces({});
    stage.setStart(start);
    state.t = 0;
    state.period = 0;
    ui.play.disabled = true;
    ui.play.setState("play");
    ui.scrub.disabled = true;
    showScrub(true);
    setReadout("");
    setReadout.flush();
  }

  const lower = () => dist(start, state.goal);

  function chartData() {
    const series = {};
    PLANNERS.forEach((p) => {
      const r = state.results[p];
      if (!r) return;
      series[p] = { points: r.points || [], end: r.end, stops: p === "rrtc" && !r.running };
    });
    return { budget: state.budget, lower: lower(), series };
  }

  /* A table cell: the value, a small line under it, and what that line means (tooltip and aria-label) */
  function setCell(c, value, sub, { cls = "", note = "" } = {}) {
    c.v.textContent = value;
    c.sub.textContent = sub || "";
    c.sub.className = "sub" + (cls ? " " + cls : "");
    if (note) { c.td.dataset.tip = note; c.sub.setAttribute("aria-label", note); }
    else { delete c.td.dataset.tip; c.sub.removeAttribute("aria-label"); }
  }

  /* The cost a running planner has reached, written at most ten times per second */
  const liveCost = {};
  PLANNERS.forEach((p) => { liveCost[p] = throttle((text) => { rows[p].c1.v.textContent = text; }, 100); });

  async function plan() {
    if (!state.goal) return;
    const token = state.token = (state.token || 0) + 1;
    let ok;
    try {
      ok = await validity();
    } catch (err) {
      if (err.cancelled) return;
      console.warn("gr-live", err);
      state.warm = true;
      ready();
      setPill("The planner stopped unexpectedly. Press Plan again.");
      return;
    }
    if (token !== state.token) return;
    stopPlay();
    markStale();
    if (!ok) { state.warm = true; ready(); setPill("Waiting for a valid scene"); return; }
    state.results = {};
    PLANNERS.forEach((p) => { liveCost[p].flush(); setCell(rows[p].t, "…"); setCell(rows[p].c0, ""); setCell(rows[p].c1, ""); });
    drawChart();
    drawChart.flush();
    ui.chartHost.classList.remove("stale");
    const job = { start, goal: state.goal, obstacles: state.obstacles, budget: state.budget, seed: state.seed };
    try {
      if (!state.warm) {
        await planners.warmup(job);
        state.warm = true;
        ready();
        if (token !== state.token) return;
      }
      await planners.plan(job, {
        onStart: (p) => {
          setPill(`Planning with ${LABELS[p]}`, { busy: true });
          state.results[p] = { running: true, points: [] };
        },
        onProgress: (p, pts) => {
          const r = state.results[p];
          if (!r || !r.running) return;
          pts.forEach((x) => r.points.push(x));
          r.end = pts[pts.length - 1][0];
          drawChart();
          liveCost[p](fmtLen(r.points[r.points.length - 1][1]));
        },
        onResult: (p, res) => {
          liveCost[p].flush();
          state.results[p] = digest(p, res);
          rows[p].tr.classList.remove("stale");
          showRow(p);
          drawChart();
          drawChart.flush();
        }
      });
    } catch (err) {
      if (!state.warm) { state.warm = true; ready(); }       // a change during the warm-up: ready all the same
      if (err.cancelled || token !== state.token) return;
      console.warn("gr-live", err);
      setPill("The planner stopped unexpectedly. Press Plan again.");
      return;
    }
    if (token !== state.token) return;
    state.stale = false;
    state.planned++;
    PLANNERS.forEach((p) => rows[p].tr.classList.remove("stale"));
    setPill(`Seed ${state.seed}, ${state.budget / 1000} s per planner`);
    state.t = 0;
    refreshView();
    if (!reduced) startPlay();
  }

  /* The scene is loaded and the planner is warm: the poster and the loading note go, the card comes to life */
  function ready() {
    if (ui.card.dataset.state === "ready") return;
    ui.card.dataset.state = "ready";
    loading.remove();
    ui.poster.remove();
    ui.startBox.remove();
    ui.hud.hidden = false;
    ui.hint.hidden = false;
    ui.again.hidden = false;
    ui.again.disabled = false;
    ui.body.removeAttribute("inert");
    ui.body.removeAttribute("aria-hidden");
    // The Start button had the focus and is gone: hand it to the first control that works now
    const a = document.activeElement;
    if (!a || a === document.body || a === ui.stage) {
      ui.again.focus({ preventScroll: true });
      hideTip();                                   // the focus ring is enough: no hint that the reader did not ask for
    }
    ui.stage.removeAttribute("tabindex");          // it only held the focus while the demo loaded
  }

  /* A worker result, ready to show */
  function digest(p, r) {
    const out = { planner: p, solved: r.solved, elapsed: r.elapsed, running: false, iterations: r.iterations };
    if (!r.solved) { out.points = []; out.end = r.elapsed; return out; }
    const tr = r.trace;
    const points = [];
    for (let i = 0; i < tr.length; i += 2) points.push([tr[i], tr[i + 1]]);
    // The first solution stands at its measured time. The later improvements carry the planner's own clock,
    // which a browser advances in coarse steps (0.1 ms in Chrome, 1 ms in Firefox and Safari), so one may read
    // earlier than the first solution: it is shown no earlier than what came before it.
    points[0] = [r.tFirst, points[0][1]];
    for (let i = 1; i < points.length; i++) points[i][0] = Math.max(points[i][0], points[i - 1][0]);
    out.points = points;
    out.end = p === "rrtc" ? r.tFirst : r.elapsed;
    out.tFirst = r.tFirst;
    const dof = start.length;
    const mk = (d) => ({ path: new Path(d.q, dof), cost: d.cost, valid: d.valid, ee: d.ee, n: d.n, ms: d.ms, ops: d.ops });
    out.first = mk(r.first);
    out.best = mk(r.best);
    out.firstSimp = mk(r.firstSimp);
    out.bestSimp = mk(r.bestSimp);
    return out;
  }

  function showRow(p) {
    const r = state.results[p], row = rows[p];
    if (!r.solved) {
      setCell(row.t, "not found", "", { note: "No solution within the time budget" });
      setCell(row.c0, "–");
      setCell(row.c1, "–");
      return;
    }
    setCell(row.t, fmtTime(r.tFirst));
    fillCosts(p);
  }

  function fillCosts(p) {
    const r = state.results[p], row = rows[p];
    if (!r || r.running || !r.solved) return;
    const a = state.simplified ? r.firstSimp : r.first, b = state.simplified ? r.bestSimp : r.best;
    const cell = (c, v, pct) => {
      const gain = pct ? "−" + pct + "%" : "", means = pct ? `${pct}% shorter than the initial solution` : "";
      if (!v.valid) {
        setCell(c, fmtLen(v.cost), "fails check", { cls: "bad", note: "A segment of this path fails VAMP's motion check at the robot's resolution, so the path is not shown" });
      } else if (v.ops === "shortcut") {
        const why = "Shortcut only, because the B-spline step gave a path that fails VAMP's motion check";
        setCell(c, fmtLen(v.cost) + "†", gain, { note: means ? `${means}. ${why}` : why });
      } else {
        setCell(c, fmtLen(v.cost), gain, { note: means });
      }
    };
    cell(row.c0, a, 0);
    cell(row.c1, b, p !== "rrtc" && b.cost < a.cost - 1e-4 ? Math.round(100 * (1 - b.cost / a.cost)) : 0);
  }

  /* ---------------------------------------------------------------- view and playback */
  function current(p) {
    const r = state.results[p];
    if (!r || r.running || !r.solved) return null;
    const v = state.variant === "first" ? (state.simplified ? r.firstSimp : r.first) : (state.simplified ? r.bestSimp : r.best);
    return v.valid ? v : null;
  }

  const atEnd = () => state.period > 0 && state.t >= state.period - 1e-3;

  function select(p) {
    state.selected = p;
    refreshView();
  }

  function refreshView() {
    ui.plannerSeg.set(state.selected);
    ui.rowSel.set(state.selected);
    PLANNERS.forEach((p) => fillCosts(p));
    if (state.stale) return;
    const have = PLANNERS.filter((p) => current(p));
    const traces = {};
    have.forEach((p) => { traces[p] = current(p).ee; });
    stage.setTraces(traces, state.selected);
    stage.showRobots({ selected: state.selected, planners: have, ghosts: state.ghosts });
    const longest = Math.max(0, ...have.map((p) => current(p).path.length));
    state.period = have.length ? HOLD0 + longest / SPEED : 0;
    state.t = Math.min(state.t, state.period);
    ui.play.disabled = !have.length;
    ui.scrub.disabled = !have.length;
    applyTime();
    if (!state.playing) ui.play.setState(atEnd() ? "replay" : "play");
  }

  function applyTime() {
    const s = Math.max(0, state.t - HOLD0) * SPEED;
    PLANNERS.forEach((p) => {
      const c = current(p);
      if (c) stage.pose(p, c.path.at(s));
    });
    showScrub(!state.playing);
    // The length as the table shows it (fmtLen), and the position along it with as many decimals
    const sel = current(state.selected);
    if (sel) {
      const total = fmtLen(sel.path.length), decimals = (total.split(".")[1] || "").length;
      setReadout.html(`<b>${Math.min(s, sel.path.length).toFixed(decimals)}</b> of ${total} rad`);
    } else setReadout("");
  }

  /* The scrubber follows the motion. Its value is written only when it changes, and at most 30 times per
   * second while a motion plays (each write lays the slider out again). */
  let scrubShown = -1, scrubAt = 0;
  function showScrub(now) {
    const v = state.period ? Math.round((state.t / state.period) * 1000) : 0;
    if (v === scrubShown) return;
    const t = performance.now();
    if (!now && t - scrubAt < 33) return;
    scrubShown = v;
    scrubAt = t;
    ui.scrub.value = v;
    ui.syncScrub();
  }

  /* The motions play once and stop at the goal; the button then offers a replay */
  let stopAnim = null;
  function startPlay() {
    if (state.stale || !state.period) return;
    if (atEnd()) state.t = 0;
    state.playing = true;
    ui.play.setState("pause");
    stopAnim = stage.animate((dt) => {
      if (!state.playing) return false;
      state.t = Math.min(state.period, state.t + dt);
      applyTime();
      if (state.t >= state.period) { stopPlay(); return false; }
      return true;
    });
  }

  function stopPlay() {
    state.playing = false;
    if (stopAnim) { stopAnim(); stopAnim = null; }
    ui.play.setState(atEnd() ? "replay" : "play");
    showScrub(true);
    setReadout.flush();
  }

  /* ---------------------------------------------------------------- shuffle and random goal */
  async function shuffle() {
    const top = tableTop();
    if (!top) return;
    const movable = state.obstacles.map((o, i) => (o.movable ? i : -1)).filter((i) => i >= 0);
    const saved = clone(state.obstacles);
    const yaw = top.e ? top.e[2] : 0, cy = Math.cos(yaw), sy = Math.sin(yaw);
    try {
      for (let attempt = 0; attempt < 40; attempt++) {
        const placed = [];
        let ok = true;
        for (const i of movable) {
          const o = state.obstacles[i], r = footprint(o);
          let found = false;
          for (let k = 0; k < 60 && !found; k++) {
            const u = (Math.random() * 2 - 1) * (top.h[0] - r), v = (Math.random() * 2 - 1) * (top.h[1] - r);
            const x = top.p[0] + u * cy - v * sy, y = top.p[1] + u * sy + v * cy;
            if (placed.every(([px, py, pr]) => Math.hypot(px - x, py - y) > pr + r + 0.02)) {
              placed.push([x, y, r]);
              o.p = [x, y, o.p[2]];
              if (o.e) o.e = [o.e[0], o.e[1], Math.random() * 2 * Math.PI - Math.PI];
              found = true;
            }
          }
          if (!found) ok = false;
        }
        if (!ok) continue;
        const [s, g] = await planners.check(state.obstacles, [start, state.goal]);
        if (s.ok && g.ok) {
          stage.setObstacles(state.obstacles);
          state.custom = true;
          ui.layoutSeg.set(-1);
          afterChange();
          return;
        }
      }
      state.obstacles = saved;
    } catch (err) {
      state.obstacles = saved;
      throw err;
    }
  }

  let seeking = false;          // not the disabled attribute: a keyboard user would lose the focus with it
  async function randomGoal() {
    if (seeking) return;
    const top = tableTop();
    seeking = true;
    try {
      const yaw = top && top.e ? top.e[2] : 0;
      const region = top ? {
        center: top.p, axes: [[Math.cos(yaw), Math.sin(yaw)], [-Math.sin(yaw), Math.cos(yaw)]],
        half: [top.h[0] - 0.05, top.h[1] - 0.05], zmin: top.p[2] + top.h[2] + 0.03, zmax: top.p[2] + top.h[2] + 0.3
      } : null;
      const q = await planners.random(state.obstacles, region, start);
      if (!q) { showWarn("No collision-free goal found over the table. Try again."); return; }
      ui.goalSeg.set(-1);
      state.goal = q;
      afterChange();
    } finally {
      seeking = false;
    }
  }

  /* ---------------------------------------------------------------- go */
  setPill("Checking the scene", { busy: true });
  setArrangement(0);
  const api = { ui, stage, planners, state, idleMs, setArrangement, shuffle, randomGoal, plan, select, refreshView, showRow, startPlay, stopPlay, applyTime };
  if (debug) window.__grLive = api;
  return api;
}
