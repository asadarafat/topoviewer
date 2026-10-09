---
hide:
  - toc
---

# Parent and child nodes

Parent and child nodes model ownership without losing graph semantics. The child remains selectable and linkable, while the parent can auto-expand when child nesting is enabled.

## Expected Result

Logical nodes can be nested inside physical parent nodes.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `link[labels.link = "service"]`.
2. Change its `lineColor` from `"#c084fc"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Parent and child nodes
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/parent-child-nodes/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/parent-child-nodes/stylesheet.yaml"
    ```
