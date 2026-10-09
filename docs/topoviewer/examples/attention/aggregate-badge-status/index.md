---
hide:
  - toc
---

# Aggregate badge and status

Aggregate badge and status defaults make a collapsed group useful before drill-down. The summary node shows the hidden member count as a badge and the worst member severity as a status marker.

## Expected Result

Collapsed aggregate summaries can expose hidden member count and worst severity as compact node cues.

## Try It

1. Copy the two YAML tabs into your own project.
2. Keep the Access region summary collapsed. In topology.yaml, change ACC-2's data.severity from critical to normal.
3. Reload. The summary's worst severity changes from critical to major because AGG-1 is still major. Its member-count badge remains 3.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Aggregate badge and status
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/aggregate-badge-status/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/aggregate-badge-status/stylesheet.yaml"
    ```
