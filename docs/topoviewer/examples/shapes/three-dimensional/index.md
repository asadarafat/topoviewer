---
hide:
  - toc
---

# Three-dimensional shapes

3D shapes cover the common diagram metaphors: cube, cuboid, sphere, cone, cylinder, pyramid, and prism. Topology labels classify each primitive and stylesheet selectors own its geometry and dimensions. Use callouts when text needs to sit near them.

## Expected Result

3D geometry primitives are available for common diagram metaphors.

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
    title: Three-dimensional shapes
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/three-dimensional/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/three-dimensional/stylesheet.yaml"
    ```
