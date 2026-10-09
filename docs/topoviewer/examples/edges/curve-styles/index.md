---
hide:
  - toc
---

# Edge curve styles

Curve styles are presentation choices. The graph still says A connects to B/C/D/E; the stylesheet controls whether that relationship renders as straight, taxi, smooth-taxi, or unbundled-bezier.

## Expected Result

Different `curveStyle` values produce different edge routing models.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `link[labels.curve = "unbundled-bezier"]`.
2. Change its `lineColor` from `"#c084fc"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Edge curve styles
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/curve-styles/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/curve-styles/stylesheet.yaml"
    ```
