/* Real-robot reel: the straight latent path of the four Franka constraints recorded in the lab (the same examples
 * as in the "Walk the latent space" widget), in one player with a tab per constraint. The slower clips are sped up
 * by a constant factor, shown on the video. Until a tab is picked, the reel plays each clip once in turn, showing
 * the progress in the active tab, and then loops the first. It plays muted and only while on screen.
 * manifest.real_media.have lists the files present under media/real/. */
import { ASSETS, el, reducedMotion, segmented } from "./util.js";

const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6L19 12z"/></svg>';
const PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/></svg>';
const CLIPS = [
  { key: "plane", speed: 1, note: "The gripper moves freely at a fixed height." },
  { key: "posonly", speed: 2, note: "The gripper stays at one point while it turns and the arm reconfigures." },
  { key: "line_orient", speed: 2, note: "The gripper slides along a horizontal line with a fixed pointing direction, and it may still spin about its own axis." },
  { key: "se3", speed: 4, note: "The gripper holds its full pose while the arm moves through its self-motion." }
];

export async function initReel(root, manifest) {
  const have = manifest.real_media && manifest.real_media.have;
  const present = (src) => !Array.isArray(have) || have.indexOf(src) >= 0;
  const n = manifest.robots.franka.n;
  const clips = CLIPS.map((c) => {
    const meta = manifest.constraints.find((x) => x.key === c.key);
    const base = "media/real/franka_" + c.key + "_line";
    return meta && { ...c, label: meta.label, id: n - meta.k, src: base + ".mp4", poster: present(base + ".jpg") ? base + ".jpg" : null };
  }).filter((c) => c && present(c.src));
  if (!clips.length) { root.hidden = true; return; }

  const tabs = el("div", { class: "dg-reel-tabs" }, root);
  const stage = el("div", { class: "dg-reel-stage paused" }, root);
  const video = el("video", { muted: true, playsinline: true, preload: reducedMotion() ? "none" : "metadata" }, stage);
  video.muted = true;
  const speed = el("span", { class: "dg-reel-speed" }, stage);
  const toggle = el("button", { type: "button", class: "dg-reel-toggle" }, stage);
  const notice = el("div", { class: "dg-reel-notice", hidden: true, text: "Video unavailable" }, stage);
  const cap = el("p", { class: "dg-reel-cap", "aria-live": "off" }, root);

  let cur = 0, auto = true, played = 0, visible = false, userPaused = reducedMotion(), fails = 0;
  const seg = segmented(tabs, clips.map((c, i) => ({ value: i, label: c.label })), 0, (i) => pick(i), { label: "Constraint" });

  function pick(i) {
    auto = false;
    userPaused = false;
    cap.setAttribute("aria-live", "polite");
    if (i === cur && notice.hidden) { sync(); return; }             // the active tab: keep playing, no reload
    show(i);
  }

  function show(i) {
    cur = i;
    seg.set(i);
    seg.buttons.forEach((b) => b.style.removeProperty("--p"));
    const c = clips[i];
    notice.hidden = true;
    if (c.poster) video.poster = ASSETS + c.poster;
    else video.removeAttribute("poster");
    video.src = ASSETS + c.src;
    video.setAttribute("aria-label", "Franka, " + c.label + ", straight latent path" + (c.speed > 1 ? ", " + c.speed + " times speed" : ""));
    speed.textContent = c.speed > 1 ? c.speed + "× speed" : "Real time";
    cap.innerHTML = "";
    el("b", { text: c.label }, cap);
    el("span", { class: "id", title: "Intrinsic dimension", text: "ID " + c.id }, cap);
    el("span", { class: "note", text: c.note }, cap);
    sync();
  }

  function render() {
    const on = !video.paused;
    stage.classList.toggle("paused", !on);
    toggle.innerHTML = on ? PAUSE : PLAY;
    toggle.setAttribute("aria-label", on ? "Pause the video" : "Play the video");
  }

  function sync() {
    if (visible && !userPaused && notice.hidden) {
      video.preload = "auto";
      video.play().catch(() => { userPaused = true; render(); });
    } else video.pause();
    render();
  }

  function tick() {
    if (video.duration) seg.buttons[cur].style.setProperty("--p", (100 * video.currentTime / video.duration).toFixed(2) + "%");
    if (!video.paused) requestAnimationFrame(tick);
  }

  video.addEventListener("play", () => { render(); requestAnimationFrame(tick); });
  video.addEventListener("pause", render);
  video.addEventListener("playing", () => { fails = 0; });
  video.addEventListener("ended", () => {
    if (auto && ++played < clips.length) { show((cur + 1) % clips.length); return; }
    if (auto) { auto = false; show(0); return; }                      // one full round, then loop the first clip
    video.currentTime = 0;
    sync();
  });
  video.addEventListener("error", () => {
    if (auto && ++fails < clips.length) { played++; show((cur + 1) % clips.length); return; }
    notice.hidden = false;
    video.pause();
    render();
  });
  stage.addEventListener("click", () => { userPaused = !video.paused; sync(); });
  tabs.addEventListener("keydown", (e) => {
    if (e.altKey || e.metaKey || e.ctrlKey) return;
    const last = clips.length - 1;
    const i = e.key === "ArrowRight" ? (cur + 1) % clips.length : e.key === "ArrowLeft" ? (cur + last) % clips.length
      : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (i < 0) return;
    e.preventDefault();
    pick(i);
    seg.buttons[i].focus();
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].intersectionRatio >= 0.4;
      sync();
    }, { threshold: [0, 0.4, 1] }).observe(stage);
  } else visible = true;
  show(0);
}
