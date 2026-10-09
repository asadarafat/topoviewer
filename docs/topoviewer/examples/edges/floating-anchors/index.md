---
hide:
  - toc
---

# Floating anchors

Floating anchors are the default edge behavior. The renderer computes a boundary attachment point from the node geometry so the line does not terminate at the node center.

## Expected Result

Floating anchors connect to the nearest point on each node boundary.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `link`.
2. Change its `lineColor` from `"#22c55e"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Floating anchors
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/floating-anchors/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/floating-anchors/stylesheet.yaml"
    ```
