---
hide:
  - toc
---

# Image embed callout

Image embeds are allowed inside markdown when the URL is safe. This lets documentation diagrams include small symbols, screenshots, or badges without creating fake graph nodes.

## Expected Result

Image embeds are allowed when the URL is safe.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `callout`.
2. Change its `lineColor` from `"var(--topoviewer-edge-default)"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Image embed callout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/image-embed/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/image-embed/stylesheet.yaml"
    ```
