---
hide:
  - toc
---

# Graph basic

A minimal TopoViewer graph starts with named nodes and named links. Keep topology facts in `graph.nodes` and `graph.links`; let the stylesheet decide how those facts are presented.

## Expected Result

A minimal graph with two nodes and one named link.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `node[labels.vendor = "cisco"]`.
2. Change its `borderColor` from `"#cffafe"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Graph basic
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/basic/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/basic/stylesheet.yaml"
    ```
