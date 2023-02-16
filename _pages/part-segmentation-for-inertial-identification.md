---
layout: page
title: Visual Part Segmentation for Inertial Parameter Identification of Manipulated Objects (ICRA 2023)
subtitle:  Vision Join Forces
description: Paper describing how visual part-level segmentation can improve the inertial parameter identification of objects manipulated by robots.
permalink: /part-segmentation-for-inertial-identification/
nav_exclude: false
nav_order: 9990
youtubeId: Jjxrk53mQY0
---

# The Sum of Its Parts: Visual Part Segmentation for Inertial Parameter Identification of Manipulated Objects


[<i class="fa fa-file-text-o" aria-hidden="true"></i> arXiv pre-print ](https://arxiv.org/abs/2302.06685){: .btn .btn-blue }


### Abstract
To operate safely and efficiently alongside human workers, collaborative robots (cobots) require the ability to quickly understand the dynamics of manipulated objects. However, traditional methods for estimating the full set of inertial parameters rely on motions that are necessarily fast and unsafe (to achieve a sufficient signal-to-noise ratio). In this work, we follow an alternative approach: by combining visual and force-torque measurements, we develop an inertial parameter identification algorithm that requires slow or "stop-and-go" motions only, and hence is ideally tailored for use  around humans. Our technique, called Homogeneous Part Segmentation (HPS), leverages the observation that man-made objects are typically composed of distinct, homogeneous parts. We combine a surface-based point clustering method with a volumetric shape segmentation algorithm to quickly produce a part-level segmentation of a manipulated object; the segmented representation is then used by HPS to accurately estimate the object's inertial parameters. To benchmark our algorithm, we create and utilize a novel dataset consisting of realistic meshes, segmented point clouds, and inertial parameters for 20 common workshop tools. Finally, we demonstrate the real-world performance and accuracy of HPS by performing an intricate `hammer balancing act' autonomously and online with a low-cost collaborative robotic arm. Our code and dataset are open source and freely available.

### The Sum of Its Parts: Visual Part Segmentation for Inertial Parameter Identification of Manipulated Objects
#### Philippe Nadeau, Matthew Giamou and Jonathan Kelly 
##### IEEE International Conference on Robotics and Automation 2023 (ICRA 2023)

## Supplementary Contributions
We augment the contributions from the paper by providing an accompanying video that summarizes the work, the source code implementing our visual part-segmentation pipeline and inertial identification algorithms, and a contributed dataset of objects used to test the whole pipeline.

All of the files can be accessed [here](https://github.com/utiasSTARS/inertial-identification-with-part-segmentation), except for the video, which is available below. The content of the data repository is summarized in this [Readme.md](https://github.com/utiasSTARS/inertial-identification-with-part-segmentation/blob/main/Readme.md). Once the reviewing process is over, the repository will be relocated to Github to ease its dissemination and to enable tracking changes.

### Accompanying Video
{% include youtubePlayer.html id=page.youtubeId %}

### Workshop Tools Dataset
Motivated by the need for a dataset that also includes inertial information about the objects, we contribute the following dataset. It contains 20 common workshop tools, and for each object:
- a watertight triangular surface mesh;
- a synthetic colored surface point-cloud;
- ground truth inertial parameters;
- ground truth part-level segmentation; and 
- a grasping reference frame.

![](/assets/part-segmentation-for-inertial-identification/Hacksaw_Model.png)

The dataset can be accessed [here](https://github.com/utiasSTARS/inertial-identification-with-part-segmentation/tree/main/data/Workshop%20Tools%20Dataset), and a description of the content of the dataset is summarized in this [Readme.md](https://github.com/utiasSTARS/inertial-identification-with-part-segmentation/blob/main/data/Workshop%20Tools%20Dataset/Readme.md).

### Source Code
#### **Part-level Object Segmentation**
[This repository](https://github.com/utiasSTARS/inertial-identification-with-part-segmentation/blob/main/warm-started-part-segmentation) contains code that loads a colored point-cloud, perform shape reconstruction, initial clustering from local surface information, and part-level segmentation from global shape information. More details about the role of each file included in the repository can be found [here](https://github.com/utiasSTARS/inertial-identification-with-part-segmentation/blob/main/warm-started-part-segmentation/Readme.md).

{::nomarkdown}
<img src="/assets/part-segmentation-for-inertial-identification/Tiled_Segmentations.gif" width="100%" />
{:/}

#### **Inertial Parameter Identification**
[This repository](https://github.com/utiasSTARS/inertial-identification-with-part-segmentation/tree/main/inertial-parameters-identification) contains code that loads kinematic and dynamic data, process it and uses it for the estimation of the mass, centre of mass and inertia tensor of a manipulated object. More details about the role of each file included in the repository can be found [here](https://github.com/utiasSTARS/inertial-identification-with-part-segmentation/blob/main/inertial-parameters-identification/Readme.md).

{::nomarkdown}
<img src="/assets/part-segmentation-for-inertial-identification/Tiled_Simulations.gif" width="100%" />
{:/}

## Citation
<pre wrap='true'>
@inproceedings{Nadeau_PartSegForInertialIdent_2023, 
    AUTHOR    = {Philippe Nadeau AND Matthew Giamou AND Jonathan Kelly}, 
    TITLE     = { {The Sum of Its Parts: Visual Part Segmentation for Inertial Parameter Identification of Manipulated Objects} }, 
    BOOKTITLE = {Proceedings of the {IEEE} International Conference on Robotics and Automation {(ICRA'23})},
    YEAR      = {2023}, 
    ADDRESS   = {London, UK}, 
    MONTH     = {May}, 
    DOI       = {}
}
</pre>


