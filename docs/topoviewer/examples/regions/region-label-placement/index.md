---
hide:
  - toc
---

# Region label placement

Region label placement keeps small or single-node regions readable. Use `labelPosition` and `labelMargin` in region styles to anchor the label on a region edge, then set `headerPadding`, `paddingX`, or `paddingY` in the same region stylesheet rule when an auto-fit hull needs reserved interior space.

## Expected Result

Region labels can be anchored around the hull with an explicit margin.

## Try It

1. Copy the two YAML tabs into your own project.
2. In stylesheet.yaml, find `region[labels.placement = "side"]` and change `labelPosition` from `rightCenter` to `leftCenter`.
3. Reload. That region's label moves to the opposite side; its member nodes and membership stay unchanged.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Region label placement
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/region-label-placement/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/region-label-placement/stylesheet.yaml"
    ```
