---
layout: page
title: Fast Object Inertial Parameter Identification for Collaborative Robots
subtitle:  Providing a Dynamic Touch to Cobots
description: Paper on inertial parameter identification for robots working at the pace of human workers
permalink: /fast-inertial-identification/
nav_exclude: true
nav_order: 9995
youtubeId: xCb1l5aNe6Y
---

# Fast Object Inertial Parameter Identification for Collaborative Robots

[<i class="fa fa-file-text-o" aria-hidden="true"></i> arXiv pre-print ](https://arxiv.org/abs/){: .btn .btn-blue }

### Abstract
Collaborative robots (cobots) aim to alleviate the burden of tedious tasks by safely working alongside humans. Providing cobots with the ability to infer the inertial parameters of manipulated objects is a key stepping stone towards their wide adoption in production facilities. To ensure safety, cobots implement kinematic limits that render state-of-the-art identification algorithms prohibitively slow and inaccurate with noisy sensors. Motivated by the literature on safe cobot operation, we introduce Point Mass Discretization (PMD), a formulation of inertial parameter identification that exploits the unique characteristics of cobot motion to outperform existing methods. Our method achieves this by leveraging knowledge of the pose and shape of the manipulated object, which is provided by a cobot's perception system. Extensive simulations and real-world experiments demonstrate that our proposed algorithm complements existing inertial parameter identification methods by specifically targeting a cobots' typical operating regime.

### Fast Object Inertial Parameter Identification for Collaborative Robots
#### Philippe Nadeau, Matthew Giamou and Jonathan Kelly 
##### Submitted to IEEE Robotics and Automation Letters (2021)

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
  <td>Detailed Proof of the Uniqueness of the Solution to the PMD problem</td>
  <td>Point-Mass Inertia Tensor Derivation</td>
  </tr>
  <tr>
  <td><a target="_blank" rel="external" href="https://drive.google.com/file/d/1UHp66af_MPMaJ_4_0Bhw-TM6PJGsL3oT/view?usp=sharing"><img src='/assets/fast-inertial-identification/ProofFirstPage.png' width='25%'></a></td>
  <td><a target="_blank" rel="external" href="https://drive.google.com/file/d/1m4KLf0IvOZMSWMnCa-RD-HpGZWu_tfTR/view?usp=sharing"><img src='/assets/fast-inertial-identification/DerivationFirstPage.png' width='25%'></a></td>
  </tr>
</table>
{:/}

## Code
{::nomarkdown} 
<a target="_blank" rel="external" href="https://github.com/PhilNad/object-inertial-param-id"><i class="fa fa-github-square" aria-hidden="true"></i> Available on Github</a>
{:/}

Set of algorithms used to estimate the mass, center of mass and inertia tensor of objects being manipulated by robot arms.

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
<!--    BOOKTITLE = {Proceedings of the {IEEE} International Conference on Robotics and Automation {(ICRA'22})}, 
    YEAR      = {2022}, 
    ADDRESS   = {Philadelphia, PA, USA}, 
    MONTH     = {May}, 
    DOI       = {}
-->
}
</pre>


