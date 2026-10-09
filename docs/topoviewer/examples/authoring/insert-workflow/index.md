---
hide:
  - toc
---

# Insert workflow

A Studio authoring fixture for adding nodes, links, regions, paths, and notes from the object palette.

The graph keeps every declared layer populated so layer toggles remain useful while authoring.

## Expected Result

A Studio fixture for inserting nodes, links, paths, regions, and notes.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `region`.
2. Change its `borderColor` from `"rgba(66, 165, 245, 0.58)"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Insert workflow
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/insert-workflow/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/insert-workflow/stylesheet.yaml"
    ```
