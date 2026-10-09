---
hide:
  - toc
---

# Real network failure view

The failure view turns operational state into attention. Critical and major objects stay bright, healthy context remains visible but muted, and the impacted service path is still traceable through the same underlying topology facts.

## Expected Result

A failure view that focuses critical objects and keeps the impacted service path traceable.

## Try It

1. Copy the two YAML tabs into your own project. Copy the Attention YAML tab into your `topoviewer` fence too; focus and collapse settings are separate from the two source files. Select the same layers in the viewer: `underlay`, `bgp`, `transport`, `service`, `operations`. In stylesheet.yaml, find selector `region`.
2. Change its `borderColor` from `"rgba(248, 113, 113, 0.55)"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../integration/real-network-failure-view/topology.yaml
    stylesheet: ../../../integration/real-network-failure-view/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Real network failure view
    selectedLayerIds:
      - underlay
      - bgp
      - transport
      - service
      - operations
    attention:
      query:
        data:
          severity: critical
        mode: dim-context
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-failure-view/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-failure-view/stylesheet.yaml"
    ```

=== "Attention YAML"

    ```yaml
    attention:
      query:
        data:
          severity: critical
        mode: dim-context
    ```
