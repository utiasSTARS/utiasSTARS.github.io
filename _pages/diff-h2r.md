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

Handovers, the exchange of objects between a giver and receiver, are a natural everyday task for humans. We do not even 
think that it involves active perception, prediction, reaction, and adjustment-making of both giver and receiver, which 
transforms handovers into a difficult task for robots. We propose using the diffusion policy[^1] to solve the mentioned 
challenges for human-to-robot (H2R) handovers. Diffusion models for policy learning have outstanding properties, such 
as the ability to express multimodal robot action distributions, learn from a small amount of data, predict 
out-of-training-distribution trajectories with smooth and reactive actions and, finally, stable training. 
Recent studies have made significant progress in H2R handover research but still have many downsides, including 
the use of two separate models for trajectory planning and predicting the moment when the gripper can be closed and 
the struggle with noticing human intentions to make a handover. In this thesis, we propose possible ways to solve 
these problems. Also, we present an approach to increasing the success rate of the diffusion policy by learning from 
its own successful results. Additionally, we propose two methods of generating training data for imitation learning 
of H2R handovers, as there are no publicly available datasets of robot-receiver trajectories for handovers.

# Approach
To solve the human-to-robot (H2R) handover task, we propose using the diffusion policy[^1]. The diffusion policy is 
an imitation learning algorithm that uses diffusion models to predict a sequence of robot actions. To predict a sequence 
of robot actions, the diffusion policy samples the Gaussian noise and then denoises it by conditioning on robot observations.
In most experiments, we use the segmented point clouds as observations. By segmented, 
we mean a regular point cloud that contains two masks: one for the human hand and another for the object used in the 
handover. In contrast to many recent studies, we use a single model (diffusion policy) to predict all robot decisions for 
the handover: when to start the motion, how to move, and when to grasp the object.


{::nomarkdown}
<div style='text-align:center'>
    <img src='/assets/diff-h2r/diffusion_in_handovers.png' width='100%'>
    <div><small><b>Diffusion policy for robot trajectories in H2R handovers.</b> During training, the encoder diffuses trajectories using a Markov chain process (See arrows from left to right), and the decoder g<sub>θ</sub> learns how to denoise those noise trajectories, also called latent variables x<sub>t</sub> (See arrows from right to left).</small></div>
</div>


<div style='text-align:center'>
    <img src='/assets/diff-h2r/diff-h2r_architecture.png' width='100%'>
    <div><small><b>Diffusion policy architecture.</b> <b>Conditions:</b> Each segmented point cloud (contains masks that say if the point belongs to the hand or to the object) from the observation sequence (N<sub>O</sub> point clouds in total) is processed by PointNet++ to get embeddings; then, these embeddings are concatenated with each other and with the sinusoidal embedding of the denoising step t to be processed by the Feature-wise Linear Modulation (FiLM) module. This module is present in each layer of the U-Net. <b>U-Net:</b> Each block of the U-Net is a Conditional Residual Block, which processes the input by 1D convolution, executes FiLM modulation on it, processes the result by one more 1D convolution block, and adds it to the initial input value processed by another 1D convolution block. During sampling, U-Net is called S times, which is the number of DDIM denoising steps.</small></div>
</div>
{:/}


---

# Environment

All experiments are conducted in the HandoverSim environment[^2], which contains 900 scenes with human motions for 
H2R handovers of 18 different objects. The evaluation metrics are the success rate and time used to complete the task. 
Failure conditions are timeout, dropping the object and touching the hand. 
The HandoverSin splits scenes into 720 training, 36 validation and 144 testing scenes.

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
    <div><small><b>Possible ends of the simulation.</b> Success — top left; Timeout — top right; 
Dropping the object — bottom left; Touching the hand — bottom right.</small></div>
</div>
{:/}

Notice that, for some objects, grasp can be very hard to complete because a big part of the object is occupied by 
the human hand (see "success" video above).

---

# Data
The Diffusion Policy is an imitation learning algorithm that requires robot trajectories for training. 
HandoverSim contains only human trajectories. Therefore, we collect training data using two methods:  with an RL expert 
and with an extended OMG Planner. Data gathering details are described in section 5.2 of the thesis, whereas here, we show examples 
of trajectories used for training.

<b>Important note:</b> We use the same actions update period the RL policy used -- 1.5s for all data.

## Data collected with the RL expert
With the RL expert from the HandoverSim2Real study[^3], we collected 454 successful trajectories for training, 
where every trajectory starts after 1.5 seconds from the beginning of the simulation.

It is important to mention that not all trajectories from the RL are good, even if they are successful:

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

Below, we also show examples where a robot controlled by the RL policy starts moving after exactly 1.5 hardcoded seconds 
pass. The RL policy does not learn human intentions and starts moving after 1.5 seconds from the start of the simulation 
for all trajectories. For some scenes, 1.5 seconds end before the human starts extending the object:

{::nomarkdown}
<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='70%' autoplay loop muted>
        <source src='/assets/diff-h2r/rl_data_videos/no_intention_007.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <img src='/assets/diff-h2r/rl_data_videos/train_007.png' width='100%'>
    <div><small><b>Example of 1.5 seconds hardcoded waiting at the beginning.</b> 1.5 seconds end before the human 
starts extending the object, so the robot starts moving towards the object on the table.</small></div>
</div>

for others, 1.5 seconds end when the human hand is starting its motion towards the robot: 

<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='70%' autoplay loop muted>
        <source src='/assets/diff-h2r/rl_data_videos/003_train.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <img src='/assets/diff-h2r/rl_data_videos/train_003.png' width='100%'>
    <div><small><b>Example of 1.5 seconds hardcoded waiting at the beginning.</b> 1.5 seconds end after the human
starts extending the object, so the robot starts moving in more similar way how the humans would move.</small></div>
</div>

{:/}


## Data collected with the extended OMG Planner
Using the extended version of the OMG Planner[^4],  we got 474 training trajectories, where every trajectory starts 
from the beginning of the simulation so that this dataset can be used for learning human handover intentions. 
For example, on the video below, the robot starts moving before 1.5 seconds from the  start of the simulation 
reacting on the human actions. Trajectories collected with the OMG Planner include actions where the robot does not 
move until the object changes its pose on more than the predefined threshold and additional 0.15 seconds passes; 
and actions where the robot moves towards the object held by the human. 0.15 seconds is the reaction time of the robot; 
both threshold in object pose change and reaction time are hyperparameters that can be changed. Finding of optimal 
values for these parameters is one of the goals for our future studies.

<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='70%' autoplay loop muted>
        <source src='/assets/diff-h2r/omg_traj/117.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <img src='/assets/diff-h2r/omg_traj/train_117.png' width='100%'>
    <div><small><b>Example of the trajectory collected with the OMG Planner that does not have hardcoded waiting time.
</b> At time 1.05s the robot notices change of the object pose and starts its motion, so that until 1.50s it
already finishes a few actions.</small></div>
</div>

---

# Experiments and Results

{::nomarkdown}
<div style='text-align:center'>
    <img src='/assets/diff-h2r/tables/experiment_overview.png' width='100%'>
    <div><small><b>Data</b> column explains what dataset was used for training: RL and OMG were described above, whereas 
Diff<sub>RL</sub> mean successful trajectories of the diffusion policy on training scenes, 
2Diff<sub>RL</sub> was also collected with the diffusion policy but from two different experiments. 
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

---

## Experiments with the RL training data
### Horizons experiments
{::nomarkdown}
<div style='text-align:center'>
    <img src='/assets/diff-h2r/tables/validation_1-5.png' width='100%'>
    <div><small><b>Experiments 1-5.</b> Validation results for 10 runs. Id=RL corresponds to the results of the RL expert.</small>  </div>
</div>
{:/}

---

All diffusion policy results from evaluations in the validation set are better than those of the RL expert. The diffusion
policy has learned to avoid human contact errors compared to the RL. However, the experiment with <b>Id 2</b>, 
where all horizons are one, has almost the same contact failure rate as the RL. The RL expert has the same type 
of horizon (O=1, P=1, A=1), using only the current observation to predict and execute one action. Thus, predicting and
executing several actions can be beneficial for avoiding human contact.

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
The left video is the model from experiment 1 (successful trajectory), the right video is the RL policy (trajectory
with a human contact). </small></div>
</div>
{:/}

However, the timeout failure rate increases when we increase the prediction horizon to 8 <b>(experiments 3 and 4).</b> 
Usually, the timeout happen when the robot closes its gripper earlier than necessary. Prediction horizon 8 can possibly 
cause it because the model learns to predict actions that correspond to very future human positions and during 
the inference predicts these far future actions wrongly because they are harder to predict.


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
    <div><small><b>Timeout.</b> Experiments with higher prediction horizon have higher timeout rate.
There are two videos from HandoverSim validation scene number 14. 
The left video is the model from experiment 1 (Prediction horizon=4), the right video is the model from experiment 3 
(Prediction horizon=8).</small></div>
</div>
{:/}

---

### Design choice experiments
{::nomarkdown}
<div style='text-align:center'>
    <img src='/assets/diff-h2r/tables/validation_6-8.png' width='100%'>
    <div><small><b>Experiments 6-8.</b> Validation results for 10 runs. Id=RL corresponds to the results of the RL expert.</small>  </div>
</div>
{:/}

---

In this part, we fix the horizons to the best configuration from the previous experiment (O=2, P=4, A=3) and test if we 
need to change different parts of the model configuration.

In <b>experiment 6,</b> we use "diffusion" normalization instead of "regular," which does not improve the model performance 
on the validation dataset.

In most experiments, the action "close the gripper" corresponds only to gripper closing. In <b>experiment 7,</b> we test how 
the model performance changes when we follow a similar procedure to the one HandoverSim2Real and GenH2R used for closing
the gripper. After the model returns the action "close the gripper," the robot moves the gripper 8 cm in the gripper’s 
z-direction and only then closes it. This change decreased the success rate of the diffusion policy, 
which became lower than that of the RL. Failures caused by human contact and timeouts increased.

{::nomarkdown}
<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/linear_motion/exp6_val_001.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/linear_motion/exp7_val_001.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small><b>Comparison of experiments 6 and 7.</b> There are two videos from HandoverSim validation scene number 1. 
The left video is the model from experiment 6 (successful), the right video is the model from experiment 7 (timeout).</small></div>
</div>
{:/}

<b>Experiment 8</b> checks if adding the end-effector state to the observation helps the model to get a higher success rate. 
We conduct this experiment because the diffusion policy original paper uses the end-effector pose as its observation. 
They do it for actions that are absolute poses. However, we decided to test if it impacts the actions that are delta of 
the end-effector poses. Validation results show that additional information about the end-effector state does not help 
the model to learn better.

---

### Action space experiments
{::nomarkdown}
<div style='text-align:center'>
    <img src='/assets/diff-h2r/tables/validation_9-10.png' width='100%'>
    <div><small><b>Experiments 9-10.</b> Validation results for 10 runs. Id=RL corresponds to the results of the RL expert.</small>  </div>
</div>
{:/}

---

In experiments 9 and 10, we test if the prediction of absolute end-effector actions is better than predicting the delta 
of the end-effector because the original diffusion policy performed better on this type of action. As the diffusion 
policy creators do, we also add an end-effector pose to observations.

<b>Experiment 9</b> uses Euler angles and "regular" normalization as we use for delta
end-effector actions, whereas <b>experiment 10</b> uses 6D rotation representation and
"diffusion" normalization as the original diffusion policy. Both of these experiments
have around zero success rates. We believe the reason could be the dynamic environment with humans in the loop because, 
intuitively, it is easier to adapt your motion change to the change of motion in the environment and adapt your absolute
position to something that is not moving. All tasks from the original diffusion policy paper were done with static 
objects, which is probably the reason for their good performance using end-effector actions.

{::nomarkdown}
<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/ee_traj/exp9_val_027_success.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/ee_traj/exp9_val_000_timeout.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/ee_traj/exp9_val_018_drop.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/ee_traj/exp9_val_020_contact.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small><b>Examples from experiment 9, where actions are absolute end-effector position and orientation.
</b> Success - top left; Timeout - top right;Dropping the object - bottom left; 
Touching the hand - bottom right.</small></div>
</div>
{:/}

---

### Test of best model trained with RL data: Experiment 1

Among the ten conducted experiments, experiment 1 has the highest success rate on
the validation set, beating the RL by <b>20.28%.</b> The highest increase in the diffusion
policy success rate compared to the RL results on the validation set is due to less
human contact rate of the diffusion policy (the difference in human contact rate is
<b>10.83%</b>).
When we test our model on the test set, unexpectedly it does not
beat an RL expert but has a very close success rate. It is important to note that RL
has a lower human contact rate on the test set than on the validation set, which can
mean that the test set has fewer scenes with human contact complexity. Hence, the
diffusion policy "loses" the advantage it had on the validation set.

{::nomarkdown}
<div style='text-align:center'>
    <img src='/assets/diff-h2r/tables/test_1.png' width='100%'>
    <div><small><b>Experiment 1.</b> Test results for 10 runs. Id=RL corresponds to the results of the RL expert.</small>  </div>
</div>
{:/}

---

# Diffusion policy self-improvement experiments

After the very successful results of experiment 1 on the validation set, we decided to collect data with this model 
on training scenes of the HandoverSim and use it for training. To do this, we run the diffusion policy on 720 training 
scenes from the HandoverSim. We run each scene until it succeeds or the number of trials becomes 10. With this method, 
we collected <b>640 successful trajectories</b>, of which <b>191 were from new scenes</b> that were not met in training data. 
Interestingly, after we tried to use the same method for data collection with the RL expert, we could collect only
<b>467 trajectories</b>.

{::nomarkdown}
<div style='text-align:center'>
    <img src='/assets/diff-h2r/diff_self-improv.png' width='100%'>
</div>
{:/}

Below, you can find examples of trajectories where the diffusion policy model from experiment 1 succeeded, 
but the RL policy failed all 10 times:

{::nomarkdown}
<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/new_trajectories/diff_train_006.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/new_trajectories/rl_train_006.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small><b>Scene 6 from the training set.</b> Diffusion policy — left; RL policy — right.</small></div>
</div>
{:/}

---

{::nomarkdown}
<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/new_trajectories/diff_train_030.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/new_trajectories/rl_train_030.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small><b>Scene 30 from the training set.</b> Diffusion policy — left; RL policy — right.</small></div>
</div>
{:/}

---

{::nomarkdown}
<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/new_trajectories/diff_train_041.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/new_trajectories/rl_train_041.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small><b>Scene 41 from the training set.</b> Diffusion policy — left; RL policy — right.</small></div>
</div>
{:/}

---

{::nomarkdown}
<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/new_trajectories/diff_train_053.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/new_trajectories/rl_train_053.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small><b>Scene 53 from the training set.</b> Diffusion policy — left; RL policy — right.</small></div>
</div>
{:/}

---

{::nomarkdown}
<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/new_trajectories/diff_train_057.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/new_trajectories/rl_train_057.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small><b>Scene 57 from the training set.</b> Diffusion policy — left; RL policy — right.</small></div>
</div>
{:/}

---

In experiment 11, we combine the RL dataset with new 640 diffusion policy trajectories (1094 trajectories in total). 
In experiment 12, we use only new data collected with the diffusion policy (640 trajectories). For experiment 13, 
we collect successful trajectories from experiment 11 (662 trajectories) and mix this data with the RL
dataset and 640 trajectories previously collected with the diffusion policy (1756 trajectories in total).

{::nomarkdown}
<div style='text-align:center'>
    <img src='/assets/diff-h2r/tables/val_11-13.png' width='100%'>
    <div><small><b>Experiments 11-13.</b> Validation results for 10 runs. Id=RL corresponds to the results of the RL expert. 
<b>Important note:</b> The results for experiment 12 differ from what was mentioned in the thesis because there, 
we accidentally showed the results of the second-best checkpoint instead of the best one.</small>  </div>
</div>
{:/}

Different data is used for each of these experiments. Therefore, we decided to
evaluate each of them on the test set using its best epoch on the validation set. Even though these experiments do not 
beat experiment 1 on the validation set, they beat both experiment 1 and the RL expert on the training set. 
With a combination of the RL and diffusion policies data in experiment 11, the diffusion model beats the RL
success rate on the test set by <b>2.15%</b>, only diffusion data beats the RL by <b>3.12%</b>, and
the combination of two diffusion datasets with the RL data beats the RL by <b>5.21%</b>.

{::nomarkdown}
<div style='text-align:center'>
    <img src='/assets/diff-h2r/tables/test_11-13.png' width='100%'>
    <div><small><b>Experiments 11-13.</b> Test results for 10 runs. Id=RL corresponds to the results of the RL expert. 
<b>Important note:</b> The results for experiment 12 differ from what was mentioned in the thesis because there, 
we accidentally showed the results of the second-best checkpoint instead of the best one.</small>  </div>
</div>
{:/}

---

# Human intention experiment on the OMG dataset
Our final test is done using the OMG dataset. As these trajectories were collected in a simplified way 
(for details, see section 5.2.2 in the thesis), we do not aim to beat the results we got with the RL data. 
In this experiment, we want to check if the diffusion policy can learn human handover intentions and successfully 
finish the handover without hardcoded waiting time at the beginning. The only waiting time for this model is 0.15s 
because it updates actions every 0.15s, and two observations are needed to generate the first action 
(observation horizon = 2). For comparison, the hardcoded waiting time for the RL is 1.5s.

{::nomarkdown}
<div style='text-align:center'>
    <img src='/assets/diff-h2r/tables/val_14.png' width='100%'>
    <div><small><b>Experiment 14.</b> Validation results for 10 runs.</small>  </div>
</div>
{:/}

The success rate for the OMG data is only 45% with human contact and drop as the main reasons for failures, which is 
lower even than the RL results on the validation set. However, the diffusion policy learnt to wait for human
intentions.

Below, you can find example videos where the robot waits at the beginning of the simulation until it notices the human 
intention to make a handover. Unlike the RL policy and the diffusion policy trained with the RL data, this waiting time 
is not hardcoded. Interestingly, in these videos, the model notices intention from a slight change of the object's pose 
for some objects and needs a more considerable human hand motion for others.


<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='70%' autoplay loop muted>
        <source src='/assets/diff-h2r/omg_traj/val_001.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <img src='/assets/diff-h2r/omg_traj/val_001.png' width='100%'>
    <div><small><b>Example of robot reaction on a validation scene 1.</b> A robot notices human handover intention and 
starts moving at 1.5s from the start of the simulation. At 1.65s, the end-effector is already slightly rotated.</small></div>
</div>

---

<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='70%' autoplay loop muted>
        <source src='/assets/diff-h2r/omg_traj/val_003.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <img src='/assets/diff-h2r/omg_traj/val_003.png' width='100%'>
    <div><small><b>Example of robot reaction on a validation scene 3.</b> A robot notices human handover intention and 
starts moving at 1.05s from the start of the simulation. At 1.2s, the end-effector is already slightly closer to us.</small></div>
</div>

---

<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='70%' autoplay loop muted>
        <source src='/assets/diff-h2r/omg_traj/val_012.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <img src='/assets/diff-h2r/omg_traj/val_012.png' width='100%'>
    <div><small><b>Example of robot reaction on a validation scene 12.</b> A robot notices human handover intention and 
starts moving at 1.8s from the start of the simulation. At 1.95s, the end-effector is already slightly rotated.</small></div>
</div>

---

Finally, there are examples of bad trajectories from experiment 14, which were most likely influenced by imperfect 
training data.

{::nomarkdown}
<div style='text-align:center'>
    <!-- <video width="480" height="360" autoplay loop muted controls> -->
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/omg_traj/val_005.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <video width='48%' autoplay loop muted>
        <source src='/assets/diff-h2r/omg_traj/val_007.mp4' type='video/mp4'>
        Your browser does not support the video tag.
    </video>
    <div><small><b>Bad examples of the diffusion policy trained with the OMG data.</b> Validation scene 5 — left; 
Validation scene 7 — right.</small></div>
</div>
{:/}

---

# Bibliography

[^1]: Cheng Chi et al. “Diffusion Policy: Visuomotor Policy Learning via Action Diffusion”. In: Proceedings of Robotics: Science and Systems (RSS). 2023. DOI: 10.48550/arXiv.2303.04137.
[^2]: Yu-Wei Chao et al. “Handoversim: A simulation framework and benchmark for human-to-robot object handovers”. In: 2022 International Conference on Robotics and Automation (ICRA). IEEE. 2022, pp. 6941–6947. DOI: 10.48550/arXiv.2205.09747.
[^3]: Sammy Christen et al. “Learning Human-to-Robot Handovers from Point Clouds”. In: Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition. 2023, pp. 9654–9664. DOI: 10.48550/arXiv.2303.17592.
[^4]: Lirui Wang, Yu Xiang, and Dieter Fox. “Manipulation trajectory optimization with online grasp synthesis and selection”. In: Robotics: Science and Systems (2020). DOI: 10.48550/arXiv.1911.10280.