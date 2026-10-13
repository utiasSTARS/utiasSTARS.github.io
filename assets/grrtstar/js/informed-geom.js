/* Geometry for the informed-set widget: the L2 heuristic, the two prolate hyperspheroids (ellipses in 2D),
 * collision of segments with axis-aligned boxes, the optimal path from a visibility graph, and the resampling of a
 * path for the morph between scenes.
 * Points are [x, y]; boxes are [x0, y0, x1, y1]. Pure functions, so tests can run them in Node. */

export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/* f^(x) = ||x - x_I|| + ||x_G - x||, the admissible cost of a path from x_I to x_G through x. */
export const fhat = (x, s, g) => dist(x, s) + dist(x, g);

export function pathLength(pts) {
  let c = 0;
  for (let i = 1; i < pts.length; i++) c += dist(pts[i - 1], pts[i]);
  return c;
}

/* Greedy cost: the largest f^ over the states of the path. f^ is convex, so on a polyline the
 * largest value sits at a vertex. Returns {cost, index}. */
export function greedyCost(pts, s, g) {
  let cost = -1, index = 0;
  pts.forEach((p, i) => {
    const f = fhat(p, s, g);
    if (f > cost) { cost = f; index = i; }
  });
  return { cost, index };
}

/* The set {x : f^(x) <= c} in 2D: centre, semi-axes a (transverse) and b (conjugate), rotation. */
export function ellipse(s, g, c) {
  const cmin = dist(s, g);
  const cc = Math.max(c, cmin);
  return {
    cx: (s[0] + g[0]) / 2, cy: (s[1] + g[1]) / 2,
    a: cc / 2, b: Math.sqrt(Math.max(cc * cc - cmin * cmin, 0)) / 2,
    rot: Math.atan2(g[1] - s[1], g[0] - s[0])
  };
}

/* Does the segment pq pass through the interior of box r? Liang-Barsky clipping against r shrunk by eps,
 * so that a segment may run along a box's side or touch its corner. */
export function segHitsBox(p, q, r, eps = 1e-9) {
  const x0 = r[0] + eps, y0 = r[1] + eps, x1 = r[2] - eps, y1 = r[3] - eps;
  const dx = q[0] - p[0], dy = q[1] - p[1];
  let t0 = 0, t1 = 1;
  // Constraint k of the clipped segment: pk * t <= qk.
  const clip = (pk, qk) => {
    if (pk === 0) return qk >= 0;              // parallel to this side: inside its slab or not at all
    const t = qk / pk;
    if (pk < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
    else { if (t < t0) return false; if (t < t1) t1 = t; }
    return true;
  };
  if (clip(-dx, p[0] - x0) && clip(dx, x1 - p[0]) && clip(-dy, p[1] - y0) && clip(dy, y1 - p[1])) {
    return t1 - t0 > 1e-12;
  }
  return false;
}

export const inBox = (p, r, eps = 0) => p[0] > r[0] + eps && p[0] < r[2] - eps && p[1] > r[1] + eps && p[1] < r[3] - eps;

export function segFree(p, q, boxes) {
  for (const r of boxes) if (segHitsBox(p, q, r)) return false;
  return true;
}

/* One flag per segment of the path: true where the segment passes through a box. */
export const pathHits = (pts, boxes) => pts.slice(1).map((q, i) => !segFree(pts[i], q, boxes));

/* Shortest collision-free path from s to g among boxes inside the bounds [x0, y0, x1, y1]:
 * Dijkstra on the visibility graph of s, g and the box corners (pushed out by a hair). */
export function shortestPath(s, g, boxes, bounds) {
  const h = 1e-6;
  const nodes = [s, g];
  for (const r of boxes) {
    for (const [x, y, sx, sy] of [[r[0], r[1], -1, -1], [r[2], r[1], 1, -1], [r[2], r[3], 1, 1], [r[0], r[3], -1, 1]]) {
      const p = [x + sx * h, y + sy * h];
      if (p[0] < bounds[0] || p[0] > bounds[2] || p[1] < bounds[1] || p[1] > bounds[3]) continue;
      if (boxes.some((o) => inBox(p, o))) continue;
      nodes.push(p);
    }
  }
  const n = nodes.length;
  const d = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n);
  d[0] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && (u < 0 || d[i] < d[u])) u = i;
    if (u < 0 || d[u] === Infinity) break;
    done[u] = 1;
    if (u === 1) break;
    for (let v = 0; v < n; v++) {
      if (done[v]) continue;
      const w = d[u] + dist(nodes[u], nodes[v]);
      if (w < d[v] && segFree(nodes[u], nodes[v], boxes)) { d[v] = w; prev[v] = u; }
    }
  }
  if (d[1] === Infinity) return null;
  const pts = [];
  for (let v = 1; v >= 0; v = prev[v]) pts.push(nodes[v]);
  return { pts: pts.reverse(), cost: d[1] };
}

/* Resample a polyline to m points evenly spaced along its length (for morphing between presets). */
export function resample(pts, m) {
  const L = pathLength(pts);
  const out = [pts[0].slice()];
  let i = 1, acc = 0;
  for (let k = 1; k < m - 1; k++) {
    const target = (L * k) / (m - 1);
    while (i < pts.length - 1 && acc + dist(pts[i - 1], pts[i]) < target) { acc += dist(pts[i - 1], pts[i]); i++; }
    const seg = dist(pts[i - 1], pts[i]) || 1;
    const t = Math.min(1, Math.max(0, (target - acc) / seg));
    out.push([pts[i - 1][0] + t * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1])]);
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}
