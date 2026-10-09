---
hide:
  - toc
---

# Draggable regions

Regions can be interactive hulls. Setting `draggable: true` and `selectable: true` in the stylesheet makes the region behave like an editable scope object.

## Expected Result

Regions can be selectable and draggable hulls.

## Try It

1. Copy the two YAML tabs into your own project.
2. Drag the Site A hull by its label or border and observe both member nodes moving with it. Reload to reset the temporary movement.
3. In stylesheet.yaml, set draggable: false on the region rule. Reload and drag the same hull again: it stays fixed, while individual node dragging remains available.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Draggable regions
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/draggable-regions/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/draggable-regions/stylesheet.yaml"
    ```
