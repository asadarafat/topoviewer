---
hide:
  - toc
---

# Real network service path

The service path view starts from the real network transport layer and adds the Payments L3VPN. Customer edge nodes and access links appear at the sides, while the service lane is stitched over the SR transport path through the provider core.

## Expected Result

A service path view that focuses the customer L3VPN path across the same provider topology.

## Try It

1. Copy the two YAML tabs into your own project. Copy the Attention YAML tab into your `topoviewer` fence too; focus and collapse settings are separate from the two source files. Select the same layers in the viewer: `underlay`, `bgp`, `transport`, `service`. In stylesheet.yaml, find selector `region`.
2. Change its `borderWidth` from `1` to `3`, then reload your page. Compare the stroke thickness of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../integration/real-network-service-path/topology.yaml
    stylesheet: ../../../integration/real-network-service-path/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Real network service path
    selectedLayerIds:
      - underlay
      - bgp
      - transport
      - service
    attention:
      query:
        pathIds:
          - payments-primary
        mode: dim-context
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-service-path/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-service-path/stylesheet.yaml"
    ```

=== "Attention YAML"

    ```yaml
    attention:
      query:
        pathIds:
          - payments-primary
        mode: dim-context
    ```
