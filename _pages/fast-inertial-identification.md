---
layout: page
title: Fast Object Inertial Parameter Identification for Collaborative Robots (ICRA 2022)
subtitle:  A Dynamic Touch for Cobots
description: Paper on inertial parameter identification for robots working at the pace of human workers
permalink: /fast-inertial-identification/
nav_exclude: false
nav_order: 9992
youtubeId: BNgGSMkgfY4
---

# Fast Object Inertial Parameter Identification for Collaborative Robots

[<i class="fa fa-file-text-o" aria-hidden="true"></i> arXiv pre-print ](https://arxiv.org/abs/2203.00830){: .btn .btn-blue }
[<i class="fa fa-github" aria-hidden="true"></i> View it on Github](https://github.com/utiasSTARS/pyb-sim-models/tree/main/pbsm/models/CompositeTestObject){: .btn .btn-green }
[<i class="fa fa-newspaper-o" aria-hidden="true"></i> DOI ](https://doi.org/10.1109/ICRA46639.2022.9916213){: .btn .btn-red }

### Abstract
Collaborative robots (cobots) are machines designed to work safely alongside people in human-centric environments. Providing cobots with the ability to quickly infer the inertial parameters of manipulated objects will improve their flexibility and enable greater usage in manufacturing and other areas. To ensure safety, cobots are subject to kinematic limits that result in low signal-to-noise ratios (SNR) for velocity, acceleration, and force-torque data. This renders existing inertial parameter identification algorithms prohibitively slow and inaccurate. Motivated by the desire for faster model acquisition, we investigate the use of an approximation of rigid body dynamics to improve the SNR. Additionally, we introduce a mass discretization method that can make use of shape information to quickly identify plausible inertial parameters for a manipulated object. We present extensive simulation studies and real-world experiments demonstrating that our approach complements existing inertial parameter identification methods by specifically targeting the typical cobot operating regime.

### Fast Object Inertial Parameter Identification for Collaborative Robots
#### Philippe Nadeau, Matthew Giamou and Jonathan Kelly 
##### IEEE International Conference on Robotics and Automation 2022 (ICRA 2022)

## Video
{% include youtubePlayer.html id=page.youtubeId %}

## Figures
{::nomarkdown}
<table width="100%">
  <tr>
  <td><img src="/assets/fast-inertial-identification/Fig1.png" width="100%" /></td>
  <td><img src="/assets/fast-inertial-identification/Fig2.png" width="100%" /></td>
  </tr>
  <tr>
  <td><img src="/assets/fast-inertial-identification/Fig3.png" width="100%"/></td>
  <td><img src="/assets/fast-inertial-identification/Fig4.png" width="100%" /></td>
  </tr>
  <tr>
  <td><img src="/assets/fast-inertial-identification/Fig5.png" width="100%" /></td>
  <td><img src="/assets/fast-inertial-identification/Fig6.png" width="100%"/></td>
  </tr>
  <tr>
  <td><img src="/assets/fast-inertial-identification/Fig7.png" width="100%" /></td>
  <td><img src="/assets/fast-inertial-identification/Fig8.png" width="100%" /></td>
  </tr>
</table>
{:/}

## Tables
{::nomarkdown}
<table width="100%">
  <tr>
  <td><img src="/assets/fast-inertial-identification/Tab1.png" width="100%"/></td>
  <td><img src="/assets/fast-inertial-identification/Tab2.png" width="100%"/></td>
  </tr>
  <tr>
  <td><img src="/assets/fast-inertial-identification/Tab3.png" width="100%"/></td>
  <td><img src="/assets/fast-inertial-identification/Tab4.png" width="100%"/></td>
  </tr>
</table>
{:/}

## Supplementary Theoretical Material
{::nomarkdown}
<table width="100%" style="text-align: center;font-weight: bold;">
  <tr>
  <td>Observability Analysis of the Reduced Model</td>
  <td>Point-Mass Inertia Tensor Derivation</td>
  </tr>
  <tr>
  <td><a target="_blank" rel="external" href="https://drive.google.com/file/d/1yRuEx5dY5E3MjH0loM8iOX8XbOJNkQ1x/view?usp=sharing"><img src='/assets/fast-inertial-identification/ProofFirstPage.png' width='25%'></a></td>
  <td><a target="_blank" rel="external" href="https://drive.google.com/file/d/1m4KLf0IvOZMSWMnCa-RD-HpGZWu_tfTR/view?usp=sharing"><img src='/assets/fast-inertial-identification/DerivationFirstPage.png' width='40%'></a></td>
  </tr>
</table>
{:/}

## Composite Test Object Model
{::nomarkdown} 
<a target="_blank" rel="external" href="https://github.com/utiasSTARS/pyb-sim-models/tree/main/pbsm/models/CompositeTestObject"><i class="fa fa-github-square" aria-hidden="true"></i> Available on Github</a>
{:/}

This repository contains code used to generate URDF models of a variety of test objects. The objects are built from two 3d-printed structures, M6 bolts and cylindrical weights. The idea is to make it easy to produce real objects that are very similar to the simulated ones and that can be arranged in a variety of configurations depending on where the weights are placed.

{::nomarkdown} 
<table width="100%">
  <tr>
  <td><img src="/assets/fast-inertial-identification/CompositeTestObjectRenderingCropped.png" width="100%" /></td>
  <td><img src="/assets/fast-inertial-identification/CompositeTestObjectSchematic.png" width="100%" /></td>
  </tr>
</table>
{:/}

## Citation
<pre wrap='true'>
@inproceedings{nadeau_fastInertialIdent_2022, 
    AUTHOR    = {Philippe Nadeau AND Matthew Giamou AND Jonathan Kelly}, 
    TITLE     = { {Fast Object Inertial Parameter Identification for Collaborative Robots} }, 
    BOOKTITLE = {Proceedings of the {IEEE} International Conference on Robotics and Automation {(ICRA)}}, 
    DATE      = {2022-05-23/2022-05-27},
    YEAR      = {2022}, 
    MONTH     = {May}, 
    ADDRESS   = {Philadelphia, PA, USA},
    DOI       = {10.1109/icra46639.2022.9916213},
    URL       = {https://arxiv.org/abs/2203.00830},
    VIDEO     = {https://www.youtube.com/watch?v=BNgGSMkgfY4}
}
</pre>


