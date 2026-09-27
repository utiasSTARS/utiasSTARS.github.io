/* Interactive version of the paper's Table 1: seven constraints x two robots.
 * Each robot cell selects that condition for both widgets below. */
import { el } from "./util.js";
import { getSelection, select, onSelect } from "./state.js";
import { tex, constraintHTML } from "./math.js";

const GLYPH_PARTS = {
  plane: '<path d="M3 15 L10 9 L23 9 L16 15 Z" fill="#e9e5f1" stroke="#6f6b75" stroke-width="1.1" stroke-linejoin="round"/>',
  line: '<path d="M2 16 L24 6" stroke="#6f6b75" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="2.5 2"/>',
  point: '<circle cx="13" cy="11" r="2.6" fill="#27262b"/><path d="M13 3.5v3M13 15.5v3M5.5 11h3M17.5 11h3" stroke="#6f6b75" stroke-width="1.1" stroke-linecap="round"/>',
  triad: '<path d="M13 12 L20 12" stroke="#c65b57" stroke-width="1.6" stroke-linecap="round"/><path d="M13 12 L13 4.5" stroke="#4a73b8" stroke-width="1.6" stroke-linecap="round"/><path d="M13 12 L8.2 16.6" stroke="#4f9a62" stroke-width="1.6" stroke-linecap="round"/>',
  axis: '<path d="M13 14 L13 4" stroke="#4a73b8" stroke-width="1.6" stroke-linecap="round"/><path d="M10.4 6.6 L13 3.5 L15.6 6.6" fill="none" stroke="#4a73b8" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>'
};
const GLYPHS = {
  plane: ["plane"],
  line: ["line"],
  posonly: ["point"],
  orient: ["triad"],
  plane_orient: ["plane", "triad"],
  line_orient: ["line", "axis"],
  se3: ["point", "triad"]
};

function glyph(key) {
  return '<svg class="glyph" viewBox="0 0 26 22" aria-hidden="true">' + GLYPHS[key].map((p) => GLYPH_PARTS[p]).join("") + "</svg>";
}

export async function init(root, manifest) {
  const host = root.querySelector("[data-role=table]");
  const note = root.querySelector("[data-role=note]");
  const robots = ["ur5", "franka"];
  const table = el("table", { class: "dg-table dg-family-table" });
  const thead = el("thead", {}, table);
  const hr = el("tr", {}, thead);
  el("th", { text: "Constraint", scope: "col" }, hr);
  el("th", { class: "what", text: "End-effector quantity fixed", scope: "col" }, hr);
  el("th", { class: "c", html: "Fixed " + tex("k"), scope: "col" }, hr);
  robots.forEach((r) => {
    const R = manifest.robots[r];
    el("th", { class: "c robot", "data-robot": r, html: R.label + '<span class="sub"><span>' + tex("n - k") + '</span> <span>(' + tex("n = " + R.n) + ")</span></span>", scope: "col" }, hr);
  });
  const tbody = el("tbody", {}, table);
  const buttons = [];
  manifest.constraints.forEach((c) => {
    const tr = el("tr", {}, tbody);
    el("td", { class: "name", html: glyph(c.key) + constraintHTML(c.key, c.label) }, tr);
    el("td", { class: "what", text: c.fixed }, tr);
    el("td", { class: "c num", html: tex(String(c.k)) }, tr);
    robots.forEach((r) => {
      const n = manifest.robots[r].n;
      const id = n - c.k;
      const td = el("td", { class: "c", "data-robot": r }, tr);
      const pips = Array.from({ length: n }, (_, i) => '<i class="' + (i < id ? "on" : "") + '"></i>').join("");
      const b = el("button", {
        type: "button",
        class: "dg-idbtn",
        "aria-pressed": "false",
        "aria-label": manifest.robots[r].label + ", " + c.label + ": intrinsic dimension " + id + (id === 0 ? ", isolated IK branches" : ""),
        title: id === 0 ? "Isolated IK branches" : id + " free direction" + (id > 1 ? "s" : ""),
        html: '<span class="n">' + tex(String(id)) + '</span><span class="pips" aria-hidden="true">' + pips + "</span>"
      }, td);
      b.addEventListener("click", () => select(r, c.key, "table"));
      buttons.push({ b, r, c: c.key, label: manifest.robots[r].label + " · " + constraintHTML(c.key, c.label) });
    });
  });
  const wrap = el("div", { class: "dg-table-scroll" }, host);
  wrap.appendChild(table);

  function paint(sel) {
    let current = null;
    buttons.forEach((x) => {
      const on = x.r === sel.robot && x.c === sel.constraint;
      x.b.setAttribute("aria-pressed", String(on));
      if (on) current = x;
    });
    if (current) {
      note.innerHTML = "Selected <b>" + current.label + '</b>. Explore it in <a href="#walk-the-latent-space">the latent space</a> and <a href="#count-the-knobs">the score spectrum</a> below.';
    }
  }
  paint(getSelection());
  onSelect(paint);
}
