---
layout: page
title: "FaVoR: Features via Voxel Rendering for Camera Relocalization (WACV 2025)"
subtitle: ""
description: WACV (2025) paper on rendering feature descriptors from unseen views
permalink: /favor/
nav_order: 9984
nav_exclude: false
---


[<i class="fa fa-file-text-o" aria-hidden="true"></i>  arXiv pre-print ](https://arxiv.org/abs/2409.07571){: .btn
.btn-blue } 
[<i class="fa fa-github" aria-hidden="true"></i> View it on Github](https://github.com/utiasSTARS/FaVoR){: .btn .btn-green }
<!--[<i class="fa fa-newspaper-o" aria-hidden="true"></i> WACV Paper](http://papers.starslab.ca/favor){: .btn .btn-red }
[<i class="fa fa-newspaper-o" aria-hidden="true"></i> Supplementary](http://papers.starslab.ca/favor){: .btn .btn-red }
-->

{::nomarkdown}
<div style='text-align:center'>
  <h1>FaVoR: Features via Voxel Rendering for Camera Relocalization</h1>
  <div class="container_">
    <p class="masthead-subheading font-weight-light mb-0">
    <a href="https://polivi.iobii.com/">Vincenzo Polizzi<sup>1</sup><a>, <a href="https://marcocannici.github.io/">Marco Cannici<sup>2</sup></a>,
      <a href="https://rpg.ifi.uzh.ch/people_scaramuzza.html">Davide Scaramuzza<sup>2</sup></a>, <a href="https://starslab.ca/people/prof-jonathan-kelly/">Jonathan Kelly<sup>1</sup></a></p>
    <br>
    <p class="masthead-subheading font-weight-light mb-0"><sup>1</sup>University of Toronto, <sup>2</sup>University of
      Zurich</p>
      <br>
  </div>
  <br>
  <img src='/assets/favor/eyecatcher.png' width='100%'>
</div>
{:/}


{::nomarkdown}
<h2 class="text-center">Abstract</h2>
<div style='text-align:center'>
  Camera relocalization methods range from dense image alignment to direct camera pose regression from a query image.
  Among these, sparse feature matching stands out as an efficient, versatile, and generally lightweight approach with
  numerous applications. However, feature-based methods often struggle with significant viewpoint and appearance
  changes, leading to matching failures and inaccurate pose estimates. To overcome this limitation, we propose a novel
  approach that leverages a globally sparse yet locally dense 3D representation of 2D features. By tracking and
  triangulating landmarks over a sequence of frames, we construct a sparse voxel map optimized to render image patch
  descriptors observed during tracking. Given an initial pose estimate, we first synthesize descriptors from the voxels
  using volumetric rendering and then perform feature matching to estimate the camera pose. This methodology enables the
  generation of descriptors for unseen views, enhancing robustness to view changes. We extensively evaluate our method
  on the 7-Scenes and Cambridge Landmarks datasets. Our results show that our method significantly outperforms existing
  state-of-the-art feature representation techniques in indoor environments, achieving up to a 39% improvement in median
  translation error. Additionally, our approach yields comparable results to other methods for outdoor scenarios while
  maintaining lower memory and computational costs.
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
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Card Styling */
  .card {
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

  .video-viewport video {
    width: 512px;
    height: 1440px;
    /* 288px * 6 */
    position: absolute;
    top: 0;
    left: 0;
  }

  .slider-container {
    margin-top: 20px;
  }

  .citation-box {
    width: 100%;
    max-width: 1000px;
    margin: 20px 0;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    background-color: #f9f9f9;
  }

  .citation-pre {
    width: 100%;
    padding: 10px;
    font-family: monospace;
    font-size: 14px;
    border: none;
    background-color: #f9f9f9;
    white-space: pre-wrap;
  }

  .centered-image-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    text-align: center;
  }

  .col {
    flex: 1 1 200px;
    max-width: 300px;
    margin: 10px;
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

    .citation-box {
        position: relative;
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 10px;
        background-color: #f8f8f8;
    }
</style>

<h2 class="text-center">Cambridge Landmarks Visualization</h2>
<div class="container">
  <!-- Card 1 -->
  <div class="card" onclick="openModal('portfolioModal1')">
    <img src="/assets/favor/Cambridge/court.png" alt="Description of Image 1" />
    <div class="overlay">+</div>
  </div>

  <!-- Card 2 -->
  <div class="card" onclick="openModal('portfolioModal2')">
    <img src="/assets/favor/Cambridge/college.png" alt="Description of Image 2">
    <div class="overlay">+</div>
  </div>

  <!-- Card 3 -->
  <div class="card" onclick="openModal('portfolioModal3')">
    <img src="/assets/favor/Cambridge/hospital.png" alt="Description of Image 3">
    <div class="overlay">+</div>
  </div>

  <!-- Card 4 -->
  <div class="card" onclick="openModal('portfolioModal4')">
    <img src="/assets/favor/Cambridge/shop.png" alt="Description of Image 4">
    <div class="overlay">+</div>
  </div>

  <!-- Card 5 -->
  <div class="card" onclick="openModal('portfolioModal5')">
    <img src="/assets/favor/Cambridge/church.png" alt="Description of Image 5">
    <div class="overlay">+</div>
  </div>
</div>

<!-- Custom Modal -->
<div id="portfolioModal1" class="modal" onclick="closeModalOutside(event, 'portfolioModal1')">
  <div class="modal-content">
    <span class="close-button" onclick="closeModal('portfolioModal1')">&times;</span>
    <h2 class="portfolio-modal-title">Great Court</h2>
    <div class="divider-custom">
      <div class="divider-custom-line"></div>
      <div class="divider-custom-icon"><i class="fa fa-camera"></i></div>
      <div class="divider-custom-line"></div>
    </div>
    <p>The video below shows the camera pose relocalization computed using FaVoR. The purple frame indicates the
      starting camera position provided by the first DenseVLAD result, while the blue frame represents the ground truth
      camera pose of the query image. The estimated camera pose is shown in black, connected to the initial pose by a
      green line.</p>
    <div class="centered-image-container">
      <div class="video-viewport">
        <img id="video_1" src="/assets/favor/video/stacked_video_Court.gif">
      </div>
    </div>
    <div class="slider-container">
      <input type="range" id="slider_1" min="0" max="4" value="0" step="1" list="tickmarks">
      <datalist id="tickmarks">
        <option value="0" label="0"></option>
        <option value="1" label="1"></option>
        <option value="2" label="2"></option>
        <option value="3" label="3"></option>
        <option value="4" label="4"></option>
      </datalist>
    </div>
    <p>Move the slidebar to change camera pose.</p>
  </div>
</div>

<!-- Custom Modal -->
<div id="portfolioModal2" class="modal" onclick="closeModalOutside(event, 'portfolioModal2')">
  <div class="modal-content">
    <span class="close-button" onclick="closeModal('portfolioModal2')">&times;</span>
    <h2 class="portfolio-modal-title">King's College</h2>
    <div class="divider-custom">
      <div class="divider-custom-line"></div>
      <div class="divider-custom-icon"><i class="fa fa-camera"></i></div>
      <div class="divider-custom-line"></div>
    </div>
    <p>The video below shows the camera pose relocalization computed using FaVoR. The purple frame indicates the
      starting camera position provided by the first DenseVLAD result, while the blue frame represents the ground truth
      camera pose of the query image. The estimated camera pose is shown in black, connected to the initial pose by a
      green line.</p>
    <div class="centered-image-container">
      <div class="video-viewport">
        <img id="video_2" src="/assets/favor/video/stacked_video_College.gif">
      </div>
    </div>
    <div class="slider-container">
      <input type="range" id="slider_2" min="0" max="4" value="0" step="1" list="tickmarks">
      <datalist id="tickmarks">
        <option value="0" label="0"></option>
        <option value="1" label="1"></option>
        <option value="2" label="2"></option>
        <option value="3" label="3"></option>
        <option value="4" label="4"></option>
      </datalist>
    </div>
    <p>Move the slidebar to change camera pose.</p>
  </div>
</div>

<!-- Custom Modal -->
<div id="portfolioModal3" class="modal" onclick="closeModalOutside(event, 'portfolioModal3')">
  <div class="modal-content">
    <span class="close-button" onclick="closeModal('portfolioModal3')">&times;</span>
    <h2 class="portfolio-modal-title">Old Hospital</h2>
    <div class="divider-custom">
      <div class="divider-custom-line"></div>
      <div class="divider-custom-icon"><i class="fa fa-camera"></i></div>
      <div class="divider-custom-line"></div>
    </div>
    <p>The video below shows the camera pose relocalization computed using FaVoR. The purple frame indicates the
      starting camera position provided by the first DenseVLAD result, while the blue frame represents the ground truth
      camera pose of the query image. The estimated camera pose is shown in black, connected to the initial pose by a
      green line.</p>
    <div class="centered-image-container">
      <div class="video-viewport">
        <img id="video_3" src="/assets/favor/video/stacked_video_Hospital.gif">
      </div>
    </div>
    <div class="slider-container">
      <input type="range" id="slider_3" min="0" max="4" value="0" step="1" list="tickmarks">
      <datalist id="tickmarks">
        <option value="0" label="0"></option>
        <option value="1" label="1"></option>
        <option value="2" label="2"></option>
        <option value="3" label="3"></option>
        <option value="4" label="4"></option>
      </datalist>
    </div>
    <p>Move the slidebar to change camera pose.</p>
  </div>
</div>

<!-- Custom Modal -->
<div id="portfolioModal4" class="modal" onclick="closeModalOutside(event, 'portfolioModal4')">
  <div class="modal-content">
    <span class="close-button" onclick="closeModal('portfolioModal4')">&times;</span>
    <h2 class="portfolio-modal-title">Shop Facade</h2>
    <div class="divider-custom">
      <div class="divider-custom-line"></div>
      <div class="divider-custom-icon"><i class="fa fa-camera"></i></div>
      <div class="divider-custom-line"></div>
    </div>
    <p>The video below shows the camera pose relocalization computed using FaVoR. The purple frame indicates the
      starting camera position provided by the first DenseVLAD result, while the blue frame represents the ground truth
      camera pose of the query image. The estimated camera pose is shown in black, connected to the initial pose by a
      green line.</p>
    <div class="centered-image-container">
      <div class="video-viewport">
        <img id="video_4" src="/assets/favor/video/stacked_video_Shop.gif">
      </div>
    </div>
    <div class="slider-container">
      <input type="range" id="slider_4" min="0" max="4" value="0" step="1" list="tickmarks">
      <datalist id="tickmarks">
        <option value="0" label="0"></option>
        <option value="1" label="1"></option>
        <option value="2" label="2"></option>
        <option value="3" label="3"></option>
        <option value="4" label="4"></option>
      </datalist>
    </div>
    <p>Move the slidebar to change camera pose.</p>
  </div>
</div>

<!-- Custom Modal -->
<div id="portfolioModal5" class="modal" onclick="closeModalOutside(event, 'portfolioModal5')">
  <div class="modal-content">
    <span class="close-button" onclick="closeModal('portfolioModal5')">&times;</span>
    <h2 class="portfolio-modal-title">St. Mary's Church</h2>
    <div class="divider-custom">
      <div class="divider-custom-line"></div>
      <div class="divider-custom-icon"><i class="fa fa-camera"></i></div>
      <div class="divider-custom-line"></div>
    </div>
    <p>The video below shows the camera pose relocalization computed using FaVoR. The purple frame indicates the
      starting camera position provided by the first DenseVLAD result, while the blue frame represents the ground truth
      camera pose of the query image. The estimated camera pose is shown in black, connected to the initial pose by a
      green line.</p>
    <div class="centered-image-container">
      <div class="video-viewport">
        <img id="video_5" src="/assets/favor/video/stacked_video_StMary.gif">
      </div>
    </div>
    <div class="slider-container">
      <input type="range" id="slider_5" min="0" max="4" value="0" step="1" list="tickmarks">
      <datalist id="tickmarks">
        <option value="0" label="0"></option>
        <option value="1" label="1"></option>
        <option value="2" label="2"></option>
        <option value="3" label="3"></option>
        <option value="4" label="4"></option>
      </datalist>
    </div>
    <p>Move the slidebar to change camera pose.</p>
  </div>
</div>

<!-- Optional Font Awesome for Icons -->

<script src="/assets/favor/scripts.js"></script>

<!--  -->
<h2 class="text-center">FaVoR vs. Standard Features Matcher</h2>
<h3 class="text-center">7-Scenes Chess, features invariance</h3>

<p class="text-center">
  In the video below, we extract Alike-l features from a fixed target image and match these features with those extracted from a query image using standard feature matching. On the right side, we display the matches from three iterations of the FaVoR method, where FaVoR is queried using the fixed target's pose. It is noticeable that the number of matches significantly increases in the third iteration of FaVoR compared to the standard matching approach. The text at the bottom left of the image shows the distance (in meters and degrees) between the target and query images, as well as the number of matches for both methods. The text turns red when the number of standard feature matches are more than the FaVoR matches.
</p>
<div class="text-center">
  <video width='100%' loop autoplay muted controls>
    <source src="/assets/favor/video/video_desc_invariance_comp.webm" alt="feature invariance">
    Your browser does not support the video tag.
  </video>
</div>

</br>

<h2 class="text-center">Rendering Capabilities</h2>
<p class="text-center">
To evaluate the view invariance of feature descriptors, we extract dense descriptor maps from images taken at different angles. Using Alike-l, we compute similarity scores between features from a target image and the dense maps. The same process is applied to FaVoR, using the ground truth pose for rendering. The figure below shows the median similarity scores of the top thirty matches for both Alike-l and FaVoR across different query angles. FaVoR maintains nearly constant scores, indicating good descriptor fidelity from unseen views. In contrast, Alike-l shows a noticeable drop in similarity beyond ±30 degrees, highlighting the advantage of FaVoR in maintaining descriptor consistency across viewpoints.
</p>
<div class="container text-center">
<img src="/assets/favor/7Scene_medianscore_vs_angle_alike-l_favor.png"/>
</div>
<p class="text-center">
In blue
is the smoothed median score for FaVoR<sub>Alike-l</sub> obtained by convolving the descriptors rendered at different view angles with the
corresponding dense descriptors map of each query image. In orange is the smoothed median score of Alike-l features extracted
from the starting image (at angle 0 deg) convolved with the subsequent images in the test sequence.
</p>

<!-- -->
<style>
  table {
    width: 100%;
    border-collapse: collapse;
    text-align: center;
  }

  th,
  td {
    padding: 8px 12px;
    border: 1px solid #ddd;
  }

  /* Styling for fixed columns in header and body cells */
  .fixed-header,
  .fixed-cell {
    position: sticky;
    background-color: #f9f9f9;
    z-index: 1;
  }

  .fixed-header {
    left: 0;
    z-index: 2;
    /* Ensures headers are on top of cells */
  }

  .fixed-header-method {
    left: 60px;
    /* Reduced offset for "Method" to minimize movement */
  }

  .fixed-cell {
    left: 0;
  }

  .fixed-cell-method {
    left: 60px;
    /* Consistent reduced offset for "Method" cells */
  }

  .highlight-column {
    background-color: #e6f7ff;
    /* Light blue highlight */
  }

  /* Highlight for the first, second, and third columns */
  .highlight-column-first {
    background-color: #1cb6ff;
    /* Strong red for the first column */
  }

  .highlight-column-second {
    background-color: #72d0fc;
    /* Light blue for the second column */
  }

  .highlight-column-third {
    background-color: #b6e6fc;
    /* Lighter green for the third column */
  }

  /* Strong separation lines for categories */
  .category-start td {
    border-top: 2px solid #444;
  }

  /* Final average row styling */
  .final-average td {
    font-weight: bold;
    background-color: #f2f2f2;
    border-top: 3px solid #000;
  }
</style>

<h2 class="text-center">Results</h2>

<h3 class="text-center">7-Scenes Dataset</h3>

<p><strong>6-DoF median localization errors on the 7-Scenes dataset.</strong> Comparison of visual localization methods. The overall top three results are shown in 
<strong style="background-color: #1cb6ff">bold</strong>, 
<u style="background-color: #72d0fc">underline</u>, and 
<span class="double-underline" style="background-color: #b6e6fc">double-underline</span>.</p>

<table>
  <thead>
    <tr>
      <th>Category</th>
      <th class="fixed-cell">Method</th>
      <th>Chess</th>
      <th>Fire</th>
      <th>Heads</th>
      <th>Office</th>
      <th>Pumpkin</th>
      <th>Kitchen</th>
      <th>Stairs</th>
      <th class="highlight-column">Average</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="4">IBMs</td>
      <td class="fixed-cell">PoseNet17</td>
      <td>13, 4.5</td>
      <td>27, 11.3</td>
      <td>17, 13.0</td>
      <td>19, 5.6</td>
      <td>26, 4.8</td>
      <td>23, 5.4</td>
      <td>35, 12.4</td>
      <td class="highlight-column">22.9, 8.1</td>
    </tr>
    <tr>
      <td class="fixed-cell">MapNet</td>
      <td>8, 3.3</td>
      <td>27, 11.7</td>
      <td>18, 13.3</td>
      <td>17, 5.2</td>
      <td>22, 4.0</td>
      <td>23, 4.9</td>
      <td>30, 12.1</td>
      <td class="highlight-column">20.7, 7.8</td>
    </tr>
    <tr>
      <td class="fixed-cell">PAEs</td>
      <td>12, 5.0</td>
      <td>24, 9.3</td>
      <td>14, 12.5</td>
      <td>19, 5.8</td>
      <td>18, 4.9</td>
      <td>18, 6.2</td>
      <td>25, 8.7</td>
      <td class="highlight-column">18.6, 7.5</td>
    </tr>
    <tr>
      <td class="fixed-cell">LENS</td>
      <td>3, 1.3</td>
      <td>10, 3.7</td>
      <td>7, 5.8</td>
      <td>7, 1.9</td>
      <td>8, 2.2</td>
      <td>9, 2.2</td>
      <td>14, 3.6</td>
      <td class="highlight-column">8.3, 3.0</td>
    </tr>
    <tr>
      <td>HM</td>
      <td class="fixed-cell">HLoc (RGB-D SP+SG)</td>
      <td>2, 0.8</td>
      <td>2, 0.8</td>
      <td>1, 0.8</td>
      <td>3, 0.8</td>
      <td>4, 1.1</td>
      <td>3, 1.1</td>
      <td>4, 1.2</td>
      <td class="highlight-column">2.7, 0.9</td>
    </tr>
    <tr>
      <td rowspan="3">SBMs</td>
      <td class="fixed-cell">SC-WLS</td>
      <td>3, 0.8</td>
      <td>5, 1.1</td>
      <td>3, 1.9</td>
      <td>6, 0.9</td>
      <td>8, 1.3</td>
      <td>9, 1.4</td>
      <td>12, 2.8</td>
      <td class="highlight-column">6.6, 1.5</td>
    </tr>
    <tr>
      <td class="fixed-cell">DSAC* (RGB)</td>
      <td>2, 1.1</td>
      <td>2, 1.2</td>
      <td>1, 1.8</td>
      <td>3, 1.2</td>
      <td>4, 1.3</td>
      <td>4, 1.7</td>
      <td>3, 1.2</td>
      <td class="highlight-column">2.7, 1.4</td>
    </tr>
    <tr>
      <td class="fixed-cell">ACE</td>
      <td>2, 1.1</td>
      <td>2, 1.8</td>
      <td>2, 1.1</td>
      <td>3, 1.4</td>
      <td>3, 1.3</td>
      <td>3, 1.3</td>
      <td>3, 1.2</td>
      <td class="highlight-column">2.6, 1.3</td>
    </tr>
    <tr>
      <td rowspan="9">SFRMs</td>
      <td class="fixed-cell">FQN</td>
      <td>4, 1.3</td>
      <td>5, 1.8</td>
      <td>4, 2.4</td>
      <td>10, 3.0</td>
      <td>9, 2.5</td>
      <td>16, 4.4</td>
      <td>140, 34.7</td>
      <td class="highlight-column">27.4, 7.4</td>
    </tr>
    <tr>
      <td class="fixed-cell">CROSSFIRE</td>
      <td>1, 0.4</td>
      <td>5, 1.9</td>
      <td>3, 2.3</td>
      <td>5, 1.6</td>
      <td>3, 0.8</td>
      <td>2, 0.8</td>
      <td>12, 1.9</td>
      <td class="highlight-column">4.4, 1.4</td>
    </tr>
    <tr>
      <td class="fixed-cell">NeRF-loc</td>
      <td>2, 1.1</td>
      <td>2, 1.1</td>
      <td>1, 1.9</td>
      <td>2, 1.1</td>
      <td>3, 1.3</td>
      <td>3, 1.5</td>
      <td>3, 1.3</td>
      <td class="highlight-column">2.3, 1.3</td>
    </tr>
    <tr>
      <td class="fixed-cell">(Ours) Alike-t</td>
      <td>1, 0.3</td>
      <td>1, 0.5</td>
      <td>1, 0.4</td>
      <td>2, 0.6</td>
      <td>2, 0.4</td>
      <td>1, 0.3</td>
      <td>4, 1.1</td>
      <td class="highlight-column-third">
        <p class="double-underline">1.7, 0.5</p>
      </td>
    </tr>
    <tr>
      <td class="fixed-cell">(Ours) Alike-s</td>
      <td>1, 0.2</td>
      <td>2, 0.6</td>
      <td>1, 0.4</td>
      <td>2, 0.4</td>
      <td>1, 0.3</td>
      <td>4, 0.9</td>
      <td>5, 1.5</td>
      <td class="highlight-column">2.3, 0.6</td>
    </tr>
    <tr>
      <td class="fixed-cell">(Ours) Alike-n</td>
      <td>1, 0.2</td>
      <td>1, 0.4</td>
      <td>1, 0.6</td>
      <td>2, 0.4</td>
      <td>1, 0.3</td>
      <td>1, 0.3</td>
      <td>6, 1.6</td>
      <td class="highlight-column">1.9, 0.5</td>
    </tr>
    <tr>
      <td class="fixed-cell">(Ours) Alike-l</td>
      <td>1, 0.2</td>
      <td>1, 0.3</td>
      <td>1, 0.4</td>
      <td>2, 0.4</td>
      <td>1, 0.3</td>
      <td>1, 0.2</td>
      <td>3, 0.8</td>
      <td class="highlight-column-first"><strong>1.4, 0.4</strong></td>
    </tr>
    <tr>
      <td class="fixed-cell">(Ours) SP</td>
      <td>1, 0.2</td>
      <td>1, 0.4</td>
      <td>1, 0.3</td>
      <td>2, 0.4</td>
      <td>1, 0.3</td>
      <td>1, 0.2</td>
      <td>4, 1.0</td>
      <td class="highlight-column-second"><u>1.6, 0.4</u></td>
    </tr>
  </tbody>
</table>
</br>
<h3 class="text-center">Cambridge Landmarks Dataset</h3>
<p><strong>6-DoF median localization errors on the Cambridge Landmarks dataset.</strong> Comparison of visual localization methods. The overall top three results are shown in 
<strong style="background-color: #1cb6ff">bold</strong>, 
<u style="background-color: #72d0fc">underline</u>, and 
<span class="double-underline" style="background-color: #b6e6fc">double-underline</span>.</p>

<table>
  <thead>
    <tr>
      <th>Category</th>
      <th class="fixed-cell">Method</th>
      <th>College</th>
      <th>Court</th>
      <th>Hospital</th>
      <th>Shop</th>
      <th>Church</th>
      <th class="highlight-column">Average</th>
      <th class="highlight-column">Average w/o Court</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="4">IBMs</td>
      <td class="fixed-cell">PoseNet</td>
      <td>88, 1.0</td>
      <td>683, 3.5</td>
      <td>88, 3.8</td>
      <td>157, 3.3</td>
      <td>320, 3.3</td>
      <td class="highlight-column">267, 3.0</td>
      <td class="highlight-column">163, 2.9</td>
    </tr>
    <tr>
      <td class="fixed-cell">MapNet</td>
      <td>107, 1.9</td>
      <td>785, 3.8</td>
      <td>149, 4.2</td>
      <td>200, 4.5</td>
      <td>194, 3.9</td>
      <td class="highlight-column">287, 3.7</td>
      <td class="highlight-column">163, 3.6</td>
    </tr>
    <tr>
      <td class="fixed-cell">PAEs</td>
      <td>90, 1.5</td>
      <td>-</td>
      <td>207, 2.6</td>
      <td>99, 3.9</td>
      <td>164, 4.2</td>
      <td class="highlight-column">-</td>
      <td class="highlight-column">140, 3.1</td>
    </tr>
    <tr>
      <td class="fixed-cell">LENS</td>
      <td>33, 0.5</td>
      <td>-</td>
      <td>44, 0.9</td>
      <td>27, 1.6</td>
      <td>53, 1.6</td>
      <td class="highlight-column">-</td>
      <td class="highlight-column">39, 1.2</td>
    </tr>
    <tr>
      <td rowspan="2">HM</td>
      <td class="fixed-cell">HLoc<sub>SP+SG</sub></td>
      <td>6, 0.1</td>
      <td>10, 0.1</td>
      <td>13, 0.2</td>
      <td>3, 0.1</td>
      <td>4, 0.1</td>
      <td class="highlight-column-first"><strong>7, 0.1</strong></td>
      <td class="highlight-column-first"><strong>7, 0.1</strong></td>
    </tr>
    <tr>
      <td class="fixed-cell">SceneSqueezer</td>
      <td>27, 0.4</td>
      <td>-</td>
      <td>37, 0.5</td>
      <td>11, 0.4</td>
      <td>15, 0.4</td>
      <td class="highlight-column">-</td>
      <td class="highlight-column">23, 0.4</td>
    </tr>
    <tr>
      <td rowspan="3">SBMs</td>
      <td class="fixed-cell">SC-WLS</td>
      <td>14, 0.6</td>
      <td>164, 0.9</td>
      <td>42, 1.7</td>
      <td>11, 0.7</td>
      <td>39, 1.3</td>
      <td class="highlight-column">54, 0.7</td>
      <td class="highlight-column">27, 1.1</td>
    </tr>
    <tr>
      <td class="fixed-cell">DSAC* (RGB)</td>
      <td>18, 0.3</td>
      <td>34, 0.2</td>
      <td>21, 0.4</td>
      <td>5, 0.3</td>
      <td>15, 0.6</td>
      <td class="highlight-column">19, 0.3</td>
      <td class="highlight-column">15, 0.4</td>
    </tr>
    <tr>
      <td class="fixed-cell">ACE</td>
      <td>28, 0.4</td>
      <td>42, 0.2</td>
      <td>31, 0.6</td>
      <td>5, 0.3</td>
      <td>19, 0.6</td>
      <td class="highlight-column">25, 0.4</td>
      <td class="highlight-column">21, 0.5</td>
    </tr>
    <tr>
      <td rowspan="9">SFRMs</td>
      <td class="fixed-cell">FQN-MN</td>
      <td>28, 0.4</td>
      <td>4253, 39.2</td>
      <td>54, 0.8</td>
      <td>13, 0.6</td>
      <td>58, 2.0</td>
      <td class="highlight-column">881, 8.6</td>
      <td class="highlight-column">38, 1.0</td>
    </tr>
    <tr>
      <td class="fixed-cell">CROSSFIRE</td>
      <td>47, 0.7</td>
      <td>-</td>
      <td>43, 0.7</td>
      <td>20, 1.2</td>
      <td>39, 1.4</td>
      <td class="highlight-column">-</td>
      <td class="highlight-column">37, 1.0</td>
    </tr>
    <tr>
      <td class="fixed-cell">NeRF-loc</td>
      <td>11, 0.2</td>
      <td>25, 0.1</td>
      <td>18, 0.4</td>
      <td>4, 0.2</td>
      <td>7, 0.2</td>
      <td class="highlight-column-second"><u>13, 0.2</u></td>
      <td class="highlight-column-second"><u>10, 0.3</u></td>
    </tr>
    <tr>
      <td class="fixed-cell">(Ours) Alike-t</td>
      <td>17, 0.3</td>
      <td>29, 0.1</td>
      <td>20, 0.4</td>
      <td>5, 0.3</td>
      <td>11, 0.4</td>
      <td class="highlight-column">16, 0.3</td>
      <td class="highlight-column">13, 0.4</td>
    </tr>
    <tr>
      <td class="fixed-cell">(Ours) Alike-s</td>
      <td>16, 0.2</td>
      <td>32, 0.2</td>
      <td>21, 0.4</td>
      <td>6, 0.3</td>
      <td>11, 0.4</td>
      <td class="highlight-column">17, 0.3</td>
      <td class="highlight-column">14, 0.4</td>
    </tr>
    <tr>
      <td class="fixed-cell">(Ours) Alike-n</td>
      <td>18, 0.3</td>
      <td>32, 0.2</td>
      <td>21, 0.4</td>
      <td>5, 0.2</td>
      <td>11, 0.3</td>
      <td class="highlight-column">17, 0.3</td>
      <td class="highlight-column">14, 0.3</td>
    </tr>
    <tr>
      <td class="fixed-cell">(Ours) Alike-l</td>
      <td>15, 0.2</td>
      <td>27, 0.1</td>
      <td>19, 0.4</td>
      <td>5, 0.3</td>
      <td>10, 0.3</td>
      <td class="highlight-column-third">
        <p class="double-underline">15, 0.3</p>
      </td>
      <td class="highlight-column-third">
        <p class="double-underline">12, 0.3</p>
      </td>
    </tr>
    <tr>
      <td class="fixed-cell">(Ours) SP</td>
      <td>18, 0.3</td>
      <td>29, 0.2</td>
      <td>27, 0.5</td>
      <td>5, 0.3</td>
      <td>11, 0.4</td>
      <td class="highlight-column">18, 0.3</td>
      <td class="highlight-column">15, 0.4</td>
    </tr>
  </tbody>
</table>



</br>
<!--  -->
<h2 class="text-center">Models Download</h2>
<p>The models used to generate the results in the paper can be downloaded from the <a href="https://huggingface.co/viciopoli/FaVoR">Hugging Face model hub</a>. To download the models, you can use the following command, make sure the <ita>huggingface-cli</ita> is installed:</p>


<div class="citation-box" style="position: relative; border: 1px solid #ddd; border-radius: 6px; padding: 10px; background-color: #f8f8f8;">
    <button class="copy-btn" onclick="copyContent(this)" title="Copy to clipboard">
        📋
    </button>
    <pre class="citation-pre" id="code-block" style="margin: 0; font-family: 'Courier New', monospace; white-space: pre-wrap;">
DATASET=7Scenes # or Cambridge
SCENE=chess # or ShopFacade etc.
NETWORK=alike-l # or alike-s, alike-n, alike-t, superpoint
huggingface-cli download viciopoli/FaVoR $DATASET/$SCENE/$NETWORK/model_ckpts/model_last.tar --local-dir-use-symlinks False --local-dir /path/to/your/directory
    </pre>
</div>

<h2 class="text-center">Cite this work</h2>
<div class="citation-box" style="position: relative; border: 1px solid #ddd; border-radius: 6px; padding: 10px; background-color: #f8f8f8;">
    <button class="copy-btn" onclick="copyContent(this)" title="Copy to clipboard">
        📋
    </button>
    <pre class="citation-pre" id="citation-block" style="margin: 0; font-family: 'Courier New', monospace; white-space: pre-wrap;">
@misc{polizzi2024arXiv,
    title={FaVoR: Features via Voxel Rendering for Camera Relocalization}, 
    author={Vincenzo Polizzi and Marco Cannici and Davide Scaramuzza and Jonathan Kelly},
    year={2024},
    eprint={2409.07571},
    archivePrefix={arXiv},
    primaryClass={cs.CV},
    url={https://arxiv.org/abs/2409.07571}, 
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
</script>

{:/}