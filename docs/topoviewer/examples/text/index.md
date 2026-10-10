# Text

Explore text behavior with a live diagram and its two source files. Each example includes an edit to try in your own copy.

## Standalone text boxes

Standalone text belongs under `diagram.texts`, not `graph.nodes`. Use it for
titles, explanatory copy, maintenance notes, and other presentation content that
must remain selectable, resizable, layer-aware, and reviewable in YAML.

### Expected Result

Layer-aware text boxes add editable canvas copy without creating graph objects.

### Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `text[id = "rotated-note"]`.
2. Change its `borderColor` from `"var(--topoviewer-info)"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: standalone-text-boxes/topology.yaml
    stylesheet: standalone-text-boxes/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Standalone text boxes
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/text/standalone-text-boxes/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/text/standalone-text-boxes/stylesheet.yaml"
    ```
