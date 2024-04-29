---
layout: page
title: "Diffusion Models for Human-to-Robot Handovers"
subtitle:  ""
permalink: /diff-h2r/
nav_order: 9986
usemathjax: true
nav_exclude: true
---

# Diffusion Models for Human-to-Robot Handovers

[<i class="fa fa-file-text-o" aria-hidden="true"></i> Thesis ](https://drive.google.com/file/d/1sJI1Pwqpwsn7UrySim-12TgH6vHzUXw3/view?usp=sharing){: .btn .btn-blue }
[<i class="fa fa-github" aria-hidden="true"></i> Github by request](https://github.com/utiasSTARS/diff-h2r/){: .btn .btn-green }
[<i class="fa fa-file" aria-hidden="true"></i> Dataset](https://drive.google.com/drive/folders/1B_4yTo5CRnvlE1PEC38KS3WbvgGRsaPn){: .btn .btn-purple }
[<i class="fa fa-flask" aria-hidden="true"></i> Experiments](https://drive.google.com/drive/folders/1HC1eJy_Abwt5Goj4nwIdi-8yBTQ0x-Cn){: .btn}


### Karyna Volokhatiuk<sup>1,2</sup>, Miguel Angel Rogel Garcia<sup>1</sup>, Jonathan Kelly<sup>1</sup>

<h5> 
    <i>
        <sup>1</sup>University of Toronto, <sup>2</sup>Ukrainian Catholic University
    </i>
</h5>

---

# Abstract

Handovers, the exchange of objects between a giver and receiver, are a natural everyday task for humans. We do not even think that it involves active perception, prediction, reaction, and adjustment-making of both giver and receiver, which transforms handovers into a difficult task for robots. We propose using the Diffusion Policy[^1] to solve the mentioned challenges for human-to-robot (H2R) handovers. Diffusion models for policy learning have outstanding properties, such as an ability to express multimodal robot action distributions, learn from a small amount of data, predict out-of-training-distribution trajectories with smooth and reactive actions and, finally, stable training. Recent studies have made significant progress in H2R handover research but still have many downsides, including the use of two separate models for trajectory planning and predicting the moment when the gripper can be closed and the struggle with noticing human intentions to make a handover. In this thesis, we propose possible ways to solve these problems. Also, we present an approach to increasing the success rate of the Diffusion Policy by learning from its own successful results. Additionally, we propose two methods of generating training data for imitation learning of H2R handovers, as there are no publicly available datasets of robot-receiver trajectories for handovers.

# Approach
We propose to use a single model to predict all robot decisions for the handover: when to start the motion, how to move, and when to grasp the object. The used model, the Diffusion Policy[^1], learns to denoise Gaussian noise into the robot trajectory based on observations. In most experiments, we use the segmented point clouds as observations. By segmented, we mean a regular point cloud that contains two masks: one for the human hand and another for the object used in the handover. 

{::nomarkdown}
<div style='text-align:center'>
    <img src='/assets/diff-h2r/diffusion_in_handovers.png' width='100%'>
    <div><small><b>Diffusion Policy for robot trajectories in H2R handovers.</b> During training, the encoder diffuses trajectories using a Markov chain process (See arrows from left to right), and the decoder g<sub>θ</sub> learns how to denoise those noise trajectories, also called latent variables x<sub>t</sub> (See arrows from right to left).</small></div>
</div>


<div style='text-align:center'>
    <img src='/assets/diff-h2r/diff-h2r_architecture.png' width='100%'>
    <div><small><b>Diffusion Policy architecture.</b> <b>Conditions:</b> Each segmented point cloud (contains masks that say if the point belongs to the hand or to the object) from the observation sequence (N<sub>O</sub> point clouds in total) is processed by PointNet++ to get embeddings; then, these embeddings are concatenated with each other and with the sinusoidal embedding of the denoising step t to be processed by the Feature-wise Linear Modulation (FiLM) module. This module is present in each layer of the U-Net. <b>U-Net:</b> Each block of the U-Net is a Conditional Residual Block, which processes the input by 1D convolution, executes FiLM modulation on it, processes the result by one more 1D convolution block, and adds it to the initial input value processed by another 1D convolution block. U-Net is called S times. which is the number of DDIM denoising steps.</small></div>
</div>
{:/}


---

# Environment

All experiments are conducted in the HandoverSim environment[^2], which contains 900 scenes with human motions for H2R handovers of 18 different objects. The evaluation metrics are the success rate and time used to complete the task. Failure conditions are timeout, dropping the object and touching the hand. The HandoverSin splits scenes on train/val/test with 720, 36 and 144 scenes accordingly.

{::nomarkdown}
<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/handover_sim/difficult_grasp_008.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/handover_sim/timeout_006.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/handover_sim/drop_000.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/handover_sim/contact_071.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small><b>Possible ends of the simulation.</b> Left to right: Success, Timeout, Dropping the object, Touching the hand.</small></div>
</div>
{:/}

Notice that successful grasp was not easy to complete because a big part of the object is occupied by human hand.

---

# Data
The Diffusion Policy is an imitation learning algorithm that requires robot trajectories for training. HandoverSim contains only human trajectories. Therefore, we collect training data using two methods: with an RL expert and with an extended OMG Planner.

## Data collected with the RL expert
With the RL expert from the HandoverSim2Real study[^3], we collected 454 successful trajectories for training, where every trajectory starts after 1.5 seconds from the beginning of the simulation.

It is important to mention that not all trajectories from the RL are good even if they are successful:

{::nomarkdown}
<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/rl_data_videos/good_015.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/rl_data_videos/bad_traj_and_grasp_001.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small><b>Two successful scenes.</b> Left scene has good trajectory and grasp, whereas the right one does not. However, both of them are successful in HandoverSim.</small></div>
</div>
{:/}

Below we also show the example where a robot controlled by RL policy starts moving towards the object laid on the table instead of waiting for the human hand to express its intention to make a hadnover.

{::nomarkdown}
<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='80%' autoplay loop muted>
        <source src='/assets/diff-h2r/rl_data_videos/no_intention_007.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small><b>No information about human intention.</b> RL starts planning after 1.5s in the HandoverSim. If the human has not grasped the object yet, it starts moving towards the robot on the table.</small></div>
</div>
{:/}


## Data collected with the extended OMG Planner
Using the extended version of the OMG Planner[^4], we got 474 training trajectories, where every trajectory starts from the beginning of the simulation so that this dataset can be used for learning human handover intentions.

---

# Experiments and Results

{::nomarkdown}
<div style='text-align:center'>
    <img src='/assets/diff-h2r/tables/experiment_overview.png' width='100%'>
    <div><small><b>Data</b> column explains what dataset was used for training: RL and OMG were described above, whereas 
Diff_<sup>RL</sup> mean successful trajectories of the diffusion policy on training scenes, 
2Diff_<sup>RL</sup> was also collected with the diffusion policy but from two different experiments. 
"+" sign means we mix datasets. Details are described in corresponding experiments. 
<b>W (s)</b> is the waiting time used at the beginning of the simulation; it is measured in seconds. 
<b>Act</b> represents if the action is the absolute pose of the end-effector (ee) or the change of its pose (Δee). 
<b>Rot</b> is a rotation representation (Euler angles or 6D). 
<b>Norm</b> is the type of normalization (regular or proposed in the diffusion policy paper). 
<b>O, P, A horizons</b> are observation, action and prediction horizons accordingly. 
<b>GM</b> is a grasp motion. If GM is ticked, the robot closes the gripper when its boolean value in the action is True. 
If GM is not ticked and when the boolean value in the action is True, the robot moves 8cm in the z-direction of the gripper and only 
then closes the gripper. <b>PO</b> describes if the position of the robot's end-effector is used as an observation. <b>B</b> is the batch size.</small></div>
</div>
{:/}

## Experiments with the RL training data
### Horizons experiments
{::nomarkdown}
<div style='text-align:center'>
    <img src='/assets/diff-h2r/tables/validation_1-5.png' width='100%'>
    <div><small>Experiments 1-5. Validation results for 10 runs.</small>  </div>
</div>
{:/}


{::nomarkdown}
<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/human_coll/exp1_val_020.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/human_coll/rl_val_020.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small><b>Human contact.</b> There are two videos from HandoverSim validation scene number 20. 
The left video is the model from experiment 1, the right video is the RL policy. </small></div>
</div>
{:/}


{::nomarkdown}
<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/timeout/exp_1_val_014.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/timeout/exp_3_val_014.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small><b>Timeout.</b> Experiments with higher prediction horizon have higher timeout rat.
There are two videos from HandoverSim validation scene number 14. 
The left video is the model from experiment 1 (P=4), the right video is the model from experiment 3 (P=8).</small></div>
</div>
{:/}

---

### Design choice experiments
{::nomarkdown}
<div style='text-align:center'>
    <img src='/assets/diff-h2r/tables/validation_6-8.png' width='100%'>
    <div><small>Experiments 6-8. Validation results for 10 runs.</small>  </div>
</div>
{:/}


{::nomarkdown}
<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/exp_6_val_009.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/exp7_val_009.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small><b>Same scene. Different failures.</b> There are two videos from HandoverSim validation scene number 9. 
The left video is the model from experiment 6, the right video is the model from experiment 7.</small></div>
</div>
{:/}

---

### Actions type experiments
{::nomarkdown}
<div style='text-align:center'>
    <img src='/assets/diff-h2r/tables/validation_9-10.png' width='100%'>
    <div><small>Experiments 9-10. Validation results for 10 runs.</small>  </div>
</div>
{:/}

{::nomarkdown}
<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/ee_traj/exp_10_ee_val_000.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/ee_traj/exp_10_val_027.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small><b>Same scene. Different failures.</b> There are two videos from HandoverSim validation scene number 9. 
The left video is the model from experiment 6, the right video is the model from experiment 7.</small></div>
</div>
{:/}



# Diffusion policy self-improvement experiments



# Bibliography

[^1]: Cheng Chi et al. “Diffusion Policy: Visuomotor Policy Learning via Action Diffusion”. In: Proceedings of Robotics: Science and Systems (RSS). 2023. DOI: 10.48550/arXiv.2303.04137.
[^2]: Yu-Wei Chao et al. “Handoversim: A simulation framework and benchmark for human-to-robot object handovers”. In: 2022 International Conference on Robotics and Automation (ICRA). IEEE. 2022, pp. 6941–6947. DOI: 10.48550/arXiv.2205.09747.
[^3]: Sammy Christen et al. “Learning Human-to-Robot Handovers from Point Clouds”. In: Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition. 2023, pp. 9654–9664. DOI: 10.48550/arXiv.2303.17592.
[^4]: Lirui Wang, Yu Xiang, and Dieter Fox. “Manipulation trajectory optimization with online grasp synthesis and selection”. In: Robotics: Science and Systems (2020). DOI: 10.48550/arXiv.1911.10280.