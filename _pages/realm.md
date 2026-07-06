---
layout: page
title: "REALM: An RGB- and Event-Aligned Latent Manifold for Cross-Modal Perception"
subtitle: ""
description: Cross-modal framework projecting event representations into the pretrained latent space of RGB foundation models.
permalink: /realm/
nav_order: 9981
nav_exclude: false
youtubeId: # Replace with your YouTube ID if you have an accompanying video
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

[<i class="fa fa-file-text-o" aria-hidden="true"></i>  arXiv pre-print ](https://arxiv.org/abs/2605.00271){: .btn .btn-blue } 
[<i class="fa fa-github" aria-hidden="true"></i> View it on Github](https://github.com/utiasSTARS/REALM){: .btn .btn-purple }
[<i class="fa-brands fa-hugging-face" aria-hidden="true"></i> Demo](https://viciopoli-realm-demo.hf.space){: .btn .btn-yellow }

{::nomarkdown}
<div style='text-align:center'>
  <img src='/assets/realm/logo.png' alt='REALM Logo' width='400' style="margin-bottom: 20px;" />
  <h1>An RGB and Event Aligned Latent Manifold for Cross-Modal Perception</h1>
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
  <img style="border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" src='/assets/realm/demo_realm.gif' width='100%' alt='REALM Demo'>
</div>
{:/}

{::nomarkdown}
<h2 class="text-center">Abstract</h2>
<div style='text-align:center'>
  Event cameras provide several unique advantages over standard frame-based sensors, including high temporal resolution, low latency, and robustness to extreme lighting. However, existing learning-based approaches for event processing are typically confined to narrow, task-specific silos and lack the ability to generalize across modalities. We address this gap with REALM, a cross-modal framework that learns an RGB and Event Aligned Latent Manifold by projecting event representations into the pretrained latent space of RGB foundation models. Instead of task-specific training, we leverage low-rank adaptation (LoRA) to bridge the modality gap, effectively unlocking the geometric and semantic priors of frozen RGB backbones for asynchronous event streams. We demonstrate that REALM effectively maps events into the ViT-based foundation latent space. Our method allows us to perform downstream tasks like depth estimation and semantic segmentation by simply transferring linear heads trained on the RGB teacher. Most significantly, REALM enables the direct, zero-shot application of complex, frozen image-trained decoders, such as MASt3R, to raw event data. We demonstrate state-of-the-art performance in wide-baseline feature matching, significantly outperforming specialized architectures.
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
  /* Basic Reset */
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .double-underline {
    text-decoration: underline;
    text-decoration-style: double;
  }

  /* Container Styling */
  .container {
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
    max-height: 288px;
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
    margin: 20px 0;
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
    display: flex;
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
    /* Limit the entire image/legend area to 80% of the white modal content */
    width: 80%; 
    margin: 0 auto 30px auto; /* Centered, with bottom margin */
    display: flex;
    flex-direction: column;
  }

  /* Constraints specifically for the Segmentation Modal Content */
  .seg-container-wrapper {
    width: 80%; 
    margin: 0 auto 30px auto; 
    display: flex;
    flex-direction: column;
    align-items: center; /* Ensures everything centers nicely */
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
</style>

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