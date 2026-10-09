---
hide:
  - toc
---

# Endpoint spacing and routing

Endpoint spacing moves the visible line inward from node boundaries. Segment controls make manual bend points explicit, while taxi controls create deterministic right-angled routes without relying on automatic layout guesses.

## Expected Result

Endpoint spacing, segment controls, and taxi controls make edge routes explicit.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `link[labels.route = "taxi"]`.
2. Change its `lineColor` from `"#f97316"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Endpoint spacing and routing
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/endpoint-spacing-routing/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/endpoint-spacing-routing/stylesheet.yaml"
    ```
