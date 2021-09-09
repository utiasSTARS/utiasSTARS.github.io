---
layout: page
title: Adaptive Traversal of Large and Correlated Field Environments (RA-L and ICRA 2022)
# subtitle:  Representing Rotations in Deep Learning
description: Submitted to RA-L+ICRA (2022)
permalink: /adaptive-graph-traversal/
nav_order: 9995
# youtubeId: 8QMcNmCPYR0
---

# Adaptive Planning in Large Unstructured Environments with Correlated Traversability Costs
Paper submitted to the Robotics and Automation Letters (RA-L) journal and the International Conference on Robotics and Automation (ICRA 2022).

## Supplementary material: simulated kilometre-long traverse using orbital maps of Jezero Crater, Mars

We test our adaptive traversal framework on real orbital maps of Jezero Crater, on Mars. This is where NASA's Mars 2020 Perseverance rover has landed in February 2021. The following grayscale map spans a surface area of 7.3 kilometres by 4.2 kilometres and has a resolution of 5 metres per pixel. The region used for the current experiment is shaded in red and the Perseverance rover landing location is marked for reference.

{::nomarkdown} 
<div style='text-align:center'>
<img src='/assets/adaptive-graph-traversal/jezero_map.png' width='100%'>
</div>
{:/}

### Experiment setup

The raw submaps of the shaded red region above (georeferenced grayscale imagery and elevation model) are shown in the first row of plots below. The global maps used in this experiment are derived from them. Specifically, the mapping data we employ includes: slope magnitude, slope orientation (aspect, or azimuth from North), rock abundance (CFA) and three classes of terrain categories derived from the SPOC Terrain classifier. In our case, class 0 is cohesive soil, class 1 is harder terrain (ex: bedrock) and class 2 is loose soil (ex: sand). Not shown here is a binary mask of dangerous/obstacle regions to avoid including invalid terrain categories, slopes steeper than 30 degrees and human-labelled areas that we generated ourselves.

{::nomarkdown} 
<div style='text-align:center'>
<img src='/assets/adaptive-graph-traversal/jezero_submaps.png' width='100%'>
</div>
{:/}

Similar to the technique described in the results section of our paper, we begin by constructing a directed graph across the space outside of the dangerous/obstacle regions. We randomly sample vertex locations and connect them according to their Voronoi neighbourhood (we calculate the Voronoi diagram of all vertices and connect those with neighbouring cells using two directed edges if they do not cross an obstacle region). Every edge is assigned a categorical feature, which is one of the three terrain classes that their originating vertices are located in. Every edge is also described by a vector of (normalized) continuous features, which in our case are the rover's pitch, roll and the rock abundance along those edges. The graph has a total of 522 vertices and 2668 edges.

{::nomarkdown} 
<div style='text-align:center'>
<img src='/assets/adaptive-graph-traversal/JEZ_graph.png' width='100%'>
</div>
{:/}


<!-- ### A Smooth Representation of <span>SO(3)</span> for Deep Rotation Learning with Uncertainty 
#### Valentin Peretroukhin, Matthew Giamou, David M. Rosen, W. Nicholas Greene, Nicholas Roy, and Jonathan Kelly 
##### Robotics: Science and Systems (RSS) 2020
 
## Code

{::nomarkdown} 
<a target="_blank" rel="external" href="https://github.com/utiasSTARS/bingham-rotation-learning"><i class="fa fa-github-square" aria-hidden="true"></i> Available on Github</a>
{:/}

## Video
{% include youtubePlayer.html id=page.youtubeId %}


### Abstract
Accurate rotation estimation is at the heart of robot perception tasks such as visual odometry and object pose estimation. Deep learning has recently provided a new way to perform these tasks, and the choice of rotation representation is an important part of network design. 

In this work, we present a novel symmetric matrix representation of rotations that is singularity-free and requires marginal computational overhead. We show that our representation has two important properties that make it particularly suitable for learned models: (1) it satisfies a smoothness property that improves convergence and generalization when regressing large rotation targets, and (2) it encodes a symmetric Bingham belief over the space of unit quaternions, permitting the training of uncertainty-aware models. 

We empirically validate the benefits of our formulation by training deep neural rotation regressors  on two data modalities. First, we use synthetic point-cloud data to show that our representation leads to superior predictive accuracy over existing representations for arbitrary rotation targets. Second, we use vision data collected onboard ground and aerial vehicles to demonstrate that our representation is amenable to an effective out-of-distribution (OOD) rejection technique that significantly improves the robustness of rotation estimates to unseen environmental effects and corrupted input images, without requiring the use of an explicit likelihood loss, stochastic sampling, or an auxiliary classifier. This capability is key for safety-critical applications where detecting novel inputs can prevent catastrophic failure of learned models.





## Citation
<pre wrap='true'>
@inproceedings{peretroukhin_so3_2020, 
    AUTHOR    = {Valentin Peretroukhin AND Matthew Giamou AND W. Nicholas Greene AND David Rosen AND Jonathan Kelly AND Nicholas Roy}, 
    TITLE     = { {A Smooth Representation of Belief over SO(3) for Deep Rotation Learning with Uncertainty} }, 
    BOOKTITLE = {Proceedings of Robotics: Science and Systems}, 
    YEAR      = {2020}, 
    ADDRESS   = {Corvalis, Oregon, USA}, 
    MONTH     = {July}, 
    DOI       = {10.15607/RSS.2020.XVI.007} 
}
</pre> -->


