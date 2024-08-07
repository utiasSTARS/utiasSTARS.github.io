---
layout: page
title: Learning from Guided Play (RA-L and IROS 2023)
subtitle:  Learning from Guided Play to improve Adversarial Imitation Learning
description: RA-L + IROS 2023 paper on learning from guided play
permalink: /lfgp/
nav_order: 9991
usemathjax: true
---

# Learning from Guided Play: Improving Exploration for Adversarial Imitation Learning with Simple Auxiliary Tasks

[<i class="fa fa-file-text-o" aria-hidden="true"></i> arXiv (with Appendix) ](https://arxiv.org/abs/2301.00051){: .btn .btn-blue }
[<i class="fa fa-github" aria-hidden="true"></i> Github](https://github.com/utiasSTARS/lfgp){: .btn .btn-green }
[<i class="fa fa-newspaper-o" aria-hidden="true"></i> DOI ](https://doi.org/10.1109/LRA.2023.3236882){: .btn .btn-grey }
[<i class="fa fa-youtube" aria-hidden="true"></i> Youtube ](https://youtu.be/qa4EVT_HSOg?si=ZLVLsFcS7ZXvQ5Md){: .btn .btn-purple }






### Trevor Ablett, Bryan Chan, Jonathan Kelly
#### Robotics and Automation Letters (RA-L) with IEEE/RSJ International Conference on Intelligent Robots and Systems (IROS'23) Option

---
*Preliminary version presented as Learning from Guided Play: A Scheduled Hierarchical Approach for Improving Exploration in Adversarial Imitation Learning*

[<i class="fa fa-file-text-o" aria-hidden="true"></i> arXiv ](https://arxiv.org/abs/2112.08932){: .btn .btn-blue }
[<i class="fa fa-film" aria-hidden="true"></i> SlidesLive ](https://slideslive.com/38971121){: .btn .btn-purple }
[<i class="fa fa-image" aria-hidden="true"></i> Poster ](/assets/lfgp/2021-neurips-lfgp-poster.pdf){: .btn }
#### Poster at Neurips 2021 Deep Reinforcement Learning Workshop


<br />

{::nomarkdown} 
<div style='text-align:center'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/lfgp/lfgp-vs-dac/lfgp_vs_dac_progression_4x.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small>Discriminator-Actor-Critic (DAC)<sup>1</sup> and Learning from Guided Play (LfGP) on a stacking task.</small></div>
</div>
{:/}



In this work, we were interested in investigating the efficacy of Adversarial Imitation Learning (AIL) on manipulation tasks.  AIL is a popular form of Inverse Reinforcement Learning (IRL) in which a Discriminator, acting as a reward, and a policy are simultaneously learned using expert data. Empirically, we found that a state-of-the-art off-policy method for AIL[^1] is unable to effectively solve a variety of manipulation tasks. We demonstrated that this is because AIL is susceptible to deceptive rewards[^2], where a locally optimal policy sufficiently matches the expert distribution without necessarily solving the task. A simplified example where this occurs is shown below:

{::nomarkdown} 
<div style='text-align:center'>
    <img src='/assets/lfgp/toy_example/lfgp-toy-example-with-states-vertical-shortest.png' width='60%'>
    <div><small>A simple MDP where AIL learns a deceptive reward and a suboptimal policy.</small></div>
</div>
{:/}

The example above can be thought of as analogous to a stacking task: \\(s^2\\) through \\(s^6\\) represent the first block being reached, grasped, lifted, moved to the second block, and dropped, respectively, while \\(s^1\\) is
the reset state, and \\(a^{15}\\) represents the second block being reached without grasping the first block (action \\(a^{nm}\\) refers to moving from \\(s^n\\) to \\(s^m\\)). Taking action \\(a^{55}\\) in \\(s^5\\) represents opening the gripper, which results in a return of -1 after taking \\(a^{15}\\) (because \\(R(s^1, a^{15} ) = −5\\)), since the first block has not actually been grasped in this case.

AIL learns to exploit the \\(a^5\\) action without actually completing the full trajectory.

To mitigate this problem, we introduced a scheduled hierarchical modification[^3] to off-policy AIL in which multiple discriminators, policies, and critics are all learned simultaneously, solving a variety of auxiliary tasks in addition to a main task, while still ultimately attempting to maximize main task performance. We called this method <b>Learning from Guided Play (LfGP)</b>, inspired by the play-based learning found in children, as opposed to goal-directed learning. Using expert data, the agent is *guided* to *playfully* explore parts of the state and action space that would have been avoided otherwise. The title also refers to the actual collection of this expert data, since the expert is guided by a uniform sampler, in our case, to fully explore an environment through play. 
This hierarchical framework not only resolved the "local maximum" policy problem exhibited by AIL, but also allowed for the reuse of expert data between tasks, increasing their expert data sample efficienty.
The separation between tasks could also be easily applied to transfer learning, but we left investigating that possibility to future work.

An example of DAC's poor performance is shown on the left side of the video at the top of the page, and the improved exploration exhibited by LfGP is shown on the right. The diagram below is a simplified description of our multitask environment and the different types of play used in our method.

{::nomarkdown} 
<div style='text-align:center'>
    <img src='/assets/lfgp/system/system-with-agent-3.png' width='100%'>
    <div><small>The main components of our system for learning from guided play.</small></div>
</div>
{:/}

### Multitask Environment
We created a simulated multitask environment which is available for use [here](https://github.com/utiasSTARS/manipulator-learning), and is automatically installed and used when training using the [open-source repository for LfGP](https://github.com/utiasSTARS/lfgp).

Here are examples of each of the four main tasks studied in this work:

{::nomarkdown} 
<div style='text-align:center'>
    <!-- <video width="320" height="240" autoplay loop muted controls> -->
    <video width='24%' autoplay loop muted>
        <source src='/assets/lfgp/ex-runs/stack_1point5x.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='24%' autoplay loop muted>
        <source src='/assets/lfgp/ex-runs/unstack_stack_1point5x.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='24%' autoplay loop muted>
        <source src='/assets/lfgp/ex-runs/bring_1point5x.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='24%' autoplay loop muted>
        <source src='/assets/lfgp/ex-runs/insert_1point5x.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small>Left to right: Stack, Unstack-Stack, Bring, Insert.</small></div>
</div>
{:/}

As stated, we also used simple-to-define auxiliary tasks to assist in learning and allow for the reuse of expert data and learned models:

{::nomarkdown} 
<div style='text-align:center'>
    <!-- <video width="320" height="240" autoplay loop muted controls> -->
    <video width='19%' autoplay loop muted>
        <source src='/assets/lfgp/ex-runs/reach_open_1point5x.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='19%' autoplay loop muted>
        <source src='/assets/lfgp/ex-runs/reach_close_1point5x.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='19%' autoplay loop muted>
        <source src='/assets/lfgp/ex-runs/reach_1point5x.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='19%' autoplay loop muted>
        <source src='/assets/lfgp/ex-runs/lift_1point5x.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='19%' autoplay loop muted>
        <source src='/assets/lfgp/ex-runs/move_obj_1point5x.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small>Left to right: Open-Gripper, Close-Gripper, Reach, Lift, Move-Object.</small></div>
</div>
{:/}

### Results
In our main performance results, we compared against the following baselines:

- Off-policy AIL (DAC[^1]) _(single-task)_
- Behavioural cloning (BC) _(single-task)_ 
- BC _(multitask)_

To try to make a fair comparison, we used an equivalent amount of _total_ expert data for the single-task methods, as compared to the multitask methods. However, it is also important to note that the single-task methods cannot reuse data between tasks. The following table describes this idea in further detail:

{::nomarkdown} 
<div style='text-align:center'>
    <img src='/assets/lfgp/data/table-updated.png' width='60%'>
    <div><small>Expert dataset sizes for each task, including quantity of auxiliary task data. Each letter under "Dataset Sizes" corresponds to an auxiliary or main task, and bolded letters correspond to datasets that were reused (e.g., <b>O</b>pen-Gripper, <b>S</b>tack). Numbers are total number of <i>(s,a)</i> pairs. </small></div>
</div>
{:/}

Our main performance results are shown below.

{::nomarkdown} 
<div style='text-align:center'>
    <img src='/assets/lfgp/results/s_fig_updated.png' width='100%'>
    <div><small>Final performance results on each main task.</small></div>
</div>
{:/}

It is clear that LfGP is able to achieve expert-level behaviour in all tasks apart from Bring.
In Bring, it nearly achieves expert performance, but is also matched by single-task BC.
Remember, however, that single-task BC has far more main-task data than LfGP, and cannot reuse expert data, so LfGP is still more expert-data efficient than BC.

### Final Learned Policies for All Methods
Here we visualize the final learned policies for all four methods and all four tasks.
Each video shows five episodes on repeat.

{::nomarkdown} 
<div style='text-align:center'>
    <table>
        <tr>
            <td style="width: 12px; min-width:10px"></td>
            <td> DAC </td>
            <td> Multitask BC </td>
            <td> Single-task BC </td>
            <td> <font size="+1"> <b>LfGP</b> </font> </td>
        </tr>
        <tr>
            <td style="width: 12px; min-width:10px">Stack</td>
            <td>
                <video width='100%' autoplay loop muted playsinline controls="">
                    <source src='/assets/lfgp/final_policies/stack/dac.mp4' type='video/mp4'>
                    Your browser does not support the video tag.
                </video>
            </td>
            <td>
                <video width='100%' autoplay loop muted playsinline controls>
                    <source src='/assets/lfgp/final_policies/stack/multitask_bc.mp4' type='video/mp4'>
                    Your browser does not support the video tag.
                </video>
            </td>
            <td>
                <video width='100%' autoplay loop muted playsinline controls>
                    <source src='/assets/lfgp/final_policies/stack/bc.mp4' type='video/mp4'>
                    Your browser does not support the video tag.
                </video>
            </td>
            <td>
                <video width='100%' autoplay loop muted playsinline controls>
                    <source src='/assets/lfgp/final_policies/stack/lfgp.mp4' type='video/mp4'>
                    Your browser does not support the video tag.
                </video>
            </td>
        </tr>
        <tr>
            <td style="width: 12px; min-width:10px">Unstack Stack</td>
            <td>
                <video width='100%' autoplay loop muted playsinline controls>
                    <source src='/assets/lfgp/final_policies/unstack-stack/dac.mp4' type='video/mp4'>
                    Your browser does not support the video tag.
                </video>
            </td>
            <td>
                <video width='100%' autoplay loop muted playsinline controls>
                    <source src='/assets/lfgp/final_policies/unstack-stack/multitask_bc.mp4' type='video/mp4'>
                    Your browser does not support the video tag.
                </video>
            </td>
            <td>
                <video width='100%' autoplay loop muted playsinline controls>
                    <source src='/assets/lfgp/final_policies/unstack-stack/bc.mp4' type='video/mp4'>
                    Your browser does not support the video tag.
                </video>
            </td>
            <td>
                <video width='100%' autoplay loop muted playsinline controls>
                    <source src='/assets/lfgp/final_policies/unstack-stack/lfgp.mp4' type='video/mp4'>
                    Your browser does not support the video tag.
                </video>
            </td>
        </tr>
        <tr>
            <td style="width: 12px; min-width:10px">Bring</td>
            <td>
                <video width='100%' autoplay loop muted playsinline controls>
                    <source src='/assets/lfgp/final_policies/bring/dac.mp4' type='video/mp4'>
                    Your browser does not support the video tag.
                </video>
            </td>
            <td>
                <video width='100%' autoplay loop muted playsinline controls>
                    <source src='/assets/lfgp/final_policies/bring/multitask_bc.mp4' type='video/mp4'>
                    Your browser does not support the video tag.
                </video>
            </td>
            <td>
                <video width='100%' autoplay loop muted playsinline controls>
                    <source src='/assets/lfgp/final_policies/bring/bc.mp4' type='video/mp4'>
                    Your browser does not support the video tag.
                </video>
            </td>
            <td>
                <video width='100%' autoplay loop muted playsinline controls>
                    <source src='/assets/lfgp/final_policies/bring/lfgp.mp4' type='video/mp4'>
                    Your browser does not support the video tag.
                </video>
            </td>
        </tr>
        <tr>
            <td style="width: 12px; min-width:10px">Insert</td>
            <td>
                <video width='100%' autoplay loop muted playsinline controls>
                    <source src='/assets/lfgp/final_policies/insert/dac.mp4' type='video/mp4'>
                    Your browser does not support the video tag.
                </video>
            </td>
            <td>
                <video width='100%' autoplay loop muted playsinline controls>
                    <source src='/assets/lfgp/final_policies/insert/multitask_bc.mp4' type='video/mp4'>
                    Your browser does not support the video tag.
                </video>
            </td>
            <td>
                <video width='100%' autoplay loop muted playsinline controls>
                    <source src='/assets/lfgp/final_policies/insert/bc.mp4' type='video/mp4'>
                    Your browser does not support the video tag.
                </video>
            </td>
            <td>
                <video width='100%' autoplay loop muted playsinline controls>
                    <source src='/assets/lfgp/final_policies/insert/lfgp.mp4' type='video/mp4'>
                    Your browser does not support the video tag.
                </video>
            </td>
        </tr>
    </table>
    <!-- <div><small>Left to right: Open-Gripper, Close-Gripper, Reach, Lift, Move-Object.</small></div> -->
</div>
{:/}

### Ablation Studies
We performed an extensive series of ablation experiments:
- _Dataset ablations:_
    - Half the original dataset size
    - 1.5x the original dataset size
    - Subsampling the expert dataset, taking every 20th \\((s,a)\\) pair.
    - Without added extra final \\((s_T, \boldsymbol{0})\\) pairs
- _Scheduler ablations:_
    - Weighted Random Scheduler with Handcrafted trajectories (WRS + HC)
    - Weighted Random Scheduler only
    - Learned Scheduler
    - No Scheduler (only main task selected) 
- _Sampling ablations:_
    - Expert sampling for discriminator only
    - No sampling bias for \\((s_T, \boldsymbol{0})\\) pairs
- _Baseline Alternatives:_
    - BC with early stopping (70%/30% training/validation split)
    - GAIL (on-policy AIL)

For more description of these ablations, please see our paper.
The results of these ablations are shown below.

{::nomarkdown} 
<div style='text-align:center'>
    <img src='/assets/lfgp/ablations/dataset_withmain_sideleg_s_fig.png' width='100%'>
    <div><small>Dataset ablations.</small></div>
</div>
<div style='text-align:center'>
    <img src='/assets/lfgp/ablations/scheduler_halfw_s_fig.png' width='32%'>
    <img src='/assets/lfgp/ablations/sampling_halfw_s_fig.png' width='32%'>
    <img src='/assets/lfgp/ablations/baseline_halfw_s_fig.png' width='32%'>
    <div><small>Scheduler, expert sampling, and baseline ablations.</small></div>
</div>
{:/}


### Analysis
We also visualized the learned stack models for LfGP and DAC.

{::nomarkdown} 
<div style='text-align:center'>
    <img src='/assets/lfgp/traj_3d/200k_to_800k.png' width='70%'>
    <div><small>LfGP and DAC trajectories for four episodes throughout learning, with manually set consistent initial conditions. The LfGP trajectories contain many tasks composed, whereas the DAC trajectories only execute the main stacking task.</small></div>
</div>
{:/}

The LfGP policies exhibit significantly more diversity than the DAC policies do, and the DAC policies eventually only learn to partially reach the blue block and hover near the green block. This is understandable—DAC has learned a deceptive reward for hovering above the green block regardless of the position of the blue block, because it hasn’t sufficiently explored the alternative of grasping and moving the blue block closer. Even if hovering above the green block doesn’t fully match the expert data, the DAC policy receives some reward for doing so, as evidenced by its learned Q-Value (DAC on the right-most image):

{::nomarkdown} 
<div style='text-align:center'>
    <img src='/assets/lfgp/q_vis/lfgp_all_tasks_plus_dac_v1_199999.png' width='100%'>
    <div><small>A view of a single plane of learned mean policy actions (arrow for velocity direction/magnitude, blue indicates open gripper, green indicates close) and Q values (red: high, yellow: low) for each LfGP task and DAC at 200k environment steps.</small></div>
</div>
{:/}

Again, compared with DAC, the LfGP policies have made significantly more progress towards each of their individual tasks than DAC has, and the LfGP Stack policy, in particular, has already learned to reach and grasp the block, while learning high value for being near either block. Further on in training, it learns to only have high value near the green block *after* having grasped the blue block; an important step that DAC never achieves.


<!-- For more details, see our [arXiv paper](https://arxiv.org/abs/2112.08932)! -->


## Code

{::nomarkdown} 
<a target="_blank" rel="external" href="https://github.com/utiasSTARS/lfgp"><i class="fa fa-github-square" aria-hidden="true"></i> Available on Github</a>
{:/}

## Neurips 2021 Deep Reinforcement Learning Workshop Presentation

[<i class="fa fa-film" aria-hidden="true"></i> SlidesLive](https://slideslive.com/38971121/learning-from-guided-play-a-scheduled-hierarchicl-approach-for-improving-exploration-in-adversarial-imitation-learning){: .btn .btn-purple }

## Citation
<pre wrap='true'>
@article{2023_Ablett_Learning,
  author = {Trevor Ablett and Bryan Chan and Jonathan Kelly},
  code = {https://github.com/utiasSTARS/lfgp},
  doi = {10.1109/LRA.2023.3236882},
  journal = {IEEE Robotics and Automation Letters},
  month = {March},
  number = {3},
  pages = {1263--1270},
  site = {https://papers.starslab.ca/lfgp/},
  title = {Learning from Guided Play: Improving Exploration for Adversarial Imitation Learning with Simple Auxiliary Tasks},
  url = {https://arxiv.org/abs/2301.00051},
  volume = {8},
  year = {2023}
}
</pre>

## Bibliography

[^1]: I. Kostrikov, K. K. Agrawal, D. Dwibedi, S. Levine, and J. Tompson, “Discriminator-Actor-Critic: Addressing Sample Inefficiency and Reward Bias in Adversarial Imitation Learning,” presented at the Proceedings of the International Conference on Learning Representations (ICLR’19), New Orleans, LA, USA, May 2019.
[^2]: A. Ecoffet, J. Huizinga, J. Lehman, K. O. Stanley, and J. Clune, “First return, then explore,” Nature, vol. 90, no. 7847, pp. 580–586, Feb. 2021.
[^3]: M. Riedmiller et al., “Learning by Playing: Solving Sparse Reward Tasks from Scratch,” in Proceedings of the 35th International Conference on Machine Learning (ICML’18), Stockholm, Sweden, Jul. 2018, pp. 4344–4353. 
