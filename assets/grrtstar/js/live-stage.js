/* three.js stage of the live demo: the MotionBenchMaker obstacles as VAMP checks them (boxes, capsules,
 * spheres), the Panda posed by each planner's path, end-effector traces in the planner colours, and
 * dragging of the movable obstacles on a horizontal plane. Render on demand; z is up.
 * Colours are the page's (util.js COLORS): the planners' as given by live.js, the start crimson and the
 * goal green as in the paper. The robot, the obstacles and the floor keep their own neutral shading. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { loadModel, Robot, ghostMaterial } from "./robot.js";
import { COLORS } from "./util.js";

const _v = new THREE.Vector3();
const C = {
  obstacle: 0xb8b2a8, hover: 0xa59f95, drag: 0x938d84, hit: 0xd0705c,
  start: COLORS.start, goal: COLORS.goal, mount: 0xdedbd5
};

/* A light line colour (the amber of AORRTC) on this light scene gets a dark edge: relative luminance */
const luminance = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
const WHITE = new THREE.Color("#ffffff"), BLACK = new THREE.Color("#000000");

export function obstacleQuaternion(e, out = new THREE.Quaternion()) {
  // VAMP: R = Rz(e2) Ry(e1) Rx(e0); three.js order "ZYX" gives the same matrix
  return out.setFromEuler(new THREE.Euler(e[0], e[1], e[2], "ZYX"));
}

/* Grid on z = z0: 0.1 m cells, darker every 0.5 m, fading out radially (as on the reference pages). */
function makeGrid(half, center, z0) {
  const pos = [], col = [];
  const minor = new THREE.Color("#e3e3e8"), major = new THREE.Color("#cfcfd6"), bg = new THREE.Color("#ffffff");
  const cell = 0.1, n = Math.round(half / cell), piece = cell / 2;
  const fade = (x, y) => {
    const r = Math.hypot(x, y) / half;
    const t = Math.min(1, Math.max(0, (r - 0.45) / 0.55));
    return 1 - t * t * (3 - 2 * t);
  };
  const push = (x0, y0, x1, y1, c) => {
    const f0 = fade(x0, y0), f1 = fade(x1, y1);
    if (f0 <= 0.001 && f1 <= 0.001) return;
    pos.push(x0 + center[0], y0 + center[1], z0, x1 + center[0], y1 + center[1], z0);
    const a = bg.clone().lerp(c, f0), b = bg.clone().lerp(c, f1);
    col.push(a.r, a.g, a.b, b.r, b.g, b.b);
  };
  for (let i = -n; i <= n; i++) {
    const c = i % 5 === 0 ? major : minor;
    const s = i * cell;
    for (let t = -half; t < half - 1e-9; t += piece) {
      push(s, t, s, t + piece, c);
      push(t, s, t + piece, s, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true }));
  lines.renderOrder = -1;
  return lines;
}

function obstacleGeometry(o) {
  if (o.kind === "sphere") return new THREE.SphereGeometry(o.r, 32, 16);
  if (o.kind === "box") return new THREE.BoxGeometry(2 * o.h[0], 2 * o.h[1], 2 * o.h[2]);
  const g = new THREE.CapsuleGeometry(o.r, o.l, 6, 24);
  g.rotateX(Math.PI / 2);                     // three's capsule runs along y; VAMP's along local z
  return g;
}

/* ---------------------------------------------------------------- the goal pose
 * The planners' robots are filled translucent ghosts in their colours (G-RRT*'s in the same green as the
 * goal), so the goal pose is a different kind of mark: the robot drawn in lines of the goal colour, with no
 * fill. Its outline is an inverted hull (the back faces pushed out by a fixed number of pixels) and its
 * creases are edge lines. An invisible copy writes depth first, so that only the lines a reader would see
 * are drawn; it is drawn after everything else, so it hides nothing behind it. */
const hulls = new WeakMap(), edges = new WeakMap();

function hullGeometry(g) {
  if (!hulls.has(g)) {
    // Plain float positions: the model's are quantized and interleaved, which mergeVertices cannot copy
    const src = g.getAttribute("position"), xyz = new Float32Array(src.count * 3);
    for (let i = 0; i < src.count; i++) { xyz[3 * i] = src.getX(i); xyz[3 * i + 1] = src.getY(i); xyz[3 * i + 2] = src.getZ(i); }
    const p = new THREE.BufferGeometry();
    p.setAttribute("position", new THREE.BufferAttribute(xyz, 3));
    if (g.index) p.setIndex(Array.from(g.index.array));
    const m = mergeVertices(p, 1e-4);           // shared corners, so that the pushed-out hull has no cracks
    m.computeVertexNormals();
    hulls.set(g, m);
  }
  return hulls.get(g);
}

function edgeGeometry(g) {
  if (!edges.has(g)) edges.set(g, new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(g, 40)));
  return edges.get(g);
}

function hullMaterial(color, width) {
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide, transparent: true, depthWrite: false });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uOutline = width;
    sh.vertexShader = "uniform float uOutline;\n" + sh.vertexShader.replace("#include <project_vertex>", [
      "vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );",
      "vec3 nView = normalize( normalMatrix * normal );",
      "vec2 dir = length( nView.xy ) > 1e-4 ? normalize( nView.xy ) : vec2( 0.0 );",
      "mvPosition.xy += dir * uOutline * -mvPosition.z;      // the same number of pixels at every depth",
      "gl_Position = projectionMatrix * mvPosition;"
    ].join("\n"));
  };
  return m;
}

function goalMark(model, color, stage) {
  const depth = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, transparent: true });
  const robot = new Robot(model, { lod: "ghost", material: depth, castShadow: false });
  const hull = hullMaterial(new THREE.Color(color), stage.outlineWidth);
  const edge = new LineMaterial({ color: new THREE.Color(color), linewidth: 1.2, worldUnits: false, transparent: true, opacity: 0.9 });
  edge.resolution.set(stage.w || 1, stage.h || 1);
  stage.lineMaterials.add(edge);
  const meshes = [];
  robot.traverse((o) => { if (o.isMesh) meshes.push(o); });
  meshes.forEach((o) => {
    o.renderOrder = 10;
    const h = new THREE.Mesh(hullGeometry(o.geometry), hull);
    h.renderOrder = 11;
    const e = new LineSegments2(edgeGeometry(o.geometry), edge);
    e.renderOrder = 12;
    o.add(h, e);
  });
  robot.userData.mark = { hull, edge };
  return robot;
}

export class LiveStage {
  constructor(host, { colors, onDrag, onDrop, onPick, canDrag } = {}) {
    this.host = host;
    this.colors = colors;
    this.onDrag = onDrag;
    this.onDrop = onDrop;
    this.onPick = onPick;
    this.canDrag = canDrag || (() => true);
    this.animators = new Set();
    this.visible = true;
    this.frame = 0;
    this.last = 0;
    this.meshes = [];
    this.obstacles = [];
    this.traces = {};
    this.dragBounds = null;
    this.outlineWidth = { value: 0 };            // the goal pose's outline, set by resize()
    this.lineMaterials = new Set();              // fat lines that need the canvas size

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-label", "A Panda arm over a table with obstacles, moving along the planned paths");
    host.prepend(renderer.domElement);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#ffffff");
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    scene.environmentIntensity = 0.55;
    this.scene = scene;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xe9e9ee, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.45);
    key.position.set(0.9, -0.5, 3.4);
    key.castShadow = true;
    const coarse = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    key.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
    Object.assign(key.shadow.camera, { left: -1.8, right: 1.8, top: 1.8, bottom: -1.8, near: 0.5, far: 7 });
    key.shadow.radius = 8;
    key.shadow.blurSamples = 16;
    key.shadow.bias = -0.0004;
    scene.add(key, key.target);
    this.key = key;
    const fill = new THREE.DirectionalLight(0xffffff, 0.45);
    fill.position.set(-2, 2, 1.2);
    scene.add(fill);

    this.world = new THREE.Group();
    scene.add(this.world);
    this.obstacleGroup = new THREE.Group();
    this.traceGroup = new THREE.Group();
    this.world.add(this.obstacleGroup, this.traceGroup);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.02, 40);
    camera.up.set(0, 0, 1);
    this.camera = camera;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minDistance = 1.0;
    controls.maxDistance = 7;
    controls.maxPolarAngle = Math.PI * 0.53;
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
    controls.addEventListener("change", () => this.invalidate());
    this.controls = controls;
    renderer.domElement.style.touchAction = "pan-y";     // let the page scroll vertically over the canvas
    renderer.domElement.addEventListener("pointerdown", () => { controls.enableZoom = true; });
    renderer.domElement.addEventListener("pointerleave", () => { controls.enableZoom = false; });

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this._drag = null;
    this._hover = -1;
    this._bindPointer();

    this._tick = this._tick.bind(this);
    this.resize();
    if ("ResizeObserver" in window) new ResizeObserver(() => this.resize()).observe(host);
    else window.addEventListener("resize", () => this.resize());
  }

  /* ---------------------------------------------------------------- robots */
  async loadRobot(planners) {
    const model = await loadModel("panda");
    this.model = model;
    this.robots = {};
    const add = (r) => { this.world.add(r); return r; };
    this.neutral = add(new Robot(model));
    planners.forEach((p) => {
      // A light colour (amber) needs a little more body to show against the white robot and floor
      const light = luminance(new THREE.Color(this.colors[p])) > 0.3;
      this.robots[p] = {
        solid: add(new Robot(model).setVisible(false)),
        ghost: add(new Robot(model, { lod: "ghost", material: ghostMaterial(this.colors[p], light ? 0.3 : 0.2), castShadow: false }).setVisible(false))
      };
    });
    this.goalGhost = add(goalMark(model, C.goal, this));
    const dot = (color) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.014, 20, 12), new THREE.MeshBasicMaterial({ color }));
      this.world.add(m);
      return m;
    };
    this.startDot = dot(C.start);
    this.goalDot = dot(C.goal);
    this.invalidate();
  }

  setStart(q) {
    this.startQ = q;
    this.neutral.setQ(q);
    Object.values(this.robots).forEach((r) => { r.solid.setQ(q); r.ghost.setQ(q); });
    this.startDot.position.copy(this.model.eePosition(q));
    this.invalidate();
  }

  setGoal(q, ok = true) {
    this.goalQ = q;
    this.goalGhost.setQ(q);
    // A goal in collision is drawn fainter (its obstacle turns red)
    const mark = this.goalGhost.userData.mark;
    mark.hull.opacity = ok ? 1 : 0.4;
    mark.edge.opacity = ok ? 0.9 : 0.35;
    this.goalDot.position.copy(this.model.eePosition(q));
    this.invalidate();
  }

  /* show: null (no results: one neutral robot at the start) or {selected, planners: [names with a path]} */
  showRobots(show) {
    const on = !!show;
    // Without a path for the selected planner, the robot stays at the start
    this.neutral.setVisible(!on || !show.planners.includes(show.selected));
    Object.entries(this.robots).forEach(([p, r]) => {
      const has = on && show.planners.includes(p);
      r.solid.setVisible(has && p === show.selected);
      r.ghost.setVisible(has && p !== show.selected && show.ghosts !== false);
    });
    this.invalidate();
  }

  pose(planner, q) {
    const r = this.robots[planner];
    r.solid.setQ(q);
    r.ghost.setQ(q);
    this.invalidate();
  }

  /* ---------------------------------------------------------------- traces */
  setTraces(traces, selected) {
    this.traceGroup.clear();
    Object.values(this.traces).forEach((l) => {
      l.geometry.dispose();
      l.material.dispose();
      if (l.userData.casing) l.userData.casing.material.dispose();       // shares the geometry
    });
    this.traces = {};
    Object.entries(traces).forEach(([p, pts]) => {
      if (!pts || pts.length < 6) return;
      const g = new LineGeometry();
      g.setPositions(pts);
      const sel = p === selected;
      // Opaque lines (overlapping joints of a translucent polyline would show as beads); the other planners
      // get a lighter tint of their colour instead
      const base = new THREE.Color(this.colors[p]);
      const color = sel ? base.clone() : base.clone().lerp(WHITE, 0.45);
      const width = sel ? 3.2 : 1.8;
      // The other planners' lines do not write depth, so the selected one stays on top where they coincide
      // (G-RRT* and RRT-Connect share their first path)
      const m = new LineMaterial({ color, linewidth: width, worldUnits: false, depthWrite: sel });
      m.resolution.set(this.w || 1, this.h || 1);
      const line = new Line2(g, m);
      line.computeLineDistances();
      line.renderOrder = sel ? 3 : 2;
      // A light colour (amber) would fade into the white floor and the pale table: a darker edge of its own
      // hue, 1 px on each side, drawn just before it
      if (luminance(base) > 0.3) {
        const edge = base.clone().lerp(BLACK, sel ? 0.42 : 0.2);
        const cm = new LineMaterial({ color: edge, linewidth: width + 2, worldUnits: false, depthWrite: false });
        cm.resolution.set(this.w || 1, this.h || 1);
        const casing = new Line2(g, cm);
        casing.computeLineDistances();
        casing.renderOrder = line.renderOrder - 0.5;
        line.userData.casing = casing;
        this.traceGroup.add(casing);
      }
      this.traceGroup.add(line);
      this.traces[p] = line;
    });
    this.invalidate();
  }

  /* ---------------------------------------------------------------- obstacles */
  setObstacles(list) {
    this.obstacleGroup.clear();
    this.meshes.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
    this.obstacles = list;
    this.meshes = list.map((o, i) => {
      const mat = new THREE.MeshStandardMaterial({ color: C.obstacle, roughness: 0.88, metalness: 0 });
      const m = new THREE.Mesh(obstacleGeometry(o), mat);
      m.position.set(o.p[0], o.p[1], o.p[2]);
      if (o.e) obstacleQuaternion(o.e, m.quaternion);
      m.castShadow = true;
      m.receiveShadow = true;
      m.userData.index = i;
      this.obstacleGroup.add(m);
      return m;
    });
    this.hits = new Set();
    this._paint();
    this.invalidate();
  }

  moveObstacle(i, p) {
    this.obstacles[i].p = p;
    this.meshes[i].position.set(p[0], p[1], p[2]);
    this.invalidate();
  }

  /* Obstacles that make the start or the goal invalid */
  markHits(set) {
    this.hits = set;
    this._paint();
  }

  _paint() {
    this.meshes.forEach((m, i) => {
      let c = C.obstacle;
      if (this.hits && this.hits.has(i)) c = C.hit;
      else if (this._drag && this._drag.i === i) c = C.drag;
      else if (this._hover === i) c = C.hover;
      m.material.color.setHex(c);
    });
    this.invalidate();
  }

  /* Ground grid under the table legs and a plain mount under the robot (not an obstacle). */
  setGround(z0, center) {
    if (this.ground) this.world.remove(this.ground);
    const g = new THREE.Group();
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShadowMaterial({ opacity: 0.12, depthWrite: false }));
    floor.position.z = z0;
    floor.receiveShadow = true;
    floor.renderOrder = -2;
    g.add(floor);
    const grid = makeGrid(1.8, center, z0 + 0.0008);
    g.add(grid);
    if (z0 < -0.02) {
      const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, -z0, 32), new THREE.MeshStandardMaterial({ color: C.mount, roughness: 0.95 }));
      mount.rotation.x = Math.PI / 2;
      mount.position.z = z0 / 2;
      mount.castShadow = true;
      g.add(mount);
    }
    this.ground = g;
    this.world.add(g);
    this.key.target.position.set(center[0], center[1], z0);
    this.key.position.set(center[0] + 0.9, center[1] - 0.5, z0 + 3.6);
    this.invalidate();
  }

  /* ---------------------------------------------------------------- camera */
  view({ target, azimuth, elevation, distance }) {
    this.home = { target: target.slice(), azimuth, elevation, distance };
    const t = new THREE.Vector3(...target);
    const d = distance * (this.aspectScale || 1);
    const ce = Math.cos(elevation);
    this.camera.position.set(t.x + d * ce * Math.cos(azimuth), t.y + d * ce * Math.sin(azimuth), t.z + d * Math.sin(elevation));
    this.controls.target.copy(t);
    this.camera.lookAt(t);
    this.controls.update();
    this.invalidate();
  }

  resize() {
    const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight);
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Narrow views move the camera back so that the scene keeps fitting horizontally
    const scale = Math.max(1, Math.pow(1.6 / (w / h), 0.6));
    const changed = this.aspectScale !== scale;
    this.aspectScale = scale;
    this.camera.updateProjectionMatrix();
    Object.values(this.traces).forEach((l) => {
      l.material.resolution.set(w, h);
      if (l.userData.casing) l.userData.casing.material.resolution.set(w, h);
    });
    this.lineMaterials.forEach((m) => m.resolution.set(w, h));
    // Outline of the goal pose: 1.6 px (a view-space offset of px * 2 / (P11 * height) per unit of depth)
    this.outlineWidth.value = 1.6 * 2 / (this.camera.projectionMatrix.elements[5] * h);
    if (changed && this.home) this.view(this.home);
    this.invalidate();
  }

  invalidate() {
    if (!this.frame) this.frame = requestAnimationFrame(this._tick);
  }

  /* fn(dt, now) runs every frame while it returns true. */
  animate(fn) {
    this.animators.add(fn);
    this.last = 0;
    this.invalidate();
    return () => this.animators.delete(fn);
  }

  setVisible(v) {
    this.visible = v;
    if (v) { this.last = 0; this.invalidate(); }
  }

  _tick(now) {
    this.frame = 0;
    const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 1 / 60;
    let again = false;
    if (this.visible) {
      for (const fn of Array.from(this.animators)) {
        if (fn(dt, now)) again = true;
        else this.animators.delete(fn);
      }
    }
    if (this.controls.update()) again = true;
    if (this.visible) this.renderer.render(this.scene, this.camera);
    this.last = again ? now : 0;
    if (again && this.visible) this.invalidate();
  }

  /* ---------------------------------------------------------------- dragging */
  _ray(e) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster;
  }

  _pickMovable(e) {
    const hits = this._ray(e).intersectObjects(this.meshes, false);
    if (hits.length) {
      const i = hits[0].object.userData.index;      // the nearest obstacle hides the rest
      if (this.obstacles[i].movable) return { i, point: hits[0].point };
    }
    if (e.pointerType !== "touch") return null;
    // A finger is coarser than the small objects: take the movable one whose centre is nearest, within 26 px
    const r = this.renderer.domElement.getBoundingClientRect();
    let best = null, bestD = 26;
    this.obstacles.forEach((o, i) => {
      if (!o.movable) return;
      _v.set(o.p[0], o.p[1], o.p[2]).project(this.camera);
      const d = Math.hypot(r.left + (_v.x + 1) / 2 * r.width - e.clientX, r.top + (1 - _v.y) / 2 * r.height - e.clientY);
      if (d < bestD) { bestD = d; best = { i }; }
    });
    return best;
  }

  _bindPointer() {
    const dom = this.renderer.domElement;
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hit = new THREE.Vector3();
    dom.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || !this.canDrag(e)) return;
      const pick = this._pickMovable(e);
      if (!pick) return;
      e.preventDefault();
      e.stopImmediatePropagation();            // keep OrbitControls out of it
      const o = this.obstacles[pick.i];
      plane.constant = -o.p[2];
      this._ray(e).ray.intersectPlane(plane, hit);
      this._drag = { i: pick.i, dx: o.p[0] - hit.x, dy: o.p[1] - hit.y, id: e.pointerId, moved: false, x: e.clientX, y: e.clientY };
      this.controls.enabled = false;
      dom.setPointerCapture(e.pointerId);
      this.host.classList.add("dragging");
      this._paint();
      this.onPick && this.onPick(pick.i);
    }, { capture: true });
    dom.addEventListener("pointermove", (e) => {
      if (this._drag && e.pointerId === this._drag.id) {
        const o = this.obstacles[this._drag.i];
        // A press that hardly moves is not a drag
        if (!this._drag.moved && Math.hypot(e.clientX - this._drag.x, e.clientY - this._drag.y) < 3) return;
        plane.constant = -o.p[2];
        if (!this._ray(e).ray.intersectPlane(plane, hit)) return;
        let p = [hit.x + this._drag.dx, hit.y + this._drag.dy, o.p[2]];
        if (this.dragBounds) p = this.dragBounds(this._drag.i, p);
        this._drag.moved = true;
        this.moveObstacle(this._drag.i, p);
        this.onDrag && this.onDrag(this._drag.i, p);
        return;
      }
      if (e.pointerType === "touch" || !this.canDrag(e)) return;
      const pick = this._pickMovable(e);
      const i = pick ? pick.i : -1;
      if (i !== this._hover) {
        this._hover = i;
        this.host.classList.toggle("hover", i >= 0);
        this._paint();
      }
    });
    const end = (e) => {
      if (!this._drag || e.pointerId !== this._drag.id) return;
      const d = this._drag;
      this._drag = null;
      this.controls.enabled = true;
      this.host.classList.remove("dragging");
      try { dom.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
      this._paint();
      this.onDrop && this.onDrop(d.i, d.moved);
    };
    dom.addEventListener("pointerup", end);
    dom.addEventListener("pointercancel", end);

    /* Touch. The canvas lets the page scroll vertically (touch-action: pan-y). A touch that starts on a
     * movable object drags it instead, so its touchstart is cancelled (pointerdown, which runs first, has
     * picked the object by then). A vertical swipe elsewhere starts an orbit for a few pixels before the
     * browser takes it over for scrolling (pointercancel): the camera then returns to where it was. */
    dom.addEventListener("touchstart", (e) => { if (this._drag && e.cancelable) e.preventDefault(); }, { passive: false });
    let orbit = -1;
    dom.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch" || !e.isPrimary || this._drag) return;
      orbit = e.pointerId;
      this.controls.saveState();
    });
    dom.addEventListener("pointerup", (e) => { if (e.pointerId === orbit) orbit = -1; });
    dom.addEventListener("pointercancel", (e) => {
      if (e.pointerId !== orbit) return;
      orbit = -1;
      // Spend what is left of the damped rotation, then go back to the saved view
      const c = this.controls;
      c.enableDamping = false;
      c.update();
      c.reset();
      c.enableDamping = true;
    });
    dom.addEventListener("pointerleave", () => {
      if (this._hover >= 0 && !this._drag) {
        this._hover = -1;
        this.host.classList.remove("hover");
        this._paint();
      }
    });
  }

  dispose() {
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
