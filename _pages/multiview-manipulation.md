---
layout: page
title: Multiview Manipulation (IROS 2021)
subtitle:  Learning Multiview Policies for Manipulation
description: IROS (2021) paper on learning multiview manipulation policies
permalink: /multiview-manipulation/
nav_order: 9995
youtubeId: oh0JMeyoswg
usemathjax: true
---

# Seeing All the Angles: Learning Multiview Manipulation Policies for Contact-Rich Tasks from Demonstrations

[<i class="fa fa-file-text-o" aria-hidden="true"></i> arXiv pre-print ](https://arxiv.org/abs/2104.13907){: .btn .btn-blue }
[<i class="fa fa-github" aria-hidden="true"></i> View it on Github](https://github.com/utiasSTARS/multiview-manipulation){: .btn .btn-green }
[<i class="fa fa-newspaper-o" aria-hidden="true"></i> IROS Paper](https://ieeexplore.ieee.org/document/9636440){: .btn .btn-red }

### Trevor Ablett, Daniel (Yifan) Zhai, Jonathan Kelly
#### IEEE/RSJ International Conference on Intelligent Robots and Systems (IROS 2021)

<br />

{::nomarkdown} 
<div style='text-align:center'>
    <!-- <video width="320" height="240" autoplay loop muted controls> -->
    <video width='49%' autoplay loop muted>
        <source src='/assets/multiview-manipulation/DoorReal_four_runs/ep_14.webm' type='video/webm'>
        Your browser does not support the video tag.
    </video>
    <video width='49%' autoplay loop muted>
        <source src='/assets/multiview-manipulation/DoorReal_four_runs/ep_9.webm' type='video/webm'>
        Your browser does not support the video tag.
    </video>
    <video width='49%' autoplay loop muted>
        <source src='/assets/multiview-manipulation/DoorReal_four_runs/ep_13.webm' type='video/webm'>
        Your browser does not support the video tag.
    </video>
    <video width='49%' autoplay loop muted>
        <source src='/assets/multiview-manipulation/DoorReal_four_runs/ep_20.webm' type='video/webm'>
        Your browser does not support the video tag.
    </video>
    <div><small>Four runs (in real time) of a single multiview policy. The corresponding sensor views are shown at the bottom right.</small></div>
</div>
{:/}

End-to-end learning has emerged as a popular alternative to the traditional sense-plan-act approach to robotic manipulation. This work was motivated by a relatively simple question: what happens when you try to apply an end-to-end visuomotor policy to a <strong>mobile</strong> manipulator, in which there is no guarantee that the base will always approach a task from the same relative pose?

We attempted to thoroughly answer this question by conducting experiments with a simulated and a real mobile manipulator. We generated <em>fixed</em>-view and <em>multi</em>view versions of a set of seven challenging and contact-rich tasks and collected human-expert data in each scenario. We then trained a neural network on each dataset, and tested the performance of fixed-view and multiview policies on fixed-view and multiview tasks.

We found that multiview policies, with an equivalent amount of data, not only significantly outperformed fixed-view policies in mulitview tasks, but performed nearly equivalently in fixed-view tasks. This seems to indicate that, given the ability to do so, it may always be worth training multiview policies. We also found that the features learned by our multiview policies tended to encode a higher degree of spatial consistency than those learned by fixed-view policies.

{::nomarkdown} 
<div style='text-align:center'>
    <!-- <img src='/assets/multiview-manipulation/system_outline/system-updated-new.png' alt='The main components of our system for learning multiview policies.' title='The main components of our system for learning multiview policies.' width='100%'> -->
    <img src='/assets/multiview-manipulation/system_outline/system-updated-new.png' width='100%'>
    <div><small>The main components of our system for learning multiview policies.</small></div>
</div>
{:/}

### Tasks/Environments

As stated, we completed experiments in seven challenging manipulation tasks.

{::nomarkdown} 
<div style='text-align:center'>
    <video width='32%' autoplay loop muted>
        <source src='/assets/multiview-manipulation/ex_runs/pickandinsert_real.webm' type='video/webm'>
        Your browser does not support the video tag.
    </video>
    <video width='32%' autoplay loop muted>
        <source src='/assets/multiview-manipulation/ex_runs/door_real.webm' type='video/webm'>
        Your browser does not support the video tag.
    </video>
    <video width='32%' autoplay loop muted>
        <source src='/assets/multiview-manipulation/ex_runs/drawer_real.webm' type='video/webm'>
        Your browser does not support the video tag.
    </video>
    <video width='24%' autoplay loop muted>
        <source src='/assets/multiview-manipulation/ex_runs/lift_sim.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='24%' autoplay loop muted>
        <source src='/assets/multiview-manipulation/ex_runs/stack_sim.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='24%' autoplay loop muted>
        <source src='/assets/multiview-manipulation/ex_runs/pickandinsert_sim.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='24%' autoplay loop muted>
        <source src='/assets/multiview-manipulation/ex_runs/door_sim.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small>Autonomous policy execution on the seven tasks used for experiments. Notice that between runs, the base pose changes. These videos are shown at 3x real time.</small></div>
</div>
{:/}

### Data Collection

We collected data using a human expert for most of our environments using an HTC Vive hand tracker. For our simulated lifting environment, in the interest of creating repeatable experiments, we generated a policy using reinforcement learning. We created a simple method for autonomoulsy choosing randomized base poses between episodes, using:

- approximate calibration between the arm and the base,
- a known workspace center point, and
- approximate localization of the base, which we obtain using wheel odometry alone.

Notably, this information is required <em>only</em> for data collection as a convenience.

{::nomarkdown}
<div style='text-align:center'>
    <video width='70%' autoplay loop muted>
        <source src='/assets/multiview-manipulation/collect/3x.webm' type='video/webm'>
        Your browser does not support the video tag.
    </video>
    <div><small>A human collecting demonstrations. Notice how the base autonomously resets to new poses between episodes.</small></div>
</div>
{:/}

### Results

As a reminder, we collected two different datasets for each task: a multiview dataset, where data is collected from the multiview task \\( \mathcal{T}_m \\), and a fixed-view dataset, where data is collected from the fixed-view task \\( \mathcal{T}_f \\).

{::nomarkdown} 
<div style='text-align:center'>
    <img src='/assets/multiview-manipulation/multi-vs-fixed/multiview-vs-fixed-view-representations.png' width='70%'>
    <!-- <div><small>Examples of our multiview and fixed-view tasks.</small></div> -->
</div>
{:/}

In this section, we refer to a multiview policy \\( \pi_m \\) and a fixed-view policy \\( \pi_f \\) as being trained on \\( \mathcal{T}_m \\) and \\( \mathcal{T}_f \\) respectively. Because \\( \mathcal{T}_m \\) and \\( \mathcal{T}_f \\) share an observation and action space, we can test \\( \pi_m \\) and \\( \pi_f \\) on both \\( \mathcal{T}_m \\) and \\( \mathcal{T}_f \\)!

{::nomarkdown} 
<div style='text-align:center'>
    <img src='/assets/multiview-manipulation/results/full_comp_success.png' width='81%'>
    <img src='/assets/multiview-manipulation/results/mult_only_envs_vert.png' width='18%'>
</div>
{:/}

The results of \\( \pi_m \\) and \\( \pi_f \\) in \\( \mathcal{T}_m \\) and \\( \mathcal{T}_f \\) are shown above, where it is clear that \\( \pi_m \\) outperforms \\( \pi_f \\) in \\( \mathcal{T}_m \\), and, perhaps more surprisingly, \\( \pi_m \\) performs comparably to \\( \pi_f \\) in \\( \mathcal{T}_f \\), despite not having any data at the exact pose used for \\( \mathcal{T}_f \\). For PickAndInsertReal and DrawerReal, due to the high potential for environmental damage when running \\( \pi_f \\) in \\( \mathcal{T}_m \\), we only ran \\( \pi_m \\), but we would expect the pattern to be similar to PickAndInsertSim, DoorSim, and DoorReal.

We also showed that \\( \pi_m \\) generalizes to out-of-distribution (OOD) data, while, for tasks where mutual information between poses is not generally high (see paper for more details), \\( \pi_f \\) performance drops dramatically as soon as the base is moved from \\( b_\phi = 0\\), the position at which it was trained.

{::nomarkdown} 
<div style='text-align:center'>
    <img src='/assets/multiview-manipulation/results/ood_smaller.png' width='40%'>
</div>
{:/}

### Feature Analysis

Since our network structure includes a spatial-soft argmax layer[^1], which roughly corresponds to a spatial attention mechnanism, we can analyze the features that it learns.

{::nomarkdown} 
<div style='text-align:center'>
    <video width='49%' autoplay loop muted>
        <source src='/assets/multiview-manipulation/feature-analysis/pi_f_feat1.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='49%' autoplay loop muted>
        <source src='/assets/multiview-manipulation/feature-analysis/pi_f_feat2.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small>Two fixed-base policy features.</small></div>
</div>
{:/}
Each of the features above are the two highest activating features learned by \\( \pi_f \\) running in \\( \mathcal{T}_m \\). Clearly, they display quite a bit of temporal and spatial spread. The following image shows the highest six activating features learned by \\( \pi_f \\):

{::nomarkdown} 
<div style='text-align:center'>
    <video width='75%' autoplay loop muted>
        <source src='/assets/multiview-manipulation/feature-analysis/pi_f_allfeat.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small>Six fixed-base policy features.</small></div>
</div>
{:/}

In contrast, here are the two highest activating features learned by \\( \pi_m \\):

{::nomarkdown} 
<div style='text-align:center'>
    <video width='49%' autoplay loop muted>
        <source src='/assets/multiview-manipulation/feature-analysis/pi_m_feat1.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='49%' autoplay loop muted>
        <source src='/assets/multiview-manipulation/feature-analysis/pi_m_feat2.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small>Two multiview policy features.</small></div>
</div>
{:/}

Clearly, the features display more consistency, indicating that the policy, without any loss enforcing it to do so, has learned a degree of view invariance. Once again, here are the six highest activating features:

{::nomarkdown} 
<div style='text-align:center'>
    <video width='75%' autoplay loop muted>
        <source src='/assets/multiview-manipulation/feature-analysis/pi_m_featall.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small>Six multiview policy features.</small></div>
</div>
{:/}

For more details, be sure to check out our [paper published at IROS 2021](https://arxiv.org/abs/2104.13907)!

## Code

{::nomarkdown} 
<a target="_blank" rel="external" href="https://github.com/utiasSTARS/multiview-manipulation"><i class="fa fa-github-square" aria-hidden="true"></i> Available on Github</a>
{:/}

## IROS 2021 Presentation
{% include youtubePlayer.html id=page.youtubeId %}

## Citation
<pre wrap='true'>
@inproceedings{ablett_multiview_2021, 
    AUTHOR    = {Trevor Ablett and Yifan Zhai and Jonathan Kelly}, 
    TITLE     = {Seeing All the Angles: Learning Multiview Manipulation Policies for Contact-Rich Tasks from Demonstrations}, 
    BOOKTITLE = {Proceedings of the {IEEE/RSJ} International Conference on Intelligent Robots and Systems {(IROS'21)}}, 
    YEAR      = {2021}, 
    ADDRESS   = {Prague, Czech Republic}, 
    MONTH     = {Sep. 27--Oct. 1}, 
    URL       = {http://arxiv.org/abs/2104.13907}
}
</pre>

## Bibliography

[^1]: S. Levine, C. Finn, T. Darrell, and P. Abbeel, “End-to-end training of deep visuomotor policies,” Journal of Machine Learning Research, vol. 17, no. 39, pp. 1–40, 2016.
