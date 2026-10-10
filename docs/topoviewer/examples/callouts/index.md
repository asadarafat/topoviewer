# Callouts

Explore callouts behavior with a live diagram and its two source files. Each example includes an edit to try in your own copy.

## Markdown callouts

Callout markdown supports headings, bullets, bold, underline, strike-through, inline code, links, and safe images. Use it for explanation, not for graph identity.

### Expected Result

Callout bodies support markdown, inline formatting, and images.

### Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `callout`.
2. Change its `lineColor` from `"var(--topoviewer-edge-default)"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: markdown/topology.yaml
    stylesheet: markdown/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Markdown callouts
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/markdown/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/markdown/stylesheet.yaml"
    ```

## Pins and leaders

Pins give leaders exact attachment points. This matters when a diagram has bars, ports, SAPs, or physical slots where center-point attachment is misleading.

The SAP `service` pin faces PE1’s `west` pin. The access line approaches that
facing edge, while the note sits above it; neither leader crosses the router.
SAP means service access point.

### Expected Result

Leaders can attach to named pins instead of object centers.

### Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `shape`.
2. Change its `borderWidth` from `2` to `4`, then reload your page. Compare the stroke thickness of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: pins-and-leaders/topology.yaml
    stylesheet: pins-and-leaders/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Pins and leaders
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/pins-and-leaders/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/pins-and-leaders/stylesheet.yaml"
    ```

## Image embed callout

Image embeds are allowed inside markdown when the URL is safe. This lets documentation diagrams include small symbols, screenshots, or badges without creating fake graph nodes.

### Expected Result

Image embeds are allowed when the URL is safe.

### Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `callout`.
2. Change its `lineColor` from `"var(--topoviewer-edge-default)"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: image-embed/topology.yaml
    stylesheet: image-embed/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Image embed callout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/image-embed/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/image-embed/stylesheet.yaml"
    ```
