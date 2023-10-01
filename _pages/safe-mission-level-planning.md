---
layout: page
title: Safe Mission-Level Path Planning for Exploration of Lunar Permanently Shadowed Regions by a Solar-Powered Rover (AERO 2024)
# subtitle:  Representing Rotations in Deep Learning
description: Submitted to IEEE Aerospace 2024
permalink: /safe-mission-level-planning/
nav_exclude: false
nav_order: 9988
# youtubeId: 8QMcNmCPYR0
---

# Safe Mission-Level Path Planning for Exploration of Lunar Permanently Shadowed Regions by a Solar-Powered Rover

### Olivier Lamarre, Shantanu Malhotra, Jonathan Kelly
#### Article currently under review, to appear at the 2024 IEEE Aerospace Conference


<!-- As part of this publication, we release the [`gplanetary_nav`](https://github.com/utiasSTARS/gplanetary-nav) Python library, an open-source repository to facilitate the interface between orbital data and global navigation planning algorithms in support of long-range/strategic planetary mobility. -->

## Overview

{::nomarkdown} 
<div class=figure style='text-align:center'>
<img src='/assets/safe-mission-level-planning/overview_lunar_bg_lowres.png' width='100%' />
<figcaption>The importance of risk-aware planning when exploring PSRs with a solar-powered rover affected by recurring random faults. Subfigure A shows a nominal mission plan visiting waypoints of interest in a given order. After a fault/delay occurs during the traverse (subfigure B), risk-aware planning (blue dashed line) suggests an early PSR exit while risk-agnostic planning (white dashed line) finds an updated plan visiting the fourth waypoint, unaware of how dangerous this traverse schedule is. If a second fault occurs inside of the PSR (subfigure C), a rover following the risk-agnostic plan misses a crucial solar charging period; battery energy depletion becomes unavoidable (subfigure D). A rover following the risk-aware plan, on the other hand, is still capable of reaching the designated target region safely. Background image courtesy of NASA and Arizona State University. VIPER render courtesy of NASA.</figcaption>
</div>
{:/}

## Supplementary material: animation of recovery drives from the LCROSS crash site

(TODO)

## Citation
<pre wrap='true'>
@unpublished{lamarre2024safe,
  author = {Olivier Lamarre and Shantanu Malhotra and Jonathan Kelly},
  title  = {Safe Mission-Level Path Planning for Exploration of Lunar Permanently Shadowed Regions by a Solar-Powered Rover},
  note   = {2024 IEEE Aerospace (submitted)},
  year   = {2024},
}
</pre>