---
hide:
  - toc
---

# Parent link pipe

Parent links let an overlay relationship ride inside a carrier relationship. The service still connects child endpoints, but the visual lane follows the parent transport pipe. Parent links, their carrier links, and links styled as pipes remain independent from attention-based parallel-link grouping because they describe containment rather than parallel capacity.

## Expected Result

A child link can be visually carried inside a parent transport link.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `link[labels.link = "service"]`.
2. Change its `lineColor` from `"#22c55e"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Parent link pipe
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/parent-link-pipe/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/parent-link-pipe/stylesheet.yaml"
    ```
