/* Toolbar controls shared by the two widgets. */
import { el, segmented, ROBOT_COLOR } from "./util.js";
import { getSelection, select, onSelect } from "./state.js";
import { tex } from "./math.js";

function group(parent, label, id) {
  const g = el("div", { class: "dg-group" }, parent);
  const l = el("span", { class: "lbl", text: label, id }, g);
  return { g, l };
}

/* Robot toggle and constraint menu, bound to the shared selection. */
export function conditionControls(toolbar, manifest, onChange, idPrefix) {
  const r = group(toolbar, "Robot", idPrefix + "-robot");
  const robotHost = el("div", {}, r.g);
  const robots = ["ur5", "franka"];
  const seg = segmented(robotHost, robots.map((k) => ({
    value: k,
    html: '<span class="sw" style="background:' + ROBOT_COLOR[k].main + '"></span>' + manifest.robots[k].label
  })), getSelection().robot, (v) => select(v, getSelection().constraint, idPrefix), { label: "Robot" });

  const c = group(toolbar, "Constraint", idPrefix + "-constraint");
  const wrap = el("div", { class: "dg-select" }, c.g);
  const menu = el("select", { "aria-labelledby": idPrefix + "-constraint" }, wrap);
  function fillMenu(robot) {
    const n = manifest.robots[robot].n;
    menu.innerHTML = "";
    manifest.constraints.forEach((k) => {
      el("option", { value: k.key, text: k.label + "  ·  ID " + (n - k.k) }, menu);
    });
    menu.value = getSelection().constraint;
  }
  fillMenu(getSelection().robot);
  menu.addEventListener("change", () => select(getSelection().robot, menu.value, idPrefix));

  onSelect((sel) => {
    seg.set(sel.robot);
    fillMenu(sel.robot);
    onChange(sel);
  });
  return { robotGroup: r.g, constraintGroup: c.g };
}

/* Slider over discrete levels with labelled stops; `paper` marks the paper's setting. */
export function levelSlider(parent, { label, symbol, symbolTex, levels, value, paper, onInput, id, ticks = null }) {
  const box = el("div", { class: "dg-tslider" }, parent);
  const top = el("div", { class: "top" }, box);
  el("span", { class: "lbl", style: { fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--dg-muted)", fontWeight: 600 }, text: label, id }, top);
  const val = el("span", { class: "val" }, top);
  const input = el("input", { type: "range", class: "dg-range", min: 0, max: levels.length - 1, step: 1, "aria-labelledby": id }, box);
  const tickRow = el("div", { class: "dg-ticks", "aria-hidden": "true" }, box);
  let current = value, paperLevel = paper, list = levels;

  function build() {
    tickRow.innerHTML = "";
    input.max = list.length - 1;
    const show = ticks || list;
    list.forEach((t, i) => {
      if (show.indexOf(t) < 0 && t !== paperLevel) return;
      const s = el("span", { text: String(t) }, tickRow);
      s.style.left = (list.length > 1 ? (100 * i) / (list.length - 1) : 0) + "%";
      s.dataset.t = t;
      if (t === paperLevel) s.classList.add("paper");
    });
  }
  function paint() {
    const i = Math.max(0, list.indexOf(current));
    input.value = i;
    input.setAttribute("aria-valuetext", symbol + " = " + current + (current === paperLevel ? ", the paper's setting" : ""));
    val.innerHTML = tex((symbolTex || symbol) + " = " + current) + (current === paperLevel ? '<span class="paper">paper</span>' : "");
    tickRow.querySelectorAll("span").forEach((s) => s.classList.toggle("on", Number(s.dataset.t) === current));
  }
  input.addEventListener("input", () => {
    current = list[Number(input.value)];
    paint();
    onInput(current);
  });
  build();
  paint();
  return {
    set(v) { current = v; paint(); },
    reset(levels2, v, paper2) { list = levels2; current = v; paperLevel = paper2; build(); paint(); },
    get: () => current,
    input
  };
}
