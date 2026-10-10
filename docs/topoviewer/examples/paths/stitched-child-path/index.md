---
hide:
  - toc
---

# Stitched child path

Stitched service paths model access-to-core-to-access behavior. The child endpoints remain inside AGG nodes, while the service lane is stitched into every segment of the parent transport path.

## Expected Result

A child service path can stitch from child endpoints into a parent transport path.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `path`.
2. Change its `labelFontSize` from `12` to `14`, then reload your page. Compare the label size of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Stitched child path
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/paths/stitched-child-path/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/paths/stitched-child-path/stylesheet.yaml"
    ```
