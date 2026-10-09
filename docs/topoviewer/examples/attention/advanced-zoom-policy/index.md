---
hide:
  - toc
---

# Advanced zoom policy

Advanced zoom policy is an optional host-controlled behavior for map-style overview/detail transitions. The recommended operator workflow is still explicit: click an aggregate summary to expand it, then click the expanded region hull or parent object to collapse it. Use zoom thresholds only when the embedding experience intentionally wants detail to follow viewport scale.

## Expected Result

Optionally bind aggregate expansion to zoom thresholds when a host needs map-style overview/detail transitions.

## Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, set `attention.aggregate.viewport.collapseBelowZoom: 0.7` and `expandAboveZoom: 1.0`.
3. Reload, then use the zoom controls to move below 0.7: both metros collapse. Zoom above 1.0: their member nodes return. Cross each threshold without clicking summaries so the zoom policy drives this comparison.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 500px
    controls: true
    controlsOpen: false
    title: Advanced zoom policy
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/advanced-zoom-policy/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/advanced-zoom-policy/stylesheet.yaml"
    ```
