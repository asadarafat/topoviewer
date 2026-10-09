---
hide:
  - toc
---

# Inline style override

Inline style is an escape hatch. Use it sparingly for one-off emphasis; reusable visual policy still belongs in the stylesheet.

## Expected Result

Inline `style` overrides are local escape hatches on individual objects.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `link[id = "normal-override"]`.
2. Change its `lineColor` from `"#fb7185"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Inline style override
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/inline-style-override/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/inline-style-override/stylesheet.yaml"
    ```
