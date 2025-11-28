---
layout: page
title: "VibES: Induced Vibration for Persistent Event-Based Sensing (3DV 2025)"
subtitle: ""
description: 3DV (2025) paper on using mechanical vibration for persistent event camera sensing
permalink: /vibes/
nav_order: 9982
nav_exclude: true
# youtubeId: placeholder_video_id
---

<!-- [<i class="fa fa-file-text-o" aria-hidden="true"></i> Paper (3DV)](#){: .btn .btn-purple }  -->
[<i class="fa fa-file-text-o" aria-hidden="true"></i> arXiv pre-print](https://arxiv.org/abs/2508.19094){: .btn .btn-blue } 
[<i class="fa fa-github" aria-hidden="true"></i> Code (Coming Soon)](https://github.com/utiasSTARS/VibES){: .btn .btn-green }
<!-- [<i class="fa fa-file-text-o" aria-hidden="true"></i> 3DV proceedings](#){: .btn } -->

{::nomarkdown}
<div style='text-align:center'>
  <h1>VibES: Induced Vibration for Persistent Event-Based Sensing</h1>
  <h3 style="color:red;">(3DV 2025)</h3>
  <div class="container_">
    <p class="masthead-subheading font-weight-light mb-0">
    <a href="https://polivi.iobii.com/">Vincenzo Polizzi<sup>1</sup></a>, 
    <a href="#">Stephen Yang<sup>1</sup></a>, 
    <a href="#">Quentin Clark<sup>2</sup></a>, 
    <a href="https://starslab.ca/people/prof-jonathan-kelly/">Jonathan Kelly<sup>1</sup></a>, 
    <a href="https://gilitschenski.org/igor/">Igor Gilitschenski<sup>2</sup></a>, 
    <a href="https://davidlindell.com/">David B. Lindell<sup>2</sup></a>
    </p>
    <br>
    <p class="masthead-subheading font-weight-light mb-0"><sup>1</sup>University of Toronto, Robotics Institute &nbsp;|&nbsp; <sup>2</sup>University of Toronto, Department of Computer Science</p>
    <br>
  </div>
  <br>
  <img src='/assets/vibes/eyecatcher.png' width='100%'>
</div>
{:/}

<!-- {% include youtubePlayer.html id=page.youtubeId %} -->

{::nomarkdown}
<h2 class="text-center">Abstract</h2>
<div style='text-align:center; max-width: 900px; margin: 0 auto;'>
  <p style='text-align: justify; margin-bottom: 15px;'>
    Event cameras are a bio-inspired class of sensors that asynchronously measure per-pixel intensity changes. Under fixed illumination conditions in static or low-motion scenes, rigidly mounted event cameras are unable to generate any events, becoming unsuitable for most computer vision tasks. To address this limitation, recent work has investigated motion-induced event stimulation that often requires complex hardware or additional optical components. In contrast, we introduce a lightweight approach to sustain persistent event generation by employing a simple rotating unbalanced mass to induce periodic vibrational motion. This is combined with a motion-compensation pipeline that removes the injected motion and yields clean, motion-corrected events for downstream perception tasks. We demonstrate our approach with a hardware prototype and evaluate it on real-world captured datasets. Our method reliably recovers motion parameters and improves both image reconstruction and edge detection over event-based sensing without motion induction.
  </p>
</div>

<style>
  .double-underline {
    text-decoration: underline;
    text-decoration-style: double;
  }

  .contribution-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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

  .contribution-card h4 {
    color: #667eea;
    margin-bottom: 10px;
    font-size: 1.2em;
  }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin: 30px 0;
  }

  .result-card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    text-align: center;
    border-top: 3px solid #764ba2;
  }

  .result-card h4 {
    color: #764ba2;
    margin-bottom: 10px;
    font-size: 1.1em;
  }

  .metric {
    font-size: 2.5em;
    font-weight: bold;
    color: #667eea;
    margin: 10px 0;
  }

  .comparison-table {
    width: 100%;
    border-collapse: collapse;
    margin: 30px 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .comparison-table th,
  .comparison-table td {
    padding: 12px;
    text-align: center;
    border: 1px solid #ddd;
  }

  .comparison-table th {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
  }

  .comparison-table tr:nth-child(even) {
    background-color: #f8f9fa;
  }

  .highlight-best {
    background-color: #d4edda !important;
    font-weight: bold;
  }

  .citation-box {
    position: relative;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 10px;
    background-color: #f8f8f8;
    margin: 30px auto;
    max-width: 900px;
  }

  .citation-pre {
    width: 100%;
    padding: 10px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    border: none;
    background-color: #f8f8f8;
    white-space: pre-wrap;
    margin: 0;
  }

  .copy-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    border: none;
    background: #667eea;
    color: white;
    padding: 5px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.3s ease;
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
  <div class="contribution-card">
    <h4>✅ Validated Performance</h4>
    <p>We validate our method on four real-world datasets, demonstrating improved event density and higher-quality results for edge detection and image reconstruction.</p>
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

<h2 class="text-center">Quantitative Results</h2>

<div class="results-grid">
  <div class="result-card">
    <h4>Shannon Entropy</h4>
    <div class="metric">↑148%</div>
    <p>Logo scene: 0.21±0.09 → 0.52±0.01</p>
  </div>
  <div class="result-card">
    <h4>Image Variance</h4>
    <div class="metric">↑1875%</div>
    <p>Pattern Checkerboard: 0.16±0.11 → 3.16±0.33</p>
  </div>
  <div class="result-card">
    <h4>Edge Continuity</h4>
    <div class="metric">↑87%</div>
    <p>Logo scene: Average contour length increased dramatically</p>
  </div>
  <div class="result-card">
    <h4>Processing Speed</h4>
    <div class="metric">65 Mev/s</div>
    <p>Real-time: 15.28ns per event</p>
  </div>
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
    <button class="copy-btn" onclick="copyContent(this)" title="Copy to clipboard">
        📋 Copy
    </button>
    <pre class="citation-pre" id="citation-block">@inproceedings{polizzi_2026_3DV,
  title={VibES: Induced Vibration for Persistent Event-Based Sensing},
  author={Polizzi, Vincenzo and Yang, Stephen and Clark, Quentin and 
          Kelly, Jonathan and Gilitschenski, Igor and Lindell, David B.},
  booktitle={International Conference on 3D Vision (3DV)},
  year={2026}
}</pre>
</div>

<script>
    function copyContent(button) {
        const codeBox = button.closest('.citation-box').querySelector('pre');
        const code = codeBox.innerText;
        navigator.clipboard.writeText(code).then(() => {
            button.innerText = '✔️ Copied!';
            setTimeout(() => {
                button.innerText = '📋 Copy';
            }, 1500);
        }).catch(err => {
            console.error('Error copying text: ', err);
        });
    }
</script>
{:/}