---
layout: page
title: Value-Penalized Auxiliary Control from Examples (CoRL 2024)
subtitle:  Multimodal and Force-Matched Imitation Learning with a See-Through Visuotactile Sensor
description: CoRL paper on learning from example states
permalink: /vpace/
nav_order: 9985
usemathjax: true
---

# Value-Penalized Auxiliary Control from Examples for Learning without Rewards or Demonstrations
{: .no_toc }

<!-- [<i class="fa fa-file-text-o" aria-hidden="true"></i> arXiv ](https://arxiv.org/abs/2311.01248){: .btn .btn-blue } -->
[<i class="fa fa-github" aria-hidden="true"></i> Github](https://github.com/utiasSTARS/vpace){: .btn .btn-green }
<!-- [<i class="fa fa-youtube" aria-hidden="true"></i> Supplementary Video](https://youtu.be/1BgS78-5_vA){: .btn .btn-purple } -->


### Trevor Ablett<sup>1</sup>, Bryan Chan<sup>2</sup>, Jayce Haoran Wang<sup>1</sup>, Jonathan Kelly<sup>1</sup>
{: .no_toc }

<h5>
    <i>
        <sup>1</sup>University of Toronto, <sup>2</sup>University of Alberta
    </i>
</h5>

#### Submitted to Conference on Robot Learning (CoRL) 2024
{: .no_toc }

---

<!-- <br /> -->

<!-- {::nomarkdown} -->
<div style='text-align:center'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/vpace/videos/real/realdoor-exploration.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small> Value-penalized auxiliary control from examples (VPACE) and SQIL<p style="display:inline" markdown="1">[^1]</p> as learning progresses on our real-world door opening task.</small></div>
</div>
<!-- {:/} -->

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

## Summary

{::nomarkdown}
<div style='text-align:center'>
    <img src='/assets/vpace/figs/system/system-900dpi.png' width='100%'>
    <div><small>A visual summary of VPACE.</small></div>
</div>
{:/}

Learning from examples of success is an appealing approach to reinforcement learning that eliminates many of the disadvantages of using hand-crafted reward functions or full expert-demonstration trajectories, both of which can be difficult to acquire, biased, or suboptimal.
However, learning from examples alone dramatically increases the exploration challenge, especially for com-
plex tasks.
In this work, the fundamental question that we aim to address is:

**_Is it possible to learn policies efficiently given only example states of completed tasks?_**

<!-- <img style="float: left; margin: 20px 10px 25px 10px;" width='40%' src="/assets/vpace/figs/all_envs_avg_with_real/squish_r_fig.png"> -->
<div style='text-align:center; float: left; margin: 20px 10px 25px 10px; width: 40%'>
    <img src="/assets/vpace/figs/all_envs_avg_with_real/squish_r_fig.png">
    <div><small>Average performance of VPACE compared with SQIL<p style="display:inline" markdown="1">[^1]</p>, RCE<p style="display:inline" markdown="1">[^2]</p>, and DAC<p style="display:inline" markdown="1">[^3]</p>.</small></div>
</div>
This work introduces **v**alue-**p**enalized **a**uxiliary **c**ontrol from **e**xamples (VPACE); we significantly improve exploration in example-based control by adding scheduled auxiliary control and examples of auxiliary tasks.
Furthermore, we identify a value-calibration problem, where policy value estimates can exceed their theoretical limits based on successful data. We resolve this problem, which is exacerbated by learning auxiliary tasks, through the addition of an above-success-level value penalty.
Across three simulated and one real robotic manipulation environment, and 21 different main tasks, we show that our approach substantially improves learning efficiency.

## Approach

VPACE boils down to three main changes to standard off-policy inverse reinforcement learning:
1. Expert buffers are replaced with *example states* \\( s^\ast \in \mathcal{B}^\ast \\), where the only expert data provided to the agent are examples of successfully completed tasks.
2. Auxiliary task data is provided, in addition to main task data, following the design established by SAC-X[^4] (for RL) and LfGP [^5] (for IRL).
3. To mitigate highly erroneous value estimates derived from bootstrapping, exacerbated by the addition of auxiliary task data, we introduce a simple scheme for value penalization based on the current value estimate for example states.

We find that our approach improves performance and efficiency both with a separately learned reward function (as in DAC[^3]), and without (as in SQIL[^1] and RCE[^2]).

For more details on our approach, see our corresponding paper.

<!-- ### Value Penalization in Example-Based Control

A Markov decision process (MDP) is defined as \\( \mathcal{M} = \langle \mathcal{S}, \mathcal{A}, R, \mathcal{P}, \mathcal{\rho_0}, \gamma \rangle \\), where the sets \\( \mathcal{S} \\) and \\( \mathcal{A} \\)
are respectively the state and action space, \\( \mathcal{P} \\) is the state-transition environment dynamics distribution, \\( \mathcal{\rho_0} \\) is the initial state distribution, \\( \gamma \\) is the discount factor, and the true reward \\( R : \mathcal{S} × \mathcal{A} \rightarrow R \\) is unknown.

For any policy \\( \pi \\), we can define the value function and Q-function as:

$$
\begin{array}{cc}
    V^{\pi}(s) = \mathbb{E}_{a \sim \pi} \left[ Q^{\pi}(s, a) \right],
    &
    Q^{\pi}(s, a) = \hat{R}(s) + \gamma \mathbb{E}_{s' \sim \mathcal{P}}\left[ V^{\pi}(s') \right],
\end{array}
$$

corresponding to the return-to-go from state \\( s \\) (and action \\( a \\)). -->

<!-- Here are example results, sorted by environment.
In each section we show:
1. Examples of our initial state distribution \\( \mathcal{\rho_0} \\) as well examples from auxiliary task example buffers \\( \mathcal{B}^\ast_{\text{aux}} \\) and main task buffers \\( \mathcal{B}^\ast_{\text{main}} \\).
2. Performance  -->

## Real Panda Results

### Exploratory Episodes over Time

#### Door

[(See video above)](#submitted-to-conference-on-robot-learning-corl-2024)

#### Drawer

<div style='text-align:center'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/vpace/videos/real/realdrawer-exploration.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
</div>

### Success Examples for Training
The numerical state data corresponding to these example success images was the only signal (i.e., no reward function and no full trajectories) used for training policies in this work.
We also show examples from the initial state distributions.

<div style='text-align:center'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/vpace/videos/real/all_real_success_examples.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
</div>

### Final Performance

<div style='text-align:center'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/vpace/videos/real/real-finalperf.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
</div>

## Simulation Results

### Exploratory Episodes over Time

#### Unstack-Stack

<div style='text-align:center'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/vpace/videos/sim_panda/unstack-stack-exploration.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
</div>

#### Insert

<div style='text-align:center'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/vpace/videos/sim_panda/insert-exploration.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
</div>

#### sawyer_drawer_open

<div style='text-align:center'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/vpace/videos/sawyer/drawer-open-exploration.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
</div>

#### sawyer_box_close

<div style='text-align:center'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/vpace/videos/sawyer/box-close-exploration.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
</div>

#### sawyer_bin_picking

<div style='text-align:center'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/vpace/videos/sawyer/bin-picking-exploration.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
</div>

#### hammer-human-v0-dp

<div style='text-align:center'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/vpace/videos/hand/hammer-exploration.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
</div>

#### relocate-human-v0-najp-dp

<div style='text-align:center'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/vpace/videos/hand/relocate-exploration.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
</div>

### Success Examples for Training
The numerical state data corresponding to these example success images was the only signal (i.e., no reward function and no full trajectories) used for training policies in this work.
We also show examples from the initial state distributions.

#### Panda Tasks

<div style='text-align:center'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/vpace/videos/sim_panda/all_panda_success_examples.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
</div>

#### Sawyer Tasks

<div style='text-align:center'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/vpace/videos/sawyer/all_sawyer_success_examples.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
</div>

#### Adroit Hand Tasks
The same data was used for the original and the delta-position variants.

<div style='text-align:center'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/vpace/videos/hand/all_hand_success_examples.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
</div>

### Final Performance (All Tasks)

#### Panda Tasks

<div style='text-align:center'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/vpace/videos/sim_panda/panda-finalperf.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
</div>

#### Sawyer Tasks

<div style='text-align:center'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/vpace/videos/sawyer/sawyer-finalperf.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
</div>

#### Adroit Hand Tasks

<div style='text-align:center'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/vpace/videos/hand/hand-finalperf.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
</div>

## Code

{::nomarkdown}
<a target="_blank" rel="external" href="https://github.com/utiasSTARS/vpace"><i class="fa fa-github-square" aria-hidden="true"></i> Available on Github</a>
{:/}

## Citation
Check back soon!

## Bibliography

[^1]: S. Reddy, A. D. Dragan, and S. Levine, “SQIL: Imitation Learning Via Reinforcement Learning with Sparse Rewards,” in 8th International Conference on Learning Representations, ICLR 2020, Addis Ababa, Ethiopia, April 26-30, 2020
[^2]: B. Eysenbach, S. Levine, and R. Salakhutdinov, “Replacing Rewards with Examples: Example-Based Policy Search via Recursive Classification,” in Advances in Neural Information Processing Systems (NeurIPS’21), Virtual, Dec. 2021
[^3]: I. Kostrikov, K. K. Agrawal, D. Dwibedi, S. Levine, and J. Tompson, “Discriminator-Actor-Critic: Addressing Sample Inefficiency and Reward Bias in Adversarial Imitation Learning,” in Proceedings of the International Conference on Learning Representations (ICLR’19), New Orleans, LA, USA, May 2019.
[^4]: M. Riedmiller et al., “Learning by Playing Solving Sparse Reward Tasks from Scratch,” in Proceedings of the 35th International Conference on Machine Learning (ICML’18), Stockholm, Sweden, Jul. 2018, pp. 4344–4353. Accessed: Jan. 10, 2021.
[^5]: T. Ablett, B. Chan, and J. Kelly, “Learning From Guided Play: Improving Exploration for Adversarial Imitation Learning With Simple Auxiliary Tasks,” IEEE Robotics and Automation Letters, vol. 8, no. 3, pp. 1263–1270, Mar. 2023, doi: 10.1109/LRA.2023.3236882.
