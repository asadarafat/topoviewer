---
hide:
  - toc
---

# Attention workflow

A Studio authoring fixture for editing attention behavior against a small multi-layer service topology.

Use it to exercise object focus, path focus, dense link grouping, and region aggregation.

## Expected Result

A Studio fixture for editing attention focus, aggregation, and link grouping.

## Try It

1. Copy the two YAML tabs into your own project. Select the same layers in the viewer: `underlay`, `service`, `operations`. In stylesheet.yaml, find selector `region`.
2. Change its `borderColor` from `"var(--topoviewer-region-stroke)"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Attention workflow
    selectedLayerIds:
      - underlay
      - service
      - operations
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/attention-workflow/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/attention-workflow/stylesheet.yaml"
    ```
