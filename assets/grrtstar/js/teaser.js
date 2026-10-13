/* Teaser: G-RRT* on a random-rectangles world in the plane, replayed from recorded runs of VAMP's G-RRT*
 * (assets/grrtstar/data/teaser/<world>.json, _tools/grrtstar/TRACE_FORMAT.md). The page runs no planner.
 *
 * Two trees grow from the start and the goal and connect greedily, as in RRT-Connect. Once they meet, VAMP draws
 * nine samples in ten from the greedy informed set and the rest from the informed set, admits a new state only if
 * it could lie on a cheaper path, and rewires both trees. Colours are the paper's: black obstacles, the tree from the
 * start in blue and the tree from the goal in vermilion, the amber path, a crimson start and a green goal, the
 * informed set as a dashed grey ellipse around the current path cost and the greedy informed set in green around
 * f(x_max), the largest heuristic cost along the path, whose state is ringed.
 * The stage's CSS gives it one of two aspect ratios (2.15 on a wide column, 1.3 on a narrow one), and each has two
 * recorded worlds. The teaser plays both and then stops with a replay button. The first world's file is preloaded
 * by the page (a <link rel=preload> per aspect ratio), the second is fetched once the first has played its first
 * solution. */
import { decode, Replay, ellipseOf } from "./trace.js";
import { COLORS, DATA, el, fetchJSON, liveText, playButton, reducedMotion, whileVisible } from "./util.js";

const WORLDS = { wide: ["wide-1", "wide-2"], narrow: ["narrow-1", "narrow-2"] };
const STILL_AFTER = 160;    // a still frame (reduced motion) shows this many iterations after the first solution
const HOLD_MS = 2600;
const FADE_MS = 500;

/* A world's recording, fetched and decoded once. */
const worlds = new Map();
function world(key) {
  if (!worlds.has(key)) {
    const w = { key, ready: null };
    w.promise = fetchJSON(DATA + "teaser/" + key + ".json").then((f) => { w.ready = { f, d: decode(f.runs.grrt, f.q) }; return w.ready; });
    w.promise.catch(() => worlds.delete(key));
    worlds.set(key, w);
  }
  return worlds.get(key);
}

export async function init(fig) {
  const stage = fig.querySelector("[data-role=stage]");
  const canvas = fig.querySelector("[data-role=canvas]");
  const hud = fig.querySelector("[data-role=hud]");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2D canvas");

  const css = getComputedStyle(document.documentElement);
  const col = (name, fb) => (css.getPropertyValue(name).trim() || fb);
  const C = {
    grrt: col("--gr-grrt", COLORS.grrt), informed: col("--gr-informed", COLORS.informed),
    start: col("--gr-start", COLORS.start), goal: col("--gr-goal", COLORS.goal), obstacle: col("--gr-obstacle", COLORS.obstacle),
    treeStart: col("--gr-tree-start", COLORS.treeStart), treeGoal: col("--gr-tree-goal", COLORS.treeGoal), path: col("--gr-path", COLORS.path),
    greedyFill: col("--gr-greedy-fill", COLORS.greedyFill), informedFill: col("--gr-informed-fill", COLORS.informedFill)
  };

  let cssW = 0, cssH = 0, dpr = 1, sc = 1, ox = 0, oy = 0, kind = "";
  let cur = null, R = null, at = 0;          // the world shown, its replay cursor, its index in WORLDS[kind]
  let running = false, visible = false, raf = 0, phase = "grow", phaseT = -Infinity, alpha = 1;
  let runs = 0, ended = false, waiting = -1;
  let userPaused = reducedMotion();
  let samples = [];                          // recent samples {x, y, greedy, t}

  const toggle = playButton({ what: "the animation", state: "pause", parent: stage });
  hud.innerHTML = "";
  // The two chips are written through liveText: at most ten times per second, and only when the text changes.
  const setPhase = liveText(el("span", { class: "gr-teaser-phase" }, hud));
  const setCost = liveText(el("span", { class: "gr-teaser-cost" }, hud));       // an empty chip is not shown (page.css)

  /* The stage's size; the aspect ratio picks the pair of worlds. Returns true when it picked the other pair. */
  function size() {
    cssW = Math.max(1, stage.clientWidth);
    cssH = Math.max(1, stage.clientHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const k = cssW / cssH > 1.7 ? "wide" : "narrow";
    const changed = k !== kind;
    kind = k;
    fit();
    return changed;
  }
  function fit() {
    if (!cur) return;
    const W = cur.f.problem.W;
    sc = Math.min(cssW / W, cssH);
    ox = (cssW - W * sc) / 2;
    oy = (cssH - sc) / 2;
  }

  /* Show world i of the present pair from its first iteration (fading in), or its still frame while paused. */
  function show(i, fadeIn) {
    const w = world(WORLDS[kind][i]);
    at = i;
    if (!w.ready) { waiting = i; alpha = 0; w.promise.then(() => { if (waiting === i) { show(i, fadeIn); update(); draw(performance.now()); } }, () => {}); return; }
    waiting = -1;
    cur = w.ready;
    R = new Replay(cur.d);
    samples = [];
    fit();
    phase = "grow";
    phaseT = fadeIn ? performance.now() : -Infinity;
    alpha = fadeIn ? 0 : 1;
    if (userPaused) finish();
  }

  /* A still frame (reduced motion, or a paused start): shortly after the first solution, where the two sets
     differ most. */
  function finish() {
    const d = cur.d;
    R.seek(d.first < 0 ? d.iterations : Math.min(d.iterations, d.first + STILL_AFTER));
    samples = [];
    phase = "hold";
    alpha = 1;
  }

  /* One iteration forward: its sample flashes if it came from one of the two sets. Once a world has played its
     first solution, the pair's other world is fetched (it is needed some seconds later). */
  function step(now) {
    const t = R.t + 1, d = cur.d;
    R.seek(t);
    if (d.first >= 0 && t >= d.first) world(WORLDS[kind][1 - at]);
    const k = t - 1, set = d.sset[k];
    if (set) {
      samples.push({ x: d.sx[k], y: d.sy[k], greedy: set === 2, t: now });
      if (samples.length > 90) samples.shift();
    }
  }

  function ellipse(c, fills, stroke, dash) {
    const p = cur.f.problem, e = ellipseOf(p.start, p.goal, c);
    if (!(e.b > 0)) return;
    ctx.save();
    ctx.translate(e.cx * sc, e.cy * sc);
    ctx.rotate(e.angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, e.a * sc, Math.max(e.b * sc, 0.5), 0, 0, 2 * Math.PI);
    for (const f of fills) { ctx.fillStyle = f; ctx.fill(); }
    ctx.setLineDash(dash);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = stroke;
    ctx.stroke();
    ctx.restore();
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    if (!cur) return;
    const s = sc, d = cur.d, p = cur.f.problem, sol = R.solution;
    ctx.translate(ox, oy);
    ctx.globalAlpha = alpha;

    // Informed set (current path cost) and greedy informed set (largest heuristic cost on the path).
    if (sol) {
      ellipse(sol.cost, [C.informedFill], C.informed, [5, 4]);
      ellipse(sol.greedy, ["#fff", C.greedyFill], C.grrt, []);        // over white, not over the grey tint
    }

    ctx.fillStyle = C.obstacle;
    for (const b of p.boxes) ctx.fillRect(b[0] * s, b[1] * s, (b[2] - b[0]) * s, (b[3] - b[1]) * s);

    // The two trees of G-RRT*: from the start in blue, from the goal in vermilion.
    ctx.lineWidth = 1.2;
    for (const [side, color] of [[1, C.treeGoal], [0, C.treeStart]]) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      for (let i = 2; i < R.n; i++) {
        if (d.side[i] !== side || !R.alive(i)) continue;
        const q = R.parent[i];
        ctx.moveTo(d.x[i] * s, d.y[i] * s);
        ctx.lineTo(d.x[q] * s, d.y[q] * s);
      }
      ctx.stroke();
    }

    // Recent samples: green from the greedy informed set, grey from the informed set.
    for (const q of samples) {
      const age = Math.min(1, (now - q.t) / 900);
      if (age >= 1) continue;
      ctx.fillStyle = q.greedy ? C.grrt : C.informed;
      ctx.globalAlpha = alpha * (1 - age) * 0.9;
      ctx.beginPath();
      ctx.arc(q.x * s, q.y * s, 1.9, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.globalAlpha = alpha;

    // Current best path in amber, over a white casing so that it reads on top of the trees, and its
    // state with the largest heuristic cost (a green ring).
    if (sol) {
      const P = sol.path;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (const [w, c] of [[5, "#fff"], [3, C.path]]) {
        ctx.lineWidth = w;
        ctx.strokeStyle = c;
        ctx.beginPath();
        ctx.moveTo(d.x[P[0]] * s, d.y[P[0]] * s);
        for (let j = 1; j < P.length; j++) ctx.lineTo(d.x[P[j]] * s, d.y[P[j]] * s);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(d.x[sol.xmax] * s, d.y[sol.xmax] * s, 4.6, 0, 2 * Math.PI);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.grrt;
      ctx.stroke();
    }

    for (const [q, c] of [[p.start, C.start], [p.goal, C.goal]]) {
      ctx.beginPath();
      ctx.arc(q[0] * s, q[1] * s, 6.5, 0, 2 * Math.PI);
      ctx.fillStyle = c;
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    setPhase(sol ? "Sampling mostly from the greedy informed set" : "Growing two trees");
    setCost(sol ? "path cost " + sol.cost.toFixed(2) : "");
  }

  function frame(now) {
    raf = 0;
    if (!running) return;
    if (waiting >= 0) {                  // the next world is still on its way
      raf = requestAnimationFrame(frame);
      return;
    }
    const d = cur.d;
    if (phase === "grow") {
      alpha = Math.min(1, (now - phaseT) / 350);
      // Slow while the trees search for each other, faster once they refine the path.
      const k = !R.solution ? 2 : R.t < 700 ? 6 : 14;
      for (let i = 0; i < k && R.t < d.iterations; i++) step(now);
      if (R.t >= d.iterations) {
        phase = "hold";
        phaseT = now;
        if (++runs >= WORLDS[kind].length) {      // the last world: stop here and offer a replay
          ended = true;
          samples = [];
          update();
          draw(now);
          return;
        }
      }
    } else if (phase === "hold" && now - phaseT > HOLD_MS) {
      phase = "fade";
      phaseT = now;
    } else if (phase === "fade") {
      alpha = Math.max(0, 1 - (now - phaseT) / FADE_MS);
      if (alpha <= 0) show((at + 1) % WORLDS[kind].length, true);
    }
    draw(now);
    raf = requestAnimationFrame(frame);
  }

  function update() {
    const go = visible && !userPaused && !ended;
    if (go && !running) { running = true; raf = requestAnimationFrame(frame); }
    if (!go && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    toggle.setState(ended ? "replay" : userPaused ? "play" : "pause");
  }

  toggle.addEventListener("click", () => {
    if (ended) {                        // replay: both worlds again, from the first
      ended = false;
      runs = 0;
      userPaused = false;
      show(0, false);
    } else {
      userPaused = !userPaused;
      if (!userPaused && cur && phase === "hold" && R.t < cur.d.iterations) { phase = "grow"; phaseT = -Infinity; }
    }
    update();
    draw(performance.now());
  });

  size();
  await world(WORLDS[kind][0]).promise;
  show(0, false);
  draw(performance.now());
  new ResizeObserver(() => {
    if (size()) { runs = 0; ended = false; show(at, false); update(); }   // the other aspect ratio: its own worlds
    draw(performance.now());
  }).observe(stage);
  whileVisible(stage, (v) => { visible = v; update(); });
  stage.classList.add("live");
}
