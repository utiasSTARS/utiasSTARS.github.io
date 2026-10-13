/* MotionBenchMaker viewer (#gr-mbm): G-RRT* in VAMP solving one MotionBenchMaker problem per scene
 * for four robots, and how its solution evolves (first solution, first solution simplified, best
 * within the time budget, best simplified).
 *
 * Data: data/mbm/index.json (robots and scenes) and data/mbm/<robot>.json (loaded when the robot is
 * picked), written by _tools/grrtstar/build_mbm.py. Robot models: robots/<robot>/ through robot.js.
 *
 * Start-up. init() asks for everything at once: the stylesheet, index.json, the first robot's data,
 * chain.json and GLB, and ./mbm-view.js with three.js and its add-ons (as modulepreload hints, so
 * that the browser does not discover them one import level at a time). It builds the widget, at its
 * final height, as soon as the stylesheet and index.json are in, and resolves; the 3D view follows.
 * root.dataset.view is "loading", then "ready" or "failed".
 *
 * The widget keeps one height: every robot's scene chips share one grid cell (the tallest sets the
 * height) and every other row has a fixed height. Without WebGL the pickers and the table of lengths
 * and times still work, and the stage says why it is empty.
 *
 * The four rows of the table are the path selector (the kit's radioRows on a .gr-table.selectable):
 * Tab reaches the chosen row, the arrow keys move the choice, and a click anywhere on a row picks it.
 *
 * While a motion plays, only WebGL draws every frame. The scrubber, the readout and its text for
 * screen readers are written at most ten times per second, and only when their value has changed. */
import { el, reducedMotion, smooth, fetchJSON, segmented, chips, radioRows, playButton, rangeFill, throttle } from "./util.js";

const BASE = new URL("../", import.meta.url).href;
const DATA = BASE + "data/mbm/";
const ROBOTS = BASE + "robots/";
const VARIANTS = ["first", "first_simp", "best", "best_simp"];
const FIRST_ROBOT = "panda";             // index.json lists it first; its files are fetched before index.json is in
const HOLD_START = 0.6, HOLD_END = 1.1;   // s, pauses at the start and at the goal
const MAX_FIRST_S = 10;                  // the longest path of a robot plays in at most this long
const BEST_S = 3.2;                      // a typical best path plays in about this long

/* What ./mbm-view.js and ./robot.js import, resolved through the page's import map. */
const THREE_MODULES = [
  "three",
  "three/addons/controls/OrbitControls.js",
  "three/addons/lines/Line2.js",
  "three/addons/lines/LineMaterial.js",
  "three/addons/lines/LineGeometry.js",
  "three/addons/lines/LineSegments2.js",
  "three/addons/lines/LineSegmentsGeometry.js",
  "three/addons/loaders/GLTFLoader.js",
  "three/addons/libs/meshopt_decoder.module.js",
  "three/addons/utils/BufferGeometryUtils.js"
];

function addCss() {
  const href = BASE + "css/mbm.css";
  const have = [...document.querySelectorAll("link[rel=stylesheet]")].find((l) => l.href === href);
  if (have && have.sheet) return Promise.resolve();
  return new Promise((resolve) => {
    const link = have || el("link", { rel: "stylesheet", href }, document.head);
    link.addEventListener("load", resolve);
    link.addEventListener("error", resolve);
  });
}

function preloadModules() {
  const urls = [new URL("./mbm-view.js", import.meta.url).href, new URL("./robot.js", import.meta.url).href];
  if (typeof import.meta.resolve === "function") {
    THREE_MODULES.forEach((m) => {
      try { urls.push(import.meta.resolve(m)); } catch (e) { /* no import map entry: the import itself will report it */ }
    });
  }
  const have = new Set([...document.querySelectorAll("link[rel=modulepreload]")].map((l) => l.href));
  urls.forEach((href) => { if (!have.has(href)) el("link", { rel: "modulepreload", href }, document.head); });
}

/* chain.json and the GLB of a robot through plain fetch(), handed to robot.js as `preloaded`. The first
 * robot's are asked for before three.js is in; the others go the same way when they are picked, so that
 * every model is read with response.arrayBuffer() (three's own loader re-streams the body, and a
 * development server that forbids caching then logs the request as cancelled although it completed).
 * A failed fetch gives null, and robot.js then loads the file itself. */
function preloadRobot(name) {
  const get = (url, as) => fetch(url).then((r) => (r.ok ? r[as]() : null)).catch(() => null);
  const chain = get(ROBOTS + name + "/chain.json", "json");
  const glb = get(ROBOTS + name + "/" + name + ".glb", "arrayBuffer");
  const full = chain.then((c) => (c && c.meshes && c.meshes.full === name + ".glb" ? glb : null));
  return { chain, full };
}

/* The view's WebGL 2 context, with the attributes three.js asks for. Making it here, while the network
 * requests are under way, takes it off the path to the first frame and tells us at once if there is none. */
function makeContext() {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", {
      alpha: true, depth: true, stencil: false, antialias: true, premultipliedAlpha: true,
      preserveDrawingBuffer: false, powerPreference: "default", failIfMajorPerformanceCaveat: false
    });
    return context ? { canvas, context } : null;
  } catch (e) {
    return null;
  }
}

const idle = () => new Promise((resolve) => setTimeout(resolve, 0));
/* Marks on the performance timeline (gr-mbm:init, built, three, view, model, problem, warm), for profiling the start. */
const mark = (name) => { try { performance.mark("gr-mbm:" + name); } catch (e) { /* no timeline */ } };

function fmtMs(t) {
  if (t < 0.01) return "< 0.01 ms";
  if (t >= 1000) return (t / 1000).toFixed(2) + " s";
  if (t >= 100) return t.toFixed(0) + " ms";
  if (t >= 10) return t.toFixed(1) + " ms";
  return t.toFixed(2) + " ms";
}
const fmtBudget = (t) => (t >= 1000 ? t / 1000 + " s" : t + " ms");
const sentence = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const pathName = (v, budget) => ({
  first: "Initial solution",
  first_simp: "Initial, simplified",
  best: "Best in " + fmtBudget(budget),
  best_simp: "Best, simplified"
}[v]);

export async function init(root) {
  mark("init");
  const css = addCss();
  const indexLoad = fetchJSON(DATA + "index.json");
  fetchJSON(DATA + FIRST_ROBOT + ".json").catch(() => {});
  let viewLoad = null, preloaded = null, gl = null;
  if (window.WebGL2RenderingContext) {
    preloadModules();
    viewLoad = import("./mbm-view.js");
    viewLoad.catch(() => {});
    preloaded = { name: FIRST_ROBOT, files: preloadRobot(FIRST_ROBOT) };
    gl = makeContext();       // after the requests have gone out
  }

  let index = null;
  try {
    [index] = await Promise.all([indexLoad, css]);
  } catch (err) {
    console.warn("MBM viewer", err);
    await css;
  }

  /* ---------------------------------------------------------- the widget, at its final height */
  root.classList.add("gr-mbm");
  root.dataset.view = "loading";
  const card = el("div", { class: "gr-card gr-mbm-card" }, root);
  const bar = el("div", { class: "gr-mbm-bar" }, card);
  const robotsEl = el("div", { class: "gr-mbm-robots" }, bar);
  const scenesEl = el("div", { class: "gr-mbm-scenes" }, bar);
  const stage = el("div", { class: "gr-mbm-stage" }, card);
  const status = el("div", { class: "gr-mbm-chips", "aria-live": "polite" }, stage);
  const statusProblem = el("span", { class: "gr-status" }, status);
  const statusCount = el("span", { class: "gr-status" }, status);
  const hint = el("span", { class: "gr-hint", "aria-hidden": "true", text: "Drag to orbit" }, stage);
  const loading = el("div", { class: "gr-mbm-loading", html: '<span class="gr-spinner" role="status" aria-label="Loading"></span>Loading' }, stage);
  // Hidden means display: none for the overlay and its spinner, so nothing keeps animating
  const setLoading = (on) => {
    loading.hidden = !on;
    loading.firstChild.hidden = !on;
  };

  const legend = el("div", {
    class: "gr-legend gr-mbm-legend",
    html: '<span class="it"><i class="dot" style="background:var(--gr-start)"></i>Start</span>'
      + '<span class="it"><i class="dot" style="background:var(--gr-goal)"></i>Goal</span>'
      + '<span class="it"><i class="ln path"></i>G-RRT* path</span>'
      + '<span class="it"><i class="ln other"></i>Other paths</span>'
  }, card);
  const transport = el("div", { class: "gr-transport gr-mbm-transport" }, card);
  const playBtn = playButton({ what: "the motion", state: "play", parent: transport, onClick: () => onPlay() });
  const range = el("input", { type: "range", class: "gr-range", min: "0", max: "1000", step: "1", value: "0", "aria-label": "Position along the path" }, transport);
  const syncRange = rangeFill(range);
  const dist = el("div", { class: "gr-readout gr-mbm-dist", "aria-hidden": "true", html: "&nbsp;" }, transport);

  // The table is the path selector: its rows are radio options (radioRows below)
  const table = el("table", { class: "gr-table selectable gr-mbm-table" }, card);
  table.innerHTML = '<thead><tr><th scope="col">Path</th><th scope="col" class="bar" aria-hidden="true"></th>'
    + '<th scope="col">Length</th><th scope="col">Time</th></tr></thead>';
  const tbody = el("tbody", {}, table);
  const rows = VARIANTS.map(() => {
    const tr = el("tr", {}, tbody);
    tr.innerHTML = '<th scope="row" class="name"></th><td class="bar" aria-hidden="true"><i></i></td>'
      + '<td class="len">&nbsp;</td><td class="time">&nbsp;</td>';
    return tr;
  });
  el("p", {
    class: "gr-caption",
    text: "For each scene, we show the problem whose best solution length is closest to the median in that scene. "
      + "Lengths are joint-space path lengths in radians. Fetch lengths have no unit, because its torso joint is prismatic."
  }, root);

  mark("built");
  const message = (msg) => {
    setLoading(false);
    [status, hint].forEach((n) => { n.hidden = true; });
    legend.classList.add("off");
    el("div", { class: "gr-mbm-msg", role: "status", text: msg }, stage);
    [playBtn, range].forEach((b) => { b.disabled = true; });
    dist.innerHTML = "&nbsp;";
    root.dataset.view = "failed";
  };
  [playBtn, range].forEach((b) => { b.disabled = true; });
  if (!index) {
    robotsEl.classList.add("gr-seg");
    message("The data of this viewer could not be loaded.");
    return;
  }

  const state = {
    robot: null, entry: null, data: null, model: null, scene: 0, variant: "first",
    playing: false, t: 0, speed: 1, tour: !reducedMotion(), token: 0, framed: false, stop: null
  };
  let view = null;
  const requested = new Set();      // robots whose model files this module has fetched

  /* ---------------------------------------------------------- pickers */
  const robotSeg = segmented(robotsEl, index.robots.map((r) => ({
    value: r.robot, html: r.label + " <small>" + r.dof + " DoF</small>"
  })), index.robots[0].robot, (name) => {
    state.tour = false;
    select(name, 0);
  }, { label: "Robot" });

  // Every robot's scenes share one grid cell, so the bar is as tall as the longest list at any width
  const sceneChips = {};
  index.robots.forEach((r) => {
    const host = el("div", { class: "off" }, scenesEl);
    host.inert = true;
    sceneChips[r.robot] = chips(host, r.scenes.map((s, i) => ({ value: i, label: sentence(s.label) })), 0, (i) => {
      state.tour = false;
      select(r.robot, i);
    }, { label: r.label + " scene" });
    sceneChips[r.robot].host = host;
  });
  const showScenes = (name) => Object.entries(sceneChips).forEach(([k, c]) => {
    c.host.classList.toggle("off", k !== name);
    c.host.inert = k !== name;
  });

  // A row is picked by a click anywhere on it or from the keyboard. Picking the chosen row again
  // restarts a motion that has stopped.
  const pick = (v) => {
    state.tour = false;
    setVariant(v, { restart: true });
    if (view && !reducedMotion()) setPlaying(true);
  };
  const pathRows = radioRows(rows, VARIANTS, "first", pick, { label: "Path shown" });
  rows.forEach((tr, i) => tr.addEventListener("click", () => {
    if (state.variant === VARIANTS[i] && !state.playing) pick(VARIANTS[i]);
  }));
  const labelPaths = (budget) => VARIANTS.forEach((v, i) => {
    rows[i].querySelector(".name").textContent = pathName(v, budget);
  });
  labelPaths(index.robots[0].budget_ms);
  showScenes(index.robots[0].robot);

  if (/[?&]debug\b/.test(location.search)) {
    window.__grMbm = { state, index, get view() { return view; }, select: (r, s, v) => select(r, s, v) };
  }

  /* ---------------------------------------------------------- timeline */
  const problem = () => state.data && state.data.scenes[state.scene];
  const path = () => view && view.paths && view.paths[state.variant];
  const moveTime = () => (path() ? Math.max(0.8, path().length / state.speed) : 1);
  const total = () => HOLD_START + moveTime() + HOLD_END;
  const progress = () => Math.min(1, Math.max(0, (state.t - HOLD_START) / moveTime()));
  const q = new Float64Array(32);

  // The scrubber and the readout: written at most ten times per second, and only when they change
  let shown = "";
  const readout = throttle(() => {
    const jp = path();
    if (!jp) return;
    const u = progress();
    const k = String(Math.round(u * 1000));
    if (range.value !== k) {
      range.value = k;
      syncRange();
    }
    const unit = state.data.length_unit ? " " + state.data.length_unit : "";
    const at = (jp.length * smooth(u)).toFixed(2), of = jp.length.toFixed(2) + unit;
    if (shown !== at + of) {
      shown = at + of;
      dist.innerHTML = "<b>" + at + "</b> of " + of;
      range.setAttribute("aria-valuetext", at + " of " + of);
    }
  }, 100);

  /* Pose the robot for the current time (WebGL only) and schedule the readout; `now` writes it at once. */
  function showTime(now = false) {
    const jp = path();
    if (!jp) return;
    view.pose(jp.at(jp.length * smooth(progress()), q.subarray(0, jp.dof)));
    readout();
    if (now) readout.flush();
  }

  // The button names what a press does: pause while playing, replay at the goal, play otherwise
  const showPlay = () => playBtn.setState(state.playing ? "pause" : progress() >= 1 ? "replay" : "play");

  function setPlaying(on) {
    state.playing = on && !!path();
    if (state.playing) {
      if (state.t >= total() - 1e-3 || progress() >= 1) state.t = 0;
      if (!state.stop) state.stop = view.animate(step);
    }
    showPlay();
    showTime(true);
  }

  function step(dt) {
    if (!state.playing) {
      state.stop = null;
      return false;
    }
    state.t += dt;
    if (state.t >= total()) {
      if (state.tour) {
        setVariant(VARIANTS[(VARIANTS.indexOf(state.variant) + 1) % VARIANTS.length], { restart: true });
        return true;
      }
      if (reducedMotion()) {
        // Asked for once: stop at the goal
        state.t = HOLD_START + moveTime();
        state.playing = false;
        state.stop = null;
        showPlay();
        showTime(true);
        return false;
      }
      state.t = 0;
    }
    showTime();
    return true;
  }

  function onPlay() {
    state.tour = false;
    setPlaying(!state.playing);
  }
  range.addEventListener("input", () => {
    state.tour = false;
    state.playing = false;
    state.t = HOLD_START + (Number(range.value) / 1000) * moveTime();
    showPlay();
    showTime(true);
  });
  // A touch on the track moves the thumb at once. If the touch turns out to be a vertical swipe, the
  // browser scrolls the page and cancels the pointer, and we put the motion back where it was.
  let held = null;
  range.addEventListener("pointerdown", (e) => {
    held = e.pointerType === "touch" ? { t: state.t, playing: state.playing, tour: state.tour } : null;
  });
  range.addEventListener("pointerup", () => { held = null; });
  range.addEventListener("pointercancel", () => {
    if (!held) return;
    state.t = held.t;
    state.tour = held.tour;
    const was = held.playing;
    held = null;
    if (was) setPlaying(true);
    else {
      showPlay();
      showTime(true);
    }
  });

  /* ---------------------------------------------------------- selection */
  function setVariant(v, { restart = false } = {}) {
    state.variant = v;
    pathRows.set(v);
    if (view) view.setVariant(v);
    if (restart) state.t = 0;
    showPlay();
    showTime(true);
  }

  function fillTable() {
    const p = problem(), unit = state.data.length_unit;
    const longest = Math.max(...VARIANTS.map((v) => p.variants[v].cost));
    rows.forEach((tr, i) => {
      const d = p.variants[VARIANTS[i]];
      tr.querySelector(".bar i").style.width = ((100 * d.cost) / longest).toFixed(1) + "%";
      tr.querySelector(".len").innerHTML = d.cost.toFixed(2) + (unit ? ' <span class="u">' + unit + "</span>" : "");
      // A solution's time counts from the start of planning; a simplified path adds its simplification.
      // Both are measured on the benchmark machine (build_mbm.py says where each comes from).
      const cell = tr.querySelector(".time");
      cell.textContent = d.simp_ms === undefined ? fmtMs(d.t_ms) : (d.simp_ms < 0.01 ? "" : "+ ") + fmtMs(d.simp_ms);
      if (d.simp_ms === undefined) cell.setAttribute("aria-label", "found at " + fmtMs(d.t_ms));
      else cell.setAttribute("aria-label", "plus " + fmtMs(d.simp_ms).replace("<", "less than") + " of simplification");
    });
    statusProblem.textContent = sentence(p.label);         // the scene, without the problem number
    statusCount.textContent = p.solutions + (p.solutions === 1 ? " solution in " : " solutions in ") + fmtBudget(state.data.budget_ms);
  }

  async function select(robot, sceneIndex, variant) {
    const token = ++state.token;
    const entry = index.robots.find((r) => r.robot === robot) || index.robots[0];
    robotSeg.set(entry.robot);
    showScenes(entry.robot);
    sceneChips[entry.robot].set(Math.min(sceneIndex, entry.scenes.length - 1));
    labelPaths(entry.budget_ms);
    if (view && !(state.robot === entry.robot && state.model)) setLoading(true);
    // Every robot's files come through fetch() here, once (the first robot's were asked for in init)
    let files = null;
    if (view && !requested.has(entry.robot)) {
      files = preloaded && preloaded.name === entry.robot ? preloaded.files : preloadRobot(entry.robot);
      requested.add(entry.robot);
    }
    preloaded = null;
    let data, model = null;
    try {
      [data, model] = await Promise.all([
        fetchJSON(DATA + entry.file),
        view ? view.loadModel(entry.robot, { ghost: false, preloaded: files }) : null
      ]);
    } catch (err) {
      if (token !== state.token) return;
      console.warn("MBM viewer", err);
      requested.delete(entry.robot);
      setLoading(false);
      if (view) view.hold(false);
      statusProblem.textContent = "The " + entry.label + " files could not be loaded";
      statusCount.textContent = "";
      return;
    }
    if (token !== state.token) return;
    mark("model");
    state.robot = entry.robot;
    state.entry = entry;
    state.data = data;
    state.model = model;
    state.scene = Math.min(sceneIndex, data.scenes.length - 1);
    // One joint-space speed per robot, so that path lengths compare by playing time
    const best = data.scenes.map((s) => s.variants.best_simp.cost).sort((a, b) => a - b);
    const longest = Math.max(...data.scenes.flatMap((s) => VARIANTS.map((v) => s.variants[v].cost)));
    state.speed = Math.max(best[best.length >> 1] / BEST_S, longest / MAX_FIRST_S);
    fillTable();
    // A new robot brings new shaders: keep the last frame up while the scene is rebuilt and they compile.
    // A newer select() takes over the hold if this one is overtaken.
    const fresh = view && (!view.robot || view.robot.model !== model);
    if (view) {
      if (fresh) {
        view.hold(true);
        state.playing = false;        // the old robot's paths do not fit the new one
      }
      view.setRobot(model);
      await idle();
      if (token !== state.token) return;
      view.setProblem(model, problem(), VARIANTS, { instant: !state.framed });
      mark("problem");
      state.framed = true;
      [playBtn, range].forEach((b) => { b.disabled = false; });
    }
    setVariant(variant || (state.tour ? "first" : state.variant), { restart: true });
    if (view) {
      if (fresh) {
        await idle();
        await view.warm();
        if (token !== state.token) return;
        mark("warm");
      }
      view.hold(false);
      root.dataset.view = "ready";
    }
    setLoading(false);
    if (view && !reducedMotion()) setPlaying(true);
  }

  /* ---------------------------------------------------------- the 3D view, when it arrives */
  const start = async () => {
    const table = " The table below still follows the robot and the scene.";
    if (!gl) {
      message("This 3D view needs WebGL 2, which this browser does not provide." + table);
    } else {
      let mod = null;
      try {
        mod = await viewLoad;
        mark("three");
        await idle();
      } catch (err) {
        console.warn("MBM viewer", err);
        message("The 3D view could not be loaded." + table);
      }
      if (mod) {
        try {
          view = new mod.MbmView(stage, {
            canvas: gl.canvas,
            context: gl.context,
            label: "3D view of the robot, the obstacles and the end-effector paths",
            onInteract: () => {
              hint.classList.add("gone");
              state.tour = false;
            }
          });
          view.loadModel = mod.loadModel;
          mark("view");
          await idle();
        } catch (err) {
          console.warn("MBM viewer", err);
          view = null;
          stage.querySelectorAll("canvas").forEach((c) => c.remove());
          message("The 3D view could not start in this browser." + table);
        }
      }
    }
    await select(index.robots[0].robot, 0, "first");
  };
  start().catch((err) => {
    console.warn("MBM viewer", err);
    if (root.dataset.view === "loading") message("The 3D view could not start in this browser.");
  });
}
