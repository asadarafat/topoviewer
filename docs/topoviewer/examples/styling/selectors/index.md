---
hide:
  - toc
---

# Selector styling

Selector styling is the core authoring contract. Topology authors classify objects once; visual rules then match by kind, id, labels, or data.

## Expected Result

Selector rules classify objects by kind, id, labels, or data.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `node[labels.vendor = "cisco"]`.
2. Change its `borderColor` from `"var(--topoviewer-info)"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Selector styling
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/selectors/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/selectors/stylesheet.yaml"
    ```
