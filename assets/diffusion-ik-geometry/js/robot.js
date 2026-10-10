/* Robots for the page: kinematic chain from chain.json, meshes from meshopt GLBs.
 *
 * World frame = the IKFast base frame of the paper's model (UR5 base_link,
 * Franka panda_link0), z up.  Joint vectors are the model's q, in order.
 * The end effector is the IKFast tool frame (UR5 ee_link, Franka panda_link8).
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { ASSETS } from "./util.js";

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const models = new Map();

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();

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

function tuneMaterial(mat) {
  const m = mat.clone();
  m.envMapIntensity = 1.0;
  if (m.emissive) m.emissiveIntensity = 0.35;
  return m;
}

/* Load chain.json and both LODs once per robot. */
export function loadModel(name) {
  if (!models.has(name)) {
    const base = ASSETS + "robots/" + name + "/";
    models.set(name, (async () => {
      const chain = await fetch(base + "chain.json").then((r) => r.json());
      const [full, ghost] = await Promise.all([
        loader.loadAsync(base + chain.meshes.full),
        loader.loadAsync(base + chain.meshes.ghost)
      ]);
      const fullMeshes = linkMeshes(full.scene);
      const materials = new Map();
      Object.values(fullMeshes).flat().forEach((m) => {
        if (!materials.has(m.material)) materials.set(m.material, tuneMaterial(m.material));
        m.material = materials.get(m.material);
      });
      return new RobotModel(name, chain, fullMeshes, linkMeshes(ghost.scene));
    })());
  }
  return models.get(name);
}

export class RobotModel {
  constructor(name, chain, fullMeshes, ghostMeshes) {
    this.name = name;
    this.chain = chain;
    this.dof = chain.dof;
    this.full = fullMeshes;
    this.ghost = ghostMeshes;
    this.origins = chain.joints.map((j) => {
      const m = new THREE.Matrix4();
      m.compose(new THREE.Vector3(...j.origin.xyz), new THREE.Quaternion(...j.origin.quat), new THREE.Vector3(1, 1, 1));
      return m;
    });
    this.axes = chain.joints.map((j) => new THREE.Vector3(...j.axis).normalize());
    this.eeOffset = new THREE.Matrix4().compose(new THREE.Vector3(...chain.ee.xyz), new THREE.Quaternion(...chain.ee.quat), new THREE.Vector3(1, 1, 1));
  }

  /* Forward kinematics without a scene graph: end-effector matrix in the robot frame. */
  fk(q, out = new THREE.Matrix4()) {
    out.identity();
    for (let i = 0; i < this.dof; i++) {
      out.multiply(this.origins[i]);
      _q.setFromAxisAngle(this.axes[i], q[i]);
      _m.makeRotationFromQuaternion(_q);
      out.multiply(_m);
    }
    return out.multiply(this.eeOffset);
  }

  eePosition(q, out = new THREE.Vector3()) {
    return out.setFromMatrixPosition(this.fk(q, _m2));
  }

  /* Joint origins and end effector, for framing the camera around a set of configurations. */
  keyPoints(q) {
    const pts = [new THREE.Vector3(0, 0, 0)];
    const T = new THREE.Matrix4();
    for (let i = 0; i < this.dof; i++) {
      T.multiply(this.origins[i]);
      _q.setFromAxisAngle(this.axes[i], q[i]);
      T.multiply(_m.makeRotationFromQuaternion(_q));
      pts.push(new THREE.Vector3().setFromMatrixPosition(T));
    }
    const flange = new THREE.Vector3().setFromMatrixPosition(T.clone().multiply(this.eeOffset));
    const tip = flange.clone().add(new THREE.Vector3().subVectors(flange, pts[pts.length - 1]).setLength(0.15));
    pts.push(flange, tip);
    return pts;
  }
}
const _m2 = new THREE.Matrix4();

/* A posable robot.  lod "full" uses the real materials; "ghost" shares one given material. */
export class Robot extends THREE.Group {
  constructor(model, { lod = "full", material = null, castShadow = true } = {}) {
    super();
    this.model = model;
    this.links = {};
    this.q = new Float64Array(model.dof);
    const meshes = lod === "full" ? model.full : model.ghost;
    const root = new THREE.Group();
    root.name = model.chain.root;
    this.add(root);
    this.links[model.chain.root] = root;
    this._attach(root, meshes[model.chain.root], material, castShadow);
    model.chain.joints.forEach((j, i) => {
      const link = new THREE.Group();
      link.name = j.child;
      link.matrixAutoUpdate = false;
      this.links[j.parent].add(link);
      this.links[j.child] = link;
      this._attach(link, meshes[j.child], material, castShadow);
    });
    this.ee = new THREE.Object3D();
    this.ee.matrixAutoUpdate = false;
    this.ee.matrix.copy(model.eeOffset);
    this.links[model.chain.ee.parent].add(this.ee);
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
      _q.setFromAxisAngle(model.axes[i], q[i]);
      link.matrix.copy(model.origins[i]).multiply(_m.makeRotationFromQuaternion(_q));
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

/* Angle-aware interpolation between two joint vectors. */
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
