/* Live teaser: both robots loop a decoded straight latent path with a growing ghost trail,
 * echoing Figure 1 of the paper (Franka SE(3) self-motion, UR5 Line + Orientation). Ghosts follow the README
 * renders: 6 poses spaced by link displacement, opacity 0.08 to 0.6, final pose untinted, no end-effector trace. */
import * as THREE from "three";
import { Stage, GhostTrail, stillGhosts } from "./scene.js";
import { loadModel, Robot } from "./robot.js";
import { ConstraintGizmo } from "./constraint.js";
import { loadInterpMeta, loadInterpLevel, segmentQ } from "./data.js";
import { ROBOT_COLOR, reducedMotion, smooth } from "./util.js";

const DENSE = 121;           /* path samples the ghosts are picked from, as the renders */
const MOVE = 3.4, HOLD = 1.6, BACK = 1.1;

/* Screen side of each robot, and how far the motion is turned out of the picture plane. */
const LAYOUT = {
  franka: { side: -1, tilt: 0.45 },
  ur5: { side: 1, tilt: -0.45 }
};

/* Yaw that lays the motion across the view: the principal direction of how the
 * arm's key points move is aligned with world x, the end effector kept in front. */
function motionYaw(model, level) {
  const frames = [];
  for (let i = 0; i <= 16; i++) frames.push(model.keyPoints(segmentQ(level, i / 16)));
  let sxx = 0, sxy = 0, syy = 0;
  for (let k = 0; k < frames[0].length; k++) {
    let mx = 0, my = 0;
    frames.forEach((f) => { mx += f[k].x; my += f[k].y; });
    mx /= frames.length; my /= frames.length;
    frames.forEach((f) => {
      const dx = f[k].x - mx, dy = f[k].y - my;
      sxx += dx * dx; sxy += dx * dy; syy += dy * dy;
    });
  }
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const ee = frames.map((f) => f[f.length - 2]);
  const c = ee.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / ee.length);
  let yaw = -theta;
  const y = Math.sin(yaw) * c.x + Math.cos(yaw) * c.y;
  if (y > 0) yaw += Math.PI;
  return yaw;
}

async function prepare(manifest, item) {
  const cond = manifest.conditions[item.robot + "/" + item.constraint];
  const meta = await loadInterpMeta(manifest, item.robot, item.constraint);
  const [model, level] = await Promise.all([loadModel(item.robot), loadInterpLevel(manifest, item.robot, item.constraint, meta, cond.t_default)]);
  return { item, model, meta, level };
}

export async function init(root, manifest) {
  const host = root.querySelector("[data-role=stage]");
  const parts = await Promise.all(manifest.teaser.map((it) => prepare(manifest, it)));
  const stage = new Stage(host, { label: "Two robot arms following decoded latent interpolations", grid: { half: 1.9 }, shadowExtent: 2.2, fov: 28 });
  const constraints = Object.fromEntries(manifest.constraints.map((c) => [c.key, c]));

  const rigs = parts.map(({ item, model, meta, level }) => {
    const colors = ROBOT_COLOR[item.robot];
    const group = new THREE.Group();
    const robot = new Robot(model);
    const trail = new GhostTrail(stage, robot, colors.ghost);
    const dense = Array.from({ length: DENSE }, (_, k) => segmentQ(level, k / (DENSE - 1)));
    const idx = stillGhosts(model, dense);
    const alphas = idx.map((i) => i / (DENSE - 1));
    trail.set(idx.map((i) => dense[i]));
    trail.reveal(0);
    const xs = dense.filter((_, k) => k % 10 === 0).map((q) => model.eePosition(q).x);
    const gizmo = new ConstraintGizmo(stage, constraints[item.constraint].gizmo, meta.target, colors.main, { span: [Math.min(...xs), Math.max(...xs)] });
    group.add(trail.group, robot, gizmo.group);

    const key = [];
    for (let i = 0; i <= 12; i++) key.push(...model.keyPoints(segmentQ(level, i / 12)));
    const L = LAYOUT[item.robot];
    group.rotation.z = motionYaw(model, level) + L.tilt;
    return { item, model, level, group, robot, trail, gizmo, key, alphas, side: L.side, t: 0 };
  });

  const boxes = rigs.map((r) => {
    r.group.updateMatrixWorld(true);
    return new THREE.Box3().setFromPoints(r.key.map((p) => p.clone().applyMatrix4(r.group.matrixWorld)));
  });
  const gap = 0.3;
  const left = rigs.findIndex((r) => r.side < 0), right = 1 - left;
  const wl = boxes[left].max.x, wr = boxes[right].min.x;
  rigs[left].group.position.x = -gap / 2 - wl;
  rigs[right].group.position.x = gap / 2 - wr;
  const cy = -0.5 * (boxes[0].min.y + boxes[0].max.y + boxes[1].min.y + boxes[1].max.y) / 2;
  rigs.forEach((r) => { r.group.position.y = cy; stage.scene.add(r.group); r.group.updateMatrixWorld(true); });

  const all = [];
  rigs.forEach((r) => r.key.forEach((p) => all.push(p.clone().applyMatrix4(r.group.matrixWorld))));
  const narrow = () => host.clientWidth / Math.max(1, host.clientHeight) < 1.5;
  const frame = (instant) => stage.fit(all, { azimuth: -Math.PI / 2 - 0.1, elevation: narrow() ? 0.4 : 0.36, margin: narrow() ? 1.08 : 1.22, offsetY: narrow() ? -0.16 : -0.07, pad: 0.09 }, { instant });
  frame(true);

  const q = rigs.map((r) => new Float64Array(r.model.dof));
  function pose(r, i, alpha, reveal, fade) {
    segmentQ(r.level, alpha, q[i]);
    r.robot.setQ(q[i]);
    r.trail.reveal(reveal);
    r.trail.fade(fade);
    r.gizmo.update(r.model.eePosition(q[i]), stage.camera);
  }

  const labels = root.querySelectorAll("[data-role^=label]");
  labels.forEach((l) => { l.hidden = false; });
  root.querySelector("[data-role=loading]").classList.add("done");

  if (reducedMotion()) {
    rigs.forEach((r, i) => pose(r, i, 1, r.alphas.length, 1));
    stage.invalidate();
    return;
  }

  const period = MOVE + HOLD + BACK;
  let clock = 0;
  stage.animate((dt) => {
    clock += dt;
    rigs.forEach((r, i) => {
      const t = (clock + i * 0.5) % period;
      if (t < MOVE) {
        const a = smooth(t / MOVE);
        pose(r, i, a, r.alphas.filter((x) => x < a).length, 1);
      } else if (t < MOVE + HOLD) {
        pose(r, i, 1, r.alphas.length, 1);
      } else {
        const k = (t - MOVE - HOLD) / BACK;
        pose(r, i, 1 - smooth(k), r.alphas.length, 1 - smooth(Math.min(1, k * 1.4)));
      }
    });
    return true;
  });
  window.addEventListener("resize", () => frame(true));
}
