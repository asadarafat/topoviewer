---
hide:
  - toc
---

# Complete network demo

The complete network demo is the integration fixture. It is intentionally broader than the feature fixtures and proves that graph facts, paths, regions, child nodes, shapes, callouts, SVG icons, controls, and theme variables can coexist.

## Expected Result

An integrated network example combining graph facts, regions, child nodes, paths, shapes, and callouts.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `callout[labels.callout = "export"]`.
2. Change its `borderColor` from `"rgba(74, 222, 128, 0.72)"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: ../examples/integration/complete-network-demo/topology.yaml
    stylesheet: ../examples/integration/complete-network-demo/stylesheet.yaml
    height: 640px
    controls: true
    controlsOpen: false
    title: Complete network demo
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/complete-network-demo/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/complete-network-demo/stylesheet.yaml"
    ```
