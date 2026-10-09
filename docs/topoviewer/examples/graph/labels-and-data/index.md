---
hide:
  - toc
---

# Labels and data

`labels` are for classification and selector matching. `data` carries facts like metrics, delay, loopback, or counters that tools can inspect without making the visual stylesheet brittle.

## Expected Result

Classification lives in `labels`; operational values live in `data`.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `link[labels.protocol = "isis"]`.
2. Change its `lineColor` from `"#22c55e"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Labels and data
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/labels-and-data/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/labels-and-data/stylesheet.yaml"
    ```
