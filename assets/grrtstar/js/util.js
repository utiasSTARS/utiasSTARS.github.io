/* Small DOM, data, colour and formatting helpers shared by the page modules.
 * Widgets may import anything exported here; util.js never imports a widget. */

export const ASSETS = "/assets/grrtstar/";
export const DATA = ASSETS + "data/";
const SVGNS = "http://www.w3.org/2000/svg";

/* The page palette (CONTRACT.md, "Look"). The same values are CSS custom properties on :root
 * (page.css), e.g. --gr-grrt, --gr-informed, --gr-start. */
export const COLORS = {
  ink: "#27262b",
  body: "#5c5962",
  muted: "#6f6b75",
  faint: "#9a96a1",
  rule: "#e6e3e8",
  hair: "#efedf1",
  surface: "#fcfcfb",
  soft: "#f5f6fa",
  accent: "#7253ed",        // keyboard focus ring only

  // G-RRT* and the greedy informed set: the paper's green, darkened to stay apart from AORRTC's amber
  // under protanopia. Green means "ours" everywhere on the page.
  grrt: "#4f9216",
  greedy: "#4f9216",
  greedyFill: "rgba(79,146,22,0.12)",     // drawn over white
  greenText: "#3f7d12",                   // small green text (5.1 to 1 on white); marks and fills keep grrt

  // Algorithm visuals, as in the paper's algorithm figures.
  treeStart: "#0b5dae",     // tree rooted at the start (blue)
  treeGoal: "#ce3e15",      // tree rooted at the goal (vermilion)
  path: "#e8a31a",          // the solution path (amber), 2.5 to 3 px over a 1 px white casing; never text
  pathEarlier: "#c9c3b8",   // an earlier solution shown for comparison (light warm grey)
  start: "#910021",         // start state (crimson)
  goal: "#4f9216",          // goal state (green)
  informed: "#8a8590",      // the informed set: dashed grey, 1.5 px, dash 5 4
  informedFill: "rgba(138,133,144,0.07)",
  obstacle: "#4a4752",      // dark charcoal, square corners (3D scenes keep their shaded grey)

  // Planners, as in the paper's figures (FCIT* is VAMP only and not in the paper).
  aorrtc: "#e8a31a",
  rrtc: "#1a1a1a",
  fcit: "#d1478b",
  rrtstar: "#910021",
  rrtstarConnect: "#c589e8",
  bitstar: "#0b5dae",
  aitstar: "#3bafec",
  eitstar: "#ee8866",
  blitstar: "#a6611a"
};

/* Chart text and lines for canvas charts (the same values as the --gr-* chart properties in page.css). */
export const CHART = { bg: "#fff", axis: "#e6e3e8", grid: "#efedf1", tick: "#6f6b75", tickSize: 11, label: "#27262b", labelSize: 12 };

/* Canvas font string in the page's font: ctx.font = chartFont(canvas) or chartFont(canvas, CHART.labelSize, 600). */
export function chartFont(node, px = CHART.tickSize, weight = 400) {
  return weight + " " + px + "px " + (getComputedStyle(node).fontFamily || "system-ui, sans-serif");
}

/* Planners of the VAMP benchmark, keyed as in the run records. dash: SVG stroke-dasharray, or null. */
export const PLANNERS = {
  grrt_new: { label: "G-RRT*", color: COLORS.grrt, dash: null },
  grrt_up: { label: "G-RRT* (previous VAMP version)", color: COLORS.grrt, dash: "5 4" },
  aorrtc: { label: "AORRTC", color: COLORS.aorrtc, dash: null },
  fcit: { label: "FCIT*", color: COLORS.fcit, dash: null },
  rrtc: { label: "RRT-Connect", color: COLORS.rrtc, dash: null }
};

/* Kept from the constraint-IK page for modules that still expect it. */
export const ROBOT_COLOR = {
  franka: { main: "#2a4f7d", light: "#527299", ghost: "#7d95b3", tint: "#e8eef6" },
  ur5: { main: "#6e1622", light: "#ca7981", ghost: "#d79ba0", tint: "#f7e9eb" }
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

/* A group of toggle buttons; exactly one is pressed (aria-pressed). Items: {value, label, html, title, cls}.
 * segmented() is the .gr-seg control (up to six short options), chips() the wrapping .gr-chips list.
 * Both return {set(value), get(), buttons}; set() does not call onPick. An item's title becomes a kit
 * tooltip (hint()), not a native title attribute. */
function pickGroup(cls, host, items, current, onPick, { label } = {}) {
  host.innerHTML = "";
  host.classList.add(cls);
  host.setAttribute("role", "group");
  if (label) host.setAttribute("aria-label", label);
  let value = current;
  const buttons = items.map((it) => {
    const b = el("button", { type: "button", class: it.cls || "", "aria-pressed": String(it.value === current) }, host);
    if (it.html) b.innerHTML = it.html;
    else b.textContent = it.label;
    if (it.title) hint(b, it.title);
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
export function segmented(host, items, current, onPick, opts) { return pickGroup("gr-seg", host, items, current, onPick, opts); }
export function chips(host, items, current, onPick, opts) { return pickGroup("gr-chips", host, items, current, onPick, opts); }

/* The one transport button (.gr-play) with its three icons. The state names what a press will do:
 * "play" (shown while paused), "pause" (shown while running), "replay" (shown at the end).
 * `what` completes the aria-label ("Play the search"). Returns the <button>, with setState(state) and
 * getState(); onClick(state, button) receives the state at the time of the press. */
const PLAY_ICONS =
  '<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
  '<svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>' +
  '<svg class="i-replay" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>';
const PLAY_VERB = { play: "Play", pause: "Pause", replay: "Replay" };
export function playButton({ what = "", state = "play", onClick, parent } = {}) {
  const b = el("button", { type: "button", class: "gr-play", html: PLAY_ICONS }, parent);
  b.setState = (st) => {
    b.dataset.state = st;
    b.setAttribute("aria-label", PLAY_VERB[st] + (what ? " " + what : ""));
    return b;
  };
  b.getState = () => b.dataset.state;
  b.setState(state);
  if (onClick) b.addEventListener("click", () => onClick(b.dataset.state, b));
  return b;
}

/* Keep the filled part of a .gr-range in step with its value. Call the returned function after setting
 * input.value from code (input events from the reader are handled).
 * It also guards against touch scrolling: a finger that lands on the track moves the thumb at once, and
 * when the gesture turns into a page scroll the browser cancels the pointer. The value then returns to
 * where it was, with an input event, so a vertical swipe never changes a value. */
export function rangeFill(input) {
  const sync = () => {
    const min = input.min === "" ? 0 : +input.min, max = input.max === "" ? 100 : +input.max;
    const p = max > min ? (100 * (+input.value - min)) / (max - min) : 0;
    input.style.setProperty("--gr-fill", clamp(p, 0, 100).toFixed(2) + "%");
  };
  input.addEventListener("input", sync);
  let held = null;
  input.addEventListener("pointerdown", (e) => { held = e.pointerType === "touch" ? input.value : null; });
  input.addEventListener("pointerup", () => { held = null; });
  input.addEventListener("pointercancel", () => {
    const before = held;
    held = null;
    if (before === null || before === input.value) return;
    input.value = before;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  sync();
  return sync;
}

/* Call fn at most once every `ms` (the last call always lands). throttled.flush() runs a pending call now. */
export function throttle(fn, ms = 100) {
  let last = -Infinity, timer = 0, args = null;
  const run = () => {
    timer = 0;
    last = performance.now();
    const a = args;
    args = null;
    fn(...a);
  };
  const wrapped = (...a) => {
    args = a;
    const wait = last + ms - performance.now();
    if (wait <= 0) { if (timer) clearTimeout(timer); run(); }
    else if (!timer) timer = setTimeout(run, wait);
  };
  wrapped.flush = () => { if (timer) { clearTimeout(timer); run(); } };
  return wrapped;
}

/* A text readout that changes at most ten times per second while something animates:
 * const set = liveText(node); set("iteration 412"); set.html(MATH.ci + " = 1.73"); set.flush() at the end. */
export function liveText(node, ms = 100) {
  let shown = null;
  const write = throttle((str, html) => {
    if (str === shown) return;
    shown = str;
    if (html) node.innerHTML = str;
    else node.textContent = str;
  }, ms);
  const set = (str) => write(String(str), false);
  set.html = (str) => write(String(str), true);
  set.flush = write.flush;
  return set;
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

export function fmt(x, digits = 2) {
  if (!isFinite(x)) return "–";
  return x.toFixed(digits);
}

/* A number with a sensible count of digits: 0.42, 3.1, 27. */
export function fmtErr(x) {
  if (!isFinite(x)) return "–";
  if (x < 1) return x.toFixed(2);
  if (x < 10) return x.toFixed(1);
  return x.toFixed(0);
}

/* The page's number format, for labels, readouts, tables and tooltips alike. With `sig` significant
 * digits: plain decimals from 0.01 up (0.061, 0.14, 1.7, 124), whole numbers with thousands separators
 * from 1,000 up (1,140, 52,400), and a power of ten below 0.01 and from a million up (6.1 × 10⁻³,
 * 3.9 × 10⁶). Infinity gives ∞ and NaN an en dash. fmtNum() returns plain text (canvas, aria-label,
 * textContent) with Unicode superscripts. fmtNumHTML() returns HTML with a real superscript
 * (<span class="gr-num">6.1 × 10<sup>−3</sup></span>, in the font of the numbers around it), for
 * anything shown as HTML. After a power of ten write "times", not "×" ("3.9 × 10⁶ times fewer"). */
const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
function numParts(x, sig) {
  if (x === 0) return { text: "0" };
  if (x === null || x === undefined || Number.isNaN(x)) return { text: "–" };
  const neg = x < 0 ? "−" : "", a = Math.abs(x);
  if (!isFinite(a)) return { text: neg + "∞" };
  let e = Math.floor(Math.log10(a));
  if (a < 0.01 || a >= 999999.5) {
    let m = (a / 10 ** e).toFixed(sig - 1);
    if (+m >= 10) { e += 1; m = (1).toFixed(sig - 1); }
    return { neg, m, e };
  }
  if (a >= 999.5) return { text: neg + Math.round(a).toLocaleString("en-US") };
  return { text: neg + a.toFixed(Math.max(0, sig - 1 - e)) };
}
export function fmtNum(x, sig = 2) {
  const p = numParts(x, sig);
  return p.text !== undefined ? p.text : p.neg + p.m + "\u00a0×\u00a010" + String(p.e).split("").map((c) => SUP[c]).join("");
}
export function fmtNumHTML(x, sig = 2) {
  const p = numParts(x, sig);
  if (p.text !== undefined) return p.text;
  return '<span class="gr-num">' + p.neg + p.m + "\u00a0×\u00a010<sup>" + String(p.e).replace("-", "−") + "</sup></span>";
}

/* The shared tooltip (.gr-tip, a white card). x and y are viewport coordinates of the pointer. It stays
 * inside the viewport: left of the pointer near the right edge, below it near the top.
 * {wide: true} lifts the 17rem cap for readouts with many rows. */
let tip = null;
export function showTip(html, x, y, { wide = false } = {}) {
  if (!tip) tip = el("div", { class: "gr-tip", role: "tooltip" }, document.body);
  tip.classList.toggle("wide", wide);
  tip.innerHTML = html;
  tip.classList.add("on");
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let left = x + 14, top = y - h - 12;
  if (left + w > window.innerWidth - 8) left = x - w - 14;
  if (top < 8) top = y + 16;
  tip.style.left = clamp(left, 8, Math.max(8, window.innerWidth - w - 8)) + "px";
  tip.style.top = clamp(top, 8, Math.max(8, window.innerHeight - h - 8)) + "px";
}
export function hideTip() { if (tip) tip.classList.remove("on"); }

/* A hint on a control, through the kit tooltip instead of a native title: shown while a mouse is over
 * the control and while it has keyboard focus. `text` is a string or a function that returns one (plain
 * text). The text also becomes the control's aria-description, unless {describe: false}. */
export function hint(node, text, { describe = true } = {}) {
  const get = () => String(typeof text === "function" ? text() : text);
  const html = () => get().replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const mouse = (e) => { if (e.pointerType === "mouse") showTip(html(), e.clientX, e.clientY); };
  node.addEventListener("pointerenter", mouse);
  node.addEventListener("pointermove", mouse);
  node.addEventListener("pointerleave", hideTip);
  node.addEventListener("pointerdown", hideTip);
  node.addEventListener("focus", () => {
    if (!node.matches(":focus-visible")) return;
    const r = node.getBoundingClientRect();
    showTip(html(), r.left + r.width / 2 - 14, r.top);
  });
  node.addEventListener("blur", hideTip);
  node.addEventListener("keydown", (e) => { if (e.key === "Escape") hideTip(); });
  if (describe && typeof text !== "function") node.setAttribute("aria-description", get());
  return node;
}

/* Rows of a <table class="gr-table selectable"> as radio options: the body becomes a radiogroup, each
 * row a radio with aria-checked, one tab stop, arrow keys, Home and End to move, Space or Enter to
 * choose. rows: the <tr> elements; values: one per row. Returns {set(value), get()}; set() does not
 * call onPick. */
export function radioRows(rows, values, current, onPick, { label } = {}) {
  rows = [...rows];
  const body = rows[0] && rows[0].parentNode;
  if (!body) return { set() {}, get: () => current };
  body.setAttribute("role", "radiogroup");
  if (label) body.setAttribute("aria-label", label);
  let value = current;
  const set = (v) => {
    value = v;
    rows.forEach((r, i) => {
      const on = values[i] === v;
      r.setAttribute("aria-checked", String(on));
      r.tabIndex = on ? 0 : -1;
    });
    if (!values.includes(v) && rows[0]) rows[0].tabIndex = 0;
  };
  const pick = (i, focus) => {
    if (i < 0 || i >= rows.length || rows[i].getAttribute("aria-disabled") === "true") return;
    const changed = values[i] !== value;
    set(values[i]);
    if (focus) rows[i].focus();
    if (changed) onPick(values[i]);
  };
  rows.forEach((r, i) => {
    r.setAttribute("role", "radio");
    r.addEventListener("click", () => pick(i, false));
    r.addEventListener("keydown", (e) => {
      const k = e.key;
      const to = k === "ArrowDown" || k === "ArrowRight" ? i + 1 : k === "ArrowUp" || k === "ArrowLeft" ? i - 1
        : k === "Home" ? 0 : k === "End" ? rows.length - 1 : k === " " || k === "Enter" ? i : null;
      if (to === null) return;
      e.preventDefault();
      pick((to + rows.length) % rows.length, true);
    });
  });
  set(current);
  return { set, get: () => value };
}

/* Run init(root) once the element comes within `margin` of the viewport. Returns a function that runs it now. */
export function whenNear(root, init, margin = "400px") {
  let io = null, done = false;
  const run = () => {
    if (done) return;
    done = true;
    if (io) io.disconnect();
    init(root);
  };
  if (!("IntersectionObserver" in window)) { run(); return run; }
  io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) run(); }, { rootMargin: margin });
  io.observe(root);
  return run;
}

/* Call onChange(true) while `node` is on screen and the tab is visible, onChange(false) otherwise.
 * For animations that must stop off screen. Returns a function that stops watching. */
export function whileVisible(node, onChange, margin = "0px") {
  let onScreen = false, shown = !document.hidden, last = null;
  const emit = () => {
    const v = onScreen && shown;
    if (v !== last) { last = v; onChange(v); }
  };
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((es) => { onScreen = es[es.length - 1].isIntersecting; emit(); }, { rootMargin: margin })
    : null;
  if (io) io.observe(node); else { onScreen = true; emit(); }
  const vis = () => { shown = !document.hidden; emit(); };
  document.addEventListener("visibilitychange", vis);
  return () => { if (io) io.disconnect(); document.removeEventListener("visibilitychange", vis); };
}

/* Show a quiet message in place of a widget that failed to start. Over a positioned root it covers the
 * root; otherwise it takes its own place in the flow. */
export function failSoft(root, err, what) {
  console.warn(what, err);
  const box = el("div", { class: "gr-fail", role: "status" });
  if (getComputedStyle(root).position !== "static" && root.clientHeight > 40) box.classList.add("gr-fail-over");
  box.textContent = (what || "This figure") + " could not be loaded in this browser.";
  root.appendChild(box);
  return box;
}

export function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) {
    return false;
  }
}

export function wasmAvailable() {
  try {
    return typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function";
  } catch (e) {
    return false;
  }
}

/* Math. The page's fixed formulas are typeset into the HTML ahead of time (_tools/grrtstar/page/
 * prerender_math.mjs), so they need only the KaTeX stylesheet, which main.js adds when a formula or a
 * widget comes near. Widget text uses mathHTML() or MATH below: plain HTML in the same fonts, no script.
 * loadKatex() fetches the KaTeX script on its first call only, for math that mathHTML() cannot set. */
const KATEX = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/";
export function loadKatexCss() {
  if (!document.querySelector('link[data-gr="katex"]')) {
    el("link", { rel: "stylesheet", href: KATEX + "katex.min.css", crossorigin: "anonymous", "data-gr": "katex" }, document.head);
  }
}
let katexPromise = null;
export function loadKatex() {
  if (window.katex) return Promise.resolve(window.katex);
  if (!katexPromise) {
    katexPromise = new Promise((resolve, reject) => {
      loadKatexCss();
      const s = el("script", { src: KATEX + "katex.min.js", crossorigin: "anonymous", async: true }, document.head);
      s.onload = () => (window.katex ? resolve(window.katex) : reject(new Error("KaTeX missing")));
      s.onerror = () => { katexPromise = null; reject(new Error("KaTeX failed to load")); };
    });
  }
  return katexPromise;
}

/* A small subset of TeX as plain HTML in a <span class="gr-m"> that matches the page's KaTeX:
 * letters, digits, + - = < > / ( ) , | and spaces; _x ^x _{..} ^{..}; \hat f; \mathbf{x};
 * \mathrm{..} and \text{..}; \max \min; \mathbb{R}; \le \ge \times \cdot \in \approx \to \infty;
 * Greek (\epsilon \varepsilon \rho \gamma \pi \eta \alpha \beta \lambda \mu \sigma); \, for a thin space.
 * mathHTML("\\hat f(\\mathbf{x}_{\\max}) \\le c_i"). A minus at the start of a group or after an operator is a
 * sign (10^{-3}). Anything else is shown as typed. */
const GREEK = { epsilon: "ϵ", varepsilon: "ε", rho: "ρ", gamma: "γ", pi: "π", eta: "η", alpha: "α", beta: "β", lambda: "λ", mu: "μ", sigma: "σ" };
const OPS = { le: "≤", ge: "≥", times: "×", cdot: "·", in: "∈", approx: "≈", to: "→", "=": "=", "<": "<", ">": ">", "+": "+", "-": "−" };
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const rm = (t) => '<span class="rm">' + t + "</span>";
function mathInner(src) {
  let i = 0, out = "", unary = true;          // unary: a minus here is a sign, not an operator
  const group = () => {                       // a {..} group or a single token, as a source string
    while (src[i] === " ") i++;
    if (src[i] === "{") {
      let d = 0;
      const a = i + 1;
      for (; i < src.length; i++) {
        if (src[i] === "{") d++;
        else if (src[i] === "}" && --d === 0) break;
      }
      return src.slice(a, i++);
    }
    if (src[i] === "\\") {
      const m = /^\\[a-zA-Z]+|^\\./.exec(src.slice(i));
      i += m[0].length;
      return m[0];
    }
    return src[i++] || "";
  };
  while (i < src.length) {
    const c = src[i];
    if (c === " ") { i++; continue; }
    if (c === "-" && unary) { i++; out += rm("−"); unary = false; continue; }
    const wasOp = "=<>+-(".includes(c) || /^\\(le|ge|times|cdot|in|approx|to)\b/.test(src.slice(i));
    if (c === "_" || c === "^") {
      i++;
      const g = group();
      out += (c === "_" ? "<sub>" : "<sup>") + mathInner(g) + (c === "_" ? "</sub>" : "</sup>");
    } else if (c === "{") {
      out += mathInner(group());
    } else if (c === "\\") {
      const m = /^\\([a-zA-Z]+)|^\\(.)/.exec(src.slice(i));
      i += m[0].length;
      const name = m[1] || m[2];
      if (name === "hat") out += '<span class="hat">' + mathInner(group()) + "</span>";
      else if (name === "mathbf") out += "<b>" + esc(group()) + "</b>";
      else if (name === "mathrm" || name === "text") out += rm(esc(group()));
      else if (name === "mathbb") out += '<span class="bb">' + ({ R: "ℝ", N: "ℕ", Z: "ℤ" }[group()] || "") + "</span>";
      else if (name === "max" || name === "min") out += rm(name);
      else if (name === "infty") out += rm("∞");
      else if (name === ",") out += "\u2009";
      else if (GREEK[name]) out += GREEK[name];
      else if (OPS[name]) out += rm("\u2005" + OPS[name] + "\u2005");
      else out += esc(m[0]);
    } else if ("=<>+-".includes(c)) {
      i++;
      out += rm("\u2005" + OPS[c] + "\u2005");
    } else if (/[0-9.,()|\/\[\]:;!]/.test(c)) {
      let t = "";
      while (i < src.length && /[0-9.,()|\/\[\]:;!]/.test(src[i])) t += src[i++];
      out += rm(esc(t));
    } else {
      out += esc(c);
      i++;
    }
    unary = wasOp;
  }
  return out;
}
const mathCache = new Map();
export function mathHTML(src) {
  let html = mathCache.get(src);
  if (html === undefined) {
    html = '<span class="gr-m">' + mathInner(src) + "</span>";
    mathCache.set(src, html);
  }
  return html;
}

/* The symbols the widgets share, as HTML strings: node.innerHTML = MATH.ci + " = 1.73". */
export const MATH = {
  ci: mathHTML("c_i"),                                   // cost of the current path
  cmin: mathHTML("c_{\\min}"),                           // straight-line cost from start to goal
  fhat: mathHTML("\\hat f"),
  fmax: mathHTML("\\hat f(\\mathbf{x}_{\\max})"),        // greedy cost bound
  xmax: mathHTML("\\mathbf{x}_{\\max}"),
  xI: mathHTML("\\mathbf{x}_I"),
  xG: mathHTML("\\mathbf{x}_G"),
  eps: mathHTML("\\epsilon"),                            // greedy biasing ratio, as in the paper
  rho: mathHTML("\\rho"),
  n: mathHTML("n"),
  R: (n) => mathHTML("\\mathbb{R}^{" + n + "}")
};

/* Math as an HTML string: KaTeX when its script has been loaded (loadKatex()), mathHTML() otherwise. */
const texCache = new Map();
export function tex(src, display = false) {
  if (!window.katex) return mathHTML(src);
  const key = (display ? "D" : "I") + src;
  let html = texCache.get(key);
  if (html === undefined) {
    html = window.katex.renderToString(src, { throwOnError: false, displayMode: display, output: "htmlAndMathml" });
    texCache.set(key, html);
  }
  return html;
}

/* Typeset every [data-tex] element under root with KaTeX (fetches the script). The page itself no
 * longer needs this, since its formulas are typeset ahead of time. */
export function renderMath(root) {
  return loadKatex().then((katex) => {
    root.querySelectorAll("[data-tex]").forEach((n) => {
      if (n.dataset.texDone) return;
      try {
        katex.render(n.dataset.tex, n, { throwOnError: false, displayMode: n.hasAttribute("data-display"), output: "htmlAndMathml" });
        n.dataset.texDone = "1";
      } catch (e) { /* keep the fallback */ }
    });
  });
}

/* Display names for superscripted math in plain text. */
export const TBAR = "t̄";
