---
hide:
  - toc
---

# Markdown callouts

Callout markdown supports headings, bullets, bold, underline, strike-through, inline code, links, and safe images. Use it for explanation, not for graph identity.

## Expected Result

Callout bodies support markdown, inline formatting, and images.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `callout`.
2. Change its `lineColor` from `"rgba(226, 232, 240, 0.72)"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Markdown callouts
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/markdown/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/markdown/stylesheet.yaml"
    ```
