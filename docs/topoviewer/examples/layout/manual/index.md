---
hide:
  - toc
---

# Manual layout

Manual layout means the author supplies coordinates. This is the right mode for diagrams where placement carries meaning.

## Expected Result

Manual layout preserves authored positions.

## Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, change node `A`'s `position` from `[120,140]` to `[120,240]`.
3. Reload. That node moves down relative to the other authored positions, and its connected links follow it.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Manual layout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/manual/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/manual/stylesheet.yaml"
    ```
