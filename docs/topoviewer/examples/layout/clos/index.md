---
hide:
  - toc
---

# CLOS layout

CLOS layout infers staged placement from graph structure.

This example intentionally uses generic node names and directed links:

- no manual node positions are authored
- `source` -> `target` link direction defines the preferred root-to-leaf order
- no network-specific labels such as spine or leaf are required

If your topology already has explicit stages, use `layout.clos.stageKey` and
`stageOrder`. If the graph is not staged, use `force`; if placement must be
operator-approved, use `manual`.

## Expected Result

CLOS layout infers staged placement from graph structure.

## Try It

1. Copy the two YAML tabs into your own project.
2. In stylesheet.yaml, change `layout.clos.direction` from `topToBottom` to `leftToRight`.
3. Reload. The stages or hierarchy turn to the new orientation while node IDs and link endpoints stay the same.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: CLOS layout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/clos/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/clos/stylesheet.yaml"
    ```
