---
hide:
  - toc
---

# Dependency focus

Dependency focus uses directed links and path sequences as an adjacency graph. This example starts from `CORE-1`, walks two downstream hops, marks reached nodes as related, and leaves the links as dimmed context so the blast radius is visible without hiding the topology.

## Expected Result

Traverse directed topology relationships to show downstream blast radius.

## Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, change `attention.query.dependency.depth` from `2` to `1`.
3. Reload. The seed and its immediate downstream neighbors remain emphasized; the access nodes two hops away return to dimmed context.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 460px
    controls: true
    controlsOpen: false
    title: Dependency focus
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/dependency-focus/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/dependency-focus/stylesheet.yaml"
    ```
