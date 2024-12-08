---
layout: page
title: Multimodal and Force-Matched Imitation Learning (T-RO 2025 and ICRA 2025)
subtitle:  Multimodal and Force-Matched Imitation Learning with a See-Through Visuotactile Sensor
description: T-RO paper multimodal and force-matched imitation learning
permalink: /sts-il/
nav_order: 9987
usemathjax: true
---

# Multimodal and Force-Matched Imitation Learning with a See-Through Visuotactile Sensor
{: .no_toc }

[<i class="fa fa-file-text-o" aria-hidden="true"></i> arXiv ](https://arxiv.org/abs/2311.01248){: .btn .btn-blue }
[<i class="fa fa-github" aria-hidden="true"></i> Github](https://github.com/SAIC-MONTREAL/tactile-il){: .btn .btn-green }
[<i class="fa fa-youtube" aria-hidden="true"></i> Supplementary Video](https://youtu.be/1BgS78-5_vA){: .btn .btn-purple }


### Trevor Ablett<sup>1</sup>, Oliver Limoyo<sup>1</sup>, Adam Sigal<sup>2</sup>, Affan Jilani<sup>3</sup>, Jonathan Kelly<sup>1</sup> , Kaleem Siddiqi<sup>3</sup>, Francois Hogan<sup>2</sup>, Gregory Dudek<sup>2,3</sup>
{: .no_toc }

<h5>
    <i>
        <sup>1</sup>University of Toronto, <sup>2</sup>Samsung AI Centre, Montreal, QC, Canada, <sup>3</sup>McGill University
    </i>
</h5>

<small>\**work completed while Trevor Ablett, Oliver Limoyo, and Affan Jilani were on internship at Samsung AI Centre, Montreal*</small>

#### IEEE Transactions on Robotics (T-RO): Special Section on Tactile Robotics (to appear), to be presented at ICRA 2025
{: .no_toc }

---

## Summary
{: .no_toc }

{::nomarkdown}
<div style='text-align:center'>
    <img src='/assets/sts-il/system/system.png' width='100%'>
    <div><small>A summary of our system for multimodal and force-matched imitation learning.</small></div>
</div>
{:/}

<!-- <br /> -->
{::nomarkdown}
<div>
    <video width='100%' autoplay loop muted>
        <source src='/assets/sts-il/system/system-only-crf28-notitle.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <!-- <div><small>A video showing: <br>
        (1) kinesthetic teaching with force recording (parts 1 and 2 in diagram above), <br>
        (2) a force-matched replay with mode switch label (parts 3 and 4 above), and <br>
        (3) a learned multimodal policy with mode-switch action (part 5 above).</small>
    </div> -->
    <div><small>A video showing: (1) kinesthetic teaching with force recording (parts 1 and 2 in diagram above), (2) a force-matched replay with mode switch label (parts 3 and 4 above), and (3) a learned multimodal policy with mode-switch action (part 5 above).</small>
    </div>
</div>
{:/}

## Table of contents
{: .no_toc }
<!-- {: .no_toc .text-delta } -->

1. TOC
{:toc}

## Motivation

The conventional approach to manipulating articulated objects such as doors and drawers with robots relies on a firm, stable grasp of the handle followed by a large arm motion to complete the opening/closing task.
<div style='text-align:center'>
    <div style='text-align:center; width: 25%; display: inline-block; margin-right: 40px'>
        <img src="/assets/sts-il/grasp_press/grasp_500dpi.png">
        <div><small>Grasp and rotate.</small></div>
    </div>
    <div style='text-align:center; width: 25%; display: inline-block; margin-right: 40px'>
        <img src="/assets/sts-il/grasp_press/press_500dpi.png">
        <div><small>Press and pull.</small></div>
    </div>
    <div style='text-align:center; width: 38%; display: inline-block;'>
        <video width='100%' object-fit='cover' autoplay loop muted>
            <source src='/assets/sts-il/grasp_press/istockphoto-toddler-cabinet.mp4' type='video/mp4'>
            Your browser does not support the video tag.
        </video>
        <div><small>A tiny human combines both.</small></div>
    </div>
</div>
In contrast, humans are capable of opening and closing doors with minimal arm motions, by relaxing their grasp on the handle and allowing for relative motion between their fingers and the handle.
This work aims to learn robot policies for door opening that are more in line with human manipulation, by leveraging high-resolution visual and tactile feedback to control the contact interactions between the robot end-effector and the handle.

### Why Kinesthetic Teaching?

{::nomarkdown}
<div style='text-align:center'>
    <!-- <video width="320" height="240" autoplay loop muted controls> -->
    <video width='50%' autoplay loop muted>
        <source src='/assets/sts-il/kin-teach-motivation/multiview-demo-short_480_crf25.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small>Teleoperation. Video in real time. Requires proxy for contact feedback, and is slow.</small></div>
</div>
{:/}

Teleoperation is a viable strategy for collecting demonstrations, but it requires a **proxy** for contact feedback. In the teleoperation example above, we used the vibration motor in the VR controller and the force-torque sensor to provide coarse feedback, but demonstrations were still difficult to collect. Even with considerable practice, we would still often cause the robot to enter into a protective stopped state for generating excessive force against the environment.

<br />

{::nomarkdown}
<div style='text-align:center'>
    <div style='text-align:center; width: 31%; display: inline-block; margin-right: 40px'>
        <video width='100%' object-fit='cover' autoplay loop muted>
            <source src='/assets/sts-il/kin-teach-motivation/kin_teach_glass_knob_open_example_raw_cropped_480_crf25.mp4' type='video/mp4'>
            Your browser does not support the video tag.
        </video>
        <div><small>Kinesthetic Teaching.</small></div>
    </div>
    <div style='text-align:center; width: 55%; display: inline-block;'>
        <video width='100%' object-fit='cover' autoplay loop muted>
            <source src='/assets/sts-il/kin-teach-motivation/replays_without_fm_480_crf28.mp4' type='video/mp4'>
            Your browser does not support the video tag.
        </video>
        <div><small>Replays of kinesthetic teaching <b>without force matching</b>.</small></div>
    </div>
</div>
{:/}

Kinesthetic teaching, as shown above, provides contact feedback, alleviating this issue by allowing the operator to naturally react to environmental contact forces.

Kinesthetic teaching has a significant downside, however: the observation and action space during demonstrations does not match that of the robot. This can be partially resolved by using *replays*, where the robot is commanded to reach the same poses achieved by the human during the demonstration. However, if the human imparts a force on the environment during their demonstration, this replay trajectory can fail.

## Approach

### See-through-Your-Skin (STS) Tactile Sensor

<div style='text-align:center'>
    <div style='text-align:center; width: 50%; display: inline-block; margin-right: 40px'>
        <img src="/assets/sts-il/sts/sts-2022-80dpi.png">
        <div><small>2022 version of STS sensor<p style="display:inline" markdown="1">[^1]</p>.</small></div>
    </div>
    <div style='text-align:left; width: 35%; display: inline-block;'>
        <img src="/assets/sts-il/sts/sts-2023-80dpi.png">
        <div><small>Version from this work, in visual mode (LEDs off) and tactile mode (LEDs on).</small></div>
    </div>
</div>

An STS sensor[^1] is a visuotactile sensor, comparable to other gel-based tactile sensors[^2], that can be switched between visual and tactile modes by leveraging a semi-transparent surface and controllable lighting, allowing for both pre-contact visual sensing and during-contact tactile sensing with a single sensor. In this work, we use the sensor in tactile mode to record a signal linearly related to force during demonstrations, and show its value in both visual and tactile mode as an input to learned policies through extensive experiments.

### Tactile Force Matching

<div style='text-align:center'>
    <div style='text-align:left; width: 38%; display: inline-block; margin-right: 40px'>
        <img src="/assets/sts-il/force-matching/fm-spring-ex.png">
        <div><small>Our force-matched trajectories are generated using a spring relationship between desired poses and recorded poses.</small></div>
    </div>
    <div style='text-align:left; width: 55%; display: inline-block;'>
        <video width='100%' object-fit='cover' autoplay loop muted>
            <source src='/assets/sts-il/force-matching/kin_teach_with_force_720.mp4' type='video/mp4'>
            Your browser does not support the video tag.
        </video>
        <div><small>Kinesthetic teaching while reading the signal linearly related to force with an STS sensor.</small></div>
    </div>
</div>

Our force-matched poses were generated by measuring a signal linearly related to force with an STS sensor, which was then used to modify the desired poses before they were input back into our Cartesian impedance controller. For more details, see our paper.

### Learned STS Mode Switching

<div style='text-align:center'>
    <div style='text-align:left; width: 38%; display: inline-block; margin-right: 40px'>
        <img src="/assets/sts-il/mode-switching/policy-diagram.png">
        <div><small>Our learned policy includes sensor mode as an output, in addition to robot motion.</small></div>
    </div>
    <div style='text-align:left; width: 55%; display: inline-block;'>
        <video width='100%' object-fit='cover' autoplay loop muted>
            <source src='/assets/sts-il/mode-switching/replay_with_label_glass_knob_open_720.mp4' type='video/mp4'>
            Your browser does not support the video tag.
        </video>
        <div><small>Mode switch labels are provided during the force matched replay by the demonstrator, who pushes a key when the robot makes contact with the environment.</small></div>
    </div>
</div>

To further leverage an STS sensor for imitation learning, we add mode switching as a policy output, allowing the policy to learn the appropriate moment to switch an STS from its visual to its tactile mode.

## Experiments

To verify the efficacy of force matching, learned mode switching, and tactile sensing in general, we study multiple observation configurations to compare and contrast the value of visual and tactile data from an STS with visual data from a wrist-mounted eye-in-hand camera.

### Experimental Tasks

{::nomarkdown}
<div style='text-align:left'>
    <video width='49%' autoplay loop muted>
        <source src='/assets/sts-il/env-examples/demo_replay_glass_knob_open_1x_480.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='49%' autoplay loop muted>
        <source src='/assets/sts-il/env-examples/demo_replay_glass_knob_close_1x_480.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='49%' autoplay loop muted>
        <source src='/assets/sts-il/env-examples/demo_replay_flat_handle_open_1x_480.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='49%' autoplay loop muted>
        <source src='/assets/sts-il/env-examples/demo_replay_flat_handle_close_1x_480.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small>Demonstrations and force-matched replays of our four experimental tasks, GlassKnobOpen, GlassKnobClose, FlatHandleOpen, and FlatHandleClose. </small></div>
</div>
{:/}

In this work, we study four challenging robotic tasks: door opening and closing with a flat handle a glass knob, including a randomized initial position requiring a reach to initially make contact. This scenario is meant to to simulate a scenario with a true mobile manipulator, where the initial pose between the arm and the handle/knob would not be consistent between each open/close. The closing tasks required shutting the door "quietly" without allowing it to slam.

### Training details

We collected 20 raw demonstrations for each task, and then completed replays of each demonstration under different conditions, such as including/excluding force matching and/or mode switching.

As shown in the *Learned STS Mode Switching* section, we trained policies with STS images, wrist camera images, and relative robot pose (i.e., relative to the beginning of an episode) as inputs, with delta end-effector poses and mode switch control as outputs.

For all experiments, we trained 3 seeds of each policy, and then ran each policy for 10 episodes in each configuration.

### Results -- Overall

The videos below show learned policies with force matching, mode switching, and STS data included.

{::nomarkdown}
<div style='text-align:center'>
    <div style='text-align:center; width: 48%; display: inline-block; margin-right: 5px'>
        <video width='100%' object-fit='cover' autoplay loop muted>
            <source src='/assets/sts-il/learned-policies/learned_policy_one_run_glass_knob_both_480.mp4' type='video/mp4'>
            Your browser does not support the video tag.
        </video>
        <div><small>Autonomous GlassKnobOpen and GlassKnobClose policies.</small></div>
    </div>
    <div style='text-align:center; width: 48%; display: inline-block;'>
        <video width='100%' object-fit='cover' autoplay loop muted>
            <source src='/assets/sts-il/learned-policies/learned_policy_one_run_flat_handle_both_480.mp4' type='video/mp4'>
            Your browser does not support the video tag.
        </video>
        <div><small>Autonomous FlatHandleOpen and FlatHandleClose policies.</small></div>
    </div>
</div>
{:/}

<div style='text-align:center'>
    <div style='text-align:left; width: 50%; display: inline-block; margin-right: 5px'>
        <img src="/assets/sts-il/results/sys_perf_leg_und.png">
        <div><small>Performance results with/without force matching, mode switching, and STS data.</small></div>
    </div>
    <div style='text-align:left; width: 48%; display: inline-block;'>
        <video width='100%' object-fit='cover' autoplay loop muted>
            <source src='/assets/sts-il/results/no_fm_no_ms_no_sts_examples_480.mp4' type='video/mp4'>
            Your browser does not support the video tag.
        </video>
        <div><small>Example runs with no force matching, no mode switching, and no STS data.</small></div>
    </div>
    <!-- <img src='/assets/sts-il/results/sys_perf_leg_und.png' width='40%'>
    <video width='49%' autoplay loop muted>
        <source src='/assets/sts-il/results/no_fm_no_ms_no_sts_examples_480.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small><i>Left:</i> Performance results with/without force matching, mode switching, and STS data. <i>Right:</i> Example runs with no force matching, no mode switching, and no STS data.</small></div> -->
</div>

<!-- ### Results -- Force Matching

Check back soon!

### Results -- Mode Switching

Check back soon!

### What if we only use the Wrist Camera?

Check back soon! -->

## Conclusion

Through over 3,000 test episodes from real-world manipulation experiments, we find that the inclusion of force matching raises average policy success rates by **62.5%**, STS mode switching by **30.3%**, and STS data as a policy input by **42.5%**. Our results highlight the utility of see-through tactile sensing for IL, both for data collection to allow force matching, and for policy execution to allow accurate task feedback.


## Code

{::nomarkdown}
<a target="_blank" rel="external" href="https://github.com/SAIC-MONTREAL/tactile-il"><i class="fa fa-github-square" aria-hidden="true"></i> Available on Github</a>
{:/}

## Citation
<pre wrap='true'>
@misc{ablettMultimodalForceMatchedImitation2023,
  title = {Multimodal and Force-Matched Imitation Learning with a See-Through Visuotactile Sensor},
  author = {Ablett, Trevor and Limoyo, Oliver and Sigal, Adam and Jilani, Affan and Kelly, Jonathan and Siddiqi, Kaleem and Hogan, Francois and Dudek, Gregory},
  year = {2023},
  month = dec,
  number = {arXiv:2311.01248},
  eprint = {2311.01248},
  primaryclass = {cs},
  publisher = {{arXiv}},
  doi = {10.48550/arXiv.2311.01248},
  urldate = {2024-02-15},
  archiveprefix = {arxiv},
  keywords = {Computer Science - Artificial Intelligence,Computer Science - Machine Learning,Computer Science - Robotics}
}
</pre>

## Bibliography

[^1]: F. R. Hogan, J.-F. Tremblay, B. H. Baghi, M. Jenkin, K. Siddiqi, and G. Dudek, “Finger-STS: Combined Proximity and Tactile Sensing for Robotic Manipulation,” IEEE Robotics and Automation Letters, vol. 7, no. 4, pp. 10865–10872, Oct. 2022, doi: 10.1109/LRA.2022.3191812.
[^2]: C. Chi, X. Sun, N. Xue, T. Li, and C. Liu, “Recent Progress in Technologies for Tactile Sensors,” Sensors, vol. 18, no. 4, Art. no. 4, Apr. 2018, doi: 10.3390/s18040948.
