---
layout: page
title: Inverse Kinematics for Serial Kinematic Chains via Sum of Squares Optimization (ICRA 2020)
subtitle:
description: ICRA (2020) paper on solving inverse kinematics using a global polynomial optimization method
permalink: /sos-ik/
youtubeId: AdPze8cTUuE
---
# Inverse Kinematics for Serial Kinematic Chains via Sum of Squares Optimization
[<i class="fa fa-file-text-o" aria-hidden="true"></i> arXiv pre-print ](https://arxiv.org/abs/1909.09318){: .btn .btn-blue }
[<i class="fa fa-github" aria-hidden="true"></i> View it on Github](https://github.com/utiasSTARS/sos-ik){: .btn .btn-green }

Inverse kinematics is a fundamental problem for articulated robots: fast and accurate algorithms are needed for translating task-related workspace constraints and goals into feasible joint configurations. In general, inverse kinematics for serial kinematic chains is a difficult nonlinear problem, for which closed form solutions cannot be easily obtained. Therefore, computationally efficient numerical methods that can be adapted to a general class of manipulators are of great importance. % to motion planning and workspace generation tasks. In this paper, we use convex optimization techniques to solve the inverse kinematics problem with joint limit constraints for highly redundant serial kinematic chains with spherical joints in two and three dimensions. This is accomplished through a novel formulation of inverse kinematics as a nearest point problem, and with a fast sum of squares solver that exploits the sparsity of kinematic constraints for serial manipulators. Our method has the advantages of post-hoc certification of global optimality and a runtime that scales polynomialy with the number of degrees of freedom. Additionally, we prove that our convex relaxation leads to a globally optimal solution when certain conditions are met, and demonstrate empirically that these conditions are common and represent many practical instances. Finally, we provide an open source implementation of our algorithm. 

 {::nomarkdown} 
<div style='text-align:center'>
<img src='/assets/sos-ik/sysimg.png' width='75%'>
</div>
{:/}
## Video
{% include youtubePlayer.html id=page.youtubeId %}

<pre wrap='true'>
@inproceedings{2020_Maric_Inverse,
  address = {Paris, France},
  author = {Filip Maric and Matthew Giamou and Soroush Khoubyarian and Ivan Petrovic and Jonathan Kelly},
  booktitle = {Proceedings of the {IEEE} International Conference on Robotics and Automation {(ICRA'20})},
  date = {2020-05-31/2020-06-04},
  month = {May 31--Jun. 4},
  title = {Inverse Kinematics for Serial Kinematic Chains via Sum of Squares Optimization},
  url = {http://arxiv.org/abs/1909.09318},
  video1 = {https://www.youtube.com/watch?v=AdPze8cTUuE},
  year = {2020}
}
</pre>
