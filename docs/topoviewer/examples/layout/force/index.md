---
hide:
  - toc
---

# Force layout

Force layout is auto-layout assistance. It is useful when topology data exists but the author does not want to maintain coordinates by hand.

## Expected Result

Force layout computes positions when the author omits coordinates.

## Try It

1. Copy the two YAML tabs into your own project.
2. In stylesheet.yaml, change `layout.linkDistance` from `130` to `210`.
3. Reload and compare the recomputed node spacing. Reload once more without another edit: the same input should produce the same layout.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Force layout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/force/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/force/stylesheet.yaml"
    ```
