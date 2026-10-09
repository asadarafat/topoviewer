---
hide:
  - toc
---

# Endpoint label controls

Use endpoint labels when the two ends of an edge need visible port names. This
example keeps circle and square arrow markers as geometry only, then renders
`sourceLabel` and `targetLabel` as styled endpoint annotations with automatic
placement.

`endpointLabelDistance` moves labels away from their endpoint along the edge. `endpointLabelSideOffset` moves labels perpendicular to the edge during auto placement. `sourceLabelXOffset`, `sourceLabelYOffset`, `targetLabelXOffset`, and `targetLabelYOffset` are final manual nudges after auto placement.

Use the center `label` for the relationship name. Use `sourceLabel` and
`targetLabel` for interface names. Do not put interface names inside arrow
markers; arrows stay marker geometry so the label engine can place endpoint
text independently.

## Expected Result

Endpoint labels can show physical ports while arrow markers remain pure geometry.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `link[labels.class = "silver"]`.
2. Change its `lineColor` from `"#64748b"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Endpoint label controls
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/endpoint-label-controls/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/endpoint-label-controls/stylesheet.yaml"
    ```
