# Regions

Explore regions behavior with a live diagram and its two source files. Each example includes an edit to try in your own copy.

## Nested regions

Nested regions let broad domains contain narrower regions. In this case the AS region contains an IS-IS L1 region and the member routers.

### Expected Result

Regions can be nested so broad domains contain smaller domains.

### Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, remove `R05` only from region `isis-l1`'s `members` list. Keep R05 itself and its membership in every other region.
3. Reload. The `isis-l1` hull contracts around its remaining member. R05 and its links remain visible; the outer AS region still contains it.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: nested-regions/topology.yaml
    stylesheet: nested-regions/stylesheet.yaml
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

## Overlapping regions

Overlapping regions are important for network diagrams because some routers, such as IS-IS L1/L2 routers, belong to two scopes at once. R05 is intentionally inside both IS-IS L1 and IS-IS L2.

### Expected Result

A shared node can be a member of multiple regions.

### Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, remove `R05` only from region `isis-l2`'s `members` list. Keep R05 itself and its membership in every other region.
3. Reload. The `isis-l2` hull contracts around its remaining member. R05 and its links remain visible; the outer AS region still contains it.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: overlapping-regions/topology.yaml
    stylesheet: overlapping-regions/stylesheet.yaml
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

## Region label placement

Region label placement keeps small or single-node regions readable. Use `labelPosition` and `labelMargin` in region styles to anchor the label on a region edge, then set `headerPadding`, `paddingX`, or `paddingY` in the same region stylesheet rule when an auto-fit hull needs reserved interior space.

### Expected Result

Region labels can be anchored around the hull with an explicit margin.

### Try It

1. Copy the two YAML tabs into your own project.
2. In stylesheet.yaml, find `region[labels.placement = "side"]` and change `labelPosition` from `rightCenter` to `leftCenter`.
3. Reload. That region's label moves to the opposite side; its member nodes and membership stay unchanged.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: region-label-placement/topology.yaml
    stylesheet: region-label-placement/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Region label placement
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/region-label-placement/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/region-label-placement/stylesheet.yaml"
    ```

## Draggable regions

Regions can be interactive hulls. Setting `draggable: true` and `selectable: true` in the stylesheet makes the region behave like an editable scope object.

### Expected Result

Regions can be selectable and draggable hulls.

### Try It

1. Copy the two YAML tabs into your own project.
2. Drag the Site A hull by its label or border and observe both member nodes moving with it. Reload to reset the temporary movement.
3. In stylesheet.yaml, set draggable: false on the region rule. Reload and drag the same hull again: it stays fixed, while individual node dragging remains available.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: draggable-regions/topology.yaml
    stylesheet: draggable-regions/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Draggable regions
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/draggable-regions/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/draggable-regions/stylesheet.yaml"
    ```
