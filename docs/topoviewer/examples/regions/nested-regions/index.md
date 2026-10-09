---
hide:
  - toc
---

# Nested regions

Nested regions let broad domains contain narrower regions. In this case the AS region contains an IS-IS L1 region and the member routers.

## Expected Result

Regions can be nested so broad domains contain smaller domains.

## Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, remove `R05` only from region `isis-l1`'s `members` list. Keep R05 itself and its membership in every other region.
3. Reload. The `isis-l1` hull contracts around its remaining member. R05 and its links remain visible; the outer AS region still contains it.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Nested regions
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/nested-regions/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/nested-regions/stylesheet.yaml"
    ```
