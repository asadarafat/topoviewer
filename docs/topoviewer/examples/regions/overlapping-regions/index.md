---
hide:
  - toc
---

# Overlapping regions

Overlapping regions are important for network diagrams because some routers, such as ABRs, belong to two scopes at once. R05 is intentionally inside both IS-IS L1 and IS-IS L2.

## Expected Result

A shared node can be a member of multiple regions.

## Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, remove `R05` only from region `isis-l2`'s `members` list. Keep R05 itself and its membership in every other region.
3. Reload. The `isis-l2` hull contracts around its remaining member. R05 and its links remain visible; the outer AS region still contains it.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Overlapping regions
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/overlapping-regions/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/overlapping-regions/stylesheet.yaml"
    ```
