/* Real-robot media: a video slot that can be scrubbed to a parameter, and the gallery.
 * Dropping the files listed in manifest.json (real_media) into media/real/ and setting
 * "available": true is enough; missing files fall back to a placeholder. */
import { ASSETS, el, ROBOT_COLOR, mediaExists } from "./util.js";

const CAMERA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6" width="13" height="12" rx="2"/><path d="M15.5 10.5 21.5 7v10l-6-3.5z"/></svg>';

function placeholder(host, title, sub) {
  const p = el("div", { class: "dg-placeholder" }, host);
  p.innerHTML = CAMERA_ICON + "<b></b><span></span>";
  p.querySelector("b").textContent = title;
  p.querySelector("span").textContent = sub;
  return p;
}

/* A media box whose playhead follows a value in [0, 1]. */
export class ScrubVideo {
  constructor(host, { still = false } = {}) {
    this.box = el("div", { class: "dg-real-media" }, host);
    this.still = still;
    this.video = null;
    this.img = null;
    this.ph = null;
    this.bar = el("div", { class: "dg-scrub" }, this.box);
    this.fill = el("i", {}, this.bar);
    this.value = 0;
    this.token = 0;
  }

  async load(url, available, { robot, title, sub }) {
    const token = ++this.token;
    this.box.dataset.robot = robot;
    this.box.style.setProperty("--dg-robot", ROBOT_COLOR[robot].main);
    if (this.video) { this.video.remove(); this.video = null; }
    if (this.img) { this.img.remove(); this.img = null; }
    if (this.ph) { this.ph.remove(); this.ph = null; }
    const ok = available === true ? !!url && (await mediaExists(ASSETS + url)) : !!url && Array.isArray(available) && available.indexOf(url) >= 0;
    if (token !== this.token) return;
    if (!ok) {
      this.ph = placeholder(this.box, title, sub);
      this.box.insertBefore(this.ph, this.bar);
      return;
    }
    if (this.still) {
      this.img = el("img", { src: ASSETS + url, alt: title });
      this.box.insertBefore(this.img, this.bar);
      return;
    }
    const v = el("video", { muted: true, playsinline: true, preload: "auto", src: ASSETS + url, "aria-label": title });
    v.muted = true;
    v.addEventListener("loadedmetadata", () => this.seek(this.value));
    v.addEventListener("error", () => {
      if (token !== this.token) return;
      v.remove();
      this.video = null;
      this.ph = placeholder(this.box, title, sub);
      this.box.insertBefore(this.ph, this.bar);
    });
    this.video = v;
    this.box.insertBefore(v, this.bar);
  }

  /* Timing of a recorded clip (export_robot_trajectories.py): normalized clip time `tau` at path
   * positions `alpha` (a plain array means evenly spaced alpha in [0, 1]). The robot ramps up and down
   * smoothly, so the clip time is not proportional to the path position. */
  setTiming(entry) {
    this.timing = null;
    if (Array.isArray(entry) && entry.length > 1) {
      this.timing = { alpha: entry.map((_, i) => i / (entry.length - 1)), tau: entry };
    } else if (entry && Array.isArray(entry.tau) && Array.isArray(entry.alpha)) {
      this.timing = entry;
    }
  }

  clipFraction(a) {
    const T = this.timing;
    if (!T) return Math.max(0, Math.min(1, a));
    const x = T.alpha, y = T.tau, n = x.length;
    if (a <= x[0]) return y[0];
    if (a >= x[n - 1]) return y[n - 1];
    let i = 0;
    while (i < n - 2 && a > x[i + 1]) i++;
    return y[i] + (y[i + 1] - y[i]) * ((a - x[i]) / (x[i + 1] - x[i]));
  }

  seek(a) {
    this.value = a;
    this.fill.style.width = (100 * Math.max(0, Math.min(1, a))) + "%";
    const v = this.video;
    if (v && v.readyState >= 1 && isFinite(v.duration)) {
      const t = Math.max(0, Math.min(v.duration - 0.001, this.clipFraction(a) * v.duration));
      if (Math.abs(v.currentTime - t) > 0.01) v.currentTime = t;
    }
  }

  setSynced(on) {
    this.bar.classList.toggle("off", !on);
  }
}

/* The real-robot row of a widget exists only for robots recorded in the lab (the Franka); for the others
 * a one-line note replaces it. Returns a function robot -> whether the row is shown. */
export function realRobotRow(realHost, manifest) {
  const note = el("p", { class: "dg-real-note", hidden: true });
  note.innerHTML = "<i></i><span>Real-robot recordings use the Franka in our lab, and the UR5 results are simulated.</span>";
  realHost.after(note);
  const robots = (manifest.real_media && manifest.real_media.robots) || ["franka"];
  return (robot) => {
    const on = robots.indexOf(robot) >= 0;
    realHost.hidden = !on;
    note.hidden = on;
    return on;
  };
}

export async function initGallery(root, manifest) {
  const robots = (manifest.real_media && manifest.real_media.robots) || ["franka"];
  const items = ((manifest.real_media && manifest.real_media.gallery) || []).filter((it) => robots.indexOf(it.robot) >= 0);
  root.classList.toggle("single", items.length === 1);
  for (const it of items) {
    const card = el("div", { class: "dg-card", "data-robot": it.robot }, root);
    const box = el("div", { class: "dg-real-media" }, card);
    const have = manifest.real_media && manifest.real_media.have;
    const ok = Array.isArray(have) ? have.indexOf(it.src) >= 0 : it.available && (await mediaExists(ASSETS + it.src));
    if (ok) {
      el("video", { controls: true, playsinline: true, preload: "metadata", src: ASSETS + it.src, poster: it.poster ? ASSETS + it.poster : null, "aria-label": it.title }, box);
    } else {
      placeholder(box, "Video coming soon", manifest.robots[it.robot].long || manifest.robots[it.robot].label);
    }
    const cap = el("div", { class: "cap" }, card);
    el("b", { text: it.title }, cap);
    el("span", { text: ok ? "" : "Real-robot recording in preparation." }, cap);
  }
}
