---
hide:
  - toc
---

# Real network BGP

The BGP view starts from the real network underlay and adds the route reflector plus PE-to-RR sessions. Transport links remain straight grey context, while the BGP overlay carries the control-plane question.

## Expected Result

A BGP view that makes route reflector sessions visible while keeping the underlay as context.

## Try It

1. Copy the two YAML tabs into your own project. Select the same layers in the viewer: `underlay`, `bgp`. In stylesheet.yaml, find selector `region`.
2. Change its `backgroundColor` from `"var(--topoviewer-region-fill)"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../integration/real-network-bgp/topology.yaml
    stylesheet: ../../../integration/real-network-bgp/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Real network BGP
    selectedLayerIds:
      - underlay
      - bgp
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-bgp/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-bgp/stylesheet.yaml"
    ```
