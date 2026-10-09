# Styling

Explore styling behavior with a live diagram and its two source files. Each example includes an edit to try in your own copy.

## Selector styling

Selector styling is the core authoring contract. Topology authors classify objects once; visual rules then match by kind, id, labels, or data.

### Expected Result

Selector rules classify objects by kind, id, labels, or data.

### Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `node[labels.vendor = "cisco"]`.
2. Change its `borderColor` from `"#cffafe"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: selectors/topology.yaml
    stylesheet: selectors/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Selector styling
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/selectors/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/selectors/stylesheet.yaml"
    ```

## Inline style override

Inline style is an escape hatch. Use it sparingly for one-off emphasis; reusable visual policy still belongs in the stylesheet.

### Expected Result

Inline `style` overrides are local escape hatches on individual objects.

### Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `link[id = "normal-override"]`.
2. Change its `lineColor` from `"#fb7185"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: inline-style-override/topology.yaml
    stylesheet: inline-style-override/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Inline style override
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/inline-style-override/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/inline-style-override/stylesheet.yaml"
    ```

## Light and dark theme variables

Theme-aware examples should use CSS variables so the same diagram follows MkDocs Material light and dark mode without duplicating the topology.

### Expected Result

Theme-aware styles should use TopoViewer CSS variables.

### Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `link`.
2. Change its `lineColor` from `"var(--topoviewer-link-physical)"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: theme-light-dark/topology.yaml
    stylesheet: theme-light-dark/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Light and dark theme variables
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/theme-light-dark/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/theme-light-dark/stylesheet.yaml"
    ```

## Label z-index

Use `labelZIndex` when labels need their own draw order without moving the object body, edge line, or region hull. The region label, edge label, endpoint labels, and node labels in this example intentionally use separate label layers.

### Expected Result

Labels can draw in their own layer without changing object, edge, or region draw order.

### Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `region`.
2. Change its `borderColor` from `"rgba(25, 118, 210, 0.48)"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: label-z-index/topology.yaml
    stylesheet: label-z-index/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Label z-index
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/label-z-index/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/label-z-index/stylesheet.yaml"
    ```
