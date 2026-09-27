/* Loaders for the page's data contract (see _tools/diffusion-ik-geometry/README.md). */
import { DATA, fetchJSON, fetchF32, wrapAngle } from "./util.js";

export function conditionKey(robot, constraint) {
  return robot + "/" + constraint;
}

export function loadInterpMeta(manifest, robot, constraint) {
  return fetchJSON(DATA + manifest.conditions[conditionKey(robot, constraint)].interp);
}

export function loadKnobs(manifest, robot, constraint) {
  return fetchJSON(DATA + manifest.conditions[conditionKey(robot, constraint)].knobs);
}

/* One noise level of the latent plane: grid joint angles, errors, branch ids, and the straight segment. */
export async function loadInterpLevel(manifest, robot, constraint, meta, t) {
  const cond = manifest.conditions[conditionKey(robot, constraint)];
  const f = await fetchF32(DATA + cond.files[String(t)]);
  const G = meta.grid, n = meta.n, L = meta.L || 49;
  let o = 0;
  const gridQ = f.subarray(o, (o += G * G * n));
  const gridErr = f.subarray(o, (o += G * G));
  const branch = meta.color_mode === "branch" ? f.subarray(o, (o += G * G)) : null;
  const segQ = f.subarray(o, (o += L * n));
  const segErr = f.subarray(o, (o += L));
  if (o !== f.length) console.warn("interp level size mismatch", robot, constraint, t, o, f.length);
  return { t, G, n, L, gridQ, gridErr, branch, segQ, segErr, range: meta.range };
}

/* Joint vector on the straight segment at alpha in [0, 1] (angle-aware linear interpolation). */
export function segmentQ(level, alpha, out) {
  const { L, n, segQ } = level;
  out = out || new Float64Array(n);
  const s = Math.min(Math.max(alpha, 0), 1) * (L - 1);
  const i = Math.min(L - 2, Math.floor(s)), f = s - i;
  for (let j = 0; j < n; j++) {
    const a = segQ[i * n + j], b = segQ[(i + 1) * n + j];
    out[j] = a + wrapAngle(b - a) * f;
  }
  return out;
}

export function segmentErr(level, alpha) {
  const { L, segErr } = level;
  const s = Math.min(Math.max(alpha, 0), 1) * (L - 1);
  const i = Math.min(L - 2, Math.floor(s)), f = s - i;
  return segErr[i] * (1 - f) + segErr[i + 1] * f;
}

/* Pad coordinates (u, v) to fractional grid indices. */
export function gridIndex(level, u, v) {
  const [lo, hi] = level.range;
  const G = level.G;
  const x = ((u - lo) / (hi - lo)) * (G - 1);
  const y = ((v - lo) / (hi - lo)) * (G - 1);
  return [Math.min(Math.max(x, 0), G - 1), Math.min(Math.max(y, 0), G - 1)];
}

/* Bilinear, angle-aware joint vector at (u, v). */
export function gridQ(level, u, v, out) {
  const { G, n, gridQ: Q } = level;
  out = out || new Float64Array(n);
  const [x, y] = gridIndex(level, u, v);
  const i = Math.min(G - 2, Math.floor(x)), k = Math.min(G - 2, Math.floor(y));
  const fx = x - i, fy = y - k;
  const b00 = (k * G + i) * n, b10 = (k * G + i + 1) * n, b01 = ((k + 1) * G + i) * n, b11 = ((k + 1) * G + i + 1) * n;
  for (let j = 0; j < n; j++) {
    const q00 = Q[b00 + j];
    const q10 = q00 + wrapAngle(Q[b10 + j] - q00);
    const q01 = q00 + wrapAngle(Q[b01 + j] - q00);
    const q11 = q00 + wrapAngle(Q[b11 + j] - q00);
    out[j] = (q00 * (1 - fx) + q10 * fx) * (1 - fy) + (q01 * (1 - fx) + q11 * fx) * fy;
  }
  return out;
}

/* Bilinear scalar field (errors) at (u, v), interpolated in log space. */
export function gridScalar(level, field, u, v, log = true) {
  const G = level.G;
  const [x, y] = gridIndex(level, u, v);
  const i = Math.min(G - 2, Math.floor(x)), k = Math.min(G - 2, Math.floor(y));
  const fx = x - i, fy = y - k;
  const g = (a, b) => (log ? Math.log(Math.max(field[b * G + a], 1e-4)) : field[b * G + a]);
  const val = (g(i, k) * (1 - fx) + g(i + 1, k) * fx) * (1 - fy) + (g(i, k + 1) * (1 - fx) + g(i + 1, k + 1) * fx) * fy;
  return log ? Math.exp(val) : val;
}

export function nearestNode(level, u, v) {
  const [x, y] = gridIndex(level, u, v);
  return Math.round(y) * level.G + Math.round(x);
}
