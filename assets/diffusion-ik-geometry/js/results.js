/* Results at a glance: the intrinsic-dimension bars of the paper's Fig. 2 (numbers from
 * the appendix table of all estimators) and the straight-line interpolation errors. */
import { DATA, el, sv, fetchJSON, showTip, hideTip, ROBOT_COLOR } from "./util.js";
import { tex, SvgLabels, constraintHTML, estimatorHTML } from "./math.js";

const RAMPS = {
  franka: ["#cfd9e8", "#97adcc", "#5a7caa", "#2a4f7d"],
  ur5: ["#f0d6da", "#dc9ea7", "#a9525f", "#6e1622"]
};
const SHORT = {
  plane: ["Plane"], line: ["Line"], posonly: ["Position"], orient: ["Orient."],
  plane_orient: ["Plane", "+ Orient."], line_orient: ["Line", "+ Orient."], se3: ["SE(3)"]
};

function fmtId(v) {
  return Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(1);
}

function panel(host, robot, res, manifest) {
  const est = res.id.estimators.filter((e) => e.fig);
  const data = res.id[robot];
  const order = res.order;
  const W = 380, H = 230, L = 26, R = 6, T = 30, B = 40;
  const ymax = 7;
  const svg = sv("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": manifest.robots[robot].label + ": estimated intrinsic dimension by constraint and estimator, against the analytical value." }, host);
  const X0 = L, gw = (W - L - R) / order.length;
  const Y = (v) => T + (1 - v / ymax) * (H - T - B);
  const grid = sv("g", { class: "grid" }, svg), axis = sv("g", { class: "axis" }, svg);
  for (let v = 0; v <= ymax; v++) {
    sv("line", { x1: L, x2: W - R, y1: Y(v), y2: Y(v), stroke: v === 0 ? "#d9d6dc" : undefined }, grid);
    if (v % 1 === 0) sv("text", { x: L - 6, y: Y(v) + 3, "text-anchor": "end", text: String(v) }, axis);
  }
  sv("text", { class: "ttl", x: L, y: 14, fill: ROBOT_COLOR[robot].main, text: manifest.robots[robot].label }, svg);
  const bw = Math.min(10, (gw - 10) / est.length);
  const groupLabels = [];
  order.forEach((c, gi) => {
    const row = data[c];
    const gx = X0 + gi * gw + (gw - bw * est.length) / 2;
    est.forEach((e, k) => {
      const v = row[e.key];
      const x = gx + k * bw;
      const y = Y(Math.max(v, 0));
      const h = Y(0) - y;
      sv("rect", { x: x + 0.5, y: Math.min(y, Y(0) - 1.2), width: bw - 1, height: Math.max(1.2, h), fill: RAMPS[robot][k], rx: 1 }, svg);
      const ci = row.ci && row.ci[e.key];
      if (ci && ci[1] - ci[0] > 0.02) {
        const cx = x + bw / 2, y0 = Y(Math.min(ci[1], ymax)), y1 = Y(Math.max(ci[0], 0));
        sv("line", { x1: cx, x2: cx, y1: y0, y2: y1, stroke: "#27262b", "stroke-width": 0.9, "stroke-opacity": 0.55 }, svg);
        sv("line", { x1: cx - 1.8, x2: cx + 1.8, y1: y0, y2: y0, stroke: "#27262b", "stroke-width": 0.9, "stroke-opacity": 0.55 }, svg);
      }
      if (Math.round(v) === row.id) {
        sv("text", { class: "check", x: x + bw / 2, y: Math.min(y, Y(row.id)) - 4, "text-anchor": "middle", fill: ROBOT_COLOR[robot].main, text: "✓" }, svg);
      }
      const hit = sv("rect", { class: "hit", x, y: T, width: bw, height: Y(0) - T }, svg);
      const html = '<span class="sw" style="background:' + RAMPS[robot][k] + '"></span><b>' + estimatorHTML(e.label) + "</b>" + (e.detail ? " (" + e.detail + ")" : "") +
        "<br>" + manifest.robots[robot].label + " · " + constraintHTML(c, manifest.constraints.find((x) => x.key === c).label) +
        "<br>estimate " + fmtId(v) + (ci ? " (95% CI " + fmtId(ci[0]) + "\u2013" + fmtId(ci[1]) + ")" : "") + " \u00b7 analytical " + row.id;
      hit.addEventListener("pointerenter", (ev) => showTip(html, ev.clientX, ev.clientY));
      hit.addEventListener("pointermove", (ev) => showTip(html, ev.clientX, ev.clientY));
      hit.addEventListener("pointerleave", hideTip);
    });
    const gxL = X0 + gi * gw + 3, gxR = X0 + (gi + 1) * gw - 3;
    sv("line", { x1: gxL, x2: gxR, y1: Y(row.id), y2: Y(row.id), stroke: "#27262b", "stroke-width": 2.6, "stroke-linecap": "round" }, svg);
    groupLabels.push({ x: X0 + (gi + 0.5) * gw, y: H - B + (SHORT[c].length > 1 ? 17 : 12), cls: "dg-grp-label",
      html: c === "se3" ? tex("\\mathrm{SE}(3)") : SHORT[c].join("<br>") });
  });
  new SvgLabels(svg).set(groupLabels, W, H);
}

export async function init(root, manifest) {
  const res = await fetchJSON(DATA + "results.json");
  const legend = root.querySelector("[data-role=legend]");
  const panels = root.querySelector("[data-role=panels]");
  const est = res.id.estimators.filter((e) => e.fig);
  est.forEach((e, k) => {
    const it = el("span", { class: "it" }, legend);
    el("i", { html: '<b style="background:' + RAMPS.franka[k] + '"></b><b style="background:' + RAMPS.ur5[k] + '"></b>' }, it);
    it.insertAdjacentHTML("beforeend", "<span>" + estimatorHTML(e.label) + (e.detail && e.key !== "svd" && e.key !== "dagger" ? " (" + e.detail + ")" : "") + (e.key === "dagger" ? " (ours)" : "") + "</span>");
  });
  const gt = el("span", { class: "it" }, legend);
  el("span", { class: "gt" }, gt);
  gt.insertAdjacentHTML("beforeend", "<span>analytical " + tex("n - k") + "</span>");
  ["franka", "ur5"].forEach((r) => panel(el("div", {}, panels), r, res, manifest));

  const tableHost = root.querySelector("[data-role=table]");
  const toggle = root.querySelector("[data-role=toggle]");
  const all = res.id.estimators;
  let html = '<div class="table-wrapper"><table class="dg-table dg-full"><thead><tr><th>Constraint</th><th>ID</th>' +
    all.map((e) => "<th>" + estimatorHTML(e.label) + (e.detail && e.key !== "svd" && e.key !== "dagger" ? "<br><span class=\"muted\" style=\"font-weight:400;text-transform:none;letter-spacing:0\">" + e.detail + "</span>" : "") + "</th>").join("") + "</tr></thead><tbody>";
  ["franka", "ur5"].forEach((r) => {
    html += '<tr class="robot" data-robot="' + r + '"><td colspan="' + (all.length + 2) + '">' + manifest.robots[r].label + "</td></tr>";
    res.order.forEach((c) => {
      const row = res.id[r][c];
      html += "<tr><td>" + constraintHTML(c, manifest.constraints.find((x) => x.key === c).label) + '</td><td class="num">' + row.id + "</td>" +
        all.map((e) => '<td class="num' + (Math.round(row[e.key]) === row.id ? " hit" : "") + '">' + fmtId(row[e.key]) + "</td>").join("") + "</tr>";
    });
  });
  html += '</tbody></table></div><p class="small muted" style="margin:0.5rem 0.2rem 0">Bold entries round to the analytical intrinsic dimension. Neighbourhood estimators run on generated configurations, and the score-based ones read the learned score function at points of the manifold.</p>';
  tableHost.innerHTML = html;
  toggle.addEventListener("click", () => {
    tableHost.hidden = !tableHost.hidden;
    toggle.textContent = tableHost.hidden ? "Show all estimators as a table" : "Hide the table";
    toggle.setAttribute("aria-expanded", String(!tableHost.hidden));
  });
  toggle.setAttribute("aria-expanded", "false");
}

function heat(v, max) {
  const t = Math.min(1, v / max);
  const a = [247, 245, 251], b = [196, 181, 232];
  const c = a.map((x, i) => Math.round(x + (b[i] - x) * t));
  return "rgb(" + c.join(",") + ")";
}

export async function initInterp(root, manifest) {
  const res = await fetchJSON(DATA + "results.json");
  const I = res.interp;
  const host = root.querySelector("[data-role=table]");
  const cols = [["franka", "pos", "mm"], ["franka", "orn", "°"], ["ur5", "pos", "mm"], ["ur5", "orn", "°"]];
  const cellOf = (r, c, k) => {
    const x = I[r][c];
    return x[k + "_lin"] !== undefined ? x[k + "_lin"] : x[k];
  };
  const maxOf = (kind) => Math.max(...["franka", "ur5"].flatMap((r) => res.order.map((c) => (cellOf(r, c, kind) ? cellOf(r, c, kind)[0] : 0))));
  const mx = { pos: maxOf("pos"), orn: maxOf("orn") };
  let html = '<div class="table-wrapper"><table class="dg-table dg-heat"><thead><tr><th></th>' +
    '<th class="c robot" data-robot="franka" colspan="2">Franka</th><th class="c robot" data-robot="ur5" colspan="2">UR5</th></tr>' +
    '<tr><th>Constraint</th>' + cols.map(([, k, u]) => '<th class="c">' + (k === "pos" ? "Position" : "Orientation") + ' <span class="unit">(' + u + ")</span></th>").join("") + "</tr></thead><tbody>";
  res.order.forEach((c) => {
    html += '<tr><td class="name">' + constraintHTML(c, manifest.constraints.find((x) => x.key === c).label) + "</td>";
    cols.forEach(([r, k]) => {
      const v = cellOf(r, c, k);
      if (!v) { html += '<td class="cell"><span class="dg-heatcell none">–</span></td>'; return; }
      html += '<td class="cell"><span class="dg-heatcell" style="background:' + heat(v[0], mx[k]) + '"><b>' + v[0].toFixed(2) + "</b><small>" + v[1].toFixed(2) + "–" + v[2].toFixed(2) + "</small></span></td>";
    });
    html += "</tr>";
  });
  html += "</tbody></table></div>";
  host.innerHTML = html;
  const foot = el("div", { class: "dg-heat-foot" }, root);
  el("span", { class: "small muted", html: "Median constraint error of the decoded straight-line paths over 30 targets and five endpoint pairs each, with the 95% bootstrap interval, at each condition\'s noise level " + tex("\\bar t") + "." }, foot);
  if (I.status) el("span", { class: "dg-status", text: I.status }, foot);
}
