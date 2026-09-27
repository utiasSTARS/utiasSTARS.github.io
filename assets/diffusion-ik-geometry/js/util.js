/* Small DOM, data and formatting helpers shared by the page modules. */

export const ASSETS = "/assets/diffusion-ik-geometry/";
export const DATA = ASSETS + "data/";
const SVGNS = "http://www.w3.org/2000/svg";

export const COLORS = {
  ink: "#27262b",
  body: "#5c5962",
  muted: "#6f6b75",
  rule: "#e6e3e8",
  soft: "#f5f6fa",
  latent: "#5b3f9e",
  franka: "#2a4f7d",
  frankaLight: "#527299",
  ur5: "#6e1622",
  ur5Light: "#ca7981"
};

/* ghost = light robot colour mixed with 25% white, as the README and paper renders (viz.add_robot). */
export const ROBOT_COLOR = {
  franka: { main: COLORS.franka, light: COLORS.frankaLight, ghost: "#7d95b3", tint: "#e8eef6" },
  ur5: { main: COLORS.ur5, light: COLORS.ur5Light, ghost: "#d79ba0", tint: "#f7e9eb" }
};

export const reducedMotion = () =>
  !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

export function el(tag, attrs, parent) {
  const n = document.createElement(tag);
  for (const k in attrs || {}) {
    const v = attrs[k];
    if (v === undefined || v === null || v === false) continue;
    if (k === "text") n.textContent = v;
    else if (k === "html") n.innerHTML = v;
    else if (k === "class") n.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(n.style, v);
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  if (parent) parent.appendChild(n);
  return n;
}

export function sv(tag, attrs, parent) {
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs || {}) {
    const v = attrs[k];
    if (v === undefined || v === null) continue;
    if (k === "text") n.textContent = v;
    else n.setAttribute(k, v);
  }
  if (parent) parent.appendChild(n);
  return n;
}

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const wrapAngle = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
export const smooth = (t) => t * t * (3 - 2 * t);

/* A row of toggle buttons; exactly one is pressed. Items: {value, label, html, title, cls}. */
export function segmented(host, items, current, onPick, { label } = {}) {
  host.innerHTML = "";
  host.classList.add("dg-seg");
  host.setAttribute("role", "group");
  if (label) host.setAttribute("aria-label", label);
  let value = current;
  const buttons = items.map((it) => {
    const b = el("button", { type: "button", class: it.cls || "", title: it.title, "aria-pressed": String(it.value === current) }, host);
    if (it.html) b.innerHTML = it.html;
    else b.textContent = it.label;
    b.addEventListener("click", () => {
      if (b.disabled) return;
      set(it.value);
      onPick(it.value);
    });
    return b;
  });
  function set(v) {
    value = v;
    buttons.forEach((x, i) => x.setAttribute("aria-pressed", String(items[i].value === v)));
  }
  return { set, get: () => value, buttons };
}

const jsonCache = new Map();
export function fetchJSON(url) {
  if (!jsonCache.has(url)) {
    jsonCache.set(url, fetch(url).then((r) => {
      if (!r.ok) throw new Error(url + ": " + r.status);
      return r.json();
    }));
  }
  return jsonCache.get(url);
}

const binCache = new Map();
export function fetchF32(url) {
  if (!binCache.has(url)) {
    binCache.set(url, fetch(url).then((r) => {
      if (!r.ok) throw new Error(url + ": " + r.status);
      return r.arrayBuffer();
    }).then((b) => new Float32Array(b)));
  }
  return binCache.get(url);
}

/* Resolve true when a media file exists, without downloading it. */
const headCache = new Map();
export function mediaExists(url) {
  if (!headCache.has(url)) {
    headCache.set(url, fetch(url, { method: "HEAD" }).then((r) => r.ok && !/text\/html/.test(r.headers.get("content-type") || "")).catch(() => false));
  }
  return headCache.get(url);
}

export function fmt(x, digits = 2) {
  if (!isFinite(x)) return "–";
  return x.toFixed(digits);
}

/* Error with a sensible number of digits: 0.42, 3.1, 27. */
export function fmtErr(x) {
  if (!isFinite(x)) return "–";
  if (x < 1) return x.toFixed(2);
  if (x < 10) return x.toFixed(1);
  return x.toFixed(0);
}

let tip = null;
export function showTip(html, x, y) {
  if (!tip) tip = el("div", { class: "dg-tip", role: "tooltip" }, document.body);
  tip.innerHTML = html;
  tip.classList.add("on");
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let left = x + 14, top = y - h - 12;
  if (left + w > window.innerWidth - 8) left = x - w - 14;
  if (top < 8) top = y + 16;
  tip.style.left = Math.max(8, left) + "px";
  tip.style.top = top + "px";
}
export function hideTip() { if (tip) tip.classList.remove("on"); }

/* Run init(root) once the element comes within `margin` of the viewport. */
export function whenNear(root, init, margin = "400px") {
  if (!("IntersectionObserver" in window)) { init(root); return; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      init(root);
    }
  }, { rootMargin: margin });
  io.observe(root);
}

/* Show a friendly message in place of a widget that failed to start. */
export function failSoft(root, err, what) {
  console.warn(what, err);
  const box = el("div", { class: "dg-fail" });
  box.textContent = what + " could not be loaded in this browser.";
  root.appendChild(box);
}

export function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) {
    return false;
  }
}

/* Display names for superscripted math in plain text. */
export const TBAR = "t̄";
