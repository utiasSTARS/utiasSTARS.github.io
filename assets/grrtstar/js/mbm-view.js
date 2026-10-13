/* three.js stage of the MotionBenchMaker viewer (mbm.js).
 *
 * Draws one VAMP robot, the obstacles of one MBM problem as VAMP's collision model (spheres, oriented
 * boxes, capsules; quaternions x y z w), the end-effector paths of the four paths of the solution and
 * start and goal markers. Paths are VAMP configurations, interpolated linearly in joint space
 * (robot.js JointPath). Renders on demand, and not at all while off screen or in a hidden tab.
 *
 * Start-up cost. The soft ambient light is a light probe holding the spherical harmonics of three's
 * RoomEnvironment (the look of the constraint-IK page) instead of a prefiltered environment map,
 * which would compile several shaders before the first frame. warm() compiles the scene's own
 * shaders without blocking where the browser can (KHR_parallel_shader_compile).
 *
 * Colours are the paper's (CONTRACT.md, round 4): the shown path is the amber solution path with a
 * darker amber casing, the other three paths are the light warm grey of earlier solutions, the start
 * is crimson and the goal green. The robot and the obstacles keep their own 3D shading.
 *
 * Touch. The canvas has touch-action: pan-y, so a vertical swipe scrolls the page. A one-finger
 * touch reaches OrbitControls only once it is a sideways drag (_gateTouch); it then orbits and may
 * tilt. A pinch zooms. With a mouse, a drag orbits and the wheel zooms only after a click into the
 * view. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { loadModel, Robot, JointPath } from "./robot.js";
import { whileVisible, reducedMotion, COLORS } from "./util.js";

export { loadModel };

const COLOR = {
  path: COLORS.path || "#e8a31a",           // the shown path: the paper's amber solution path
  casing: "#a8700f",                        // a darker amber around it, so it reads on light obstacles
  other: COLORS.pathEarlier || "#c9c3b8",   // the other three paths: the paper's earlier solution
  start: COLORS.start || "#910021",
  goal: COLORS.goal || "#4f9216",
  obstacle: "#b8b2a8"                       // shaded warm grey in 3D (the paper's flat obstacles are black)
};
const EE_STEP = 0.02;    // joint-space spacing (rad) of the samples of each end-effector path
/* Spherical harmonics (bands 0 to 2, the same for r, g and b) of three's RoomEnvironment, from
 * LightProbeGenerator.fromCubeRenderTarget on a 256 px cube render of it (three 0.169). */
const ROOM_SH = [3.4311, 1.3474, 1.1595, 0.1746, 0.1927, 1.1869, 0.4053, -0.1714, -1.0187];
const smooth = (t) => t * t * (3 - 2 * t);

/* Grid on z = 0 around the origin: cells of `cell` metres, fading out radially. */
function makeGrid(half, cell) {
  const pos = [], col = [];
  const line = new THREE.Color("#e2e0e6");
  const n = Math.round(half / cell);
  const piece = cell / 2;
  const fade = (x, y) => 1 - smooth(Math.min(1, Math.max(0, (Math.hypot(x, y) / half - 0.3) / 0.7)));
  const push = (x0, y0, x1, y1) => {
    const f0 = fade(x0, y0), f1 = fade(x1, y1);
    if (f0 <= 0.001 && f1 <= 0.001) return;
    pos.push(x0, y0, 0, x1, y1, 0);
    // towards white (1, 1, 1) as the line fades
    col.push(1 + (line.r - 1) * f0, 1 + (line.g - 1) * f0, 1 + (line.b - 1) * f0, 1 + (line.r - 1) * f1, 1 + (line.g - 1) * f1, 1 + (line.b - 1) * f1);
  };
  for (let i = -n; i <= n; i++) {
    const s = i * cell;
    for (let t = -half; t < half - 1e-9; t += piece) {
      push(s, t, s, t + piece);
      push(t, s, t + piece, s);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true }));
  lines.renderOrder = -1;
  return lines;
}

/* The 8 corners of a mesh's bounding box, in world coordinates (an oriented box). */
function corners(mesh, out) {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  const b = mesh.geometry.boundingBox;
  for (let k = 0; k < 8; k++) {
    out.push(new THREE.Vector3(k & 1 ? b.max.x : b.min.x, k & 2 ? b.max.y : b.min.y, k & 4 ? b.max.z : b.min.z).applyMatrix4(mesh.matrixWorld));
  }
  return out;
}

const thin = (list, most) => {
  const step = Math.max(1, Math.ceil(list.length / most));
  return step === 1 ? list : list.filter((_, i) => i % step === 0);
};

export class MbmView {
  /* canvas and context: a WebGL 2 context made ahead of time (mbm.js), or none to let three make it. */
  constructor(host, { label = "3D view", onInteract = null, canvas = undefined, context = undefined } = {}) {
    this.host = host;
    this.animators = new Set();
    this.lineMaterials = new Set();
    this.visible = true;
    this.held = false;
    this.frame = 0;
    this.last = 0;
    this.onInteract = onInteract;

    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas, context });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute("aria-label", label);
    renderer.domElement.setAttribute("role", "img");
    host.prepend(renderer.domElement);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#ffffff");
    this.scene = scene;
    const probe = new THREE.LightProbe();
    probe.sh.fromArray(ROOM_SH.flatMap((c) => [c, c, c]));
    probe.intensity = 0.55;
    scene.add(probe);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe9e9ee, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 1.45);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 4;
    scene.add(key, key.target);
    this.key = key;
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-2, 2, 1.2);
    scene.add(fill);

    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.12, depthWrite: false }));
    this.floor.receiveShadow = true;
    this.floor.renderOrder = -2;
    scene.add(this.floor);
    this.grid = makeGrid(3.5, 0.25);
    scene.add(this.grid);

    this.world = new THREE.Group();     // obstacles, paths, markers of the current problem
    scene.add(this.world);
    this.robot = null;
    this.paths = {};
    this.lines = {};

    this.obstacleMaterial = new THREE.MeshStandardMaterial({ color: COLOR.obstacle, roughness: 0.88, metalness: 0 });
    this.unitBox = new THREE.BoxGeometry(1, 1, 1);
    this.unitSphere = new THREE.SphereGeometry(1, 32, 20);
    this.markerGeometry = new THREE.SphereGeometry(1, 24, 16);
    this.markerMaterials = {
      start: new THREE.MeshStandardMaterial({ color: COLOR.start, roughness: 0.5 }),
      goal: new THREE.MeshStandardMaterial({ color: COLOR.goal, roughness: 0.5 })
    };
    const xray = (color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.38, depthTest: false, depthWrite: false });
    this.markerXray = { start: xray(COLOR.start), goal: xray(COLOR.goal) };

    const camera = new THREE.PerspectiveCamera(34, 1, 0.02, 60);
    camera.up.set(0, 0, 1);
    camera.position.set(2.5, -2.5, 1.8);
    this.camera = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.maxPolarAngle = Math.PI * 0.53;
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
    // A gesture counts as the reader's once it has moved the camera: a tap, or a vertical swipe that
    // the browser turns into a page scroll, must not stop the tour
    let gesture = false;
    controls.addEventListener("change", () => {
      if (gesture) {
        gesture = false;
        this.cancelTween();
        if (this.onInteract) this.onInteract();
      }
      this.invalidate();
    });
    controls.addEventListener("start", () => { gesture = true; });
    controls.addEventListener("end", () => { gesture = false; });
    this.controls = controls;
    renderer.domElement.style.touchAction = "pan-y";      // OrbitControls sets "none"
    this._gateTouch(host, controls);
    // Wheel zoom only after a click into the view, so the page still scrolls past it
    renderer.domElement.addEventListener("pointerdown", () => { controls.enableZoom = true; });
    renderer.domElement.addEventListener("pointerleave", () => { controls.enableZoom = false; });

    this._tick = this._tick.bind(this);
    this.resize();
    if ("ResizeObserver" in window) new ResizeObserver(() => this.resize()).observe(host);
    else window.addEventListener("resize", () => this.resize());
    this.stopWatching = whileVisible(host, (v) => {
      this.visible = v;
      this.last = 0;
      if (v) this.invalidate();
    }, "60px");
  }

  /* A one-finger touch reaches OrbitControls only once it is a sideways drag. The browser needs some
   * 15 px of a vertical swipe before it takes it for scrolling (and cancels the pointer), and those
   * first moves would otherwise tilt the camera. Listeners in the capture phase run before the
   * controls' own. */
  _gateTouch(host, controls) {
    let id = null, x0 = 0, y0 = 0, open = true, fingers = 0;
    host.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch") return;
      fingers++;
      if (fingers === 1) {
        id = e.pointerId; x0 = e.clientX; y0 = e.clientY; open = false;
      } else {
        open = true;                      // a second finger: pinch and two-finger turns pass
      }
    }, true);
    host.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "touch" || open || e.pointerId !== id) return;
      const dx = Math.abs(e.clientX - x0), dy = Math.abs(e.clientY - y0);
      if ((dx >= 6 && dx >= dy) || Math.hypot(dx, dy) >= 24) {
        open = true;
        // Start the turn here, not at the touch-down point (no jump); three r169 keeps it in _rotateStart
        if (controls._rotateStart) controls._rotateStart.set(e.pageX, e.pageY);
        return;
      }
      e.stopPropagation();
    }, true);
    const up = (e) => {
      if (e.pointerType !== "touch") return;
      fingers = Math.max(0, fingers - 1);
      if (fingers === 0) {
        id = null;
        open = true;
      }
    };
    host.addEventListener("pointerup", up, true);
    host.addEventListener("pointercancel", up, true);
  }

  resize() {
    const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight);
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.lineMaterials.forEach((m) => m.resolution.set(w, h));
    if (this.fitArgs) this.fit(...this.fitArgs, { instant: true });
    this.invalidate();
  }

  invalidate() {
    if (!this.frame && this.visible) this.frame = requestAnimationFrame(this._tick);
  }

  /* fn(dt) runs every frame while it returns true. */
  animate(fn) {
    this.animators.add(fn);
    this.invalidate();
    return () => this.animators.delete(fn);
  }

  _tick(now) {
    this.frame = 0;
    if (!this.visible) {
      this.last = 0;
      return;
    }
    const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 1 / 60;
    let again = false;
    for (const fn of Array.from(this.animators)) {
      if (fn(dt, now)) again = true;
      else this.animators.delete(fn);
    }
    if (this.controls.update()) again = true;
    if (!this.held) this.renderer.render(this.scene, this.camera);
    this.last = again ? now : 0;
    if (again) this.invalidate();
  }

  /* While held, nothing is drawn (the last frame stays): the scene is being rebuilt. */
  hold(on) {
    this.held = on;
    if (!on) this.invalidate();
  }

  /* Compile the shaders of what is in the scene now, off the main thread where the browser can. */
  async warm() {
    try {
      if (this.renderer.compileAsync) await this.renderer.compileAsync(this.scene, this.camera);
    } catch (e) {
      // the first frame compiles them instead
    }
  }

  lineMaterial(opts) {
    const m = new LineMaterial(Object.assign({ linewidth: 2.5, worldUnits: false, transparent: true, depthWrite: false }, opts));
    m.resolution.set(this.w || 1, this.h || 1);
    this.lineMaterials.add(m);
    return m;
  }

  /* ------------------------------------------------------------ robot */
  setRobot(model) {
    if (this.robot && this.robot.model === model) return this.robot;
    if (this.robot) this.scene.remove(this.robot);
    this.robot = new Robot(model, { lod: "full", castShadow: true });
    this.scene.add(this.robot);
    this.invalidate();
    return this.robot;
  }

  pose(q) {
    if (!this.robot) return;
    this.robot.setQ(q);
    this.invalidate();
  }

  /* ------------------------------------------------------------ problem */
  clearProblem() {
    this.world.children.slice().forEach((c) => {
      this.world.remove(c);
      c.traverse((o) => {
        if (o.geometry && !o.userData.shared) o.geometry.dispose();
      });
      if (c.isLine2) {
        this.lineMaterials.delete(c.material);
        c.material.dispose();
      }
    });
    this.lines = {};
    this.paths = {};
  }

  /* Build the problem (obstacles, the end-effector path of every variant, start and goal markers)
   * and frame the whole scene. */
  setProblem(model, problem, variants, { instant = false } = {}) {
    this.clearProblem();
    const obstacles = new THREE.Group();
    const o = problem.obstacles || {};
    const add = (geom, a, scale, shared) => {
      const m = new THREE.Mesh(geom, this.obstacleMaterial);
      m.position.set(a[0], a[1], a[2]);
      if (a.length > 4) m.quaternion.set(a[3], a[4], a[5], a[6]);
      if (scale) m.scale.copy(scale);
      m.castShadow = true;
      m.receiveShadow = true;
      m.userData.shared = shared;
      obstacles.add(m);
    };
    (o.box || []).forEach((a) => add(this.unitBox, a, new THREE.Vector3(2 * a[7], 2 * a[8], 2 * a[9]), true));
    (o.sphere || []).forEach((a) => add(this.unitSphere, a, new THREE.Vector3(a[3], a[3], a[3]), true));
    // three's capsule runs along y; VAMP's along local z
    (o.capsule || []).forEach((a) => add(new THREE.CapsuleGeometry(a[7], a[8], 5, 20).rotateX(Math.PI / 2), a, null, false));
    this.world.add(obstacles);
    obstacles.updateMatrixWorld(true);

    // End-effector paths of all variants (Baxter: one per arm)
    const ees = model.eeFrames.length;
    const pathPts = [];
    const q = new Float64Array(model.dof);
    variants.forEach((v) => {
      const jp = new JointPath(problem.variants[v].path);
      this.paths[v] = jp;
      const tracks = Array.from({ length: ees }, () => []);
      // Sample every segment densely, keeping the waypoints themselves
      for (let i = 0; i < jp.points.length - 1; i++) {
        const seg = jp.s[i + 1] - jp.s[i];
        const k = Math.max(1, Math.ceil(seg / EE_STEP));
        for (let j = i === 0 ? 0 : 1; j <= k; j++) {
          jp.at(jp.s[i] + (seg * j) / k, q);
          model.eePositions(q).forEach((p, e) => tracks[e].push(p));
        }
      }
      if (jp.points.length === 1) model.eePositions(jp.points[0]).forEach((p, e) => tracks[e].push(p, p.clone()));
      this.lines[v] = tracks.map((track) => {
        const g = new LineGeometry();
        const flat = new Float32Array(track.length * 3);
        track.forEach((p, i) => p.toArray(flat, 3 * i));
        g.setPositions(flat);
        const line = new Line2(g, this.lineMaterial({ color: COLOR.other, linewidth: 1.6, opacity: 0.9 }));
        line.computeLineDistances();
        this.world.add(line);
        // A darker casing under the shown path (shown for the selected variant)
        const casing = new Line2(g, this.lineMaterial({ color: COLOR.casing, linewidth: 5.4, opacity: 1 }));
        casing.userData.shared = true;
        casing.renderOrder = 2.5;
        casing.visible = false;
        this.world.add(casing);
        line.userData.casing = casing;
        // The same path seen through the obstacles, dashed and faint (shown for the selected variant)
        const xray = new Line2(g, this.lineMaterial({ color: COLOR.casing, linewidth: 1.8, opacity: 0.45, depthTest: false, dashed: true, dashSize: 0.018, gapSize: 0.014 }));
        xray.userData.shared = true;
        xray.renderOrder = 1;
        xray.visible = false;
        this.world.add(xray);
        line.userData.xray = xray;
        track.forEach((p) => pathPts.push(p));
        return line;
      });
    });

    // Start and goal markers at each end effector
    const r = 0.017;
    [[model.eePositions(problem.start), "start"], [model.eePositions(problem.goal), "goal"]].forEach(([ps, kind]) => ps.forEach((p) => {
      [[this.markerMaterials[kind], r, 4], [this.markerXray[kind], r * 0.8, 5]].forEach(([material, size, order]) => {
        const m = new THREE.Mesh(this.markerGeometry, material);
        m.userData.shared = true;
        m.position.copy(p);
        m.scale.setScalar(size);
        m.renderOrder = order;
        this.world.add(m);
      });
    }));

    // The whole scene: every obstacle, the robot's meshes along the first and best paths, the paths
    const robotPts = [], joints = [], obstaclePts = [];
    ["first", "best"].forEach((v) => {
      const jp = this.paths[v] || this.paths[variants[0]];
      for (let i = 0; i <= 5; i++) {
        this.robot.setQ(jp.atFraction(i / 5, q));
        this.robot.updateMatrixWorld(true);
        this.robot.traverse((m) => { if (m.isMesh) corners(m, robotPts); });
        model.keyPoints(q).forEach((p) => joints.push(p));
      }
    });
    this.pose(problem.start);
    this.robot.updateMatrixWorld(true);
    obstacles.children.forEach((m) => corners(m, obstaclePts));
    const framePts = thin(pathPts, 300).concat(robotPts, obstaclePts);
    const all = new THREE.Box3().setFromPoints(framePts);
    const c = all.getCenter(new THREE.Vector3());
    const radius = all.getSize(new THREE.Vector3()).length() / 2;

    // Floor under the lowest point of the robot and the obstacles (VAMP has no floor; this one only
    // catches shadows), grid lines on multiples of 0.25 m, shadow camera around the scene
    const lowest = new THREE.Box3().setFromPoints(robotPts.concat(obstaclePts)).min.z;
    const floorZ = lowest - 0.002;
    this.floor.position.set(c.x, c.y, floorZ);
    this.grid.position.set(Math.round(c.x / 0.25) * 0.25, Math.round(c.y / 0.25) * 0.25, floorZ + 0.0008);
    const e = radius * 1.2;
    Object.assign(this.key.shadow.camera, { left: -e, right: e, top: e, bottom: -e, near: 0.1, far: 14 });
    this.key.shadow.camera.updateProjectionMatrix();
    this.key.target.position.set(c.x, c.y, floorZ);
    this.key.position.copy(this.key.target.position).add(new THREE.Vector3(0.9, -0.6, 4.5));

    // View: start from the paper's (behind the robot's side, render_gifs.py) and turn it to the
    // direction from which the obstacles hide the least of the end-effector paths and the arm
    const oc = (obstaclePts.length ? new THREE.Box3().setFromPoints(obstaclePts) : all).getCenter(new THREE.Vector3());
    const toward = new THREE.Vector3(oc.x, oc.y, 0);
    if (toward.lengthSq() < 1e-6) toward.set(1, 0, 0);
    toward.normalize();
    const side = new THREE.Vector3(toward.y, -toward.x, 0);
    const dir = toward.clone().multiplyScalar(-0.5).addScaledVector(side, 0.85).add(new THREE.Vector3(0, 0, 0.6)).normalize();
    const view = this.bestView(model, obstacles, framePts, pathPts, joints, Math.atan2(dir.y, dir.x));
    this.fit(framePts, { azimuth: view.azimuth, elevation: view.elevation, margin: 1.08 }, { instant });
  }

  /* The viewing direction, among 12 azimuths and 2 elevations, with the fewest end-effector path
   * samples and arm joints hidden behind the obstacles or the robot's fixed body (Fetch's base and
   * torso, Baxter's torso and pedestal, at the start pose); ties go to the azimuth nearest az0.
   * Occluders are the oriented bounding boxes of the meshes, and each sight line is clipped against
   * them in the box's own frame. */
  bestView(model, obstacles, framePts, pathPts, jointPts, az0) {
    const samples = thin(pathPts, 110).map((p) => [p, 1]).concat(thin(jointPts, 40).map((p) => [p, 0.5]));
    const fitPts = thin(framePts, 200);
    const boxes = [];
    const occluder = (m) => {
      if (!m.isMesh) return;
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      const inv = m.matrixWorld.clone().invert();
      const local = new Float32Array(samples.length * 3);
      samples.forEach(([p], i) => p.clone().applyMatrix4(inv).toArray(local, 3 * i));
      boxes.push({ min: m.geometry.boundingBox.min.toArray(), max: m.geometry.boundingBox.max.toArray(), inv, local });
    };
    obstacles.children.forEach(occluder);
    const fixed = [model.chain.root].concat(model.chain.joints.filter((j) => j.type === "prismatic").map((j) => j.child));
    fixed.forEach((name) => this.robot.links[name].children.forEach(occluder));
    const eye = new THREE.Vector3(), eyeL = new THREE.Vector3(), el = [0, 0, 0];
    const weight = samples.reduce((a, s) => a + s[1], 0) || 1;
    const hidden = (pos) => {
      let sum = 0;
      const far = samples.map(([p]) => 1 - 0.01 / Math.max(0.02, p.distanceTo(pos)));    // stop 1 cm short of the sample
      const seen = new Uint8Array(samples.length);
      for (const b of boxes) {
        eyeL.copy(pos).applyMatrix4(b.inv).toArray(el);
        for (let i = 0; i < samples.length; i++) {
          if (seen[i]) continue;
          let t0 = 0, t1 = far[i], hit = true;
          for (let k = 0; k < 3 && hit; k++) {
            const d = b.local[3 * i + k] - el[k];
            if (Math.abs(d) < 1e-9) {
              hit = el[k] >= b.min[k] && el[k] <= b.max[k];
            } else {
              let a = (b.min[k] - el[k]) / d, z = (b.max[k] - el[k]) / d;
              if (a > z) { const s = a; a = z; z = s; }
              if (a > t0) t0 = a;
              if (z < t1) t1 = z;
              hit = t0 <= t1;
            }
          }
          if (hit) {
            seen[i] = 1;
            sum += samples[i][1];
          }
        }
      }
      return sum / weight;
    };
    let best = null;
    for (const elevation of [0.55, 0.8]) {
      for (let k = 0; k < 12; k++) {
        const turn = k <= 6 ? k : k - 12;           // 0, +-30 deg, ... 180 deg
        const azimuth = az0 + (turn * Math.PI) / 6;
        eye.copy(this.solveFit(fitPts, { azimuth, elevation, margin: 1.08, steps: 6 }).pos);
        const score = 1.5 * hidden(eye) + 0.03 * Math.abs(turn) + (elevation > 0.6 ? 0.04 : 0);
        if (!best || score < best.score) best = { score, azimuth, elevation };
      }
    }
    return best;
  }

  /* Highlight one variant: the amber solution path with its casing, on top; the others light warm grey. */
  setVariant(v) {
    Object.entries(this.lines || {}).forEach(([k, lines]) => lines.forEach((line) => {
      const on = k === v;
      const m = line.material;
      m.color.set(on ? COLOR.path : COLOR.other);
      m.linewidth = on ? 3.4 : 1.6;
      m.opacity = on ? 1 : 0.9;
      line.renderOrder = on ? 3 : 2;
      line.userData.casing.visible = on;
      line.userData.xray.visible = on;
    }));
    this.invalidate();
  }

  /* ------------------------------------------------------------ camera */
  /* Camera position and target that put the points inside the view, seen from a direction (azimuth,
   * elevation in radians), with `margin` to spare. The labels over the stage take `inset` pixels at
   * the top and the bottom, and the points stay clear of them. */
  solveFit(points, { azimuth = -0.9, elevation = 0.42, margin = 1.08, inset = [30, 26], steps = 14 } = {}) {
    const cam = this._fitCamera || (this._fitCamera = this.camera.clone());
    cam.fov = this.camera.fov;
    cam.aspect = this.camera.aspect;
    cam.updateProjectionMatrix();
    const top = (2 * inset[0]) / (this.h || 400), bottom = (2 * inset[1]) / (this.h || 400);
    const cy = (bottom - top) / 2, sy = 1 - (top + bottom) / 2;      // centre and half height of the free band (NDC)
    const dir = new THREE.Vector3(Math.cos(elevation) * Math.cos(azimuth), Math.cos(elevation) * Math.sin(azimuth), Math.sin(elevation));
    const box = new THREE.Box3().setFromPoints(points);
    const target = box.getCenter(new THREE.Vector3());
    let dist = box.getSize(new THREE.Vector3()).length() * 1.2;
    const p = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
    for (let it = 0; it < steps; it++) {
      cam.position.copy(target).addScaledVector(dir, dist);
      cam.up.set(0, 0, 1);
      cam.lookAt(target);
      cam.updateMatrixWorld(true);
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const q of points) {
        p.copy(q).project(cam);
        if (p.x < x0) x0 = p.x;
        if (p.x > x1) x1 = p.x;
        if (p.y < y0) y0 = p.y;
        if (p.y > y1) y1 = p.y;
      }
      const ext = Math.max((x1 - x0) / 2, (y1 - y0) / 2 / sy);
      right.setFromMatrixColumn(cam.matrixWorld, 0);
      up.setFromMatrixColumn(cam.matrixWorld, 1);
      const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * dist;
      const halfW = halfH * cam.aspect;
      target.addScaledVector(right, ((x0 + x1) / 2) * halfW).addScaledVector(up, ((y0 + y1) / 2 - cy) * halfH);
      dist *= Math.max(0.5, Math.min(2, ext * margin));
    }
    return { pos: target.clone().addScaledVector(dir, dist), target, dist };
  }

  /* Move the camera to frame the points (see solveFit). */
  fit(points, opts = {}, { instant = false } = {}) {
    this.fitArgs = [points, opts];
    const { pos, target, dist } = this.solveFit(points, opts);
    this.controls.maxDistance = dist * 2.2;
    this.controls.minDistance = dist * 0.3;
    this.tweenTo(pos, target, instant || reducedMotion() ? 0 : 0.7);
  }

  tweenTo(pos, target, dur = 0.7) {
    this.cancelTween();
    const p0 = this.camera.position.clone(), t0 = this.controls.target.clone();
    if (!dur) {
      this.camera.position.copy(pos);
      this.controls.target.copy(target);
      this.controls.update();
      this.invalidate();
      return;
    }
    let s = 0;
    const fn = (dt) => {
      if (fn.cancelled) return false;
      s = Math.min(1, s + dt / dur);
      const k = smooth(s);
      this.camera.position.lerpVectors(p0, pos, k);
      this.controls.target.lerpVectors(t0, target, k);
      return s < 1;
    };
    this.tween = fn;
    this.animate(fn);
  }

  cancelTween() {
    if (this.tween) this.tween.cancelled = true;
    this.tween = null;
  }
}
