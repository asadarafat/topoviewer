---
hide:
  - toc
---

# Link grouping

Link grouping demonstrates threshold-based edge aggregation. Three transport links between the same two routers start as one summary link labeled `3 links`; click the summary link to reveal each member as a Cytoscape-style bundled Bezier edge. Use the explicit `Collapse 3 links` control to return to the summary without turning member-edge selection into a hidden toggle.

## Expected Result

Group parallel links by endpoint and layer when the count crosses a threshold.

## Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, change `attention.links.grouping.threshold` from `2` to `4`.
3. Reload. These three parallel links no longer meet the threshold, so they render individually instead of as one counted summary.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 440px
    controls: true
    controlsOpen: false
    title: Link grouping
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/link-grouping/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/link-grouping/stylesheet.yaml"
    ```
