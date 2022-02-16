---
layout: page
title: Learning from Guided Play (NeurIPS 2021 Deep RL Workshop)
subtitle:  Learning from Guided Play to improve Adversarial Imitation Learning
description: Neurips (2021) Deep Reinforcement Learning Workshop paper on learning from guided play
permalink: /lfgp/
nav_order: 9993
usemathjax: true
---

# Learning from Guided Play: A Scheduled Hierarchical Approach for Improving Exploration in Adversarial Imitation Learning

[<i class="fa fa-file-text-o" aria-hidden="true"></i> arXiv pre-print ](https://arxiv.org/abs/2112.08932){: .btn .btn-blue }
[<i class="fa fa-github" aria-hidden="true"></i> View it on Github](https://github.com/utiasSTARS/lfgp){: .btn .btn-green }
[<i class="fa fa-film" aria-hidden="true"></i> SlidesLive](https://slideslive.com/38971121/learning-from-guided-play-a-scheduled-hierarchicl-approach-for-improving-exploration-in-adversarial-imitation-learning){: .btn .btn-purple }
[<i class="fa fa-image" aria-hidden="true"></i> Poster](https://github.com/utiasSTARS/utiasSTARS.github.io/raw/master/assets/lfgp/2021-neurips-lfgp-poster.pdf){: .btn }

### Trevor Ablett\*, Bryan Chan\*, Jonathan Kelly _(\*equal contribution)_
#### Neurips 2021 Deep Reinforcement Learning Workshop

<br />

{::nomarkdown} 
<div style='text-align:left'>
    <video width='100%' autoplay loop muted>
        <source src='/assets/lfgp/lfgp-vs-dac/lfgp-dac-4x-combined-720p.webm' type='video/webm'>
        Your browser does not support the video tag.
    </video>
    <div><small>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp Off-policy Adversarial Imitation Learning (DAC)<sup>1</sup> &nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp Learning from Guided Play (LfGP)</small></div>
</div>
{:/}

In this work, we were interested in investigating the efficacy of Adversarial Imitation Learning (AIL) on manipulation tasks.  AIL is a popular form of Inverse Reinforcement Learning (IRL) in which a Discriminator acting as a reward and a policy are simultaneously learned using expert data. Empirically, we found that a state-of-the-art off-policy method for AIL[^1] is unable to effectively solve a variety of manipulation tasks effectively. We hypothesized that this was, at least partially, due to the fact that AIL does not enforce any means for effective exploration. 

To mitigate this problem, we introduced a scheduled hierarchical modification[^2] to off-policy AIL in which multiple discriminators, policies, and critics are all learned simultaneously, solving a variety of auxiliary tasks in addition to a main task, while still ultimately attempting to maximize main task performance. We called this method <b>Learning from Guided Play (LfGP)</b>, inspired by play-based learning, as opposed to goal-directed learning. This not only significantly improved the performance of AIL with an equivalent amount of expert data, but also allowed for the reuse of auxiliary task models and expert data between main tasks through transfer learning.

An example of DAC's poor performance is shown on the left side of the video at the top of the page, and the improved exploration demonstrated by LfGP is shown on the right. The diagram below is a simplified description of our multitask environment and the different types of play used in our method.

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
We compared our method to both multitask and single-task baselines:

_Multitask_
- A no-scheduler variant of our method, where only the main task is executed (LfGP-NS)
- Multitask Behaviour Cloning (BC (Multi))

_Single-task_
- Discriminator Actor-Critic (DAC)
- Behaviour Cloning (BC)
- Behaviour Cloning with the same amount of main task data as the multitask methods (BC (less data))


To try to make a fair comparison, we used an equivalent amount of _total_ expert data for the single-task methods, as compared to the multitask methods. However, it is also important to note that the single-task methods cannot reuse data between tasks. The following table describes this idea in further detail:

{::nomarkdown} 
<div style='text-align:center'>
    <img src='/assets/lfgp/data/table-wide.png' width='75%'>
    <div><small>Expert dataset sizes for each task, including quantity of auxiliary task data. Each letter under "Dataset Sizes" corresponds to an auxiliary or main task, and bolded letters correspond to datasets that were reused (e.g., <b>O</b>pen-Gripper, <b>S</b>tack). Numbers are total number of <i>(s,a)</i> pairs. </small></div>
</div>
{:/}

Our main performance results are shown below.

{::nomarkdown} 
<div style='text-align:center'>
    <img src='/assets/lfgp/results/s_fig_fixed_unstack_dac.png' width='90%'>
    <div><small>Final performance results on each main task.</small></div>
</div>
{:/}

Although single-task BC beats LfGP in three out of four tasks, remember that it cannot reuse learned data or learned models. However, this result shows that there is still further work to be done to better understand the differences in performance between AIL and BC, especially since with the exact same data, single-task BC dramatically outperforms DAC in all of our environments.

The results of our simple transfer learning are shown here:

{::nomarkdown} 
<div style='text-align:center'>
    <img src='/assets/lfgp/results/transfer_s_fig.png' width='50%'>
    <div><small>Transfer learning using existing models. See our code and paper for more implementation details.</small></div>
</div>
{:/}

In three out of four main tasks, transfer learning shows improved learning speed. We used a very simple method for transfer learning, in which we simply reused the existing buffer and models as warm-starts for a new main-task, but we believe that with future work, a more efficient method for transfer learning could do even better.


For more details, see our [arXiv paper](https://arxiv.org/abs/2112.08932)!


## Code

{::nomarkdown} 
<a target="_blank" rel="external" href="https://github.com/utiasSTARS/lfgp"><i class="fa fa-github-square" aria-hidden="true"></i> Available on Github</a>
{:/}

## Neurips 2021 Deep Reinforcement Learning Workshop Presentation

[<i class="fa fa-film" aria-hidden="true"></i> SlidesLive](https://slideslive.com/38971121/learning-from-guided-play-a-scheduled-hierarchicl-approach-for-improving-exploration-in-adversarial-imitation-learning){: .btn .btn-purple }

## Citation
<pre wrap='true'>
@misc{ablett2021learning,
      title={Learning from Guided Play: A Scheduled Hierarchical Approach for Improving Exploration in Adversarial Imitation Learning}, 
      author={Trevor Ablett and Bryan Chan and Jonathan Kelly},
      year={2021},
      eprint={2112.08932},
      archivePrefix={arXiv},
      primaryClass={cs.LG}
}
</pre>

## Bibliography

[^1]: I. Kostrikov, K. K. Agrawal, D. Dwibedi, S. Levine, and J. Tompson, “Discriminator-Actor-Critic: Addressing Sample Inefficiency and Reward Bias in Adversarial Imitation Learning,” presented at the Proceedings of the International Conference on Learning Representations (ICLR’19), New Orleans, LA, USA, May 2019.
[^2]: M. Riedmiller et al., “Learning by Playing: Solving Sparse Reward Tasks from Scratch,” in Proceedings of the 35th International Conference on Machine Learning (ICML’18), Stockholm, Sweden, Jul. 2018, pp. 4344–4353. 
