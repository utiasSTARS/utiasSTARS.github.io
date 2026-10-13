/* Main-thread side of the live demo's planners: two module workers running VAMP as WebAssembly.
 *   checker  validity checks and random goals; always quick, so the scene reacts while a plan runs
 *   planner  runs RRT-Connect, G-RRT* and AORRTC one after the other on one core, so that they
 *            compete under the same conditions; a new plan cancels a running one
 * The module is downloaded and compiled once on the main thread and handed to every worker, and the
 * worker's two scripts are fetched once and kept as Blob URLs, so a worker that is stopped (to cancel a
 * plan, or because the demo is off screen) comes back without any request, download or compile.
 *
 * Cancelling. A WebAssembly call cannot be interrupted, so a job that already runs in the worker is
 * cancelled by terminating the worker and starting a fresh one. A job is only posted once the worker
 * has initialised; one that still waits for that is cancelled on this side and never reaches the
 * worker, which therefore keeps initialising (one instantiation per worker, never two). */

const PLANNERS = ["rrtc", "aorrtc", "grrtstar"];            // run order, as listed in live.js

function cancelled() {
  return Object.assign(new Error("cancelled"), { cancelled: true });
}

/* The worker and the Emscripten glue it imports, fetched once and kept in memory as two Blob URLs (the
 * worker's import is pointed at the glue's blob). Every later worker then starts without a request; over
 * HTTP each restart would revalidate both files once their cache lifetime (ten minutes on GitHub Pages) is
 * over. The glue never needs its own URL here, because the compiled module is handed to it. */
async function workerBlob(workerUrl) {
  const GLUE = "../data/live/panda_wasm.js";
  const text = async (url) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + ": " + r.status);
    return r.text();
  };
  const [worker, glue] = await Promise.all([text(workerUrl), text(new URL(GLUE, workerUrl))]);
  if (!worker.includes(`"${GLUE}"`)) throw new Error("live-worker.js does not import " + GLUE);
  const blob = (src) => URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
  return blob(worker.replace(`"${GLUE}"`, JSON.stringify(blob(glue))));
}

class Channel {
  constructor(url, module) {
    this.url = url;
    this.module = module;
    this.next = 1;
    this.jobs = new Map();           // id -> {resolve, reject, onProgress, posted}
    this.spawned = 0;
    this.worker = null;
    this.ready = null;
    this.spawn();
  }

  spawn() {
    const worker = new Worker(this.url, { type: "module" });
    this.worker = worker;
    this.spawned++;
    this.dead = false;
    // The worker answers {type: "ready"} to init; nothing else is posted before that
    this.ready = new Promise((resolve, reject) => {
      worker.onmessage = (e) => {
        if (worker !== this.worker) return;
        const m = e.data;
        if (m.type === "ready") resolve(m);
        else if (m.type === "error" && m.id === 0) reject(new Error(m.message));
        else this.receive(m);
      };
      worker.onerror = (e) => {
        if (e.preventDefault) e.preventDefault();
        if (worker !== this.worker) return;
        const err = new Error(e.message || "worker error");
        this.dead = true;
        reject(err);
        this.jobs.forEach((j) => j.reject(err));
        this.jobs.clear();
      };
    });
    this.ready.catch(() => {});      // observed by call(); never an unhandled rejection
    worker.postMessage({ type: "init", id: 0, module: this.module });
  }

  receive(m) {
    const j = this.jobs.get(m.id);
    if (!j) return;
    if (m.type === "progress") {
      if (j.onProgress) j.onProgress(m);
      return;
    }
    this.jobs.delete(m.id);
    if (m.type === "error") j.reject(new Error(m.message));
    else j.resolve(m);
  }

  /* Post a job once the worker is ready; resolves with its answer, rejects with {cancelled: true} if cancelled. */
  call(msg, onProgress) {
    if (!this.worker || this.dead) this.spawn();
    const id = this.next++;
    const worker = this.worker;
    return new Promise((resolve, reject) => {
      const job = { resolve, reject, onProgress, posted: false };
      this.jobs.set(id, job);
      this.ready.then(() => {
        // Cancelled, or the worker was replaced, while waiting for it
        if (this.jobs.get(id) !== job || worker !== this.worker) return;
        job.posted = true;
        worker.postMessage(Object.assign({ id }, msg));
      }, (err) => {
        if (this.jobs.get(id) !== job) return;
        this.jobs.delete(id);
        reject(err);
      });
    });
  }

  busy() {
    return this.jobs.size > 0;
  }

  /* Cancel every job. Only a job that has reached the worker costs a restart. */
  cancel() {
    if (!this.jobs.size) return;
    let running = false;
    const err = cancelled();
    this.jobs.forEach((j) => { running = running || j.posted; j.reject(err); });
    this.jobs.clear();
    if (running && this.worker) {
      this.worker.terminate();
      this.spawn();
    }
  }

  /* Stop the worker and free its memory; the next call() starts a new one. */
  stop() {
    const err = cancelled();
    this.jobs.forEach((j) => j.reject(err));
    this.jobs.clear();
    if (this.worker) this.worker.terminate();
    this.worker = null;
    this.ready = null;
  }

  start() {
    if (!this.worker || this.dead) this.spawn();
    return this.ready;
  }
}

export class Planners {
  constructor() {
    this.runs = 0;
    this.compiles = 0;
  }

  /* base: URL of assets/grrtstar/ */
  static async create(base, onStage) {
    const wasmUrl = base + "data/live/panda_wasm.wasm";
    onStage && onStage("Loading VAMP");
    const p = new Planners();
    const blobs = workerBlob(new URL("./live-worker.js", import.meta.url));      // alongside the module
    blobs.catch(() => {});
    try {
      p.module = await WebAssembly.compileStreaming(fetch(wasmUrl));
    } catch (e) {
      // Servers that do not send application/wasm
      const r = await fetch(wasmUrl);
      if (!r.ok) throw new Error(wasmUrl + ": " + r.status);
      p.module = await WebAssembly.compile(await r.arrayBuffer());
    }
    p.compiles++;
    const url = new URL("./live-worker.js", import.meta.url);
    const spawn = async (from, patience) => {
      p.checker = new Channel(from, p.module);
      p.planner = new Channel(from, p.module);
      const late = new Promise((_, reject) => setTimeout(() => reject(new Error("the workers did not start")), patience));
      const [info] = await Promise.race([Promise.all([p.checker.ready, p.planner.ready]), late]);
      p.info = info;
    };
    const blob = await blobs.catch(() => null);
    try {
      await spawn(blob || url, blob ? 8000 : 60000);
      p.fromMemory = !!blob;
    } catch (err) {
      // A browser that cannot start a module worker from a Blob URL: the plain URL, through the HTTP cache
      if (!blob) throw err;
      p.checker.stop();
      p.planner.stop();
      await spawn(url, 60000);
      p.fromMemory = false;
    }
    return p;
  }

  /* Workers running, workers started so far, and how often the module was compiled (always once). */
  stats() {
    return {
      workers: (this.checker.worker ? 1 : 0) + (this.planner.worker ? 1 : 0),
      spawned: this.checker.spawned + this.planner.spawned,
      compiles: this.compiles,
      fromMemory: !!this.fromMemory
    };
  }

  /* WebAssembly memory held by the running workers, in bytes: {checker, planner} */
  async memory() {
    const one = (ch) => (ch.worker ? ch.call({ type: "stats" }).then((r) => r.memory, () => 0) : Promise.resolve(0));
    const [checker, planner] = await Promise.all([one(this.checker), one(this.planner)]);
    return { checker, planner };
  }

  get suspended() {
    return !this.checker.worker && !this.planner.worker;
  }

  /* Stop both workers (the demo is off screen or the tab is hidden). The compiled module stays. */
  suspend() {
    this.runs++;
    this.checker.stop();
    this.planner.stop();
  }

  /* Start the workers again from the compiled module. */
  resume() {
    return Promise.all([this.checker.start(), this.planner.start()]);
  }

  async check(obstacles, configs) {
    const r = await this.checker.call({ type: "check", obstacles, configs });
    return r.results;
  }

  async random(obstacles, region, start) {
    const r = await this.checker.call({ type: "random", obstacles, region, start });
    return r.q;
  }

  async warmup(job) {
    await this.planner.call(Object.assign({ type: "warmup" }, job));
  }

  /* Plan with each planner in turn. job: {start, goal, obstacles, budget, seed}.
   * onProgress(planner, points) streams the anytime improvements, onResult(planner, result) each result.
   * Rejects with {cancelled: true} when another plan, cancel() or suspend() takes over. */
  async plan(job, { onStart, onProgress, onResult } = {}) {
    this.planner.cancel();
    const run = ++this.runs;
    const out = {};
    for (const planner of PLANNERS) {
      if (this.runs !== run) throw cancelled();
      onStart && onStart(planner);
      const r = await this.planner.call(Object.assign({ type: "plan", planner }, job), (m) => {
        if (this.runs === run && onProgress) onProgress(planner, m.points);
      });
      if (this.runs !== run) throw cancelled();
      out[planner] = r;
      onResult && onResult(planner, r);
    }
    return out;
  }

  cancel() {
    this.runs++;
    this.planner.cancel();
  }
}

export { PLANNERS };
