---
hide:
  - toc
---

# Real network underlay

The underlay view shows only the physical routed core: PE and P routers, straight grey transport links, and metro/core regions. Service endpoints, route reflectors, BGP sessions, and service paths are hidden so the operator can inspect the physical topology without control-plane or service overlays.

## Expected Result

A provider underlay view that foregrounds transport capacity, media, and backup links.

## Try It

1. Copy the two YAML tabs into your own project. Select the same layers in the viewer: `underlay`. In stylesheet.yaml, find selector `region`.
2. Change its `backgroundColor` from `"var(--topoviewer-region-fill)"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../integration/real-network-underlay/topology.yaml
    stylesheet: ../../../integration/real-network-underlay/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Real network underlay
    selectedLayerIds:
      - underlay
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-underlay/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-underlay/stylesheet.yaml"
    ```
