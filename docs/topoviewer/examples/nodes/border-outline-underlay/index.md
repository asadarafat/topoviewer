---
hide:
  - toc
---

# Border, outline, and underlay

Border, outline, and underlay styles create operational emphasis without changing the topology. Warning and critical nodes stand out through stroke pattern, outline, and underlay while the normal peer stays visually quiet.

## Expected Result

Node border, outline, and underlay controls provide operational emphasis without changing graph facts.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `link`.
2. Change its `lineColor` from `"#94a3b8"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Border, outline, and underlay
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/border-outline-underlay/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/border-outline-underlay/stylesheet.yaml"
    ```
