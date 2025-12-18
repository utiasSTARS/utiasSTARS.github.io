---
layout: page
title: "VibES: Induced Vibration for Persistent Event-Based Sensing (3DV 2025)"
subtitle: ""
description: 3DV (2025) paper on using mechanical vibration for persistent event camera sensing
permalink: /vibes/
nav_order: 9982
nav_exclude: true
---

[<i class="fa fa-file-text-o" aria-hidden="true"></i> arXiv pre-print](https://arxiv.org/abs/2508.19094){: .btn .btn-blue } 
[<i class="fa fa-github" aria-hidden="true"></i> Code (Coming Soon)](https://github.com/utiasSTARS/VibES){: .btn .btn-green }

{::nomarkdown}
<div style="text-align:center">
  <h1>VibES: Induced Vibration for Persistent Event-Based Sensing</h1>
  <h3 style="color:red;">(3DV 2025)</h3>

  <p>
    <a href="https://polivi.iobii.com/">Vincenzo Polizzi<sup>1</sup></a>, 
    <a href="https://stephyang.xyz/">Stephen Yang<sup>1</sup></a>, 
    Quentin Clark<sup>2</sup>, 
    <a href="https://starslab.ca/people/prof-jonathan-kelly/">Jonathan Kelly<sup>1</sup></a>, 
    <a href="https://gilitschenski.org/igor/">Igor Gilitschenski<sup>2</sup></a>, 
    <a href="https://davidlindell.com/">David B. Lindell<sup>2</sup></a>
  </p>

  <p>
    <sup>1</sup>University of Toronto, Robotics Institute &nbsp;|&nbsp;
    <sup>2</sup>University of Toronto, Department of Computer Science
  </p>

  <img src="/assets/vibes/eyecatcher.png" width="100%">
</div>

<h2 class="text-center">Abstract</h2>
<div style='text-align:center; max-width: 900px; margin: 0 auto;'>
  <p style='text-align: justify; margin-bottom: 15px;'>
    Event cameras are a bio-inspired class of sensors that asynchronously measure per-pixel intensity changes. Under fixed illumination conditions in static or low-motion scenes, rigidly mounted event cameras are unable to generate any events, becoming unsuitable for most computer vision tasks. To address this limitation, recent work has investigated motion-induced event stimulation that often requires complex hardware or additional optical components. In contrast, we introduce a lightweight approach to sustain persistent event generation by employing a simple rotating unbalanced mass to induce periodic vibrational motion. This is combined with a motion-compensation pipeline that removes the injected motion and yields clean, motion-corrected events for downstream perception tasks. We demonstrate our approach with a hardware prototype and evaluate it on real-world captured datasets. Our method reliably recovers motion parameters and improves both image reconstruction and edge detection over event-based sensing without motion induction.
  </p>
</div>


<style>
/* ---------- Video viewport ---------- */
.video-viewport {
  position: relative;
  width: 100%;
  max-width: 640px;
  aspect-ratio: 640 / 360;
  overflow: hidden;
  margin: 40px auto;
  border-radius: 12px;
  background: #000;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

/* ---------- Vertical strip ---------- */
.video-wrapper {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 800%;              /* 8 stacked frames */
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;                /* BELOW bar */
}

#vibes_video {
  width: 100%;
  height: 100%;
  object-fit: fill;
  display: block;
}

/* ---------- Sliding bar (FIXED) ---------- */
#boundary_bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: #ff3e3e;
  box-shadow: 0 0 10px rgba(255,62,62,0.8);
  pointer-events: none;
  transition: left 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s;
  z-index: 5;                /* ABOVE video */
}

/* ---------- Slider ---------- */
.slider-container {
  max-width: 600px;
  margin: 20px auto;
  text-align: center;
}

.slider-container input {
  width: 100%;
  cursor: pointer;
}

.label-container {
  display: flex;
  justify-content: space-between;
  font-size: 0.8em;
  font-weight: bold;
  color: #555;
}

/* ---------- Contributions ---------- */
.contribution-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px,1fr));
  gap: 20px;
  margin: 30px 0;
}

.contribution-card {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* ---------- Citation ---------- */
.citation-box {
  position: relative;
  max-width: 900px;
  margin: 30px auto;
  padding: 10px;
  background: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.citation-pre {
  font-family: monospace;
  white-space: pre-wrap;
}

.copy-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #667eea;
  color: white;
  border: none;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.copy-btn:hover {
    background: #764ba2;
  }

  .hardware-specs {
    background: #f8f9fa;
    padding: 25px;
    border-radius: 8px;
    margin: 30px auto;
    max-width: 800px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .spec-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #ddd;
  }

  .spec-row:last-child {
    border-bottom: none;
  }

  .spec-label {
    font-weight: 600;
    color: #667eea;
  }
</style>

<h2 class="text-center">Interactive Compensation Visualization</h2>
<p class="text-center">
  Left: <b>Uncompensated</b> &nbsp;|&nbsp; Right: <b>Motion-Compensated</b>
</p>

<div class="video-viewport">
  <div class="video-wrapper" id="video_mover">
    <video id="vibes_video" muted autoplay loop playsinline>
      <source src="/assets/vibes/vibes_fast.mp4" type="video/mp4">
    </video>
  </div>
  <div id="boundary_bar"></div>
</div>

<div class="slider-container">
  <input type="range" id="vibes_slider" min="1" max="7" value="0" step="1">
  <div class="label-container">
    <span>12.5%</span><span>25%</span><span>37.5%</span>
    <span>50%</span><span>62.5%</span><span>75%</span><span>87.5%</span>
  </div>
</div>

<h2 class="text-center">Key Contributions</h2>
<div class="contribution-grid">
  <div class="contribution-card">
    <h4>🔧 Vibrating Event Camera</h4>
    <p>We design a vibrating event camera using a simple rotating unbalanced mass that enables event generation in static scenes, addressing a fundamental limitation of event cameras.</p>
  </div>
  <div class="contribution-card">
    <h4>⚡ Real-Time Compensation</h4>
    <p>We introduce a real-time motion-compensation pipeline that estimates and removes induced vibrations online, without requiring calibration or prior knowledge of physical parameters.</p>
  </div>
</div>
{:/}

{::nomarkdown}
<h2 class="text-center">Method Overview</h2>
{:/}

Our approach combines mechanical vibration with computational motion compensation to enable persistent event generation:

1. **Mechanical Vibration**: A DC motor with an eccentric mass induces controlled sinusoidal motion through a mass-spring-damper system
2. **Event Tracking**: HASTE tracker extracts centroid trajectories from the event stream
3. **Frequency Estimation**: Non-uniform FFT (NUFFT) determines the oscillation frequency
4. **Extended Kalman Filter**: Continuously tracks motion parameters (amplitude, frequency, phase)
5. **Motion Compensation**: Removes induced vibration to yield clean, motion-corrected events

{::nomarkdown}
<div style='text-align:center; margin: 40px 0;'>
  <img src='/assets/vibes/eyecatcher.png' width='100%' style='border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);'>
  <p style='margin-top: 15px; font-style: italic; color: #666;'>Figure: VibES processing pipeline from vibration induction to motion-compensated events</p>
</div>

<h2 class="text-center">Qualitative Results</h2>

<div style='text-align:center; margin: 40px 0;'>
  <img src='/assets/vibes/niqe_entropy.png' width='100%' style='border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);'>
  <p style='margin-top: 15px; font-style: italic; color: #666;'>Comparison showing (a) No Vibration: blurred accumulated events, (b) With Vibration: increased event density, (c) With Compensation: sharp, motion-corrected results</p>
</div>

<h3 class="text-center">Performance Across Datasets</h3>
{:/}

| Dataset | Metric | S-EV | VIBES | Improvement |
|---------|--------|------|-------|-------------|
| Logo | Entropy ↑ | 0.21±0.09 | **0.52±0.01** | +148% |
| Logo | NIQE ↓ | 8.6±9.4 | **5.1±0.3** | -41% |
| Pattern Checkerboard | Variance ↑ | 0.16±0.11 | **3.16±0.33** | +1875% |
| AMI-EV | Entropy ↑ | 0.08±0.05 | **0.24±0.04** | +200% |
| Pattern | Gradient Mag. ↑ | 0.19±0.09 | **0.30±0.06** | +58% |

{::nomarkdown}
<h2 class="text-center">Hardware Prototype</h2>

<div style='text-align:center; margin: 40px 0;'>
  <img src='/assets/vibes/mech_model.png' width='80%' style='border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);'>
  <p style='margin-top: 15px; font-style: italic; color: #666;'>Physical prototype showing the event camera with vibration mechanism</p>
</div>

<div class="hardware-specs">
  <h3 style="text-align: center; margin-bottom: 20px; color: #667eea;">System Specifications</h3>
  <div class="spec-row">
    <span class="spec-label">Event Camera:</span>
    <span>Prophesee EVK3 (IMX636, 1280×720 px)</span>
  </div>
  <div class="spec-row">
    <span class="spec-label">Motor:</span>
    <span>DC Hobby Motor with eccentric mass</span>
  </div>
  <div class="spec-row">
    <span class="spec-label">Power Consumption:</span>
    <span><strong>0.282W</strong> @ 2V (vs. 6-14W for pan-tilt alternatives)</span>
  </div>
  <div class="spec-row">
    <span class="spec-label">Frequency Range:</span>
    <span>30-500 rad/s (NUFFT estimation)</span>
  </div>
  <div class="spec-row">
    <span class="spec-label">Damping System:</span>
    <span>Foam-based passive spring-damper</span>
  </div>
  <div class="spec-row">
    <span class="spec-label">Motion Type:</span>
    <span>2D planar (X-Y image plane)</span>
  </div>
  <div class="spec-row">
    <span class="spec-label">Processing:</span>
    <span>C++ with Metavision API</span>
  </div>
</div>

<h2 class="text-center">Applications</h2>

<div class="contribution-grid">
  <div class="contribution-card">
    <h4>📸 Image Reconstruction</h4>
    <p>Generate high-quality images from events even in static scenes. E2VID reconstruction quality improved with NIQE scores 41% better for Logo scene.</p>
  </div>
  <div class="contribution-card">
    <h4>🔍 Edge Detection</h4>
    <p>Extract clean, continuous edges with reduced fragmentation. Contour length increased 87% and junction count improved dramatically.</p>
  </div>
  <div class="contribution-card">
    <h4>📊 Frequency Estimation</h4>
    <p>Accurately estimate vibration frequencies of objects in the scene. Tested 7.5-22.5 Hz range with <0.1 Hz error.</p>
  </div>
  <div class="contribution-card">
    <h4>📏 Relative Depth Awareness</h4>
    <p>Parallax from induced motion encodes depth information. Successfully predicted relative depth ratios (0.33, 0.50, 0.66) in synthetic scenes.</p>
  </div>
</div>

<h2 class="text-center">Power Efficiency Comparison</h2>
{:/}

| Method | Motor Type | Power Consumption | Notes |
|--------|-----------|-------------------|-------|
| **VibES (Ours)** | DC Hobby Motor | **0.282W** | Full power |
| Orchard et al. | Dynamixel MX-28T | 2.4W | Standby |
| Testa et al. (2020) | PTU-D46-17 | 6W - 13W | Low to full power |
| Testa et al. (2023) | PTU-E46 | 6W - 13W | Low to full power |
| AMI-EV | DJI M2006 BLDC | 14.4W | No-load |

{::nomarkdown}
<h2 class="text-center">Edge Quality Comparison</h2>
{:/}

| Scene | Status | Avg. Components ↓ | Avg. Length ↑ | Junction Count |
|-------|--------|------------------|---------------|----------------|
| **Logo** | S-EV | 265.8±221.4 | 3.6±3.1 | 136.5±165.8 |
| | **VIBES** | **175.0±52.5** | **32.1±10.8** | **979.3±349.2** |
| **Pattern Checkerboard** | S-EV | 300.3±232.9 | 6.7±5.3 | 193.2±176.3 |
| | **VIBES** | **140.7±40.2** | **49.9±17.3** | **691.3±63.2** |
| **AMI-EV** | S-EV | 91.1±17.2 | 4.2±2.4 | 63.3±54.6 |
| | **VIBES** | **82.9±14.1** | **8.3±1.6** | **147.9±31.8** |

{::nomarkdown}

<h2 class="text-center">Cite this work</h2>
<div class="citation-box">
  <button class="copy-btn" onclick="copyContent(this)">📋 Copy</button>
<pre class="citation-pre" id="citation-block">@inproceedings{polizzi_2026_3DV,
  title={VibES: Induced Vibration for Persistent Event-Based Sensing},
  author={Polizzi, Vincenzo and Yang, Stephen and Clark, Quentin and
          Kelly, Jonathan and Gilitschenski, Igor and Lindell, David B.},
  booktitle={International Conference on 3D Vision (3DV)},
  year={2026}
}</pre>
</div>

<script>
document.addEventListener("DOMContentLoaded", () => {
  const mover = document.getElementById("video_mover");
  const slider = document.getElementById("vibes_slider");
  const bar = document.getElementById("boundary_bar");

  function updateUI() {
    const step = Number(slider.value);

    /* vertical frame shift */
    mover.style.transform = `translateY(-${(step-1) * 12.5}%)`;

    /* horizontal boundary */
    const pos = step * 12.5;
    bar.style.left = pos + "%";
    bar.style.opacity = (pos >= 100) ? "0" : "1";
  }

  slider.addEventListener("input", updateUI);
  updateUI();
});

function copyContent(btn) {
  navigator.clipboard.writeText(
    document.getElementById("citation-block").innerText
  ).then(() => {
    btn.innerText = "✔ Copied!";
    setTimeout(() => btn.innerText = "📋 Copy", 1500);
  });
}
</script>
{:/}
