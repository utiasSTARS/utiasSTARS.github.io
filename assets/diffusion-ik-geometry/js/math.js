/* Math typesetting with KaTeX (loaded by the page like the induced-metrics page).
 * tex(src) returns cached inline HTML for dynamic strings; renderStatic(root) typesets the \( \) and \[ \]
 * delimiters of static text; SvgLabels places KaTeX labels over an SVG, in its viewBox coordinates. */

const cache = new Map();

/* Plain-text fallback while KaTeX is unavailable. */
function fallback(src) {
  return src
    .replace(/\\bar\s*t/g, "t̄").replace(/\\hat\s*d/g, "d̂")
    .replace(/\\alpha/g, "α").replace(/\\sigma/g, "σ").replace(/\\dagger/g, "†")
    .replace(/\\mathrm\{([^}]*)\}/g, "$1").replace(/\\to/g, "→").replace(/\\,|\\ |\\;/g, " ")
    .replace(/[{}^_]/g, "").replace(/-/g, "−").replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

export function tex(src) {
  let html = cache.get(src);
  if (html === undefined) {
    if (!window.katex) return '<span class="dg-tex-fallback">' + fallback(src) + "</span>";
    html = window.katex.renderToString(src, { throwOnError: false, output: "htmlAndMathml" });
    cache.set(src, html);
  }
  return html;
}

/* Set innerHTML only when it changes (readouts update on every pointer move). */
export function setHTML(node, html) {
  if (node.__dgHTML !== html) {
    node.innerHTML = html;
    node.__dgHTML = html;
  }
}

export function renderStatic(root) {
  if (!root || !window.renderMathInElement) return;
  window.renderMathInElement(root, {
    delimiters: [
      { left: "\\[", right: "\\]", display: true },
      { left: "\\(", right: "\\)", display: false }
    ],
    throwOnError: false
  });
}

/* Constraint display name in the surrounding text font (SE(3) included, like the other labels). */
export function constraintHTML(key, label) {
  return String(label).replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

/* "Score-SVD†" with the dagger as math. */
export function estimatorHTML(label) {
  return String(label).replace("†", tex("^\\dagger"));
}

/* HTML labels positioned over an SVG in its viewBox coordinates. */
export class SvgLabels {
  constructor(svg) {
    this.svg = svg;
    const parent = svg.parentNode;
    if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
    this.layer = document.createElement("div");
    this.layer.className = "dg-svg-labels";
    this.layer.setAttribute("aria-hidden", "true");
    parent.appendChild(this.layer);
  }

  /* items: [{x, y, html, anchor: "start" | "middle" | "end", cls}]; W, H: viewBox size. */
  set(items, W, H) {
    const html = items.map((it) => {
      const tx = it.anchor === "start" ? "0" : it.anchor === "end" ? "-100%" : "-50%";
      const left = (100 * it.x) / W, top = (100 * it.y) / H;
      return '<span class="dg-svg-label ' + (it.cls || "") + '" style="left:' + left.toFixed(3) + "%;top:" + top.toFixed(3) +
        "%;transform:translate(" + tx + ',-50%)">' + it.html + "</span>";
    }).join("");
    setHTML(this.layer, html);
  }
}
