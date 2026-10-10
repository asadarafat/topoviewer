---
hide:
  - toc
---

# Arrows, dashes, and labels

Arrows, dashes, and labels are edge styling. The request and reply links use the same `lineDashPattern` but different `lineDashOffset` values, so the rendered dash cadence is visibly phase-shifted. Endpoint labels make it clear that `sourceLabel` follows the edge source and `targetLabel` follows the edge target.

## Expected Result

Edges can carry labels, arrows, dash patterns, and dash offsets without changing topology semantics.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `link[labels.direction = "reply"]`.
2. Change its `lineColor` from `"var(--topoviewer-info)"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Arrows, dashes, and labels
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/arrows-dashes-labels/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/arrows-dashes-labels/stylesheet.yaml"
    ```
