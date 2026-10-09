---
hide:
  - toc
---

# Inspector workflow

A Studio authoring fixture for inspecting and editing object labels, data, positions, and relationship endpoints.

The topology includes routers, a firewall, a service, links, and a callout so the Inspect panel has varied object types.

## Expected Result

A Studio fixture for inspecting object labels, data, positions, and relationships.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `link[labels.layer = "security"]`.
2. Change its `lineColor` from `"#d32f2f"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Inspector workflow
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/inspector-workflow/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/inspector-workflow/stylesheet.yaml"
    ```
