---
layout: page
title: Self-Supervised DPC (ICRA 2020)
subtitle:
description:
permalink: /ss-dpc/
nav_order: 9998
youtubeId: AvNBUK4lTMo
---

# Self-Supervised Deep Pose Corrections for Robust Visual Odometry (ICRA 2020)

[<i class="fa fa-file-text-o" aria-hidden="true"></i> arXiv Publication](https://arxiv.org/abs/2002.12339){: .btn .btn-purple }
[<i class="fa fa-github" aria-hidden="true"></i> View it on Github](https://github.com/utiasSTARS/ss-dpc-net){: .btn }


Many geometric visual odometry (VO) algorithms exist that provide accurate egomotion estimates. However, modelling assumptions (e.g., the rigid world and photometric consistency assumptions) limit the use of these 'classical' estimators in challenging environments where modelling assumptions do not hold. To address this issue, deep pose correction (DPC) networks have been shown to improve the overall accuracy of classical VO estimators by learning to correct for systematic error that is present in the estimator's egomotion estimates. Herein, we extend the DPC framework by implementing a self-supervised loss formulation, which improves the overall accuracy and allows our network to be retrained online when the robot acquires data within new environments.

{::nomarkdown} 
<div style='text-align:center'>
<img src='/assets/self-supervised-dpc/system.png' width='75%'>
</div>
{:/}

### Self-Supervised Deep Pose Corrections for Robust Visual Odometry 
#### Brandon Wagstaff, Valentin Peretroukhin, and Jonathan Kelly 
##### International Conference on Robotics and Automation (ICRA) 2020

## Preprint

{::nomarkdown} 
 <a target="_blank" rel="external" href="https://github.com/utiasSTARS/ss-dpc-net"><img src='/assets/self-supervised-dpc/arxiv_shadow.png' width='25%'></a>
 {:/}
 
## Code

{::nomarkdown} 
<a target="_blank" rel="external" href="https://github.com/utiasSTARS/ss-dpc-net"><i class="fa fa-github-square" aria-hidden="true"></i> Available on Github</a>
{:/}


### Abstract
We present a self-supervised deep pose correction (DPC) network that applies pose corrections to a visual odometry estimator to improve its accuracy. Instead of regressing inter-frame pose changes directly, we build on prior work that uses data-driven learning to regress pose corrections that account for systematic errors due to violations of modelling assumptions. Our self-supervised formulation removes any requirement for six-degrees-of-freedom ground truth and, in contrast to expectations, often improves overall navigation accuracy compared to a supervised approach. Through extensive experiments, we show that our self-supervised DPC network can significantly enhance the performance of classical monocular and stereo odometry estimators and substantially out-performs state-of-the-art learning-only approaches.

## Video
{% include youtubePlayer.html id=page.youtubeId %}
## Citation

<pre wrap='true'>
@inproceedings{2020_Wagstaff_Self-Supervised,
  author = {Brandon Wagstaff and Valentin Peretroukhin and Jonathan Kelly},
  booktitle = {Proceedings of the {IEEE} International Conference on Robotics and Automation {(ICRA'20})},
  date = {2020-05-31/2020-06-04},
  month = {May 31--Jun. 4},
  title = {Self-Supervised Deep Pose Corrections for Robust Visual Odometry},
  url = {https://arxiv.org/abs/2002.12339},
  year = {2020}
}
</pre>


