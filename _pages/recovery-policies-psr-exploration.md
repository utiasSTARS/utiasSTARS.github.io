---
layout: page
title: Recovery Policies for Safe Exploration of Lunar Permanently Shadowed Regions by a Solar-Powered Rover (Acta Astronautica)
# subtitle:  Representing Rotations in Deep Learning
description: Submitted to Acta Astronautica
permalink: /recovery-policies-psr-exploration/
nav_exclude: true
nav_order: 9989
# youtubeId: 8QMcNmCPYR0
---

# Recovery Policies for Safe Exploration of Lunar Permanently Shadowed Regions by a Solar-Powered Rover
**Article currently under review to appear in the Acta Astronautica journal.**

As part of this publication, we release the [`gplanetary_nav`](https://github.com/utiasSTARS/global-planetary-nav) Python library, an open-source repository to facilitate the interface between orbital data and global navigation planning algorithms in support of long-range/strategic planetary mobility.

{::nomarkdown} 
<div class=figure style='text-align:center'>
<img src='/assets/recovery-policies-psr-exploration/overview.png' width='100%' />
<figcaption>With a solar-powered rover affected by random navigation delays, the safest way out of a PSR is dictated by the probability of survival of the rover, not the physically shortest path. In subfigure A, the black dashed line shows the path returned by a hypothetical risk-agnostic offline spatiotemporal planner. The blue arrow shows an action returned by a hypothetical online, risk-aware planner. A fault occurring early into the traverse (subfigure B) not only invalidates the offline plan, but in this case it also prevents the rover from being exposed to sunlight no matter where it exits the PSR (subfigure C). On the other hand, a risk-aware online planner can, by design, proactively account for stochastic faults (see blue path). In this conceptual example, the online planning methodology leads the rover to sunlight (subfigure D). VIPER render courtesy of NASA.</figcaption>
</div>
{:/}

## Supplementary material: animation of recovery drives from the LCROSS crash site

The manuscript shows snapshots of simulation trials departing at different times from a specific location near the LCROSS crash site. The following shows complete animations of these traverses:

Departure from timestamp t<sub>0</sub> (UNIX timestamp 1882218800s, August 23 2029 22:33:20 UTC):

<iframe width="560" height="315" src="https://www.youtube.com/embed/Wfv5q5eROXc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

Departure from timestamp t<sub>1</sub> (UNIX timestamp 1882272800s, August 24 2029 13:33:20 UTC):

<iframe width="560" height="315" src="https://www.youtube.com/embed/hayNnuagIps" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

Departure from timestamp t<sub>2</sub> (UNIX timestamp 1882377200s, August 25 2029 18:33:20 UTC):

<iframe width="560" height="315" src="https://www.youtube.com/embed/tehlriK4HA4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

Departure from timestamp t<sub>4</sub> (UNIX timestamp 1882514000s, August 27 2029 08:33:20 UTC):

<iframe width="560" height="315" src="https://www.youtube.com/embed/_-If01n-UmI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
