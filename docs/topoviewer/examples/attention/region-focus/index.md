---
hide:
  - toc
---

# Region focus

Region focus uses `graph.regions[].members` as the declarative grouping source. The attention query focuses the access metro region, so its member nodes become prominent while the PE outside the region and the surrounding links stay as dimmed context.

## Expected Result

Focus a region and its member nodes while preserving surrounding context.

## Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, remove `ACC-2` only from region `access-metro`'s `members` list. Keep the node and its links.
3. Reload. That node becomes dimmed context instead of a focused region member, and the auto-fit hull adjusts to its remaining members.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 460px
    controls: true
    controlsOpen: false
    title: Region focus
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/region-focus/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/region-focus/stylesheet.yaml"
    ```
