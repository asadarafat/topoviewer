---
hide:
  - toc
---

# Dense CLOS labels

Dense CLOS labels show the label-placement problem that appears in operational
fabric dashboards: region names, node names, node metadata, endpoint port
labels, and bidirectional bandwidth values all want space around the same small
set of links.

The topology keeps one parent link per fabric adjacency. Physical port names
live on `sourceLabel` and `targetLabel`; bandwidth values live on
`directions.sourceToTarget.label` and `directions.targetToSource.label`. The
stylesheet assigns independent label z-index values and uses the shared
collision policy so labels can move without changing node or link geometry.

## Expected Result

Show region, node, metadata, endpoint port, and bidirectional bandwidth labels in one compact CLOS fabric.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `linkDirection[direction = "targetToSource"]`.
2. Change its `lineColor` from `"#4caf50"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 500px
    controls: true
    controlsOpen: false
    title: Dense CLOS labels
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/dense-clos-labels/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/dense-clos-labels/stylesheet.yaml"
    ```
