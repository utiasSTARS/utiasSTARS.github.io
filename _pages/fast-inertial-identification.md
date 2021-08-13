---
layout: page
title: Fast Inertial Parameter Identification of Manipulated Objects for Collaborative Robots (ICRA 2022)
subtitle:  Providing a Dynamic Touch to Cobots
description: ICRA (2022) paper on inertial parameter identification for robots working at the pace of human workers
permalink: /fast-inertial-identification/
nav_exclude: true
nav_order: 9995
youtubeId: 
---

# Fast Inertial Parameter Identification of Manipulated Objects for Collaborative Robots 

[<i class="fa fa-file-text-o" aria-hidden="true"></i> arXiv pre-print ](https://arxiv.org/abs/){: .btn .btn-blue }

### Abstract
Collaborative robots (cobots) aims to safely work alongside human workers to alleviate the burden of tedious tasks. Providing cobots with the capability to infer the *inertial parameters* of manipulated objects can be a stepping stone towards their wide adoption in production facilities. To ensure safety, cobots implement kinematic limits that makes existing algorithms prohibitively slow and inaccurate on noisy signals. We formulate an optimization problem that can generate a good solution faster than other methods by relying on two educated approximations and by leveraging knowledge of the pose and shape of the manipulated object. The proposed algorithm is supported by a number of simulation and real-world experiments that show how it complements existing algorithms by specifically targeting cobots operation regime.

### Fast Inertial Parameter Identification of Manipulated Objects for Collaborative Robots 
#### Philippe Nadeau, Matthew Giamou and Jonathan Kelly 
##### International Conference on Robotics and Automation (ICRA) 2022 

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
<a target="_blank" rel="external" href="https://github.com/PhilNad/inertial-parameters-estimation"><i class="fa fa-github-square" aria-hidden="true"></i> Available on Github</a>
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
    TITLE     = { {Fast Inertial Parameter Identification of Manipulated Objects for Collaborative Robots} }, 
    BOOKTITLE = {Proceedings of the {IEEE} International Conference on Robotics and Automation {(ICRA'22})}, 
    YEAR      = {2022}, 
    ADDRESS   = {Philadelphia, PA, USA}, 
    MONTH     = {May}, 
    DOI       = {} 
}
</pre>


