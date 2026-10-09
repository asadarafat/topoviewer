---
hide:
  - toc
---

# Layered network authoring

The default compact Studio authoring fixture.

It combines underlay, BGP, service, and operations layers in one small topology so Studio and regression checks can exercise layer toggles, relationship editing, attention, and diagnostics without starting from an empty graph.

## Expected Result

A compact layered-network fixture for Studio, demos, and regression checks.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `region`.
2. Change its `borderColor` from `"rgba(25, 118, 210, 0.34)"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Layered network authoring
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/layered-network/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/layered-network/stylesheet.yaml"
    ```
