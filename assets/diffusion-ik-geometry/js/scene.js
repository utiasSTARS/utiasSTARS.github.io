/* Shared three.js stage: a viser-like look (white background, light grid with
 * 0.1 m cells, soft contact shadow), render-on-demand, pause when offscreen,
 * camera framing, ghost trails and fat polylines. z is up throughout. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { el, reducedMotion, smooth } from "./util.js";
import { ghostMaterial } from "./robot.js";

let envTexture = null;
function environment(renderer) {
  if (!envTexture) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }
  return envTexture;
}

/* Grid on z = 0: 0.1 m cells, darker lines every 0.5 m, fading out radially. */
export function makeGrid(half = 1.0, cell = 0.1, center = [0, 0]) {
  const pos = [], col = [];
  const minor = new THREE.Color("#dddde3"), major = new THREE.Color("#c6c6ce"), bg = new THREE.Color("#ffffff");
  const n = Math.round(half / cell);
  const piece = cell / 2;
  const fade = (x, y) => {
    const r = Math.hypot(x, y) / half;
    return 1 - smooth(Math.min(1, Math.max(0, (r - 0.45) / 0.55)));
  };
  const push = (x0, y0, x1, y1, c) => {
    const f0 = fade(x0, y0), f1 = fade(x1, y1);
    if (f0 <= 0.001 && f1 <= 0.001) return;
    pos.push(x0 + center[0], y0 + center[1], 0, x1 + center[0], y1 + center[1], 0);
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
  lines.position.z = 0.0008;
  lines.renderOrder = -1;
  return lines;
}

export class Stage {
  constructor(host, { label = "3D view", grid = { half: 1.0 }, fov = 32, shadowExtent = 1.3 } = {}) {
    this.host = host;
    this.animators = new Set();
    this.lines = new Set();
    this.visible = true;
    this.frame = 0;
    this.last = 0;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.domElement.setAttribute("aria-label", label);
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.classList.add("dg-canvas");
    host.appendChild(renderer.domElement);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#ffffff");
    scene.environment = environment(renderer);
    scene.environmentIntensity = 0.55;
    this.scene = scene;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xe9e9ee, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(0.6, -0.4, 3.2);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    const e = shadowExtent;
    Object.assign(key.shadow.camera, { left: -e, right: e, top: e, bottom: -e, near: 0.5, far: 6 });
    key.shadow.radius = 9;
    key.shadow.blurSamples = 20;
    key.shadow.bias = -0.0004;
    scene.add(key);
    scene.add(key.target);
    this.key = key;
    const fill = new THREE.DirectionalLight(0xffffff, 0.45);
    fill.position.set(-2, 2, 1.2);
    scene.add(fill);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.13, depthWrite: false }));
    floor.receiveShadow = true;
    floor.renderOrder = -2;
    scene.add(floor);
    if (grid) scene.add(makeGrid(grid.half, 0.1, grid.center || [0, 0]));

    const camera = new THREE.PerspectiveCamera(fov, 1, 0.02, 40);
    camera.up.set(0, 0, 1);
    camera.position.set(2, -2, 1.4);
    this.camera = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minDistance = 0.6;
    controls.maxDistance = 6;
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
    controls.addEventListener("change", () => this.invalidate());
    controls.addEventListener("start", () => {
      this.hint && this.hint.classList.add("gone");
      this.cancelTween();
    });
    this.controls = controls;
    renderer.domElement.style.touchAction = "pan-y";
    renderer.domElement.addEventListener("pointerdown", () => { controls.enableZoom = true; });
    renderer.domElement.addEventListener("pointerleave", () => { controls.enableZoom = false; });

    this.hint = el("div", { class: "dg-hint", "aria-hidden": "true", text: "Drag to orbit" }, host);

    if (/[?&]debug\b/.test(location.search)) (window.__dgStages = window.__dgStages || []).push(this);
    this._tick = this._tick.bind(this);
    this.resize();
    if ("ResizeObserver" in window) new ResizeObserver(() => this.resize()).observe(host);
    else window.addEventListener("resize", () => this.resize());
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        this.visible = entries.some((x) => x.isIntersecting);
        if (this.visible) this.invalidate();
      }, { rootMargin: "100px" }).observe(host);
    }
  }

  resize() {
    const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight);
    if (w === this.w && h === this.h) return;
    this.w = w; this.h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.lines.forEach((m) => m.resolution.set(w, h));
    if (this.fitArgs) this.fit(...this.fitArgs, { instant: true });
    this.invalidate();
  }

  invalidate() {
    if (!this.frame) this.frame = requestAnimationFrame(this._tick);
  }

  /* fn(dt, now) is called every frame; return true to keep animating. */
  animate(fn) {
    this.animators.add(fn);
    this.last = 0;
    this.invalidate();
    return () => this.animators.delete(fn);
  }

  _tick(now) {
    this.frame = 0;
    const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 1 / 60;
    let again = false;
    for (const fn of Array.from(this.animators)) {
      if (fn(dt, now)) again = true;
      else this.animators.delete(fn);
    }
    if (this.controls.update()) again = true;
    if (this.visible) this.renderer.render(this.scene, this.camera);
    this.last = again ? now : 0;
    if (again && this.visible) this.invalidate();
    else if (again) this.pending = true;
  }

  /* Frame a set of points from a viewing direction (azimuth, elevation in radians):
   * the camera distance and target are solved so the points' projection fills the
   * view up to `margin` and is centred (with an optional vertical offset). */
  fit(points, { azimuth = -0.9, elevation = 0.42, margin = 1.1, offsetY = 0, pad = 0.07 } = {}, { instant = false } = {}) {
    this.fitArgs = [points, { azimuth, elevation, margin, offsetY, pad }];
    if (pad) {
      const grown = [];
      points.forEach((q) => {
        grown.push(q);
        for (let a = 0; a < 3; a++) {
          for (const sgn of [-1, 1]) {
            const g = q.clone();
            g.setComponent(a, g.getComponent(a) + sgn * pad);
            if (a === 2) g.z = Math.max(0, g.z);
            grown.push(g);
          }
        }
      });
      points = grown;
    }
    const cam = this.camera.clone();
    cam.aspect = this.camera.aspect;
    cam.updateProjectionMatrix();
    const dir = new THREE.Vector3(Math.cos(elevation) * Math.cos(azimuth), Math.cos(elevation) * Math.sin(azimuth), Math.sin(elevation));
    const box = new THREE.Box3().setFromPoints(points);
    const target = box.getCenter(new THREE.Vector3());
    let dist = box.getSize(new THREE.Vector3()).length() * 1.2;
    const p = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
    for (let it = 0; it < 12; it++) {
      cam.position.copy(target).addScaledVector(dir, dist);
      cam.up.set(0, 0, 1);
      cam.lookAt(target);
      cam.updateMatrixWorld(true);
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      points.forEach((q) => {
        p.copy(q).project(cam);
        x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
      });
      const ext = Math.max((x1 - x0) / 2, (y1 - y0) / 2);
      right.setFromMatrixColumn(cam.matrixWorld, 0);
      up.setFromMatrixColumn(cam.matrixWorld, 1);
      const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * dist;
      const halfW = halfH * cam.aspect;
      target.addScaledVector(right, ((x0 + x1) / 2) * halfW).addScaledVector(up, ((y0 + y1) / 2 - offsetY) * halfH);
      dist *= Math.max(0.5, Math.min(2, ext * margin));
    }
    const pos = target.clone().addScaledVector(dir, dist);
    this.controls.maxDistance = dist * 2.2;
    this.controls.minDistance = dist * 0.35;
    this.key.target.position.copy(target).setZ(0);
    this.key.position.copy(this.key.target.position).add(new THREE.Vector3(0.6, -0.4, 3.2));
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

  lineMaterial(opts) {
    const m = new LineMaterial(Object.assign({ linewidth: 2.5, worldUnits: false, transparent: true, depthWrite: false }, opts));
    m.resolution.set(this.w || 1, this.h || 1);
    this.lines.add(m);
    return m;
  }
}

/* A fat polyline whose points can be replaced. */
export class Polyline {
  constructor(stage, { color = "#27262b", width = 2.5, opacity = 1, dashed = false, fadeTo = null, depthTest = true } = {}) {
    this.fadeTo = fadeTo ? new THREE.Color(fadeTo) : null;
    this.color = new THREE.Color(color);
    this.material = stage.lineMaterial({ color: fadeTo ? 0xffffff : this.color, vertexColors: !!fadeTo, linewidth: width, opacity, dashed, dashSize: 0.02, gapSize: 0.014, depthTest });
    this.line = null;
    this.stage = stage;
    this.group = new THREE.Group();
  }

  set(points) {
    if (this.line) {
      this.group.remove(this.line);
      this.line.geometry.dispose();
      this.line = null;
    }
    if (!points || points.length < 2) return this;
    const g = new LineGeometry();
    const flat = [];
    points.forEach((p) => flat.push(p.x, p.y, p.z));
    g.setPositions(flat);
    if (this.fadeTo) {
      const cols = [];
      const n = points.length;
      points.forEach((p, i) => {
        const c = this.fadeTo.clone().lerp(this.color, Math.pow(i / (n - 1), 1.4));
        cols.push(c.r, c.g, c.b);
      });
      g.setColors(cols);
    }
    this.line = new Line2(g, this.material);
    this.line.computeLineDistances();
    this.line.renderOrder = 3;
    this.group.add(this.line);
    this.count = points.length;
    return this;
  }

  /* Draw only the first k points. */
  reveal(k) {
    if (this.line) this.line.geometry.instanceCount = Math.max(0, Math.min(this.count, k) - 1);
    return this;
  }
}

/* Ghost style of the README and paper renders (render_media.py still_ghosts / trail_panel): k poses of a
 * densely sampled path, spaced evenly by the mean displacement of the link frames (not evenly in alpha),
 * first pose included; poses within 0.05 rad of the final pose are dropped (they would only hide it). */
export const GHOST_RAMP = [0.08, 0.6];
export function stillGhosts(model, qs, k = 6) {
  const n = qs.length;
  if (n < 2) return [];
  const pts = qs.map((q) => model.keyPoints(q));
  const s = [0];
  for (let i = 1; i < n; i++) {
    let d = 0;
    for (let j = 0; j < pts[i].length; j++) d += pts[i][j].distanceTo(pts[i - 1][j]);
    s.push(s[i - 1] + d / pts[i].length);
  }
  const out = [];
  for (let g = 0; g < k; g++) {
    const target = (s[n - 1] * g) / k;
    let i = 0;
    while (i < n - 1 && s[i] < target) i++;
    if (out.indexOf(i) < 0) out.push(i);
  }
  const last = qs[n - 1];
  return out.filter((i) => {
    let m = 0;
    for (let j = 0; j < last.length; j++) m = Math.max(m, Math.abs(qs[i][j] - last[j]));
    return m >= 0.05;
  });
}

/* Translucent copies of a robot along a path, opacity ramping from `from` to `to`. */
export class GhostTrail {
  constructor(stage, robot, color, { from = GHOST_RAMP[0], to = GHOST_RAMP[1] } = {}) {
    this.stage = stage;
    this.robot = robot;
    this.color = color;
    this.from = from;
    this.to = to;
    this.group = new THREE.Group();
    this.ghosts = [];
  }

  clear() {
    this.ghosts.forEach((g) => {
      this.group.remove(g);
      g.userData.material.dispose();
    });
    this.ghosts = [];
  }

  /* qs: joint vectors in path order; `shown` limits how many are visible (progressive reveal). */
  set(qs) {
    this.clear();
    const n = qs.length;
    qs.forEach((q, i) => {
      const t = n > 1 ? i / (n - 1) : 1;
      const mat = ghostMaterial(this.color, this.from + (this.to - this.from) * t);
      const g = this.robot.ghost(mat).setQ(q);
      g.userData.material = mat;
      g.userData.baseOpacity = mat.opacity;
      g.renderOrder = 1 + i;
      this.group.add(g);
      this.ghosts.push(g);
    });
    return this;
  }

  reveal(count) {
    this.ghosts.forEach((g, i) => { g.visible = i < count; });
  }

  fade(k) {
    this.ghosts.forEach((g) => {
      const m = g.userData.material;
      m.opacity = g.userData.baseOpacity * k;
      m.transparent = true;
      g.visible = k > 0.01;
    });
  }
}
