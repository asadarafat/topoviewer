---
hide:
  - toc
---

# Dense link grouping

A compact Studio fixture for parallel links and link grouping.

Use it to tune bundle threshold behavior without loading a large topology.

## Expected Result

A Studio fixture for parallel link grouping and bundle threshold editing.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `link[labels.layer = "observability"]`.
2. Change its `lineColor` from `"var(--topoviewer-info)"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 500px
    controls: true
    controlsOpen: false
    title: Dense link grouping
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/dense-links/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/dense-links/stylesheet.yaml"
    ```
