---
layout: page
title: Safe Mission-Level Path Planning for Exploration of Lunar Shadowed Regions by a Solar-Powered Rover (AERO 2024)
# subtitle:  Representing Rotations in Deep Learning
description: Submitted to IEEE Aerospace 2024
permalink: /safe-mission-level-planning/
nav_exclude: false
nav_order: 9988
# youtubeId: 8QMcNmCPYR0
---

# Safe Mission-Level Path Planning for Exploration of Lunar Shadowed Regions by a Solar-Powered Rover

### Olivier Lamarre, Shantanu Malhotra, Jonathan Kelly

#### Article accepted in the 2024 IEEE Aerospace Conference


<!-- As part of this publication, we release the [`gplanetary_nav`](https://github.com/utiasSTARS/gplanetary-nav) Python library, an open-source repository to facilitate the interface between orbital data and global navigation planning algorithms in support of long-range/strategic planetary mobility. -->

## Overview

{::nomarkdown}
<div class=figure style='text-align:center'>
<img src='/assets/safe-mission-level-planning/overview_lunar_bg_lowres.png' width='100%' />
<figcaption>The importance of risk-aware planning when exploring PSRs with a solar-powered rover affected by recurring random faults. Subfigure A shows a nominal mission plan visiting waypoints of interest in a given order. After a fault/delay occurs during the traverse (subfigure B), risk-aware planning (blue dashed line) suggests an early PSR exit while risk-agnostic planning (white dashed line) finds an updated plan visiting the fourth waypoint, unaware of how dangerous this traverse schedule is. If a second fault occurs inside of the PSR (subfigure C), a rover following the risk-agnostic plan misses a crucial solar charging period; battery energy depletion becomes unavoidable (subfigure D). A rover following the risk-aware plan, on the other hand, is still capable of reaching the designated target region safely. Background image courtesy of NASA and Arizona State University. VIPER render courtesy of NASA.</figcaption>
</div>
{:/}


## Supplementary material

### Distribution of Monte-Carlo trials between our approach and the CCDP algorithm

<div class=figure style='text-align:center'>
<img src='/assets/safe-mission-level-planning/exp1_mc_barplots.png' width='100%' />
</div>

### Traverse trials for the medium-scale traverse generated with our proposed algorithm

5 waypoints visited, no fault, safe region reached:

<!-- 0 -->
<iframe width="560" height="315" src="https://www.youtube.com/embed/IzGCmaPK47s?si=TXKhrirFxS7XGMiI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

5 waypoints visited, 1 fault, safe region reached:

<!-- 1116 -->
<iframe width="560" height="315" src="https://www.youtube.com/embed/0XSyNmswyY0?si=DmGUBTvciDoYieQ5" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

3 waypoints visited, 2 faults, safe region reached:

<!-- 1002 -->
<iframe width="560" height="315" src="https://www.youtube.com/embed/7BP7wJ-0UNs?si=9jTRnHmjmuy5hPtP" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

1 waypoint visited, 4 faults, safe region reached:

<!-- 189 -->
<iframe width="560" height="315" src="https://www.youtube.com/embed/Xeq6KNWubnk?si=ganqV4eYoa4qb4Hx" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

1 waypoint visited, 2 faults, mission failure:

<!-- 6031 -->
<iframe width="560" height="315" src="https://www.youtube.com/embed/d9BJOB0DsyI?si=vjzmQNtTFvyMVhK3" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

### Traverse trials near the LCROSS impact site

2 waypoints visited, six faults, safe region reached:

<iframe width="560" height="315" src="https://www.youtube.com/embed/wnyS_jxWAvE?si=3ce5NWv5flsRcuNV" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

1 waypoint visited, two faults, safe region reached:

<iframe width="560" height="315" src="https://www.youtube.com/embed/UBQ_o2kqWc4?si=AR36c80QN4nRSXLn" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

2 waypoints visited, six faults, mission failure:

<iframe width="560" height="315" src="https://www.youtube.com/embed/J-F9Y7e69hI?si=69T4PdAOFq7EaAfz" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

## Citation

<pre wrap='true'>
@unpublished{lamarre2024safe,
  author = {Olivier Lamarre and Shantanu Malhotra and Jonathan Kelly},
  title  = {Safe Mission-Level Path Planning for Exploration of Lunar Permanently Shadowed Regions by a Solar-Powered Rover},
  note   = {2024 IEEE Aerospace (accepted)},
  year   = {2024},
}
</pre>