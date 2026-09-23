/* Induced Riemannian Metrics for Motion Planning with Constraints: page script.
 *
 * Kept in its own file because the site layout compresses HTML whitespace,
 * which would turn any inline line comment into a comment on the rest of the
 * script.  Every number below comes from the paper's tables.
 */
(function () {
  "use strict";

  // ------------------------------------------------------------------ data

  var TASKS = [
    { key: "bottom_middle", short: "B→M", long: "Bottom to middle" },
    { key: "bottom_top", short: "B→T", long: "Bottom to top" },
    { key: "middle_bottom", short: "M→B", long: "Middle to bottom" },
    { key: "middle_top", short: "M→T", long: "Middle to top" },
    { key: "top_bottom", short: "T→B", long: "Top to bottom" },
    { key: "top_middle", short: "T→M", long: "Top to middle" }
  ];

  // Paper palette for light surfaces, video palette for the dark stage.
  var METRICS = {
    flat: { name: "flat", paper: "#c65a24", stage: "#e0781e" },
    euclidean: { name: "Euclidean", paper: "#2568a3", stage: "#4a9eff" },
    kinetic: { name: "kinetic-energy", paper: "#16866d", stage: "#35b37e" }
  };
  var ORDER = ["flat", "euclidean", "kinetic"];

  // Hardware results: median over five trials, columns in TASKS order.
  var HW = {
    dur: {
      flat: [14.11, 20.97, 14.12, 12.89, 20.97, 12.94],
      euclidean: [12.19, 12.63, 12.19, 10.20, 12.60, 10.24],
      kinetic: [14.33, 14.81, 14.33, 13.23, 14.75, 13.25]
    },
    len: {
      flat: [6.64, 9.56, 6.64, 7.33, 9.56, 7.33],
      euclidean: [5.03, 7.38, 5.04, 5.91, 7.38, 5.91],
      kinetic: [6.60, 9.06, 6.60, 7.94, 9.06, 7.93]
    },
    ke: {
      flat: [0.281, 0.382, 0.281, 0.295, 0.382, 0.295],
      euclidean: [0.266, 0.443, 0.266, 0.309, 0.444, 0.309],
      kinetic: [0.158, 0.320, 0.158, 0.124, 0.320, 0.124]
    }
  };

  // Planning and trajectory optimization: median induced lengths over 50 trials.
  var SIM = {
    sbp_imp: {
      label: "Planner, implicit",
      note: "Sampling-based planner in the implicit representation, 10 s anytime budget.",
      euc: { euclidean: [4.08, 5.79, 4.06, 4.70, 5.78, 4.70], kinetic: [4.29, 6.05, 4.27, 5.05, 6.02, 4.96] },
      ke: { euclidean: [2.63, 3.48, 2.66, 2.62, 3.55, 2.71], kinetic: [2.67, 3.49, 2.65, 2.66, 3.47, 2.62] }
    },
    sbp_exp: {
      label: "Planner, explicit",
      note: "Sampling-based planner in the explicit representation, 10 s anytime budget.",
      euc: { flat: [4.48, 6.22, 4.54, 5.01, 6.38, 4.93], euclidean: [3.90, 5.85, 3.90, 4.60, 5.88, 4.58], kinetic: [4.76, 6.95, 4.73, 5.97, 6.94, 5.94] },
      ke: { flat: [2.78, 3.81, 2.82, 2.82, 3.87, 2.76], euclidean: [2.66, 3.68, 2.67, 2.74, 3.70, 2.72], kinetic: [2.54, 3.60, 2.53, 2.44, 3.66, 2.37] }
    },
    to_exp: {
      label: "Optimizer, explicit seeds",
      note: "Trajectory optimizer in the explicit representation, seeded from the explicit motions.",
      euc: { flat: [4.76, 7.01, 4.76, 5.46, 7.01, 5.46], euclidean: [3.57, 5.21, 3.57, 4.18, 5.21, 4.18], kinetic: [4.66, 6.43, 4.66, 5.62, 6.42, 5.62] },
      ke: { flat: [2.83, 3.98, 2.82, 2.93, 3.98, 2.93], euclidean: [2.48, 3.27, 2.48, 2.49, 3.27, 2.48], kinetic: [2.05, 2.64, 2.05, 1.63, 2.64, 1.63] }
    },
    to_imp: {
      label: "Optimizer, implicit seeds",
      note: "Trajectory optimizer in the explicit representation, seeded from the implicit motions.",
      euc: { euclidean: [3.57, 5.21, 3.57, 4.18, 5.21, 4.18], kinetic: [4.65, 6.42, 4.65, 5.62, 6.42, 5.62] },
      ke: { euclidean: [2.48, 3.26, 2.48, 2.48, 3.27, 2.48], kinetic: [2.05, 2.64, 2.05, 1.63, 2.64, 1.63] }
    }
  };
  var MEASURES = { euc: "Induced Euclidean length", ke: "Induced kinetic-energy length" };

  var ASSETS = "/assets/induced-metrics/";
  var LEAD = 0.4;   // the lead the supplementary video puts before each motion
  var HOLD = 2.5;   // pause on the final bars before the player loops

  // ------------------------------------------------------------------ helpers

  var SVGNS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) {
    var n = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(n);
    return n;
  }
  function sv(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs || {}) {
      if (k === "text") n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(n);
    return n;
  }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function min(a) { return Math.min.apply(null, a); }
  function max(a) { return Math.max.apply(null, a); }

  /* A row of toggle buttons in which exactly one is pressed. */
  function segmented(host, items, current, onPick) {
    host.innerHTML = "";
    var buttons = items.map(function (it) {
      var b = el("button", { type: "button", text: it.label, "aria-pressed": String(it.value === current) }, host);
      if (it.title) b.title = it.title;
      b.addEventListener("click", function () {
        buttons.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        onPick(it.value);
      });
      return b;
    });
    return {
      set: function (value) {
        buttons.forEach(function (x, i) { x.setAttribute("aria-pressed", String(items[i].value === value)); });
      }
    };
  }

  var tip = null;
  function showTip(html, x, y) {
    if (!tip) tip = el("div", { class: "im-tip", role: "tooltip" }, document.body);
    tip.innerHTML = html;
    tip.classList.add("on");
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = x + 14, top = y - h - 12;
    if (left + w > window.innerWidth - 8) left = x - w - 14;
    if (top < 8) top = y + 16;
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }
  function hideTip() { if (tip) tip.classList.remove("on"); }

  // ------------------------------------------------------------------ math

  var MACROS = { "\\mat": "\\boldsymbol{\\mathbf{#1}}" };
  function renderMath() {
    if (!window.renderMathInElement) return;
    window.renderMathInElement(document.querySelector(".im"), {
      delimiters: [
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false }
      ],
      macros: MACROS,
      throwOnError: false
    });
  }
  function tex(node, src) {
    if (window.katex) window.katex.render(src, node, { macros: MACROS, throwOnError: false });
    else node.textContent = src;
  }

  // ------------------------------------------------------------------ 3-vectors

  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function mul(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(a) { return Math.sqrt(dot(a, a)); }
  function matvec(M, v) { return [dot(M[0], v), dot(M[1], v), dot(M[2], v)]; }

  /* Symmetric 2x2 eigendecomposition: values ascending, unit vectors. */
  function eig2(a, b, c) {
    var tr = a + c, det = a * c - b * b;
    var disc = Math.sqrt(Math.max(tr * tr / 4 - det, 0));
    var l1 = tr / 2 - disc, l2 = tr / 2 + disc;
    var v1 = Math.abs(b) > 1e-12 ? [l1 - c, b] : (a <= c ? [1, 0] : [0, 1]);
    var n1 = Math.hypot(v1[0], v1[1]);
    v1 = [v1[0] / n1, v1[1] / n1];
    return { l: [l1, l2], v: [v1, [-v1[1], v1[0]]] };
  }

  // ------------------------------------------------------------------ diagram

  /* A toy constraint surface in R^3 with a nonlinear parameterization, drawn
   * from the same formulas the paper states: G_Q = B^T G B, g = Phi^T G Phi,
   * R = B^T Phi, and g = R^T G_Q R. */
  function initDiagram(root) {
    var svg = root.querySelector("[data-role=svg]");
    var readout = root.querySelector("[data-role=readout]");
    var state = { u: [0.35, -0.2], metric: "varying" };

    // Math labels are KaTeX in an HTML layer over the SVG, so the figure uses
    // the same math font and notation as the text.  Positions are given in
    // viewBox units and converted to percentages of the box.
    var VBW = 760, VBH = 330;
    var box = el("div", { class: "svgbox" });
    svg.parentNode.insertBefore(box, svg);
    box.appendChild(svg);
    var layer = el("div", { class: "labels", "aria-hidden": "true" }, box);
    var labels = {};
    function mlabel(key, parts, x, y, anchor, cls) {
      var n = labels[key];
      if (!n) {
        n = labels[key] = el("span", { class: "lab" + (cls ? " " + cls : "") }, layer);
        parts.forEach(function (part) {
          if (typeof part === "string") n.appendChild(document.createTextNode(part));
          else tex(el("span", {}, n), part.m);
        });
      }
      n.style.left = (100 * x / VBW).toFixed(3) + "%";
      n.style.top = (100 * y / VBH).toFixed(3) + "%";
      n.setAttribute("data-anchor", anchor || "middle");
    }

    function phi(u1, u2) {
      return [
        1.15 * u1 + 0.18 * u1 * u1 * u1,
        0.95 * u2 + 0.14 * u1 * u2,
        0.42 * Math.sin(1.6 * u1 + 0.4) * Math.cos(1.1 * u2) + 0.2 * u2 * u2
      ];
    }
    function dphi(u1, u2) {
      var h = 1e-5;
      var a = phi(u1 + h, u2), b = phi(u1 - h, u2), c = phi(u1, u2 + h), d = phi(u1, u2 - h);
      return [mul(sub(a, b), 1 / (2 * h)), mul(sub(c, d), 1 / (2 * h))];
    }
    function ambient(q) {
      if (state.metric === "euclidean") return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      // Positive definite and varying with q: I scaled, plus a rank-one term
      // whose direction turns with the configuration.
      var ang = 1.5 * q[0] + 0.7;
      var a = [Math.cos(ang), Math.sin(ang), 0.45];
      var s = 4.5 + 2.0 * Math.sin(1.3 * q[1]);
      return [0, 1, 2].map(function (i) {
        return [0, 1, 2].map(function (j) { return (i === j ? 0.55 : 0) + s * a[i] * a[j]; });
      });
    }

    var YAW = -0.5, PITCH = 0.62, CX = 0, CY = 0, S = 1;
    function proj(p) {
      var x = p[0] * Math.cos(YAW) - p[1] * Math.sin(YAW);
      var y = p[0] * Math.sin(YAW) + p[1] * Math.cos(YAW);
      return {
        x: CX + S * x,
        y: CY - S * (p[2] * Math.cos(PITCH) + y * Math.sin(PITCH)),
        d: y * Math.cos(PITCH) - p[2] * Math.sin(PITCH)
      };
    }

    // Fit the surface into the right-hand part of the figure.
    (function fit() {
      var xs = [], ys = [];
      for (var a = 0; a <= 20; a++) for (var b = 0; b <= 20; b++) {
        var p = proj(phi(-1 + a / 10, -1 + b / 10));
        xs.push(p.x); ys.push(p.y);
      }
      var bx0 = 330, bx1 = 700, by0 = 70, by1 = 300;
      S = Math.min((bx1 - bx0) / (max(xs) - min(xs)), (by1 - by0) / (max(ys) - min(ys)));
      CX = (bx0 + bx1) / 2 - S * (max(xs) + min(xs)) / 2;
      CY = (by0 + by1) / 2 - S * (max(ys) + min(ys)) / 2;
    })();

    var UX = 30, UY = 100, US = 172;
    function toPx(u) { return { x: UX + (u[0] + 1) / 2 * US, y: UY + (1 - (u[1] + 1) / 2) * US }; }
    function fromPx(x, y) { return [clamp((x - UX) / US * 2 - 1, -0.92, 0.92), clamp(1 - (y - UY) / US * 2, -0.92, 0.92)]; }

    svg.innerHTML = "";
    var defs = sv("defs", {}, svg);
    [["ink", "#27262b"], ["acc", "#7253ed"], ["mut", "#87848d"]].forEach(function (m) {
      var mk = sv("marker", { id: "im-arrow-" + m[0], viewBox: "0 0 10 10", refX: "8.5", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" }, defs);
      sv("path", { d: "M0,0 L10,5 L0,10 z", fill: m[1] }, mk);
    });

    // Parameter domain: square grid, flat.
    var gU = sv("g", {}, svg);
    sv("rect", { x: UX, y: UY, width: US, height: US, fill: "#fbfbfd", stroke: "#c9c6ce", "stroke-width": 1, rx: 2 }, gU);
    for (var i = 1; i < 8; i++) {
      var t = UX + i * US / 8, s = UY + i * US / 8;
      sv("line", { x1: t, y1: UY, x2: t, y2: UY + US, stroke: "#e6e3e8" }, gU);
      sv("line", { x1: UX, y1: s, x2: UX + US, y2: s, stroke: "#e6e3e8" }, gU);
    }
    mlabel("U", [{ m: "\\mathcal{U} \\subseteq \\mathbb{R}^{d}" }], UX, 20, "start", "big");
    mlabel("Uname", ["parameter domain"], UX, 42, "start", "note");
    var kU = sv("g", { transform: "translate(" + UX + "," + (UY + US + 24) + ")" }, gU);
    sv("line", { x1: 0, y1: -4, x2: 16, y2: -4, stroke: "#87848d", "stroke-width": 1.2, "stroke-dasharray": "4 3" }, kU);
    mlabel("flat", ["flat unit circle"], UX + 22, UY + US + 20, "start", "note");
    sv("line", { x1: 108, y1: -4, x2: 124, y2: -4, stroke: "#7253ed", "stroke-width": 1.6 }, kU);
    mlabel("gu", ["unit ellipse of ", { m: "g(u)" }], UX + 130, UY + US + 20, "start", "note");

    // The map.
    var gA = sv("g", {}, svg);
    sv("path", { d: "M222,186 C250,166 276,166 304,182", fill: "none", stroke: "#87848d", "stroke-width": 1.6, "marker-end": "url(#im-arrow-mut)" }, gA);
    mlabel("phi", [{ m: "\\varphi" }], 263, 156, "middle", "big");

    // Surface, drawn once: shaded quads sorted back to front, then the image of the grid.
    var gS = sv("g", {}, svg);
    var N = 18, quads = [];
    var light = [0.35, -0.45, 0.82];
    light = mul(light, 1 / norm(light));
    for (var a = 0; a < N; a++) {
      for (var b = 0; b < N; b++) {
        var u0 = -1 + 2 * a / N, u1 = -1 + 2 * (a + 1) / N, v0 = -1 + 2 * b / N, v1 = -1 + 2 * (b + 1) / N;
        var P = [phi(u0, v0), phi(u1, v0), phi(u1, v1), phi(u0, v1)];
        var n = cross(sub(P[1], P[0]), sub(P[3], P[0]));
        var shade = 0.5 + 0.5 * Math.abs(dot(n, light)) / (norm(n) || 1);
        var pp = P.map(proj);
        quads.push({ pts: pp, d: (pp[0].d + pp[1].d + pp[2].d + pp[3].d) / 4, shade: shade });
      }
    }
    quads.sort(function (p, q) { return q.d - p.d; });
    quads.forEach(function (q) {
      var c = Math.round(226 + 26 * q.shade);
      var col = "rgb(" + (c - 4) + "," + (c - 2) + "," + c + ")";
      sv("polygon", {
        points: q.pts.map(function (p) { return p.x.toFixed(1) + "," + p.y.toFixed(1); }).join(" "),
        fill: col, stroke: col, "stroke-width": 0.6
      }, gS);
    });
    for (var k = 0; k <= 8; k++) {
      var c1 = -1 + 2 * k / 8, pa = [], pb = [];
      for (var m = 0; m <= 40; m++) {
        var w = -1 + 2 * m / 40;
        var A = proj(phi(c1, w)), B = proj(phi(w, c1));
        pa.push(A.x.toFixed(1) + "," + A.y.toFixed(1));
        pb.push(B.x.toFixed(1) + "," + B.y.toFixed(1));
      }
      sv("polyline", { points: pa.join(" "), fill: "none", stroke: "#b9b6c0", "stroke-width": 0.8 }, gS);
      sv("polyline", { points: pb.join(" "), fill: "none", stroke: "#b9b6c0", "stroke-width": 0.8 }, gS);
    }
    mlabel("Q", [{ m: "\\mathcal{Q} \\subset \\mathcal{M}" }], 742, 20, "end", "big");
    mlabel("Qname", ["constraint submanifold"], 742, 42, "end", "note");

    // Dynamic layers.
    var gUdyn = sv("g", {}, svg);
    var gQdyn = sv("g", {}, svg);

    function arrow(parent, p0, p1, color, width, dash) {
      var attrs = { x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y, stroke: color, "stroke-width": width, "stroke-linecap": "round" };
      if (dash) attrs["stroke-dasharray"] = dash;
      attrs["marker-end"] = "url(#im-arrow-ink)";
      return sv("line", attrs, parent);
    }

    function draw() {
      var u = state.u;
      var q = phi(u[0], u[1]);
      var J = dphi(u[0], u[1]);         // columns of Phi
      var o1 = mul(J[0], 1 / norm(J[0]));
      var t2 = sub(J[1], mul(o1, dot(J[1], o1)));
      var o2 = mul(t2, 1 / norm(t2));
      // B: any orthonormal basis of the tangent space works; turning it 35 degrees
      // away from the first column of Phi keeps the two sets of arrows apart.
      var ca = Math.cos(0.61), sa = Math.sin(0.61);
      var b1 = add(mul(o1, ca), mul(o2, -sa)), b2 = add(mul(o1, sa), mul(o2, ca));
      var G = ambient(q);
      var GB1 = matvec(G, b1), GB2 = matvec(G, b2), GJ1 = matvec(G, J[0]), GJ2 = matvec(G, J[1]);
      var GQ = [dot(b1, GB1), dot(b1, GB2), dot(b2, GB2)];       // B^T G B
      var gu = [dot(J[0], GJ1), dot(J[0], GJ2), dot(J[1], GJ2)]; // Phi^T G Phi
      var R = [[dot(b1, J[0]), dot(b1, J[1])], [dot(b2, J[0]), dot(b2, J[1])]];
      var GQm = [[GQ[0], GQ[1]], [GQ[1], GQ[2]]];
      var RtGR = [[0, 0], [0, 0]];
      for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) {
        var s = 0;
        for (var a = 0; a < 2; a++) for (var b = 0; b < 2; b++) s += R[a][i] * GQm[a][b] * R[b][j];
        RtGR[i][j] = s;
      }

      // Parameter domain: the point, the flat unit circle and the unit ellipse of g(u).
      gUdyn.innerHTML = "";
      var pu = toPx(u), sc = 30;
      sv("circle", { cx: pu.x, cy: pu.y, r: sc, fill: "none", stroke: "#87848d", "stroke-width": 1.2, "stroke-dasharray": "4 3" }, gUdyn);
      var eg = eig2(gu[0], gu[1], gu[2]), pts = [];
      for (var m = 0; m <= 72; m++) {
        var th = 2 * Math.PI * m / 72;
        var x = Math.cos(th) / Math.sqrt(eg.l[0]), y = Math.sin(th) / Math.sqrt(eg.l[1]);
        var du = [eg.v[0][0] * x + eg.v[1][0] * y, eg.v[0][1] * x + eg.v[1][1] * y];
        pts.push((pu.x + sc * du[0]).toFixed(1) + "," + (pu.y - sc * du[1]).toFixed(1));
      }
      sv("polygon", { points: pts.join(" "), fill: "rgba(114,83,237,0.10)", stroke: "#7253ed", "stroke-width": 1.5 }, gUdyn);
      sv("circle", { cx: pu.x, cy: pu.y, r: 5, fill: "#27262b", stroke: "#fff", "stroke-width": 2 }, gUdyn);
      mlabel("u", [{ m: "u" }], pu.x + 8, pu.y - 10, "start");

      // Submanifold: tangent plane, both bases, and the induced unit ellipse.
      gQdyn.innerHTML = "";
      var P0 = proj(q), L = 0.52;
      var plane = [add(add(q, mul(b1, L)), mul(b2, L)), add(sub(q, mul(b1, L)), mul(b2, L)),
                   sub(sub(q, mul(b1, L)), mul(b2, L)), sub(add(q, mul(b1, L)), mul(b2, L))].map(proj);
      sv("polygon", {
        points: plane.map(function (p) { return p.x.toFixed(1) + "," + p.y.toFixed(1); }).join(" "),
        fill: "rgba(39,38,43,0.07)", stroke: "rgba(39,38,43,0.35)", "stroke-width": 1
      }, gQdyn);
      mlabel("T", [{ m: "\\mathcal{T}_q\\mathcal{Q}" }], plane[2].x - 4, plane[2].y + 12, "end", "soft");

      var G2 = eig2(GQ[0], GQ[1], GQ[2]), ell = [], r = 0.42;
      for (var n = 0; n <= 90; n++) {
        var t = 2 * Math.PI * n / 90;
        var xi = [G2.v[0][0] * Math.cos(t) / Math.sqrt(G2.l[0]) + G2.v[1][0] * Math.sin(t) / Math.sqrt(G2.l[1]),
                  G2.v[0][1] * Math.cos(t) / Math.sqrt(G2.l[0]) + G2.v[1][1] * Math.sin(t) / Math.sqrt(G2.l[1])];
        var v = add(mul(b1, xi[0] * r), mul(b2, xi[1] * r));
        var p = proj(add(q, v));
        ell.push(p.x.toFixed(1) + "," + p.y.toFixed(1));
      }
      sv("polygon", { points: ell.join(" "), fill: "rgba(114,83,237,0.10)", stroke: "#7253ed", "stroke-width": 1.6 }, gQdyn);

      var LB = 0.56;
      var e1 = proj(add(q, mul(b1, LB))), e2 = proj(add(q, mul(b2, LB)));
      var f1 = proj(add(q, mul(J[0], LB * 0.7))), f2 = proj(add(q, mul(J[1], LB * 0.7)));
      arrow(gQdyn, P0, e1, "#27262b", 1.9);
      arrow(gQdyn, P0, e2, "#27262b", 1.9);
      arrow(gQdyn, P0, f1, "#27262b", 1.6, "5 3");
      arrow(gQdyn, P0, f2, "#27262b", 1.6, "5 3");
      function tipLabel(key, tipPt, src) {
        var dx = tipPt.x - P0.x, dy = tipPt.y - P0.y, n = Math.hypot(dx, dy) || 1;
        mlabel(key, [{ m: src }], tipPt.x + 13 * dx / n, tipPt.y + 13 * dy / n, "middle");
      }
      tipLabel("b1", e1, "b_1"); tipLabel("b2", e2, "b_2");
      tipLabel("d1", f1, "\\partial_1 \\varphi"); tipLabel("d2", f2, "\\partial_2 \\varphi");
      sv("circle", { cx: P0.x, cy: P0.y, r: 5, fill: "#27262b", stroke: "#fff", "stroke-width": 2 }, gQdyn);
      mlabel("q", [{ m: "q" }], P0.x - 10, P0.y + 12, "end");

      // Readout, three matrices: two of them always agree.
      function m2(M) {
        return "\\begin{bmatrix}" + M[0][0].toFixed(3) + " & " + M[0][1].toFixed(3) + " \\\\ " +
          M[1][0].toFixed(3) + " & " + M[1][1].toFixed(3) + "\\end{bmatrix}";
      }
      readout.innerHTML = "";
      [["\\mat{G}_{\\mathcal{Q}}(q) = ", GQm], ["g(u) = ", [[gu[0], gu[1]], [gu[1], gu[2]]]],
       ["\\mat{R}^{\\mathsf{T}}\\mat{G}_{\\mathcal{Q}}(q)\\mat{R} = ", RtGR]].forEach(function (row) {
        tex(el("span", {}, readout), row[0] + m2(row[1]));
      });
    }

    segmented(root.querySelector("[data-role=metric]"), [
      { value: "euclidean", label: "Euclidean" },
      { value: "varying", label: "configuration-dependent" }
    ], state.metric, function (v) { state.metric = v; draw(); });

    // A transparent handle over the parameter domain takes the drag, with
    // touch-action none so that dragging on a phone does not scroll the page.
    var handle = sv("rect", { class: "handle", x: UX - 12, y: UY - 12, width: US + 24, height: US + 24 }, svg);
    var dragging = false;
    function pick(evt) {
      var pt = svg.createSVGPoint();
      pt.x = evt.clientX; pt.y = evt.clientY;
      var loc = pt.matrixTransform(svg.getScreenCTM().inverse());
      state.u = fromPx(loc.x, loc.y);
      draw();
    }
    handle.addEventListener("pointerdown", function (e) {
      dragging = true; handle.setPointerCapture(e.pointerId); pick(e); e.preventDefault();
    });
    handle.addEventListener("pointermove", function (e) { if (dragging) pick(e); });
    handle.addEventListener("pointerup", function () { dragging = false; });
    handle.addEventListener("pointercancel", function () { dragging = false; });
    svg.setAttribute("tabindex", "0");
    svg.addEventListener("keydown", function (e) {
      var d = { ArrowLeft: [-0.05, 0], ArrowRight: [0.05, 0], ArrowUp: [0, 0.05], ArrowDown: [0, -0.05] }[e.key];
      if (!d) return;
      state.u = [clamp(state.u[0] + d[0], -0.92, 0.92), clamp(state.u[1] + d[1], -0.92, 0.92)];
      draw();
      e.preventDefault();
    });
    draw();
  }

  // ------------------------------------------------------------------ player

  var ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';

  function initPlayer(root) {
    var st = { task: 1, view: "front", on: { flat: true, euclidean: true, kinetic: true }, speed: 1,
               t: 0, playing: false, userPaused: false, visible: false };
    var grid = root.querySelector("[data-role=grid]");
    var meters = root.querySelector("[data-role=meters]");
    var clockEl = root.querySelector("[data-role=clock]");
    var titleEl = root.querySelector("[data-role=title]");
    var viewLabel = root.querySelector("[data-role=viewlabel]");
    var playBtn = root.querySelector("[data-role=play]");
    var scrub = root.querySelector("[data-role=scrub]");

    // Tiles, one per metric, built once and reused across tasks and views.
    var tiles = {};
    ORDER.forEach(function (m) {
      var M = METRICS[m];
      var tile = el("div", { class: "im-tile" }, grid);
      el("div", { class: "bar", style: "background:" + M.stage }, tile);
      el("div", { class: "name", style: "color:" + M.stage, text: M.name }, tile);
      var frame = el("div", { class: "frame" }, tile);
      var video = el("video", { muted: "", playsinline: "", preload: "auto", disablepictureinpicture: "" }, frame);
      video.muted = true;
      el("div", { class: "done", style: "color:" + M.stage, text: "COMPLETE" }, frame);
      tiles[m] = { el: tile, video: video, end: 0 };
      frame.addEventListener("click", function () { playBtn.click(); });
      frame.style.cursor = "pointer";
    });

    // Meters: duration, joint-space path length, integrated kinetic energy.
    var METERS = [
      { key: "dur", cap: "EXECUTED DURATION [s]", dec: 2, best: false },
      { key: "len", cap: "JOINT-SPACE PATH LENGTH [rad]", dec: 2, best: true },
      { key: "ke", cap: "INTEGRATED KINETIC ENERGY [J s]", dec: 3, best: true }
    ];
    var rows = {};
    METERS.forEach(function (mt) {
      var box = el("div", { class: "im-meter" }, meters);
      el("div", { class: "cap", text: mt.cap }, box);
      rows[mt.key] = {};
      ORDER.forEach(function (m) {
        var M = METRICS[m];
        var row = el("div", { class: "im-row" }, box);
        el("span", { class: "who", style: "color:" + M.stage, text: M.name }, row);
        var track = el("div", { class: "track" }, row);
        var fill = el("div", { class: "fill", style: "background:" + M.stage }, track);
        var best = el("div", { class: "best" }, track);
        var val = el("span", { class: "val", style: "color:" + M.stage }, row);
        rows[mt.key][m] = { row: row, fill: fill, best: best, val: val };
      });
    });

    function shown() { return ORDER.filter(function (m) { return st.on[m]; }); }
    function D(m) { return HW.dur[m][st.task]; }
    function maxD() { return max(shown().map(D)); }
    function tEnd() { return LEAD + maxD() + HOLD; }

    function load(keepTime) {
      var task = TASKS[st.task].key;
      titleEl.textContent = TASKS[st.task].long;
      viewLabel.textContent = "Real · " + st.view + " view";
      ORDER.forEach(function (m) {
        var T = tiles[m];
        T.end = LEAD + D(m);
        var base = ASSETS + "video/" + st.view + "/" + task + "_" + m;
        T.video.poster = base + ".webp";
        T.video.src = base + ".mp4";
        T.video.load();
        if (keepTime) {
          T.video.addEventListener("loadedmetadata", function once() {
            T.video.removeEventListener("loadedmetadata", once);
            T.video.currentTime = Math.min(st.t, T.end, (T.video.duration || T.end) - 0.04);
          });
        }
      });
      layout();
      if (!keepTime) st.t = 0;
      scrub.max = tEnd().toFixed(2);
      render();
    }

    function layout() {
      var n = 0;
      ORDER.forEach(function (m) {
        tiles[m].el.hidden = !st.on[m];
        if (st.on[m]) n++;
        METERS.forEach(function (mt) { rows[mt.key][m].row.classList.toggle("hidden", !st.on[m]); });
      });
      grid.style.setProperty("--cols", n);
      scrub.max = tEnd().toFixed(2);
    }

    function render() {
      var t = st.t, ms = shown(), md = maxD(), elapsed = clamp(t - LEAD, 0, md);
      var allDone = t >= LEAD + md;
      clockEl.textContent = elapsed.toFixed(1) + "s";
      scrub.value = Math.min(t, tEnd()).toFixed(2);
      ms.forEach(function (m) { tiles[m].el.classList.toggle("is-done", t >= tiles[m].end); });
      METERS.forEach(function (mt) {
        var vals = ms.map(function (m) { return HW[mt.key][m][st.task]; });
        var top = max(vals), low = min(vals);
        ms.forEach(function (m) {
          var R = rows[mt.key][m], v = HW[mt.key][m][st.task], d = D(m);
          var frac = clamp((t - LEAD) / d, 0, 1);
          var width, text;
          if (mt.key === "dur") {
            width = Math.min(elapsed, d) / md;
            text = (frac >= 1 ? d : Math.min(elapsed, d)).toFixed(2);
          } else {
            width = v / top * frac;
            text = (v * frac).toFixed(mt.dec);
          }
          R.fill.style.width = (100 * width).toFixed(2) + "%";
          var isBest = mt.best && allDone && v === low;
          R.row.classList.toggle("is-best", isBest);
          R.best.style.width = "calc(" + (100 * width).toFixed(2) + "% + 6px)";
          R.val.innerHTML = text + (isBest ? '<span class="tag">LOWEST</span>' : "");
        });
      });
    }

    function setPlaying(on) {
      st.playing = on;
      playBtn.innerHTML = on ? ICON_PAUSE : ICON_PLAY;
      playBtn.setAttribute("aria-label", on ? "Pause" : "Play");
      if (!on) ORDER.forEach(function (m) { tiles[m].video.pause(); });
    }

    function seekAll(t) {
      ORDER.forEach(function (m) {
        var v = tiles[m].video;
        var target = Math.min(t, tiles[m].end, (v.duration || tiles[m].end) - 0.04);
        if (Math.abs(v.currentTime - target) > 0.02) v.currentTime = Math.max(target, 0);
      });
    }

    /* The clock follows the longest video that is still playing, so a video
     * that buffers holds the clock instead of drifting away from it.  Once
     * every video has finished, wall time runs the final hold, then the loop.
     * Every video that should play is asked to play on every frame; when the
     * browser refuses (autoplay blocked), the player stops and shows Play. */
    function active(m) {
      var T = tiles[m];
      return st.t < T.end - 0.05 && !T.video.ended;
    }
    function tryPlay(v) {
      var p = v.play();
      if (p && p.catch) p.catch(function (err) {
        if (err && err.name === "NotAllowedError" && st.playing) { st.userPaused = true; setPlaying(false); }
      });
    }

    var last = null;
    function frame(now) {
      var dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1);
      last = now;
      var ms = shown();
      if (st.playing) {
        var live = ms.filter(active);
        if (live.length) {
          var lead = live.reduce(function (a, b) { return tiles[b].end > tiles[a].end ? b : a; });
          var lv = tiles[lead].video;
          if (!lv.paused && !lv.seeking) st.t = Math.max(st.t, lv.currentTime);
        } else {
          st.t += dt * st.speed;
        }
        ms.forEach(function (m) {
          var T = tiles[m], v = T.video;
          if (T.video.ended && st.t < T.end) st.t = Math.max(st.t, Math.min(T.end, v.duration || T.end));
          if (active(m)) {
            if (v.playbackRate !== st.speed) v.playbackRate = st.speed;
            if (Math.abs(v.currentTime - st.t) > 0.25 && !v.seeking) v.currentTime = st.t;
            if (v.paused) tryPlay(v);
          } else if (!v.paused) {
            v.pause();
          }
        });
        if (st.t >= tEnd()) { st.t = 0; seekAll(0); }
      }
      render();
      if (st.visible || st.playing) requestAnimationFrame(frame);
      else last = null;
    }
    function kick() { last = null; requestAnimationFrame(frame); }

    segmented(root.querySelector("[data-role=task]"), TASKS.map(function (t, i) {
      return { value: i, label: t.short, title: t.long };
    }), st.task, function (i) {
      st.task = i;
      load(false);
      st.userPaused = false;
      setPlaying(true);
      kick();
    });
    segmented(root.querySelector("[data-role=view]"), [
      { value: "front", label: "Front" }, { value: "side", label: "Side" }
    ], st.view, function (v) { st.view = v; load(true); kick(); });

    var chipHost = root.querySelector("[data-role=metrics]");
    ORDER.forEach(function (m) {
      var M = METRICS[m];
      var chip = el("button", { type: "button", class: "im-chip", "aria-pressed": "true" }, chipHost);
      el("span", { class: "sw", style: "background:" + M.stage }, chip);
      el("span", { text: M.name }, chip);
      chip.addEventListener("click", function () {
        if (st.on[m] && shown().length === 1) return;   // keep at least one metric
        st.on[m] = !st.on[m];
        chip.setAttribute("aria-pressed", String(st.on[m]));
        if (st.on[m]) {
          var v = tiles[m].video;
          v.currentTime = Math.min(st.t, tiles[m].end, (v.duration || tiles[m].end) - 0.04);
        } else {
          tiles[m].video.pause();
        }
        layout();
        if (st.t > tEnd()) st.t = 0;
        kick();
      });
    });

    var speedHost = root.querySelector("[data-role=speed]");
    segmented(speedHost, [{ value: 0.5, label: "0.5×" }, { value: 1, label: "1×" }, { value: 2, label: "2×" }], 1,
      function (s) { st.speed = s; });

    playBtn.innerHTML = ICON_PLAY;
    playBtn.addEventListener("click", function () {
      st.userPaused = st.playing;
      setPlaying(!st.playing);
      kick();
    });
    root.querySelector("[data-role=restart]").addEventListener("click", function () {
      st.t = 0;
      seekAll(0);
      st.userPaused = false;
      setPlaying(true);
      kick();
    });
    scrub.addEventListener("input", function () {
      st.userPaused = true;
      setPlaying(false);
      st.t = parseFloat(scrub.value);
      seekAll(st.t);
      kick();
    });

    load(false);

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          st.visible = e.isIntersecting;
          if (e.isIntersecting && !st.userPaused && !reduce) setPlaying(true);
          if (!e.isIntersecting && st.playing) setPlaying(false);
          kick();
        });
      }, { threshold: 0.35 }).observe(root);
    } else {
      st.visible = true;
      kick();
    }
  }

  // ------------------------------------------------------------------ hardware table

  function initHardwareTable(host) {
    var groups = [["dur", "Executed duration [s]", 2], ["len", "Joint-space path length [rad]", 2], ["ke", "Integrated kinetic energy [J s]", 3]];
    var html = '<div class="im-card" style="padding:0.2rem;overflow-x:auto"><table class="im-table im-hw"><thead><tr class="grp"><th></th>';
    groups.forEach(function (g) { html += '<th colspan="3">' + g[1] + "</th>"; });
    html += "</tr><tr><th>Task</th>";
    groups.forEach(function () {
      ORDER.forEach(function (m) {
        html += '<th><span class="metric"><span class="sw" style="background:' + METRICS[m].paper + '"></span>' + METRICS[m].name + "</span></th>";
      });
    });
    html += "</tr></thead><tbody>";
    TASKS.forEach(function (t, i) {
      html += '<tr><td title="' + t.long + '">' + t.short + "</td>";
      groups.forEach(function (g) {
        var row = ORDER.map(function (m) { return HW[g[0]][m][i]; });
        ORDER.forEach(function (m, k) {
          html += "<td" + (row[k] === min(row) ? ' class="best"' : "") + ">" + row[k].toFixed(g[2]) + "</td>";
        });
      });
      html += "</tr>";
    });
    html += '</tbody></table><p class="small muted" style="margin:0.5rem 0.5rem 0.4rem">Median over five trials on the real setup. Bold marks the lowest value for each task and measure.</p></div>';
    host.innerHTML = html;
  }

  // ------------------------------------------------------------------ 3D viewer

  function initViewer(root) {
    var st = { task: 1, live: false };
    var canvas = root.querySelector("[data-role=canvas]");
    var launch = root.querySelector("[data-role=launch]");
    var open = root.querySelector("[data-role=open]");
    var frame = null;
    // The recordings frame the three cells for a 2.6:1 viewer; this widens or
    // narrows the vertical field of view so they fit the viewer at any width.
    // 0.62 is the half-width of the cells over their distance from the camera,
    // and 46 px is viser's playback bar.
    function fov() {
      var aspect = canvas.clientWidth / Math.max(canvas.clientHeight - 46, 1);
      return clamp(2 * Math.atan(0.62 / aspect), 0.3, 1.3).toFixed(3);
    }
    function url() {
      return ASSETS + "viser/client/index.html?playbackPath=" + ASSETS + "viser/" + TASKS[st.task].key +
        ".viser&initialCameraFov=" + fov();
    }
    function update() {
      open.href = url();
      launch.style.backgroundImage = "url(" + ASSETS + "viser/posters/" + TASKS[st.task].key + ".webp)";
      if (frame) frame.src = url();
    }
    segmented(root.querySelector("[data-role=task]"), TASKS.map(function (t, i) {
      return { value: i, label: t.short, title: t.long };
    }), st.task, function (i) { st.task = i; update(); });
    launch.addEventListener("click", function () {
      frame = el("iframe", { title: "Interactive 3D viewer of the three motions", allow: "fullscreen", src: url() }, canvas);
      launch.remove();
    });
    update();
  }

  // ------------------------------------------------------------------ chart

  function initChart(root) {
    var st = { measure: "euc", block: "to_exp", table: false };
    var svg = root.querySelector("[data-role=svg]");
    var legend = root.querySelector("[data-role=legend]");
    var note = root.querySelector("[data-role=note]");
    var tableHost = root.querySelector("[data-role=table]");
    var toggle = root.querySelector("[data-role=toggle-table]");

    function metricsOf(block) { return ORDER.filter(function (m) { return SIM[block].euc[m]; }); }

    function niceStep(span) {
      var raw = span / 6, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
      return (f < 1.5 ? 1 : f < 3.5 ? 2.5 : f < 7.5 ? 5 : 10) * p;
    }

    function draw() {
      var data = SIM[st.block][st.measure], ms = metricsOf(st.block);
      var all = [];
      ms.forEach(function (m) { all = all.concat(data[m]); });
      var lo = min(all), hi = max(all), pad = (hi - lo) * 0.08 + 0.05;
      var step = niceStep(hi - lo + 2 * pad);
      var x0 = Math.floor((lo - pad) / step) * step, x1 = Math.ceil((hi + pad) / step) * step;
      var W = Math.max(Math.round(svg.getBoundingClientRect().width) || 760, 280);
      var L = 56, Rm = 16, TOP = 16, ROW = 42, H = TOP + ROW * TASKS.length + 34;
      function X(v) { return L + (v - x0) / (x1 - x0) * (W - L - Rm); }

      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.setAttribute("aria-label", MEASURES[st.measure] + " by problem for the " + SIM[st.block].label.toLowerCase() + " results.");
      svg.innerHTML = "";
      var grid = sv("g", { class: "grid" }, svg), axis = sv("g", { class: "axis" }, svg);
      for (var v = x0; v <= x1 + 1e-9; v += step) {
        sv("line", { x1: X(v), x2: X(v), y1: TOP - 6, y2: TOP + ROW * TASKS.length }, grid);
        sv("text", { x: X(v), y: H - 12, "text-anchor": "middle", text: +v.toFixed(2) }, axis);
      }
      TASKS.forEach(function (t, i) {
        var y = TOP + ROW * i + ROW / 2;
        var vals = ms.map(function (m) { return data[m][i]; });
        var best = min(vals);
        sv("text", { class: "row-label", x: 8, y: y + 4, text: t.short }, svg);
        sv("line", { class: "range", x1: X(min(vals)), x2: X(max(vals)), y1: y, y2: y }, svg);
        // Draw the best last so its ring sits on top of a near neighbour.
        var order = ms.slice().sort(function (a, b) { return data[b][i] - data[a][i]; });
        order.forEach(function (m) {
          var val = data[m][i], cx = X(val);
          sv("circle", { class: "dot", cx: cx, cy: y, r: 6.5, fill: METRICS[m].paper }, svg);
          var hit = sv("circle", { class: "hit", cx: cx, cy: y, r: 13 }, svg);
          var html = '<span class="sw" style="background:' + METRICS[m].paper + '"></span><b>' + METRICS[m].name + "</b> · " + t.short +
            "<br>" + val.toFixed(2) + (val === best ? " (shortest)" : "");
          hit.addEventListener("pointerenter", function (e) { showTip(html, e.clientX, e.clientY); });
          hit.addEventListener("pointermove", function (e) { showTip(html, e.clientX, e.clientY); });
          hit.addEventListener("pointerleave", hideTip);
        });
        ms.forEach(function (m) {
          if (data[m][i] === best) {
            sv("text", { class: "best-lbl", x: X(best), y: y - 11, "text-anchor": "middle", text: best.toFixed(2) }, svg);
          }
        });
      });

      legend.innerHTML = "";
      ms.forEach(function (m) {
        var it = el("span", { class: "it" }, legend);
        el("span", { class: "sw", style: "background:" + METRICS[m].paper }, it);
        el("span", { text: METRICS[m].name }, it);
      });
      note.textContent = SIM[st.block].note + " " + MEASURES[st.measure] + ", median over 50 trials. Labels mark the shortest motion for each problem.";

      var html = '<table class="im-table"><thead><tr class="grp"><th></th><th colspan="6">Induced Euclidean length</th><th colspan="6">Induced kinetic-energy length</th></tr><tr><th>Metric</th>';
      ["euc", "ke"].forEach(function () { TASKS.forEach(function (t) { html += "<th>" + t.short + "</th>"; }); });
      html += "</tr></thead><tbody>";
      ms.forEach(function (m) {
        html += '<tr><td><span class="metric"><span class="sw" style="background:' + METRICS[m].paper + '"></span>' + METRICS[m].name + "</span></td>";
        ["euc", "ke"].forEach(function (me) {
          TASKS.forEach(function (t, i) {
            var col = ms.map(function (x) { return SIM[st.block][me][x][i]; });
            var v = SIM[st.block][me][m][i];
            html += "<td" + (v === min(col) ? ' class="best"' : "") + ">" + v.toFixed(2) + "</td>";
          });
        });
        html += "</tr>";
      });
      tableHost.innerHTML = '<div style="overflow-x:auto">' + html + "</tbody></table></div>";
    }

    segmented(root.querySelector("[data-role=measure]"), [
      { value: "euc", label: "Euclidean length" }, { value: "ke", label: "kinetic-energy length" }
    ], st.measure, function (v) { st.measure = v; draw(); });
    segmented(root.querySelector("[data-role=block]"), Object.keys(SIM).map(function (k) {
      return { value: k, label: SIM[k].label, title: SIM[k].note };
    }), st.block, function (v) { st.block = v; draw(); });
    if ("ResizeObserver" in window) {
      var lastW = 0;
      new ResizeObserver(function () {
        var w = Math.round(svg.getBoundingClientRect().width);
        if (w && Math.abs(w - lastW) > 4) { lastW = w; draw(); }
      }).observe(svg);
    }
    toggle.addEventListener("click", function () {
      st.table = !st.table;
      tableHost.hidden = !st.table;
      toggle.textContent = st.table ? "Hide the table" : "Show as a table";
    });
    draw();
  }

  // ------------------------------------------------------------------ citation

  function initCopy(btn) {
    btn.addEventListener("click", function () {
      var text = document.getElementById("im-bibtex").textContent;
      var done = function () { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy"; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
      else {
        var r = document.createRange();
        r.selectNodeContents(document.getElementById("im-bibtex"));
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        document.execCommand("copy");
        done();
      }
    });
  }

  // ------------------------------------------------------------------ boot

  function boot() {
    renderMath();
    var d = document.getElementById("im-diagram"); if (d) initDiagram(d);
    var p = document.getElementById("im-player"); if (p) initPlayer(p);
    var h = document.getElementById("im-hw-table"); if (h) initHardwareTable(h);
    var v = document.getElementById("im-viewer"); if (v) initViewer(v);
    var c = document.getElementById("im-chart"); if (c) initChart(c);
    var b = document.querySelector(".im-bib [data-role=copy]"); if (b) initCopy(b);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
