/* Web Worker of the live demo: VAMP's Panda planners compiled to WebAssembly (data/live/panda_wasm.*).
 *
 * Messages in (each with an id, answered with the same id):
 *   {type: "init", module}             module: a compiled WebAssembly.Module (or none: fetch and compile here)
 *   {type: "check", obstacles, configs}  VAMP's validity check of each configuration, and for an invalid one
 *                                      the obstacles it hits (index into obstacles, -1 for self-collision)
 *   {type: "random", obstacles, region, start, tries}  a random collision-free configuration whose end effector
 *                                      lies in region {center, axes, half, zmin, zmax} and points down, and which
 *                                      the straight line from start does not reach
 *   {type: "stats"}                    the size of this worker's WebAssembly memory
 *   {type: "plan", planner, start, goal, obstacles, budget, seed}
 *                                      planner: "rrtc" | "grrtstar" | "aorrtc"; budget in ms
 * Messages out: {type: "ready"}, {type: "progress", id, points: [[t_ms, cost], ...]}, {type: "result", id, ...},
 * {type: "error", id, message}.
 *
 * A plan runs the anytime planner once with a wall-clock deadline (G-RRT* and AORRTC report every new best
 * solution), then measures the time to the first solution precisely: the planners are deterministic for a
 * seed, so rerunning one with optimize = false repeats exactly the search up to its first solution, and the
 * mean over repeats beats the browser's coarse timer. Every returned path passes VAMP's own motion check. */
import createModule from "../data/live/panda_wasm.js";

let M = null;
const MAX_ITER = 2000000000;     // size_t is 32 bits in wasm32; the deadline stops the planners
// Sample capacity of every planner. RRT-Connect and AORRTC clear arrays of this size on each call and
// G-RRT* does not, and the times we report run from the call. At 30000 that clearing costs RRT-Connect about
// 3 us (under 2% of a first solution here; 10 us at VAMP's C++ default of 100000 and 100 us at the 10^6 of
// VAMP's Python helper), so it does not decide any comparison. In our runs G-RRT* used fewer than 10000
// samples in 2 s, so the capacity does not end a run early.
const MAX_SAMPLES = 30000;
const RANGE = 1.0;               // vamp.configure_robot_and_planner_with_kwargs for the Panda

/* ---------------------------------------------------------------- helpers */

const own = [];                   // embind objects to free at the end of a request
const keep = (o) => { own.push(o); return o; };
const freeAll = () => { while (own.length) { const o = own.pop(); try { o.delete(); } catch (e) { /* already freed */ } } };

function vec(a) {
  const v = keep(new M.VectorFloat());
  for (let i = 0; i < a.length; i++) v.push_back(a[i]);
  return v;
}

function readVec(v) {
  const n = v.size(), out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = v.get(i);
  v.delete();
  return out;
}

/* Local z axis of R = Rz(e2) Ry(e1) Rx(e0) (VAMP's Euler convention). */
function zAxis(e) {
  const cx = Math.cos(e[0]), sx = Math.sin(e[0]), cy = Math.cos(e[1]), sy = Math.sin(e[1]), cz = Math.cos(e[2]), sz = Math.sin(e[2]);
  return [cz * sy * cx + sz * sx, sz * sy * cx - cz * sx, cy * cx];
}

function addObstacle(env, o) {
  const p = o.p;
  if (o.kind === "sphere") env.add_sphere(p[0], p[1], p[2], o.r);
  else if (o.kind === "box") env.add_cuboid(p[0], p[1], p[2], o.e[0], o.e[1], o.e[2], o.h[0], o.h[1], o.h[2]);
  else {
    const z = zAxis(o.e), h = o.l / 2;
    env.add_capsule(p[0] + z[0] * h, p[1] + z[1] * h, p[2] + z[2] * h, p[0] - z[0] * h, p[1] - z[1] * h, p[2] - z[2] * h, o.r);
  }
}

function environment(obstacles) {
  const env = keep(new M.Environment());
  obstacles.forEach((o) => addObstacle(env, o));
  return env;
}

function pathData(path) {
  return { q: readVec(path.get_all_waypoints()), n: path.size(), cost: path.cost() };
}

function pathFrom(flat, dof) {
  const p = keep(new M.Path());
  for (let i = 0; i < flat.length; i += dof) p.append(vec(flat.subarray(i, i + dof)));
  return p;
}

/* End-effector positions along the path, with segments split to at most `step` in joint space. */
function eeTrace(flat, dof, step = 0.04) {
  const out = [];
  const q = new Float32Array(dof);
  const push = () => {
    const m = readVec(M.end_effector_fk(vec(q)));
    out.push(m[12], m[13], m[14]);
  };
  const n = flat.length / dof;
  for (let i = 0; i < n; i++) {
    if (i === 0) { q.set(flat.subarray(0, dof)); push(); continue; }
    const a = flat.subarray((i - 1) * dof, i * dof), b = flat.subarray(i * dof, (i + 1) * dof);
    let d = 0;
    for (let j = 0; j < dof; j++) d += (b[j] - a[j]) ** 2;
    const k = Math.max(1, Math.ceil(Math.sqrt(d) / step));
    for (let s = 1; s <= k; s++) {
      for (let j = 0; j < dof; j++) q[j] = a[j] + (b[j] - a[j]) * (s / k);
      push();
    }
  }
  return new Float32Array(out);
}

function rng(seed) {
  const r = keep(new M.RNG());
  r.seed(seed);
  return r;
}

function settings(planner, optimize) {
  let s;
  if (planner === "rrtc") {
    s = keep(new M.RRTCSettings());
    s.range = RANGE;
    s.max_iterations = MAX_ITER;
    s.max_samples = MAX_SAMPLES;
  } else if (planner === "grrtstar") {
    s = keep(new M.GRRTStarSettings());
    s.range = RANGE;
    s.max_iterations = MAX_ITER;
    s.max_samples = MAX_SAMPLES;
    s.optimize = optimize;
  } else {
    s = keep(new M.AORRTCSettings());
    const r = s.rrtc;
    r.range = RANGE;
    s.rrtc = r;
    s.max_iterations = MAX_ITER;
    s.max_samples = MAX_SAMPLES;
    s.optimize = optimize;
  }
  return s;
}

const solve = { rrtc: "plan_rrtc", grrtstar: "plan_grrtstar", aorrtc: "plan_aorrtc" };

/* One planner call, bounded by budget (ms; 0 = no deadline), with a copy of the seeded generator `gen`.
 * The clock starts after the settings and the generator are ready. Returns the result object (to free). */
function run(planner, start, goal, env, budget, gen, optimize, progress) {
  const st = settings(planner, optimize);
  const r = keep(gen.clone());
  M.anytime_begin(budget, progress || null);
  try {
    return keep(M[solve[planner]](start, goal, env, st, r));
  } finally {
    M.anytime_end();
  }
}

/* ---------------------------------------------------------------- requests */

function check({ obstacles, configs }) {
  const env = environment(obstacles);
  const empty = keep(new M.Environment());
  const single = obstacles.map((o) => { const e = keep(new M.Environment()); addObstacle(e, o); return e; });
  return configs.map((c) => {
    const q = vec(c);
    if (M.validate(q, env)) return { ok: true, hits: [] };
    const hits = [];
    if (!M.validate(q, empty)) hits.push(-1);
    single.forEach((e, i) => { if (!M.validate(q, e)) hits.push(i); });
    return { ok: false, hits };
  });
}

function random({ obstacles, region, start, tries = 60000 }) {
  const env = environment(obstacles);
  const lo = readVec(M.get_lower_bounds()), hi = readVec(M.get_upper_bounds());
  const dof = lo.length, q = new Array(dof);
  const mark = own.length;
  for (let t = 0; t < tries; t++) {
    for (let j = 0; j < dof; j++) q[j] = lo[j] + Math.random() * (hi[j] - lo[j]);
    const qv = vec(q);
    const m = readVec(M.end_effector_fk(qv));
    if (region) {
      const x = m[12] - region.center[0], y = m[13] - region.center[1], z = m[14];
      const u = x * region.axes[0][0] + y * region.axes[0][1], v = x * region.axes[1][0] + y * region.axes[1][1];
      if (Math.abs(u) > region.half[0] || Math.abs(v) > region.half[1] || z < region.zmin || z > region.zmax) continue;
      if (m[10] > -0.7) continue;                            // gripper pointing down, as for a grasp
    }
    if (M.validate(qv, env)) {
      // Not reachable along a straight line from the start, so that there is something to plan
      if (!start) return { q: q.slice(), tries: t + 1 };
      const line = keep(new M.Path());
      line.append(vec(start));
      line.append(qv);
      if (M.validate_path(line, env) >= 0) return { q: q.slice(), tries: t + 1 };
    }
    while (own.length > mark) own.pop().delete();
  }
  return { q: null, tries };
}

function plan({ id, planner, start, goal, obstacles, budget, seed }) {
  const env = environment(obstacles);
  const s = vec(start), g = vec(goal);
  const dof = start.length;
  const gen = rng(seed);

  // Progress for the live chart, at most every 25 ms
  let pending = [], lastPost = 0;
  const flush = () => {
    if (pending.length) postMessage({ type: "progress", id, planner, points: pending });
    pending = [];
    lastPost = performance.now();
  };
  const progress = planner === "rrtc" ? null : (t, c) => {
    pending.push([t, c]);
    if (performance.now() - lastPost > 25) flush();
  };

  // 1. The anytime run within the budget
  const res = run(planner, s, g, env, budget, gen, true, progress);
  const elapsed = M.anytime_elapsed_ms();
  flush();
  const solved = res.solved;
  const out = { type: "result", id, planner, solved, budget, seed, iterations: res.iterations, elapsed };
  if (!solved) return out;

  const best = res.path;
  keep(best);
  let trace, first;
  if (planner === "rrtc") {
    trace = [elapsed, best.cost()];
    first = best;
  } else {
    trace = Array.from(readVec(M.anytime_trace()));
    first = keep(M.anytime_first_path());
    if (!first.size()) first = best;
  }

  // 2. The time to the first solution: repeat the search up to it (deterministic for the seed) in batches of
  //    at least 2 ms, so that the browser's coarse clock (0.1 ms in Chrome) does not matter, and take the
  //    median over the batches of the mean time per search
  let tFirst = trace[0];
  if (tFirst < 8) {
    const mark = own.length;
    const once = () => { run(planner, s, g, env, 0, gen, false, null); while (own.length > mark) own.pop().delete(); };
    const batches = [];
    const t0 = performance.now();
    while (batches.length < 15 && (batches.length < 5 || performance.now() - t0 < 30)) {
      let reps = 0;
      const b0 = performance.now();
      do { once(); reps++; } while (performance.now() - b0 < 2 && reps < 400);
      batches.push((performance.now() - b0) / reps);
    }
    batches.sort((a, b) => a - b);
    tFirst = batches[batches.length >> 1];
  }

  // 3. VAMP's simplification (shortcut, then B-spline) of the first and the final path. B-spline smoothing
  //    subdivides segments it has checked, and on rare occasions the result fails VAMP's check when checked
  //    again (step 4); then we show the shortcut-only path, whose every segment the shortcut step checked.
  const simplify = (p) => {
    const ss = keep(new M.SimplifySettings());
    const t0 = performance.now();
    const r = keep(M.simplify_path(p, env, ss, keep(gen.clone())));
    let sp = keep(r.path), ops = "shortcut+bspline";
    if (M.validate_path(sp, env) >= 0) {
      const ops1 = keep(new M.VectorSimplifyRoutine());
      ops1.push_back(M.SimplifyRoutine.SHORTCUT);
      ss.operations = ops1;
      sp = keep(keep(M.simplify_path(p, env, ss, keep(gen.clone()))).path);
      ops = "shortcut";
    }
    return { path: sp, ms: performance.now() - t0, ops };
  };
  const sFirst = simplify(first), sBest = planner === "rrtc" ? sFirst : simplify(best);

  // 4. VAMP's own check of every path we show (each waypoint, and each segment with validate_motion at the
  //    robot's resolution), and end-effector traces
  const pack = (p, extra) => {
    const d = pathData(p);
    const bad = M.validate_path(p, env);
    return Object.assign(d, { valid: bad < 0, bad, ee: bad < 0 ? eeTrace(d.q, dof) : null }, extra || {});
  };
  out.trace = trace;
  out.tFirst = tFirst;
  out.first = pack(first, { t: tFirst });
  out.best = planner === "rrtc" ? out.first : pack(best, { t: trace[trace.length - 2] });
  out.firstSimp = pack(sFirst.path, { ms: sFirst.ms, ops: sFirst.ops });
  out.bestSimp = planner === "rrtc" ? out.firstSimp : pack(sBest.path, { ms: sBest.ms, ops: sBest.ops });
  return out;
}

/* Warm the engine up on a request's scene, so that the first plan the reader sees runs optimized code: the
 * engine compiles WebAssembly quickly first and optimizes the hot functions in the background. */
function warmup({ start, goal, obstacles }) {
  const env = environment(obstacles);
  const s = vec(start), g = vec(goal);
  const mark = own.length;
  const t0 = performance.now();
  for (let round = 0; round < 3; round++) {
    for (const p of ["rrtc", "grrtstar", "aorrtc"]) {
      const gen = rng(round + 1);
      const r = run(p, s, g, env, 40, gen, true, null);
      const path = keep(r.path);
      M.validate_path(path, env);
      keep(M.simplify_path(path, env, keep(new M.SimplifySettings()), keep(gen.clone())));
      for (let k = 0; k < 20; k++) run(p, s, g, env, 0, gen, false, null);
      while (own.length > mark) own.pop().delete();
    }
    if (performance.now() - t0 > 600) break;
  }
  return {};
}

async function init(module) {
  const opts = {};
  if (module) {
    opts.instantiateWasm = (imports, receive) => {
      WebAssembly.instantiate(module, imports).then((inst) => {
        memory = Object.values(inst.exports).find((v) => v instanceof WebAssembly.Memory) || null;
        receive(inst, module);
      });
      return {};
    };
  }
  M = await createModule(opts);
  return { dof: M.get_dimension(), lower: Array.from(readVec(M.get_lower_bounds())), upper: Array.from(readVec(M.get_upper_bounds())) };
}

/* Size of this worker's WebAssembly memory in bytes (for the lifecycle check in _tools/grrtstar/live_session.py) */
let memory = null;
const stats = () => ({ memory: memory ? memory.buffer.byteLength : 0 });

const handlers = { check: (m) => ({ results: check(m) }), random, plan, warmup, stats };

let ready = null;
self.onmessage = async (e) => {
  const m = e.data;
  try {
    if (m.type === "init") {
      ready = init(m.module);
      postMessage(Object.assign({ type: "ready", id: m.id }, await ready));
      return;
    }
    await ready;
    const r = handlers[m.type](m);
    postMessage(Object.assign({ type: m.type === "plan" ? "result" : m.type, id: m.id }, r));
  } catch (err) {
    postMessage({ type: "error", id: m.id, message: String(err && err.message || err) });
  } finally {
    freeAll();
  }
};
