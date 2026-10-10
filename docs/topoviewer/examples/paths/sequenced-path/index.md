---
hide:
  - toc
---

# Sequenced path

A sequenced path is more than a link: it records the ordered nodes that the logical path traverses. Rendering expands the sequence into path segments.

## Expected Result

A path sequence models ordered traversal through graph nodes.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `path[labels.protocol = "sr-te"]`.
2. Change its `lineColor` from `"var(--topoviewer-danger)"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Sequenced path
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/paths/sequenced-path/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/paths/sequenced-path/stylesheet.yaml"
    ```
