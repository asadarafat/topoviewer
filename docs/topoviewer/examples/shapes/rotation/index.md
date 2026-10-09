---
hide:
  - toc
---

# Shape rotation

Shape geometry, dimensions, and rotation are stylesheet policy. The topology keeps stable shape identity, position, layers, and selector labels; text remains a separate annotation concern.

## Expected Result

Shape geometry can be rotated directly or through a stylesheet rule.

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
    title: Shape rotation
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/rotation/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/rotation/stylesheet.yaml"
    ```
