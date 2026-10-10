/* Task-space constraints: the error of a configuration and a 3D gizmo for the constraint set.
 * mask = [px, py, pz, rx, ry, rz]; the same rules as the paper's appendix. */
import * as THREE from "three";
import { Polyline } from "./scene.js";

const _T = new THREE.Matrix4();

/* Position error (mm, Euclidean over constrained axes) and orientation error (deg). */
export function constraintError(model, q, target) {
  model.fk(q, _T);
  const e = _T.elements;
  const p = [e[12], e[13], e[14]];
  const mask = target.mask;
  let s = 0, anyPos = false;
  for (let i = 0; i < 3; i++) if (mask[i]) { anyPos = true; s += (p[i] - target.pos[i]) ** 2; }
  const nb = mask[3] + mask[4] + mask[5];
  let orn = 0;
  const R = target.R;
  const col = (j) => [e[4 * j], e[4 * j + 1], e[4 * j + 2]];
  if (nb === 3) {
    let tr = 0;
    for (let j = 0; j < 3; j++) { const c = col(j); tr += c[0] * R[0][j] + c[1] * R[1][j] + c[2] * R[2][j]; }
    orn = Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));
  } else if (nb === 2) {
    const fa = [0, 1, 2].find((i) => !mask[3 + i]);
    const c = col(fa);
    orn = Math.acos(Math.max(-1, Math.min(1, c[0] * R[0][fa] + c[1] * R[1][fa] + c[2] * R[2][fa])));
  }
  return { pos: anyPos ? 1000 * Math.sqrt(s) : null, orn: nb ? (orn * 180) / Math.PI : null };
}

export function errorLabel(err) {
  const parts = [];
  if (err.pos !== null) parts.push({ value: err.pos, unit: "mm", what: "position" });
  if (err.orn !== null) parts.push({ value: err.orn, unit: "°", what: "orientation" });
  return parts;
}

/* The constraint set drawn in the world, as the README renders: a plane patch, a line or a target point.
 * Orientation constraints get no gizmo (no RGB frames), matching viz.add_target_gizmo(orientation=False). */
export class ConstraintGizmo {
  constructor(stage, kind, target, color, opts = {}) {
    this.group = new THREE.Group();
    this.follow = [];
    const P = new THREE.Vector3(...target.pos);
    const col = new THREE.Color(color);
    const hasPlane = kind === "plane" || kind === "plane-frame";
    const hasLine = kind === "line" || kind === "line-axis";
    const span = opts.span || [P.x - 0.45, P.x + 0.45];
    const x0 = Math.min(span[0], P.x) - 0.12, x1 = Math.max(span[1], P.x) + 0.12;
    if (hasPlane) {
      const size = Math.max(0.5, Math.min(1.1, x1 - x0));
      const patch = new THREE.Mesh(new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }));
      patch.position.set((x0 + x1) / 2, P.y, P.z);
      patch.renderOrder = 2;
      this.group.add(patch);
      const h = size / 2, cx = (x0 + x1) / 2;
      const edge = new Polyline(stage, { color, width: 1.5, opacity: 0.55 }).set([
        new THREE.Vector3(cx - h, P.y - h, P.z), new THREE.Vector3(cx + h, P.y - h, P.z),
        new THREE.Vector3(cx + h, P.y + h, P.z), new THREE.Vector3(cx - h, P.y + h, P.z),
        new THREE.Vector3(cx - h, P.y - h, P.z)]);
      this.group.add(edge.group);
    }
    if (hasLine) {
      const line = new Polyline(stage, { color, width: 2, opacity: 0.9 }).set([
        new THREE.Vector3(x0, P.y, P.z), new THREE.Vector3(x1, P.y, P.z)]);
      this.group.add(line.group);
    }
    if (kind === "point" || kind === "frame") {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.011, 20, 14), new THREE.MeshBasicMaterial({ color: col }));
      s.position.copy(P);
      s.renderOrder = 6;
      this.group.add(s);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.022, 0.027, 40),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthTest: false }));
      ring.position.copy(P);
      ring.renderOrder = 6;
      this.group.add(ring);
      this.billboard = ring;
    }
  }

  /* Move end-effector-attached parts to the current end-effector position. */
  update(eePosition, camera) {
    this.follow.forEach(({ obj, R }) => {
      obj.position.copy(eePosition);
      if (R) obj.quaternion.setFromRotationMatrix(R);
    });
    if (this.billboard && camera) this.billboard.quaternion.copy(camera.quaternion);
  }

  dispose(parent) {
    parent.remove(this.group);
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.material.dispose && !o.isLine2) o.material.dispose();
    });
  }
}
