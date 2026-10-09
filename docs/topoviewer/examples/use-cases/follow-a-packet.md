# Follow A Packet Through The Fabric

**Which devices carry this tenant's traffic, and which links merely exist?**

Start at **API A** in Rack 01 and follow the teal arrows to **DB D** in Rack 04.
Two spines connect all four leaves; the highlighted route chooses Spine 1.
Violet **T42** badges identify the tenant's endpoints. Gray lines show physical
connectivity, including links that this route does not use.

```topoviewer
topology: examples/integration/fabric-journey/topology.yaml
stylesheet: examples/integration/fabric-journey/stylesheet.yaml
height: 620px
controls: true
controlsOpen: false
title: Follow a packet through the fabric
```

*Authored example: the route and the optional 18% / 4% utilization values are illustrative,
not live measurements or a recorded forwarding decision.*

## Try Three Views

1. **Separate the route from the wiring.** Open the diagram's settings and
   clear **Layers > Tenant 42 route**. The teal route disappears; all ten devices,
   twelve physical links, and four rack groups remain. Turn the layer back on.
   The same physical fabric now carries the visible five-device route again:
   **API A → Leaf 1 → Spine 1 → Leaf 4 → DB D**.

2. **Read the ports and the direction.** Enable **Port labels** and **Sample
   utilization** under Display. On the active fabric uplinks, Leaf 1
   and Leaf 4 use `e1/49`; their Spine 1 ports are `e1/1` and `e1/4`. On the
   API A access link, **18%** points toward Leaf 1 and **4%** points toward API A.
   Disable **Sample utilization**: the values and directional strokes disappear,
   while the physical link remains. Re-enable it, then close settings.

3. **Follow only this conversation.** Click a teal path segment. The five
   devices in the tenant route stay prominent while unrelated fabric objects
   dim. Click empty canvas, or open settings and choose **Attention > Clear**,
   to restore the full context. The underlying topology does not change.

## Make It Yours

Download the [Studio project](../../../assets/gallery/fabric.tvstudio) and use
**Project menu > Open archive** in [Studio](../../author/studio/index.md).
Change a visible label, apply an appearance change, and export your own copy.
The [first-project walkthrough](../../author/studio/first-project.md) covers
Apply, Save, and archive verification.

For a file-based workflow, download the [source bundle](../../../assets/gallery/fabric.zip).
It contains the topology, stylesheet, expected checks, and a short README.
You can also inspect [topology.yaml](../integration/fabric-journey/topology.yaml)
and [stylesheet.yaml](../integration/fabric-journey/stylesheet.yaml) directly.

Keep physical adjacencies in `graph.links` and the chosen ordered route in
`graph.paths`. A new route can use Spine 2 without redrawing the physical
fabric. To drive direction values from actual metrics, continue with
[telemetry mapping](../../author/studio/telemetry-mapper.md) and the
[Grafana lab](grafana-topoviewer-panel.md).
