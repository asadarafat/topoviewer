---
hide:
  - toc
---

# Pins and leaders

Pins give leaders exact attachment points. This matters when a diagram has bars, ports, SAPs, or physical slots where center-point attachment is misleading.

The SAP `service` pin faces PE1’s `west` pin. The access line approaches that
facing edge, while the note sits above it; neither leader crosses the router.
SAP means service access point.

## Expected Result

Leaders can attach to named pins instead of object centers.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `shape`.
2. Change its `borderWidth` from `2` to `4`, then reload your page. Compare the stroke thickness of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Pins and leaders
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/pins-and-leaders/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/pins-and-leaders/stylesheet.yaml"
    ```
