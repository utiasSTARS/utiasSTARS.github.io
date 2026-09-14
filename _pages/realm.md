---
layout: page
title: "REALM: An RGB- and Event-Aligned Latent Manifold for Cross-Modal Perception"
subtitle: ""
description: Cross-modal framework projecting event representations into the pretrained latent space of RGB foundation models.
permalink: /realm/
nav_order: 9981
nav_exclude: false
youtubeId: zi1l7-jrxEY
---

<style>
  /* Hugging Face Yellow Button */
  .btn.btn-yellow {
    color: #ffffff; /* Black text for high contrast */
    background-color: #FFD21E; /* Hugging Face yellow */
    border-color: #FFD21E;
  }

  .btn.btn-yellow:hover {
    background-color: #e6bd1b; /* Slightly darker on hover */
    border-color: #e6bd1b;
    color: #ffffff;
    text-decoration: none;
  }
</style>
[<i class="fa fa-file-text-o" aria-hidden="true"></i>  Springer Nature](https://link.springer.com/chapter/10.1007/978-3-032-37369-4_1){: .btn
.btn-purple } 
[<i class="fa fa-file-text-o" aria-hidden="true"></i>  arXiv pre-print ](https://arxiv.org/abs/2605.00271){: .btn .btn-blue } 
[<i class="fa fa-github" aria-hidden="true"></i> View it on Github](https://github.com/utiasSTARS/REALM){: .btn .btn-purple }
[<i class="fa-brands fa-hugging-face" aria-hidden="true"></i> Demo](https://viciopoli-realm-demo.hf.space){: .btn .btn-yellow }
[<i class="fa fa-file-text-o" aria-hidden="true"></i> Poster](https://drive.google.com/file/d/1NZm2DoNwsvJvTFdluxJhGeztvmebJyo7/view?usp=sharing){: .btn }

{::nomarkdown}
<div style='text-align:center'>
  <img src='/assets/realm/logo.png' alt='REALM Logo' width='400' style="margin-bottom: 20px;" />
  <h1>An RGB- and Event-Aligned Latent Manifold for Cross-Modal Perception</h1>
  <h3 style="color:red;">(ECCV 2026)</h3>
  <p style="max-width: 750px; margin: 10px auto 25px auto; font-size: 1.1em; color: #444; text-align: left;">
    <strong>TL;DR:</strong> REALM maps event-camera data into the frozen latent space of the DUNE RGB foundation model using lightweight LoRA adapters &mdash; no task-specific training. This lets a single encoder drive depth estimation and segmentation via simple linear heads, and enables the direct, zero-shot use of frozen image-trained decoders like MASt3R on raw event data, setting a new state of the art in event-based feature matching.
  </p>
  <div class="container_">
    <p class="masthead-subheading font-weight-light mb-0">
    <a href="https://polivi.iobii.com/">Vincenzo Polizzi<sup>1</sup></a>, 
    <a href="https://davidlindell.com/">David B. Lindell<sup>2</sup></a>, 
    <a href="https://starslab.ca/people/prof-jonathan-kelly/">Jonathan Kelly<sup>1</sup></a></p>
    <br>
    <p class="masthead-subheading font-weight-light mb-0">
      <sup>1</sup>University of Toronto, Robotics Institute<br>
      <sup>2</sup>University of Toronto, Department of Computer Science
    </p>
    <br>
  </div>
  <br>
  <img style="border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" src='/assets/realm/realm_slam_x8.gif' width='100%' alt='REALM Demo'>
  <p style="margin-top: 12px; color: #555; font-size: 0.95em; text-align: center;">
    REALM running in MASt3R-SLAM &mdash; a demo application, not part of the paper.
  </p>
</div>

<div style="position:relative; z-index:10; isolation:isolate; width:100%; max-width:900px; margin:30px auto; background:#000; border-radius:8px; overflow:hidden; box-shadow:0 4px 8px rgba(0,0,0,0.1);">
  <iframe
    src="https://www.youtube.com/embed/{{ page.youtubeId }}"
    title="REALM"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
    style="display:block; width:100%; aspect-ratio:16/9; height:auto; border:0;">
  </iframe>
</div>

<h2 class="text-center">Abstract</h2>
<div style='text-align:center'>
  Event cameras provide several unique advantages over standard frame-based sensors, including high temporal resolution, low latency, and robustness to extreme lighting. However, existing learning-based approaches for event processing are typically confined to narrow, task-specific silos and lack the ability to generalize across modalities. We address this gap with REALM, a cross-modal framework that learns an RGB and Event Aligned Latent Manifold by projecting event representations into the pretrained latent space of RGB foundation models. Instead of task-specific training, we leverage low-rank adaptation (LoRA) to bridge the modality gap, effectively unlocking the geometric and semantic priors of frozen RGB backbones for asynchronous event streams. We demonstrate that REALM effectively maps events into the ViT-based foundation latent space. Our method allows us to perform downstream tasks like depth estimation and semantic segmentation by simply transferring linear heads trained on the RGB teacher. Most significantly, REALM enables the direct, zero-shot application of complex, frozen image-trained decoders, such as MASt3R, to raw event data. We demonstrate state-of-the-art performance in wide-baseline feature matching, significantly outperforming specialized architectures.
</div>

<div class="centered-image-container" style="margin-top: 30px; flex-direction: column;">
  <img src="/assets/realm/media/fig_overview.png" alt="REALM overview: events are mapped by REALM into DUNE's latent space, enabling zero-shot MASt3R-based feature matching and 3D reconstruction, as well as semantic segmentation and depth estimation via simple linear heads." style="max-width: 900px; width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  <p style="max-width: 900px; margin-top: 12px; color: #555; font-size: 0.95em; text-align: center;">
    By mapping a sparse event stream into DUNE's latent space, REALM enables diverse downstream applications: zero-shot feature matching and 3D reconstruction with the frozen MASt3R decoder, and dense prediction tasks like semantic segmentation and depth estimation using simple linear heads.
  </p>
</div>

<h2 class="text-center">Highlights</h2>
<div class="container" style="max-width: 1000px;">
  <div class="card" style="cursor: default; max-width: 100%; flex: 1 1 260px; padding: 18px;">
    <h3 style="margin-bottom: 8px;">One encoder, many tasks</h3>
    <p style="font-size: 0.95em; color: #444;">A single frozen encoder, aligned to DUNE's latent manifold via lightweight LoRA adapters, supports depth, segmentation, and feature matching &mdash; no task-specific training on events.</p>
  </div>
  <div class="card" style="cursor: default; max-width: 100%; flex: 1 1 260px; padding: 18px;">
    <h3 style="margin-bottom: 8px;">Zero-shot frozen decoders</h3>
    <p style="font-size: 0.95em; color: #444;">The RGB-trained MASt3R matching head is applied directly to event features with no fine-tuning, treating events as native RGB representations.</p>
  </div>
  <div class="card" style="cursor: default; max-width: 100%; flex: 1 1 260px; padding: 18px;">
    <h3 style="margin-bottom: 8px;">State of the art in matching</h3>
    <p style="font-size: 0.95em; color: #444;">REALM outperforms specialized event-only baselines in wide-baseline feature matching and pose estimation, and even surpasses its own RGB teacher at night.</p>
  </div>
</div>

<h2 class="text-center">Method</h2>
<p style="max-width: 900px; margin: 0 auto 20px auto; text-align: left;">
  REALM builds on <strong>DUNE</strong>, a universal ViT encoder distilled from heterogeneous RGB and 3D teachers (including MASt3R). We replace DUNE's image patch embedder with a lightweight convolutional stem that maps a 5-bin event voxel grid into the same token format, and adapt the frozen backbone to the event modality with <strong>Low-Rank Adaptation (LoRA)</strong> &mdash; leaving the pretrained weights untouched to avoid catastrophic forgetting. Training uses a dual-masking distillation strategy: a <strong>progressive spatial mask</strong> restricts the distillation loss to regions with active events early in training (to avoid hallucinating static backgrounds the event stream never observed) and gradually dilates outward to encourage holistic scene understanding, while <strong>MAE-style patch dropout</strong> forces the encoder to build compressed, context-aware representations rather than relying on local interpolation.
</p>

<div class="centered-image-container" style="margin-bottom: 10px; flex-direction: column;">
  <img src="/assets/realm/media/fig_architecture.png" alt="Overview of the cross-modal distillation framework: event representations undergo MAE-style patch dropout before being processed by a trainable embedding layer and a LoRA-adapted student encoder, trained to match the frozen DUNE teacher under a progressive spatial mask." style="max-width: 850px; width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  <p style="max-width: 850px; margin-top: 12px; color: #555; font-size: 0.95em; text-align: center;">
    Event representations undergo MAE-style patch dropout before being processed by a trainable embedding layer and a LoRA-adapted student encoder. The network is trained to match the latent representation of the frozen DUNE teacher, with a progressive spatial mask focusing the distillation loss on regions with active event data.
  </p>
</div>

<div class="centered-image-container" style="margin-top: 30px; flex-direction: column;">
  <img src="/assets/realm/media/fig_umap.png" alt="Qualitative comparison of DUNE and REALM feature manifolds via PCA, and a UMAP plot showing RGB and event features forming consistent clusters." style="max-width: 900px; width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  <p style="max-width: 900px; margin-top: 12px; color: #555; font-size: 0.95em; text-align: center;">
    Spatial feature maps (PCA) show that REALM implicitly segments objects and identifies semantic structures similarly to the RGB teacher, while the masking strategy avoids representing the static background that is invisible to the events. The UMAP plot (right) confirms this alignment, showing consistent clusters where event features sit close to their RGB counterparts &mdash; enabling zero-shot transfer of downstream tasks.
  </p>
</div>

<h2 class="text-center">Interactive Demo</h2>
<p class="text-center">
  Try REALM on your own data. Upload an RGB image and an event voxel grid (see github repo on how to obtain it).
</p>

<div class="centered-image-container" style="margin-top: 30px; margin-bottom: 30px;">
  <iframe 
    src="https://viciopoli-realm-demo.hf.space"
    frameborder="0" 
    width="100%" 
    height="1200" 
    style="border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  </iframe>
</div>

<style>
  /* Scoped box-sizing — replaces the old global * reset.
     The global version zeroed margin/padding on the theme's
     wrappers too, which let .site-footer overlap the video. */
  .realm-container,
  .realm-container *,
  .card,
  .card *,
  .modal,
  .modal *,
  .citation-box,
  .citation-box *,
  .seg-container-wrapper,
  .seg-container-wrapper * {
    box-sizing: border-box;
  }

  .double-underline {
    text-decoration: underline;
    text-decoration-style: double;
  }

  /* Container Styling */
  .realm-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center; /* This centers the bottom row */
    gap: 16px;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Card Styling */
  .card {
    flex: 1 1 300px; /* Allows cards to grow and shrink with a base width of 300px */
    max-width: 350px; /* Stops a lone card from stretching across the entire screen */
    position: relative;
    background-color: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition: transform 0.3s;
  }

  /* Scale up the card slightly on hover */
  .card:hover {
    transform: scale(1.05);
  }

  /* Image Styling */
  .card img {
    width: 100%;
    height: auto;
    display: block;
  }
  

  /* Hover Overlay with "+" icon */
  .card .overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
    color: white;
    font-size: 3em;
    font-weight: bold;
  }

  /* Show the overlay on hover */
  .card:hover .overlay {
    opacity: 1;
  }

  /* Modal Styling */
  .modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background-color: white;
    padding: 20px;
    max-width: 1200px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    border-radius: 8px;
    position: relative;
    text-align: center;
  }

  /* Close Button */
  .close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 1.5em;
    cursor: pointer;
  }

  /* Divider and Title */
  .divider-custom {
    display: flex;
    align-items: center;
    margin: 20px 0;
  }

  .divider-custom-line {
    flex: 1;
    height: 1px;
    background-color: #ccc;
  }

  .divider-custom-icon {
    margin: 0 10px;
    font-size: 1.5em;
    color: #333;
  }

  /* Slider Styling */
  .slider-container {
    margin-top: 20px;
  }

  .video-viewport {
    max-width: 512px;
    aspect-ratio: 512 / 288;
    overflow: hidden;
    position: relative;
  }

  .video-viewport video,
  .video-viewport img {
    width: 100%;
    height: auto;
  }

  .citation-box {
    width: 100%;
    max-width: 1000px;
    margin: 20px auto;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    background-color: #f9f9f9;
    position: relative;
  }

  .citation-pre {
    width: 100%;
    padding: 10px;
    font-family: monospace;
    font-size: 14px;
    border: none;
    background-color: #f9f9f9;
    white-space: pre-wrap;
    text-align: left;
  }

  .centered-image-container {
    display: flex;s
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }

  .copy-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 16px;
    transition: transform 0.3s ease;
  }

  .copy-btn:hover {
    transform: scale(1.2);
  }

  /* Constraints specifically for the Segmentation Modal Content */
  .seg-container-wrapper {
    width: 80%;
    margin: 0 auto 30px auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* Force the legend to span the full width and divide into exactly 4 equal parts */
  .seg-legend-container {
    display: flex;
    width: 100%;
    margin-bottom: 10px;
  }

  .seg-legend-container span {
    flex: 1; /* Forces each span to take exactly 25% of the width */
    text-align: center;
    font-weight: bold;
    font-size: 1.1em;
    color: #333;
  }
</style>

<h2 class="text-center">Qualitative Results on Downstream Tasks</h2>
<div class="container">
  <div class="card" onclick="openModal('portfolioModal1')">
    <img src="/assets/realm/media/depth_thumb.png" alt="Depth Estimation Preview" />
    <div class="overlay">+</div>
  </div>

  <div class="card" onclick="openModal('portfolioModal2')">
    <img src="/assets/realm/media/seg_thumb.png" alt="Semantic Segmentation Preview">
    <div class="overlay">+</div>
  </div>

  <div class="card" onclick="openModal('portfolioModal3')">
    <img src="/assets/realm/media/match_thumb.png" alt="Feature Matching Preview">
    <div class="overlay">+</div>
  </div>
</div>

<div id="portfolioModal1" class="modal" onclick="closeModalOutside(event, 'portfolioModal1')">
  <div class="modal-content">
    <span class="close-button" onclick="closeModal('portfolioModal1')">&times;</span>
    <h2 class="portfolio-modal-title">Monocular Depth Estimation</h2>
    <div class="divider-custom">
      <div class="divider-custom-line"></div>
      <div class="divider-custom-icon"><i class="fa fa-camera"></i></div>
      <div class="divider-custom-line"></div>
    </div>
    <p>REALM preserves dense scene structures using a simple linear projector evaluated on MVSEC sequences, showcasing strong robustness in challenging nighttime conditions where frame-based sensing degrades.</p>
    
    <div class="seg-container-wrapper">
        <div class="seg-legend-container">
            <span>RGB</span>
            <span>Events</span>
            <span>GroundTruth</span>
            <span>REALM</span>
        </div>
        
        <div class="centered-image-container" style="display: flex; justify-content: center; align-items: center;">
          <div class="video-viewport" style="max-width: 100%; width: 100%;">
            <img id="video_2" src="/assets/realm/media/depth.gif" alt="REALM Segmentation" style="width: 100%; height: auto;">
          </div>
        </div>
    </div>

  </div>
</div>


<div id="portfolioModal2" class="modal" onclick="closeModalOutside(event, 'portfolioModal2')">
  <div class="modal-content">
    <span class="close-button" onclick="closeModal('portfolioModal2')">&times;</span>
    <h2 class="portfolio-modal-title">Dense Semantic Segmentation</h2>
    <div class="divider-custom">
      <div class="divider-custom-line"></div>
      <div class="divider-custom-icon"><i class="fa fa-camera"></i></div>
      <div class="divider-custom-line"></div>
    </div>
    <p>REALM effectively identifies key classes (e.g., road, vehicles, pedestrians) on the DSEC driving dataset using a frozen backbone and a single linear head, inheriting strong scene understanding directly from the RGB teacher.</p>
    
    <div class="seg-container-wrapper">
        <div class="seg-legend-container">
            <span>RGB</span>
            <span>Events</span>
            <span>GroundTruth</span>
            <span>REALM</span>
        </div>
        
        <div class="centered-image-container" style="display: flex; justify-content: center; align-items: center;">
          <div class="video-viewport" style="max-width: 100%; width: 100%;">
            <img id="video_2" src="/assets/realm/media/seg.gif" alt="REALM Segmentation" style="width: 100%; height: auto;">
          </div>
        </div>
    </div>

  </div>
</div>

<div id="portfolioModal3" class="modal" onclick="closeModalOutside(event, 'portfolioModal3')">
  <div class="modal-content">
    <span class="close-button" onclick="closeModal('portfolioModal3')">&times;</span>
    <h2 class="portfolio-modal-title">Cross-Modal Feature Matching</h2>
    <div class="divider-custom">
      <div class="divider-custom-line"></div>
      <div class="divider-custom-icon"><i class="fa fa-camera"></i></div>
      <div class="divider-custom-line"></div>
    </div>
    <p>Zero-shot cross-modal (RGB-Event) and intra-modal (Event-Event) matching leveraging the frozen MASt3R decoder. REALM operates natively in a geometrically consistent latent space to produce robust correspondences under wide viewpoints.<br>
    In green are the correct matches in orange the incorrect ones (given by RANSAC).</p>
    <div class="centered-image-container">
      <div class="video-viewport">
        <img id="video_3" src="/assets/realm/media/ie_matches_robot_fast.gif">
      </div>
    </div>
  </div>
</div>

<script src="/assets/realm/scripts.js"></script>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    text-align: center;
    margin-bottom: 30px;
  }

  th, td {
    padding: 8px 12px;
    border: 1px solid #ddd;
  }

  .fixed-header, .fixed-cell {
    position: sticky;
    background-color: #f9f9f9;
    z-index: 1;
    left: 0;
  }

  .fixed-header {
    z-index: 2;
  }

  .highlight-column {
    background-color: #e6f7ff;
  }

  .highlight-column-first {
    background-color: #b6e6fc; 
  }

  .results-table-wrapper {
    max-width: 900px;
    margin: 0 auto 40px auto;
    overflow-x: auto;
  }

  .results-caption {
    text-align: center;
    color: #555;
    font-size: 0.9em;
    margin-top: -14px;
    margin-bottom: 30px;
  }
</style>

<h2 class="text-center">Quantitative Results</h2>
<p style="max-width: 900px; margin: 0 auto 30px auto; text-align: center; color: #444;">
  REALM uses a <strong>single frozen encoder</strong> across all three tasks: linear heads trained on RGB/DUNE features are transferred zero-shot to event features for depth and segmentation, and the frozen, RGB-trained <strong>MASt3R</strong> head is used as-is for feature matching &mdash; no event-specific fine-tuning of any decoder.
</p>

<h3 class="text-center" style="margin-bottom: 10px;">Wide-Baseline Feature Matching (AUC, %)</h3>
<div class="results-table-wrapper">
  <table>
    <thead>
      <tr>
        <th>Dataset</th>
        <th>Metric</th>
        <th>LLAK</th>
        <th>RATE</th>
        <th>EventPoint</th>
        <th>SuperEvent</th>
        <th class="highlight-column-first">REALM (Ours)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td rowspan="3">ECD</td><td>@5&deg;</td><td>0.7</td><td>3.3</td><td>1.6</td><td>22.7</td><td class="highlight-column"><strong>26.2</strong></td></tr>
      <tr><td>@10&deg;</td><td>1.4</td><td>8.4</td><td>3.0</td><td>35.8</td><td class="highlight-column"><strong>46.8</strong></td></tr>
      <tr><td>@20&deg;</td><td>2.1</td><td>18.0</td><td>5.4</td><td>46.7</td><td class="highlight-column"><strong>63.3</strong></td></tr>
      <tr><td rowspan="3">EDS</td><td>@5&deg;</td><td>0.5</td><td>2.1</td><td>1.6</td><td>15.2</td><td class="highlight-column"><strong>18.3</strong></td></tr>
      <tr><td>@10&deg;</td><td>0.7</td><td>5.1</td><td>2.8</td><td>26.4</td><td class="highlight-column"><strong>34.1</strong></td></tr>
      <tr><td>@20&deg;</td><td>1.0</td><td>10.3</td><td>5.2</td><td>40.1</td><td class="highlight-column"><strong>55.3</strong></td></tr>
    </tbody>
  </table>
</div>
<p class="results-caption">REALM outperforms all specialized event-based matching baselines by a wide margin on both the ECD and EDS datasets, despite using a frozen, image-trained MASt3R head with no event fine-tuning.</p>

<h3 class="text-center" style="margin-bottom: 10px;">Monocular Depth Estimation &mdash; Avg. Absolute Error [m] (MVSEC)</h3>
<div class="results-table-wrapper">
  <table>
    <thead>
      <tr>
        <th>Sequence</th>
        <th>Cut-off</th>
        <th>DUNE (RGB ref.)</th>
        <th>e2depth</th>
        <th>Zhu et al.</th>
        <th>EMoDepth</th>
        <th class="highlight-column-first">REALM (Ours)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td rowspan="3">outdoor day 1</td><td>10 m</td><td>1.16</td><td><u>1.85</u></td><td>2.72</td><td><strong>1.40</strong></td><td class="highlight-column"><u>1.85</u></td></tr>
      <tr><td>20 m</td><td>1.76</td><td>2.64</td><td>3.84</td><td><strong>2.07</strong></td><td class="highlight-column"><u>2.42</u></td></tr>
      <tr><td>30 m</td><td>2.12</td><td>3.13</td><td>4.40</td><td><strong>2.65</strong></td><td class="highlight-column"><u>2.76</u></td></tr>
      <tr><td rowspan="3">outdoor night 1</td><td>10 m</td><td>2.13</td><td>3.38</td><td>3.13</td><td><u>2.18</u></td><td class="highlight-column"><strong>2.08</strong></td></tr>
      <tr><td>20 m</td><td>3.10</td><td>3.82</td><td>4.02</td><td><u>2.70</u></td><td class="highlight-column"><strong>2.51</strong></td></tr>
      <tr><td>30 m</td><td>3.51</td><td>4.46</td><td>4.89</td><td><u>3.64</u></td><td class="highlight-column"><strong>3.18</strong></td></tr>
      <tr><td rowspan="3">outdoor night 2</td><td>10 m</td><td>2.45</td><td><strong>1.67</strong></td><td>2.19</td><td>2.06</td><td class="highlight-column"><u>2.00</u></td></tr>
      <tr><td>20 m</td><td>3.46</td><td><u>2.63</u></td><td>3.15</td><td>2.76</td><td class="highlight-column"><strong>2.31</strong></td></tr>
      <tr><td>30 m</td><td>3.86</td><td>3.58</td><td>3.92</td><td><u>3.42</u></td><td class="highlight-column"><strong>2.98</strong></td></tr>
      <tr><td rowspan="3">outdoor night 3</td><td>10 m</td><td>2.33</td><td><strong>1.42</strong></td><td>2.86</td><td>2.09</td><td class="highlight-column"><u>1.79</u></td></tr>
      <tr><td>20 m</td><td>3.37</td><td><u>2.33</u></td><td>4.46</td><td>2.82</td><td class="highlight-column"><strong>2.15</strong></td></tr>
      <tr><td>30 m</td><td>3.79</td><td><u>3.18</u></td><td>5.05</td><td>3.52</td><td class="highlight-column"><strong>2.97</strong></td></tr>
    </tbody>
  </table>
</div>
<p class="results-caption"><strong>Bold</strong> = best, <u>underline</u> = second-best among event-based methods (DUNE is an RGB reference, not a competing baseline). REALM wins or ties for best on 3 of 4 nighttime/outdoor sequences and, most notably, <strong>consistently outperforms its own RGB teacher, DUNE</strong>, at night &mdash; highlighting the inherent advantage of event-based sensing in high-dynamic-range conditions.</p>

<h3 class="text-center" style="margin-bottom: 10px;">Semantic Segmentation (DSEC, 11 classes)</h3>
<div class="results-table-wrapper">
  <table>
    <thead>
      <tr>
        <th>Metric</th>
        <th>DUNE (RGB)</th>
        <th>ESS</th>
        <th>EV-SegNet</th>
        <th>HALSIE</th>
        <th>ESEG</th>
        <th class="highlight-column-first">REALM (Ours)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Accuracy [%]</td><td>93.33</td><td>89.25</td><td>88.61</td><td>89.01</td><td><strong>91.47</strong></td><td class="highlight-column">89.23</td></tr>
      <tr><td>mIoU [%]</td><td>67.64</td><td>51.57</td><td>51.76</td><td>52.43</td><td><strong>57.55</strong></td><td class="highlight-column">55.37</td></tr>
    </tbody>
  </table>
</div>
<p class="results-caption">Using only a single linear head transferred zero-shot from the frozen DUNE encoder, REALM is competitive with specialized, purpose-built event-segmentation architectures &mdash; without any edge-guidance modules or recurrent decoders.</p>

<h3 class="text-center" style="margin-bottom: 10px;">Inference Efficiency (vs. MINIMA, per image pair)</h3>
<div class="results-table-wrapper">
  <table>
    <thead>
      <tr>
        <th>Model</th>
        <th>Total Latency [ms]</th>
        <th>FPS</th>
        <th>Peak GPU Memory [MB]</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>MINIMA</td><td>221.2</td><td>4.52</td><td>7563</td></tr>
      <tr><td class="highlight-column-first"><strong>REALM (Ours)</strong></td><td class="highlight-column"><strong>111.3</strong></td><td class="highlight-column"><strong>8.99</strong></td><td class="highlight-column"><strong>2581</strong></td></tr>
    </tbody>
  </table>
</div>
<p class="results-caption">REALM is roughly <strong>2&times; faster</strong> and uses under a third of the GPU memory of MINIMA for cross-modal matching, while achieving higher matching accuracy.</p>

<h2 class="text-center">Cite this work</h2>
<div class="citation-box">
    <button class="copy-btn" onclick="copyContent(this)" title="Copy to clipboard">📋</button>
    <pre class="citation-pre" id="citation-block" style="margin: 0; font-family: 'Courier New', monospace; white-space: pre-wrap;">
@inproceedings{polizzi_2026_realm,
      title={REALM: An RGB- and Event-Aligned Latent Manifold for Cross-Modal Perception}, 
      author={Vincenzo Polizzi and David B. Lindell and Jonathan Kelly},
      booktitle={European Conference on Computer Vision (ECCV)},
      year={2026}
}
    </pre>
</div>

<script>
    function copyContent(button) {
        const codeBox = button.closest('.citation-box').querySelector('pre');
        const code = codeBox.innerText;
        navigator.clipboard.writeText(code).then(() => {
            button.innerText = '✔️';
            setTimeout(() => {
                button.innerText = '📋';
            }, 1500);
        }).catch(err => {
            console.error('Error copying text: ', err);
        });
    }

    // Modal behavior scripts
    function openModal(modalId) {
      document.getElementById(modalId).style.display = 'flex';
    }

    function closeModal(modalId) {
      document.getElementById(modalId).style.display = 'none';
    }

    function closeModalOutside(event, modalId) {
      if (event.target === document.getElementById(modalId)) {
        closeModal(modalId);
      }
    }
</script>

{:/}