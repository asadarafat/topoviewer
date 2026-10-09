---
hide:
  - toc
---

# Tree layout

Tree layout arranges a directed hierarchy into deterministic levels without
requiring authored positions.

This example uses a service dependency tree with one disconnected component:

- link direction defines parent-to-child traversal
- sibling order is stable by object ID, independent of YAML array order
- `layout.tree.direction` controls the orientation
- bounded gaps keep disconnected components readable

Use `tree` for hierarchies and dependency views. Use `clos` for dense staged
fabrics, `force` for general graphs, and `manual` when placement is part of the
reviewed artifact.

## Expected Result

Tree layout computes deterministic levels for directed hierarchies and disconnected components.

## Try It

1. Copy the two YAML tabs into your own project.
2. In stylesheet.yaml, change `layout.tree.direction` from `leftToRight` to `topToBottom`.
3. Reload. The stages or hierarchy turn to the new orientation while node IDs and link endpoints stay the same.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Tree layout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/tree/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/tree/stylesheet.yaml"
    ```
