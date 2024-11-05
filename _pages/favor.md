---
layout: page
title: "FaVoR: Features via Voxel Rendering for Camera Relocalization (WACV 2025)"
subtitle: ""
description: WACV (2025) paper on rendering feature descriptors from unseen views
permalink: /favor/
nav_order: 9984
nav_exclude: true
---


[<i class="fa fa-file-text-o" aria-hidden="true"></i> arXiv pre-print ](https://arxiv.org/abs/2409.07571){: .btn .btn-blue }
<!-- 
[<i class="fa fa-github" aria-hidden="true"></i> View it on Github](https://github.com/utiasSTARS/){: .btn .btn-green }
[<i class="fa fa-newspaper-o" aria-hidden="true"></i> WACV Paper](http://papers.starslab.ca/favor){: .btn .btn-red }
[<i class="fa fa-newspaper-o" aria-hidden="true"></i> Supplementary](http://papers.starslab.ca/favor){: .btn .btn-red }
-->

{::nomarkdown} 
<div style='text-align:center'>
<h1>FaVoR: Features via Voxel Rendering</h1>
<div class="container_">
    <p class="masthead-subheading font-weight-light mb-0">Vincenzo Polizzi<sup>1</sup>, Marco Cannici<sup>2</sup>, Davide Scaramuzza<sup>2</sup>, Jonathan Kelly<sup>1</sup></p>
    <br>
    <p class="masthead-subheading font-weight-light mb-0"><sup>1</sup>University of Toronto, <sup>2</sup>University of Zurich</p>
</div>
<br>
<img src='/assets/favor/eyecatcher.png' width='100%'>
</div>
{:/}


{::nomarkdown} 
<h2 class="text-center">Abstract</h2>
<div style='text-align:center'>
Camera relocalization methods range from dense image alignment to direct camera pose regression from a query image. Among these, sparse feature matching stands out as an efficient, versatile, and generally lightweight approach with numerous applications. However, feature-based methods often struggle with significant viewpoint and appearance changes, leading to matching failures and inaccurate pose estimates. To overcome this limitation, we propose a novel approach that leverages a globally sparse yet locally dense 3D representation of 2D features. By tracking and triangulating landmarks over a sequence of frames, we construct a sparse voxel map optimized to render image patch descriptors observed during tracking. Given an initial pose estimate, we first synthesize descriptors from the voxels using volumetric rendering and then perform feature matching to estimate the camera pose. This methodology enables the generation of descriptors for unseen views, enhancing robustness to view changes. We extensively evaluate our method on the 7-Scenes and Cambridge Landmarks datasets. Our results show that our method significantly outperforms existing state-of-the-art feature representation techniques in indoor environments, achieving up to a 39% improvement in median translation error. Additionally, our approach yields comparable results to other methods for outdoor scenarios while maintaining lower memory and computational costs.
</div>

<style>
   
    /* Basic Reset */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
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
            width: 512px;
            height: 288px;
            overflow: hidden;
            position: relative;
      }
      
      .video-viewport video {
            width: 512px;
            height: 1440px; /* 288px * 6 */
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
  </style>
  
<h2 class="text-center">Cambridge Landmarks Visualization</h2>
  <div class="container">
    <!-- Card 1 -->
    <div class="card" onclick="openModal('portfolioModal1')">
      <img src="/assets/favor/Cambridge/court.png" alt="Description of Image 1"/>
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
      <p>The video below shows the camera pose relocalization computed using FaVoR. The purple frame indicates the starting camera position provided by the first DenseVLAD result, while the blue frame represents the ground truth camera pose of the query image. The estimated camera pose is shown in black, connected to the initial pose by a green line.</p> 
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
      <p>The video below shows the camera pose relocalization computed using FaVoR. The purple frame indicates the starting camera position provided by the first DenseVLAD result, while the blue frame represents the ground truth camera pose of the query image. The estimated camera pose is shown in black, connected to the initial pose by a green line.</p>   
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
      <p>The video below shows the camera pose relocalization computed using FaVoR. The purple frame indicates the starting camera position provided by the first DenseVLAD result, while the blue frame represents the ground truth camera pose of the query image. The estimated camera pose is shown in black, connected to the initial pose by a green line.</p>   
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
      <p>The video below shows the camera pose relocalization computed using FaVoR. The purple frame indicates the starting camera position provided by the first DenseVLAD result, while the blue frame represents the ground truth camera pose of the query image. The estimated camera pose is shown in black, connected to the initial pose by a green line.</p>   
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
      <p>The video below shows the camera pose relocalization computed using FaVoR. The purple frame indicates the starting camera position provided by the first DenseVLAD result, while the blue frame represents the ground truth camera pose of the query image. The estimated camera pose is shown in black, connected to the initial pose by a green line.</p>   
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
  <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/js/all.min.js"></script>

  <script src="/assets/favor/scripts.js"></script>

<!--  -->
<h2 class="text-center">FaVoR vs. Standard Features Matcher</h2>
<h3 class="text-center">7-Scenes Chess, features invariance</h3>

<p class="text-center">
In the video below, we extract Alike-l features from a target image. We then match the target features with those extracted from a query image under Standard feature matching. On the rigth side, we report the matches in three iterations of the FaVoR method queried from the target image pose. It is noticeble that the amount of matches is much higher in the 3rd iteration of FaVoR compared to the standard matching approach. The text at the bottom left of the image reports the distance in meters and degree between the target image and the query images and the number of matches for both the methods, the text turn out red when the number of standard feature matches is higher than the FaVoR ones.
</p>
<div class="text-center">
   <video width='100%' loop autoplay muted controls>
      <source src="/assets/favor/video/video_desc_invariance_comp.webm" alt="feature invariance">
        Your browser does not support the video tag.
   </video> 
</div>

</br>

<!-- -->

<h2 class="text-center">Results</h2>

<h3 class="text-center">7-Scenes Dataset</h3>

<table>
  <thead>
    <tr>
      <th>Category</th>
      <th>Method</th>
      <th>Chess</th>
      <th>Fire</th>
      <th>Heads</th>
      <th>Office</th>
      <th>Pumpkin</th>
      <th>Kitchen</th>
      <th>Stairs</th>
      <th>Average</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="4">IBMs</td>
      <td>PoseNet17</td>
      <td>13, 4.5</td>
      <td>27, 11.3</td>
      <td>17, 13.0</td>
      <td>19, 5.6</td>
      <td>26, 4.8</td>
      <td>23, 5.4</td>
      <td>35, 12.4</td>
      <td>22.9, 8.1</td>
    </tr>
    <tr>
      <td>MapNet</td>
      <td>8, 3.3</td>
      <td>27, 11.7</td>
      <td>18, 13.3</td>
      <td>17, 5.2</td>
      <td>22, 4.0</td>
      <td>23, 4.9</td>
      <td>30, 12.1</td>
      <td>20.7, 7.8</td>
    </tr>
    <tr>
      <td>PAEs</td>
      <td>12, 5.0</td>
      <td>24, 9.3</td>
      <td>14, 12.5</td>
      <td>19, 5.8</td>
      <td>18, 4.9</td>
      <td>18, 6.2</td>
      <td>25, 8.7</td>
      <td>18.6, 7.5</td>
    </tr>
    <tr>
      <td>LENS</td>
      <td>3, 1.3</td>
      <td>10, 3.7</td>
      <td>7, 5.8</td>
      <td>7, 1.9</td>
      <td>8, 2.2</td>
      <td>9, 2.2</td>
      <td>14, 3.6</td>
      <td>8.3, 3.0</td>
    </tr>
    <tr>
      <td>HM</td>
      <td>HLoc (RGB-D SP+SG)</td>
      <td>2, 0.8</td>
      <td>2, 0.8</td>
      <td>1, 0.8</td>
      <td>3, 0.8</td>
      <td>4, 1.1</td>
      <td>3, 1.1</td>
      <td>4, 1.2</td>
      <td>2.7, 0.9</td>
    </tr>
    <tr>
      <td rowspan="3">SBMs</td>
      <td>SC-WLS</td>
      <td>3, 0.8</td>
      <td>5, 1.1</td>
      <td>3, 1.9</td>
      <td>6, 0.9</td>
      <td>8, 1.3</td>
      <td>9, 1.4</td>
      <td>12, 2.8</td>
      <td>6.6, 1.5</td>
    </tr>
    <tr>
      <td>DSAC* (RGB)</td>
      <td>2, 1.1</td>
      <td>2, 1.2</td>
      <td>1, 1.8</td>
      <td>3, 1.2</td>
      <td>4, 1.3</td>
      <td>4, 1.7</td>
      <td>3, 1.2</td>
      <td>2.7, 1.4</td>
    </tr>
    <tr>
      <td>ACE</td>
      <td>2, 1.1</td>
      <td>2, 1.8</td>
      <td>2, 1.1</td>
      <td>3, 1.4</td>
      <td>3, 1.3</td>
      <td>3, 1.3</td>
      <td>3, 1.2</td>
      <td>2.6, 1.3</td>
    </tr>
    <tr>
      <td rowspan="9">SFRMs</td>
      <td>FQN</td>
      <td>4, 1.3</td>
      <td>5, 1.8</td>
      <td>4, 2.4</td>
      <td>10, 3.0</td>
      <td>9, 2.5</td>
      <td>16, 4.4</td>
      <td>140, 34.7</td>
      <td>27.4, 7.4</td>
    </tr>
    <tr>
      <td>CROSSFIRE</td>
      <td>1, 0.4</td>
      <td>5, 1.9</td>
      <td>3, 2.3</td>
      <td>5, 1.6</td>
      <td>3, 0.8</td>
      <td>2, 0.8</td>
      <td>12, 1.9</td>
      <td>4.4, 1.4</td>
    </tr>
    <tr>
      <td>NeRF-loc</td>
      <td>2, 1.1</td>
      <td>2, 1.1</td>
      <td>1, 1.9</td>
      <td>2, 1.1</td>
      <td>3, 1.3</td>
      <td>3, 1.5</td>
      <td>3, 1.3</td>
      <td>2.3, 1.3</td>
    </tr>
    <tr>
      <td>(Ours) Alike-t</td>
      <td>1, 0.3</td>
      <td>1, 0.5</td>
      <td>1, 0.4</td>
      <td>2, 0.6</td>
      <td>2, 0.4</td>
      <td>1, 0.3</td>
      <td>4, 1.1</td>
      <td><strong>1.7, 0.5</strong></td>
    </tr>
    <tr>
      <td>(Ours) Alike-s</td>
      <td>1, 0.2</td>
      <td>2, 0.6</td>
      <td>1, 0.4</td>
      <td>2, 0.4</td>
      <td>1, 0.3</td>
      <td>4, 0.9</td>
      <td>5, 1.5</td>
      <td>2.3, 0.6</td>
    </tr>
    <tr>
      <td>(Ours) Alike-n</td>
      <td>1, 0.2</td>
      <td>1, 0.4</td>
      <td>1, 0.6</td>
      <td>2, 0.4</td>
      <td>1, 0.3</td>
      <td>1, 0.3</td>
      <td>6, 1.6</td>
      <td>1.9, 0.5</td>
    </tr>
    <tr>
      <td>(Ours) Alike-l</td>
      <td>1, 0.2</td>
      <td>1, 0.3</td>
      <td>1, 0.4</td> 
      <td>2, 0.4</td>    
      <td>1, 0.3</td>    
      <td>1, 0.2</td>    
      <td>3, 0.8</td>
      <td><strong>1.4, 0.4</strong></td>
    </tr>
    <tr>
      <td>(Ours) SP</td>
      <td>1, 0.2</td>
      <td>1, 0.4</td> 
      <td>1, 0.3</td> 
      <td>2, 0.4</td> 
      <td>1, 0.3</td> 
      <td>1, 0.2</td> 
      <td>4, 1.0</td>
      <td>1.6, 0.4</td>
    </tr>
  </tbody>
</table>
</br>
<h3 class="text-center">7-Scenes Dataset</h3>

<table>
  <thead>
    <tr>
      <th>Category</th>
      <th>Method</th>
      <th>College</th>
      <th>Court</th>
      <th>Hospital</th>
      <th>Shop</th>
      <th>Church</th>
      <th>Average</th>
      <th>Average w/o Court</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="4">IBMs</td>
      <td>PoseNet</td>
      <td>88, 1.0</td>
      <td>683, 3.5</td>
      <td>88, 3.8</td>
      <td>157, 3.3</td>
      <td>320, 3.3</td>
      <td>267, 3.0</td>
      <td>163, 2.9</td>
    </tr>
    <tr>
      <td>MapNet</td>
      <td>107, 1.9</td>
      <td>785, 3.8</td>
      <td>149, 4.2</td>
      <td>200, 4.5</td>
      <td>194, 3.9</td>
      <td>287, 3.7</td>
      <td>163, 3.6</td>
    </tr>
    <tr>
      <td>PAEs</td>
      <td>90, 1.5</td>
      <td>-</td>
      <td>207, 2.6</td>
      <td>99, 3.9</td>
      <td>164, 4.2</td>
      <td>-</td>
      <td>140, 3.1</td>
    </tr>
    <tr>
      <td>LENS</td>
      <td>33, 0.5</td>
      <td>-</td>
      <td>44, 0.9</td>
      <td>27, 1.6</td>
      <td>53, 1.6</td>
      <td>-</td>
      <td>39, 1.2</td>
    </tr>
    <tr>
      <td rowspan="2">HM</td>
      <td>HLoc<sub>SP+SG</sub></td>
      <td>6, 0.1</td>
      <td>10, 0.1</td>
      <td>13, 0.2</td>
      <td>3, 0.1</td>
      <td>4, 0.1</td>
      <td><strong>7, 0.1</strong></td>
      <td><strong>7, 0.1</strong></td>
    </tr>
    <tr>
      <td>SceneSqueezer</td>
      <td>27, 0.4</td>
      <td>-</td>
      <td>37, 0.5</td>
      <td>11, 0.4</td>
      <td>15, 0.4</td>
      <td>-</td>
      <td>23, 0.4</td>
    </tr>
    <tr>
      <td rowspan="3">SBMs</td>
      <td>SC-WLS</td>
      <td>14, 0.6</td>
      <td>164, 0.9</td>
      <td>42, 1.7</td>
      <td>11, 0.7</td>
      <td>39, 1.3</td>
      <td>54, 0.7</td>
      <td>27, 1.1</td>
    </tr>
    <tr>
      <td>DSAC* (RGB)</td>
      <td>18, 0.3</td>
      <td>34, 0.2</td>
      <td>21, 0.4</td>
      <td>5, 0.3</td>
      <td>15, 0.6</td>
      <td>19, 0.3</td>
      <td>15, 0.4</td>
    </tr>
    <tr>
      <td>ACE</td>
      <td>28, 0.4</td>
      <td>42, 0.2</td>
      <td>31, 0.6</td>
      <td>5, 0.3</td>
      <td>19, 0.6</td>
      <td>25, 0.4</td>
      <td>21, 0.5</td>
    </tr>
    <tr>
      <td rowspan="9">SFRMs</td>
      <td>FQN-MN</td>
      <td>28, 0.4</td>
      <td>4253, 39.2</td>
      <td>54, 0.8</td>
      <td>13, 0.6</td>
      <td>58, 2.0</td>
      <td>881, 8.6</td>
      <td>38, 1.0</td>
    </tr>
    <tr>
      <td>CROSSFIRE</td>
      <td>47, 0.7</td>
      <td>-</td>
      <td>43, 0.7</td>
      <td>20, 1.2</td>
      <td>39, 1.4</td>
      <td>-</td>
      <td>37, 1.0</td>
    </tr>
    <tr>
      <td>NeRF-loc</td>
      <td>11, 0.2</td>
      <td>25, 0.1</td>
      <td>18, 0.4</td>
      <td>4, 0.2</td>
      <td>7, 0.2</td>
      <td><u>13, 0.2</u></td>
      <td><u>10, 0.3</u></td>
    </tr>
    <tr>
      <td>(Ours) Alike-t</td>
      <td>17, 0.3</td>
      <td>29, 0.1</td>
      <td>20, 0.4</td>
      <td>5, 0.3</td>
      <td>11, 0.4</td>
      <td>16, 0.3</td>
      <td>13, 0.4</td>
    </tr>
    <tr>
      <td>(Ours) Alike-s</td>
      <td>16, 0.2</td>
      <td>32, 0.2</td>
      <td>21, 0.4</td>
      <td>6, 0.3</td>
      <td>11, 0.4</td>
      <td>17, 0.3</td>
      <td>14, 0.4</td>
    </tr>
    <tr>
      <td>(Ours) Alike-n</td>
      <td>18, 0.3</td>
      <td>32, 0.2</td>
      <td>21, 0.4</td>
      <td>5, 0.2</td>
      <td>11, 0.3</td>
      <td>17, 0.3</td>
      <td>14, 0.3</td>
    </tr>
    <tr>
      <td>(Ours) Alike-l</td>
      <td>15, 0.2</td>
      <td>27, 0.1</td>
      <td>19, 0.4</td>
      <td>5, 0.3</td>
      <td>10, 0.3</td>
      <td><strong>15, 0.3</strong></td>
      <td><strong>12, 0.3</strong></td>
    </tr>
    <tr>
      <td>(Ours) SP</td>
      <td>18, 0.3</td>
      <td>29, 0.2</td>
      <td>27, 0.5</td>
      <td>5, 0.3</td>
      <td>11, 0.4</td>
      <td>18, 0.3</td>
      <td>15, 0.4</td>
   </tr>
   </tbody>
</table>



</br>
<!--  -->
<h2 class="text-center">Models Downlaod</h2>
<p>Coming soon</p>
<h3 class="text-center">Cambridge Landmarks Dataset</h3>

  <div class="row">
    <div class="col">
      <a class="btn" href="#"><i class="fa fa-cubes"></i> Great Court Model</a>
    </div>
    <div class="col">
      <a class="btn" href="#"><i class="fa fa-cubes"></i> King's College Model</a>
    </div>
    <div class="col">
      <a class="btn" href="#"><i class="fa fa-cubes"></i> Old Hospital Model</a>
    </div>
    <div class="col">
      <a class="btn" href="#"><i class="fa fa-cubes"></i> Shop Facade Model</a>
    </div>
    <div class="col">
      <a class="btn" href="#"><i class="fa fa-cubes"></i> St. Mary's Church Model</a>
    </div>
  </div>

  <!-- 7-Scenes Dataset Heading -->
<h3 class="text-center">7-Scenes Dataset</h3>

  <!-- Buttons for 7-Scenes Dataset -->
  <div class="row">
    <div class="col">
      <a class="btn" href="#"><i class="fa fa-cubes"></i> Chess Model</a>
    </div>
    <div class="col">
      <a class="btn" href="#"><i class="fa fa-cubes"></i> Fire Model</a>
    </div>
    <div class="col">
      <a class="btn" href="#"><i class="fa fa-cubes"></i> Heads Model</a>
    </div>
    <div class="col">
      <a class="btn" href="#"><i class="fa fa-cubes"></i> Office Model</a>
    </div>
    <div class="col">
      <a class="btn" href="#"><i class="fa fa-cubes"></i> Pumpkin Model</a>
    </div>
    <div class="col">
      <a class="btn" href="#"><i class="fa fa-cubes"></i> Red Kitchen Model</a>
    </div>
    <div class="col">
      <a class="btn" href="#"><i class="fa fa-cubes"></i> Stairs Model</a>
    </div>
  </div>


<h2 class="text-center">Cite us</h2>
<div class="citation-box">
    <pre class="citation-pre">
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
{:/}
