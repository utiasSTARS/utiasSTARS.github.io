/* Robots of the G-RRT* page: VAMP's four robots (panda, ur5, fetch, baxter), built by
 * _tools/grrtstar/build_robots.py from VAMP's own URDFs and meshes.
 *
 * Frames and joints.  The world frame is VAMP's world frame (the URDF root link), z up.  Joint
 * vectors are VAMP configurations in vamp.<robot>.joint_names() order (radians; Fetch's first joint,
 * the torso lift, is prismatic and in metres).  _tools/grrtstar/fk_check.py checks chain.json
 * against vamp.<robot>.eefk and vamp.<robot>.fk (largest error about 1e-7 m).
 *   panda   7 DoF, root panda_link0, end effector panda_grasptarget
 *   ur5     6 DoF, root offset_link (the arm's base stands 0.9144 m up), end effector robotiq_85_base_link
 *   fetch   8 DoF, root base_link, end effector gripper_link
 *   baxter 14 DoF (left arm, then right arm), root base, end effectors right_gripper (VAMP's) and left_gripper
 *
 * Exports (the first five as before; everything else is new and optional):
 *   loadModel(name, { ghost = true, preloaded = null } = {}) -> Promise<RobotModel>
 *       chain.json and the meshes, loaded once per robot.  With ghost: false the light ghost LOD
 *       is not fetched; model.loadGhost() fetches it later.  Only Panda has a ghost GLB
 *       (panda_ghost.glb, used by the live demo); for the other robots "ghost" is the full meshes.
 *       Full-LOD meshes come without normals and get creased normals on load (see creasedNormals).
 *       preloaded: { chain, full } hands over chain.json (object) and the full GLB (ArrayBuffer), or
 *       promises of them, fetched before this module and three.js had arrived (mbm.js does this).
 *   RobotModel  .name .chain .dof .lower .upper (VAMP's joint bounds) .full .ghost .eeFrames
 *       loadGhost()            Promise<this> once the ghost LOD is in
 *       fk(q, out?)            end-effector matrix (VAMP's end effector) in the world frame
 *       eePosition(q, out?)    its position
 *       eePositions(q)         positions of all end effectors (chain.ees; two on Baxter)
 *       linkMatrices(q)        world matrix of every moving link, in joint order
 *       keyPoints(q)           root, joint origins and end effectors, for camera framing
 *   Robot(model, { lod = "full", material = null, castShadow = true })   a THREE.Group
 *       setQ(q)  eePose()  ghost(material)  setVisible(v)  .links[name]  .ee  .eeNodes (one per chain.ees)
 *   ghostMaterial(color, opacity)
 *   lerpQ(a, b, t, out?)       angle-wrapping interpolation (NOT what VAMP does; see lerpLinear)
 *   lerpLinear(a, b, t, out?)  straight-line interpolation in joint space, as VAMP checks motions
 *   JointPath(waypoints)       a VAMP path parametrised by joint-space arc length:
 *       .length  .at(s, out?) (s in [0, length])  .atFraction(u, out?)
 *   creasedNormals(geometry, crease?)   per-corner normals for an indexed mesh (non-indexed result)
 *   ROBOT_NAMES, assetBase (robots/ next to this file, so the page path does not matter)
 *
 * Changes from the constraint-IK copy this file replaces: models come from VAMP (Panda's end effector is
 * now panda_grasptarget, not panda_link8; the world frame is VAMP's), the chain may be a tree (Baxter)
 * and may have prismatic joints (Fetch), and the GLB file names are <robot>.glb and <robot>_ghost.glb
 * (chain.meshes), so load models through loadModel rather than by file name.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

export const ROBOT_NAMES = ["panda", "ur5", "fetch", "baxter"];
export const assetBase = new URL("../robots/", import.meta.url).href;

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const models = new Map();

const _m = new THREE.Matrix4();
const _m2 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
const CREASE = THREE.MathUtils.degToRad(40);

/* Meshes grouped by link, each with its transform relative to the link node
 * (mesh quantization stores a scale and offset on the mesh node). */
function linkMeshes(gltfScene) {
  const out = {};
  gltfScene.updateMatrixWorld(true);
  gltfScene.traverse((o) => {
    if (!o.isMesh) return;
    const link = o.name.replace(/__\d+$/, "");
    const node = gltfScene.getObjectByName(link);
    const rel = new THREE.Matrix4();
    if (node) rel.copy(node.matrixWorld).invert();
    rel.multiply(o.matrixWorld);
    (out[link] = out[link] || []).push({ geometry: o.geometry, material: o.material, matrix: rel });
  });
  return out;
}

/* Per-corner normals of an indexed triangle mesh: the area-weighted normals of the faces around
 * each vertex that lie within `crease` of the corner's own face.  Returns a non-indexed geometry. */
export function creasedNormals(geometry, crease = CREASE) {
  const pos = geometry.attributes.position;
  const index = geometry.index;
  const nTri = index ? index.count / 3 : pos.count / 3;
  const nVert = pos.count;
  const idx = new Uint32Array(nTri * 3);
  for (let i = 0; i < nTri * 3; i++) idx[i] = index ? index.getX(i) : i;
  const P = new Float32Array(nVert * 3);
  for (let i = 0; i < nVert; i++) {
    P[3 * i] = pos.getX(i);
    P[3 * i + 1] = pos.getY(i);
    P[3 * i + 2] = pos.getZ(i);
  }
  // Face normals: area-weighted (A) and unit (U)
  const A = new Float32Array(nTri * 3), U = new Float32Array(nTri * 3);
  for (let f = 0; f < nTri; f++) {
    const a = 3 * idx[3 * f], b = 3 * idx[3 * f + 1], c = 3 * idx[3 * f + 2];
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    A[3 * f] = nx; A[3 * f + 1] = ny; A[3 * f + 2] = nz;
    U[3 * f] = nx / l; U[3 * f + 1] = ny / l; U[3 * f + 2] = nz / l;
  }
  // Faces around each vertex (CSR)
  const start = new Uint32Array(nVert + 1);
  for (let i = 0; i < idx.length; i++) start[idx[i] + 1]++;
  for (let i = 0; i < nVert; i++) start[i + 1] += start[i];
  const fill = start.slice(0, nVert);
  const faces = new Uint32Array(idx.length);
  for (let i = 0; i < idx.length; i++) faces[fill[idx[i]]++] = (i / 3) | 0;

  const cos = Math.cos(crease);
  const outP = new Float32Array(nTri * 9), outN = new Float32Array(nTri * 9);
  for (let f = 0; f < nTri; f++) {
    const fx = U[3 * f], fy = U[3 * f + 1], fz = U[3 * f + 2];
    for (let k = 0; k < 3; k++) {
      const v = idx[3 * f + k];
      let nx = 0, ny = 0, nz = 0;
      for (let j = start[v]; j < start[v + 1]; j++) {
        const g = faces[j];
        if (g === f || U[3 * g] * fx + U[3 * g + 1] * fy + U[3 * g + 2] * fz > cos) {
          nx += A[3 * g]; ny += A[3 * g + 1]; nz += A[3 * g + 2];
        }
      }
      const l = Math.hypot(nx, ny, nz) || 1;
      const o = 9 * f + 3 * k;
      outN[o] = nx / l; outN[o + 1] = ny / l; outN[o + 2] = nz / l;
      outP[o] = P[3 * v]; outP[o + 1] = P[3 * v + 1]; outP[o + 2] = P[3 * v + 2];
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(outP, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(outN, 3));
  g.computeBoundingSphere();
  return g;
}

function tuneMaterial(mat) {
  const m = mat.clone();
  m.envMapIntensity = 1.0;
  if (m.emissive) m.emissiveIntensity = 0.35;
  return m;
}

/* Yield to the event loop, so that a long model set-up does not block scrolling. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/* Load chain.json and the full LOD once per robot (and the ghost LOD unless ghost: false).
 * preloaded: { chain, full } may hand over chain.json (object) and the full GLB (ArrayBuffer), or
 * promises of them, that the caller began to fetch before this module had loaded. */
export function loadModel(name, { ghost = true, preloaded = null } = {}) {
  if (!models.has(name)) {
    const base = assetBase + name + "/";
    models.set(name, (async () => {
      // A preloaded file that is missing (null, or a promise that fails) is fetched here instead
      const given = async (key) => {
        try { return (preloaded && (await preloaded[key])) || null; } catch (e) { return null; }
      };
      const chain = (await given("chain")) || await fetch(base + "chain.json").then((r) => {
        if (!r.ok) throw new Error(base + "chain.json: " + r.status);
        return r.json();
      });
      // The ghost LOD loads alongside when the first caller wants it
      const ghostLoad = ghost && chain.meshes.ghost ? loader.loadAsync(base + chain.meshes.ghost) : null;
      if (ghostLoad) ghostLoad.catch(() => {});
      const buffer = await given("full");
      const full = buffer ? await loader.parseAsync(buffer, base) : await loader.loadAsync(base + chain.meshes.full);
      const fullMeshes = linkMeshes(full.scene);
      const materials = new Map();
      const geometries = new Map();
      let t0 = performance.now();
      for (const m of Object.values(fullMeshes).flat()) {
        if (!materials.has(m.material)) materials.set(m.material, tuneMaterial(m.material));
        m.material = materials.get(m.material);
        if (!m.geometry.attributes.normal) {
          if (!geometries.has(m.geometry)) {
            // Creasing 60 000 triangles takes a while on a phone: do it in slices of about 12 ms
            if (performance.now() - t0 > 12) {
              await tick();
              t0 = performance.now();
            }
            geometries.set(m.geometry, creasedNormals(m.geometry));
          }
          m.geometry = geometries.get(m.geometry);
        }
      }
      const model = new RobotModel(name, chain, fullMeshes, null);
      if (ghostLoad) model._ghost = ghostLoad.then((g) => { model.ghost = linkMeshes(g.scene); return model; });
      return model;
    })());
    // A failed load may be tried again
    models.get(name).catch(() => models.delete(name));
  }
  const p = models.get(name);
  return ghost ? p.then((m) => m.loadGhost()) : p;
}

export class RobotModel {
  constructor(name, chain, fullMeshes, ghostMeshes) {
    this.name = name;
    this.chain = chain;
    this.dof = chain.dof;
    this.full = fullMeshes;
    this.ghost = ghostMeshes;
    this._ghost = null;
    this.lower = chain.joints.map((j) => (j.limit ? j.limit[0] : -Math.PI));
    this.upper = chain.joints.map((j) => (j.limit ? j.limit[1] : Math.PI));
    this.prismatic = chain.joints.map((j) => j.type === "prismatic");
    this.origins = chain.joints.map((j) => {
      const m = new THREE.Matrix4();
      m.compose(new THREE.Vector3(...j.origin.xyz), new THREE.Quaternion(...j.origin.quat), new THREE.Vector3(1, 1, 1));
      return m;
    });
    this.axes = chain.joints.map((j) => new THREE.Vector3(...j.axis).normalize());
    // Index of the joint that moves each joint's parent link (-1: the root)
    const byChild = new Map(chain.joints.map((j, i) => [j.child, i]));
    this.parentIndex = chain.joints.map((j) => (byChild.has(j.parent) ? byChild.get(j.parent) : -1));
    const frame = (e) => ({
      link: e.link,
      parentIndex: byChild.has(e.parent) ? byChild.get(e.parent) : -1,
      offset: new THREE.Matrix4().compose(new THREE.Vector3(...e.xyz), new THREE.Quaternion(...e.quat), new THREE.Vector3(1, 1, 1))
    });
    this.eeFrame = frame(chain.ee);
    this.eeFrames = (chain.ees || [chain.ee]).map(frame);
    this.eeOffset = this.eeFrame.offset;
    this._T = chain.joints.map(() => new THREE.Matrix4());
  }

  /* Fetch the ghost LOD (once). */
  loadGhost() {
    if (this.ghost) return Promise.resolve(this);
    if (!this.chain.meshes.ghost) {
      // Only Panda ships a ghost LOD (the live demo uses it); other robots fall back to the full meshes
      this.ghost = this.full;
      return Promise.resolve(this);
    }
    if (!this._ghost) {
      this._ghost = loader.loadAsync(assetBase + this.name + "/" + this.chain.meshes.ghost).then((g) => {
        this.ghost = linkMeshes(g.scene);
        return this;
      });
    }
    return this._ghost;
  }

  /* Joint motion: rotation about the axis, or translation along it for prismatic joints. */
  motion(i, qi, out = _m) {
    if (this.prismatic[i]) return out.makeTranslation(_v.copy(this.axes[i]).multiplyScalar(qi));
    _q.setFromAxisAngle(this.axes[i], qi);
    return out.makeRotationFromQuaternion(_q);
  }

  /* World matrix of every moving link (joint children, in joint order).  The returned array is reused. */
  linkMatrices(q) {
    const T = this._T;
    for (let i = 0; i < this.dof; i++) {
      const p = this.parentIndex[i];
      if (p < 0) T[i].copy(this.origins[i]);
      else T[i].multiplyMatrices(T[p], this.origins[i]);
      T[i].multiply(this.motion(i, q[i]));
    }
    return T;
  }

  _frame(T, f, out) {
    return f.parentIndex < 0 ? out.copy(f.offset) : out.multiplyMatrices(T[f.parentIndex], f.offset);
  }

  /* Forward kinematics without a scene graph: end-effector matrix in the world frame. */
  fk(q, out = new THREE.Matrix4()) {
    return this._frame(this.linkMatrices(q), this.eeFrame, out);
  }

  eePosition(q, out = new THREE.Vector3()) {
    return out.setFromMatrixPosition(this.fk(q, _m2));
  }

  /* Positions of all end effectors (chain.ees). */
  eePositions(q) {
    const T = this.linkMatrices(q);
    return this.eeFrames.map((f) => new THREE.Vector3().setFromMatrixPosition(this._frame(T, f, _m2)));
  }

  /* Root, joint origins and end effectors (with a short tip beyond each), for framing the camera. */
  keyPoints(q) {
    const T = this.linkMatrices(q);
    const pts = [new THREE.Vector3(0, 0, 0)];
    T.forEach((m) => pts.push(new THREE.Vector3().setFromMatrixPosition(m)));
    this.eeFrames.forEach((f) => {
      const M = this._frame(T, f, new THREE.Matrix4());
      const flange = new THREE.Vector3().setFromMatrixPosition(M);
      const base = f.parentIndex < 0 ? new THREE.Vector3() : new THREE.Vector3().setFromMatrixPosition(T[f.parentIndex]);
      const d = new THREE.Vector3().subVectors(flange, base);
      pts.push(flange, d.lengthSq() > 1e-8 ? flange.clone().add(d.setLength(0.1)) : flange.clone());
    });
    return pts;
  }
}

/* A posable robot.  lod "full" uses the real materials; "ghost" shares one given material
 * (load the model with ghost: true, or await model.loadGhost(), before asking for a ghost). */
export class Robot extends THREE.Group {
  constructor(model, { lod = "full", material = null, castShadow = true } = {}) {
    super();
    this.model = model;
    this.links = {};
    this.q = new Float64Array(model.dof);
    const meshes = (lod === "full" ? model.full : model.ghost) || {};
    const root = new THREE.Group();
    root.name = model.chain.root;
    this.add(root);
    this.links[model.chain.root] = root;
    this._attach(root, meshes[model.chain.root], material, castShadow);
    model.chain.joints.forEach((j) => {
      const link = new THREE.Group();
      link.name = j.child;
      link.matrixAutoUpdate = false;
      this.links[j.child] = link;
    });
    model.chain.joints.forEach((j) => {
      const link = this.links[j.child];
      this.links[j.parent].add(link);
      this._attach(link, meshes[j.child], material, castShadow);
    });
    this.ees = model.chain.ees ? model.chain.ees : [model.chain.ee];
    this.eeNodes = this.ees.map((e, k) => {
      const o = new THREE.Object3D();
      o.matrixAutoUpdate = false;
      o.matrix.copy(model.eeFrames[k].offset);
      this.links[e.parent].add(o);
      return o;
    });
    this.ee = this.eeNodes[0];
    this.setQ(this.q);
  }

  _attach(link, meshes, material, castShadow) {
    (meshes || []).forEach((src) => {
      const m = new THREE.Mesh(src.geometry, material || src.material);
      m.matrixAutoUpdate = false;
      m.matrix.copy(src.matrix);
      m.castShadow = castShadow;
      m.receiveShadow = false;
      link.add(m);
    });
  }

  setQ(q) {
    const model = this.model;
    for (let i = 0; i < model.dof; i++) {
      this.q[i] = q[i];
      const link = this.links[model.chain.joints[i].child];
      link.matrix.copy(model.origins[i]).multiply(model.motion(i, q[i]));
      link.matrixWorldNeedsUpdate = true;
    }
    return this;
  }

  /* End-effector pose in world coordinates (updates world matrices). */
  eePose() {
    this.updateMatrixWorld(true);
    const pos = new THREE.Vector3(), quat = new THREE.Quaternion(), scale = new THREE.Vector3();
    this.ee.matrixWorld.decompose(pos, quat, scale);
    return { position: pos, quaternion: quat, matrix: this.ee.matrixWorld.clone() };
  }

  /* A translucent copy that shares geometry with this robot's model. */
  ghost(material) {
    return new Robot(this.model, { lod: "ghost", material, castShadow: false });
  }

  setVisible(v) {
    this.visible = v;
    return this;
  }
}

/* Tinted, translucent material used for ghost copies. */
export function ghostMaterial(color, opacity) {
  const c = new THREE.Color(color);
  return new THREE.MeshStandardMaterial({
    color: c,
    emissive: c.clone().multiplyScalar(0.18),
    roughness: 0.75,
    metalness: 0.0,
    transparent: opacity < 1,
    opacity,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: 2,
    polygonOffsetUnits: 6
  });
}

/* Angle-aware interpolation between two joint vectors (wraps each difference into [-pi, pi]). */
export function lerpQ(a, b, t, out) {
  const n = a.length;
  out = out || new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let d = b[i] - a[i];
    d -= 2 * Math.PI * Math.round(d / (2 * Math.PI));
    out[i] = a[i] + d * t;
  }
  return out;
}

/* Straight-line interpolation in joint space.  VAMP plans in R^n and checks every motion along the
 * straight segment, so this is how its paths must be played back. */
export function lerpLinear(a, b, t, out) {
  const n = a.length;
  out = out || new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = a[i] + (b[i] - a[i]) * t;
  return out;
}

/* A piecewise-linear joint-space path, parametrised by arc length (VAMP's path cost). */
export class JointPath {
  constructor(waypoints) {
    this.points = waypoints.map((q) => Float64Array.from(q));
    this.dof = this.points.length ? this.points[0].length : 0;
    this.s = [0];
    for (let i = 1; i < this.points.length; i++) {
      let d = 0;
      for (let j = 0; j < this.dof; j++) d += (this.points[i][j] - this.points[i - 1][j]) ** 2;
      this.s.push(this.s[i - 1] + Math.sqrt(d));
    }
    this.length = this.s[this.s.length - 1];
  }

  at(s, out) {
    const P = this.points, S = this.s, n = P.length;
    out = out || new Float64Array(this.dof);
    if (n === 1 || s <= 0) {
      out.set(P[0]);
      return out;
    }
    if (s >= this.length) {
      out.set(P[n - 1]);
      return out;
    }
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (S[mid] <= s) lo = mid;
      else hi = mid;
    }
    const seg = S[hi] - S[lo];
    return lerpLinear(P[lo], P[hi], seg > 0 ? (s - S[lo]) / seg : 0, out);
  }

  atFraction(u, out) {
    return this.at(u * this.length, out);
  }
}
