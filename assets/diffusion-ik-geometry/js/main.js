/* Page entry point.  Every widget starts lazily when it scrolls near the viewport. */
import { DATA, fetchJSON, whenNear, webglAvailable, failSoft } from "./util.js";
import { renderStatic } from "./math.js";

function initCopy(btn) {
  btn.addEventListener("click", () => {
    const pre = document.getElementById("dg-bibtex");
    const text = pre.textContent;
    const done = () => {
      btn.textContent = "Copied";
      setTimeout(() => { btn.textContent = "Copy"; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => {});
    } else {
      const r = document.createRange();
      r.selectNodeContents(pre);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
      document.execCommand("copy");
      done();
    }
  });
}

function lazy(id, loader, what, needsGL) {
  const root = document.getElementById(id);
  if (!root) return;
  whenNear(root, async () => {
    try {
      if (needsGL && !webglAvailable()) throw new Error("WebGL unavailable");
      const manifest = await fetchJSON(DATA + "manifest.json");
      const mod = await loader();
      await mod.init(root, manifest);
    } catch (err) {
      failSoft(root.querySelector("[data-role=stage]") || root, err, what);
    }
  });
}

function boot() {
  renderStatic(document.getElementById("dg"));
  const copy = document.querySelector(".dg-bib [data-role=copy]");
  if (copy) initCopy(copy);

  const teaser = document.getElementById("dg-teaser");
  if (teaser) {
    whenNear(teaser, async () => {
      const stage = teaser.querySelector("[data-role=stage]");
      const fallback = () => {
        teaser.querySelector("[data-role=fallback]").hidden = false;
        teaser.querySelector("[data-role=loading]").classList.add("done");
        stage.classList.add("static");
      };
      if (!webglAvailable()) { fallback(); return; }
      try {
        const manifest = await fetchJSON(DATA + "manifest.json");
        const mod = await import("./teaser.js");
        await mod.init(teaser, manifest);
      } catch (err) {
        console.warn("teaser", err);
        fallback();
      }
    }, "200px");
  }

  lazy("dg-family", () => import("./family.js"), "The constraint table", false);
  lazy("dg-walk", () => import("./latent.js"), "The latent-space widget", true);
  lazy("dg-knobs", () => import("./knobs.js"), "The intrinsic-dimension widget", true);
  lazy("dg-idchart", () => import("./results.js"), "The results chart", false);
  lazy("dg-interp", () => import("./results.js").then((m) => ({ init: m.initInterp })), "The interpolation table", false);
  lazy("dg-gallery", () => import("./media.js").then((m) => ({ init: m.initGallery })), "The video gallery", false);

  if (/[?&]debug\b/.test(location.search)) {
    import("./robot.js").then((robot) => {
      /* In-browser forward-kinematics check, used by _tools/diffusion-ik-geometry/fk_check.py --browser.
         cases: [{robot, q, pos, R}] with R row-major; returns the worst position (m) and rotation (rad)
         errors of RobotModel.fk and of the posed scene graph (Robot.eePose). */
      async function fkCheck(cases) {
        let fkPos = 0, fkRot = 0, sgPos = 0, sgRot = 0;
        const rotErr = (m, R) => {
          const e = m.elements;
          let tr = 0;
          for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) tr += e[4 * j + i] * R[i][j];
          return Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));
        };
        for (const c of cases) {
          const model = await robot.loadModel(c.robot);
          const T = model.fk(c.q);
          const e = T.elements;
          fkPos = Math.max(fkPos, Math.hypot(e[12] - c.pos[0], e[13] - c.pos[1], e[14] - c.pos[2]));
          fkRot = Math.max(fkRot, rotErr(T, c.R));
          const r = new robot.Robot(model).setQ(c.q);
          const pose = r.eePose();
          sgPos = Math.max(sgPos, pose.position.distanceTo({ x: c.pos[0], y: c.pos[1], z: c.pos[2] }));
          sgRot = Math.max(sgRot, rotErr(pose.matrix, c.R));
        }
        return { n: cases.length, fkPos, fkRot, sceneGraphPos: sgPos, sceneGraphRot: sgRot };
      }
      window.DIKG = { robot, fkCheck, manifest: () => fetchJSON(DATA + "manifest.json") };
    });
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
