/* Replay of recorded VAMP runs (format "vamp-trace/1", _tools/grrtstar/TRACE_FORMAT.md) for gr-teaser and
 * gr-search. The page runs no planner: both figures draw states that VAMP's G-RRT* reached, iteration by iteration.
 *
 * decode(run, q) unpacks a run once into typed arrays. A Replay is a cursor on it: seek(t) moves to the state
 * after iteration t in either direction, applying or undoing only the rewires in between (each rewire keeps the
 * parent it replaced), so a scrubber jump costs the events it crosses and never a replay from the start.
 * The state after iteration t (TRACE_FORMAT.md, "Replaying to iteration t"):
 *   node i exists        born[i] <= t and prunedAt[i] > t (nodes are born in id order, so the first `n` ids)
 *   its parent           the last rewire of i with iter <= t, else parent0[i]
 *   the current solution the last solution with iter <= t (index `sol`, -1 before the first) */

const NEVER = 0x7fffffff;

/* Last index k of the ascending array a with a[k] <= v, or -1. */
function lastAtMost(a, v) {
  let lo = 0, hi = a.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] <= v) lo = m + 1; else hi = m; }
  return lo - 1;
}

export function decode(run, q) {
  const nd = run.nodes, n = nd.n;
  const X = new Int32Array(n), Y = new Int32Array(n), x = new Float64Array(n), y = new Float64Array(n);
  const parent0 = new Int32Array(n), born = new Int32Array(n), side = Uint8Array.from(nd.side);
  for (let i = 0, b = 0; i < n; i++) {
    const p = i - nd.up[i];
    parent0[i] = p;
    X[i] = nd.dx[i] + (p === i ? 0 : X[p]);
    Y[i] = nd.dy[i] + (p === i ? 0 : Y[p]);
    born[i] = b += nd.born[i];
    x[i] = X[i] * q;
    y[i] = Y[i] * q;
  }
  // rewires with absolute values, and the parent each one replaced (a forward pass from the first parents)
  const R = run.rewires, m = R.iter.length;
  const rIter = new Int32Array(m), rChild = new Int32Array(m), rParent = new Int32Array(m), rPrev = new Int32Array(m);
  const cur = parent0.slice();
  for (let k = 0, it = 0, par = 0; k < m; k++) {
    it += R.iter[k];
    par += R.parent[k];
    const c = R.child[k];
    rIter[k] = it; rChild[k] = c; rParent[k] = par; rPrev[k] = cur[c];
    cur[c] = par;
  }
  const prunedAt = new Int32Array(n).fill(NEVER);
  const prunes = run.prunes.map((p) => ({ iter: p.iter, nodes: p.nodes }));
  for (const p of prunes) for (const i of p.nodes) prunedAt[i] = Math.min(prunedAt[i], p.iter);
  const S = run.samples, T = run.iterations;
  const sx = new Float64Array(T), sy = new Float64Array(T), sset = Uint8Array.from(S.set);
  for (let k = 0; k < T; k++) { sx[k] = S.x[k] * q; sy[k] = S.y[k] * q; }
  const sols = run.solutions.map((s) => ({ iter: s.iter, cost: s.cost, greedy: s.greedy, xmax: s.xmax, path: Int32Array.from(s.path), via: s.via }));
  return {
    n, x, y, side, born, parent0, prunedAt, prunes,
    rIter, rChild, rParent, rPrev,
    iterations: T, sx, sy, sset,
    sols, solIters: Int32Array.from(sols.map((s) => s.iter)),
    first: sols.length ? sols[0].iter : -1,
    summary: run.summary
  };
}

export class Replay {
  constructor(d) {
    this.d = d;
    this.parent = d.parent0.slice();
    this.k = 0;              // rewires applied: indices below k
    this.t = -1;
    this.seek(0);
  }
  /* Move to the state after iteration t (0 to d.iterations). Returns true if anything changed. */
  seek(t) {
    const d = this.d;
    t = Math.max(0, Math.min(d.iterations, Math.floor(t)));
    if (t === this.t) return false;
    if (t > this.t) {
      while (this.k < d.rIter.length && d.rIter[this.k] <= t) { this.parent[d.rChild[this.k]] = d.rParent[this.k]; this.k++; }
    } else {
      while (this.k > 0 && d.rIter[this.k - 1] > t) { this.k--; this.parent[d.rChild[this.k]] = d.rPrev[this.k]; }
    }
    this.t = t;
    this.n = lastAtMost(d.born, t) + 1;
    this.sol = lastAtMost(d.solIters, t);
    return true;
  }
  alive(i) { return this.d.prunedAt[i] > this.t; }
  get solution() { return this.sol >= 0 ? this.d.sols[this.sol] : null; }
  /* Nodes pruned at iterations in (a, b], for the fade of a pruning the replay just passed. */
  prunedBetween(a, b) {
    const out = [];
    for (const p of this.d.prunes) if (p.iter > a && p.iter <= b) out.push(...p.nodes);
    return out;
  }
}

/* The informed set {x : |x - start| + |x - goal| <= c} as an ellipse: centre, rotation, semi-axes. */
export function ellipseOf(start, goal, c) {
  const cmin = Math.hypot(goal[0] - start[0], goal[1] - start[1]);
  return {
    cx: (start[0] + goal[0]) / 2, cy: (start[1] + goal[1]) / 2, angle: Math.atan2(goal[1] - start[1], goal[0] - start[0]),
    a: c / 2, b: Math.sqrt(Math.max(c * c - cmin * cmin, 0)) / 2
  };
}

/* Run-length encoded statistics ([iteration, value, ...], each value holding until the next listed iteration, null
 * for infinite) expanded to one value per iteration 1..iters (index 0 unused), Infinity for null. */
export function expandRLE(rle, iters) {
  const out = new Float64Array(iters + 1).fill(Infinity);
  for (let k = 0; k < rle.length; k += 2) {
    const a = rle[k], b = k + 2 < rle.length ? rle[k + 2] : iters + 1, v = rle[k + 1] === null ? Infinity : rle[k + 1];
    out.fill(v, a, b);
  }
  return out;
}
