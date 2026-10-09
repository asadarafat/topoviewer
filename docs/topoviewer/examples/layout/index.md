# Layout

Explore layout behavior with a live diagram and its two source files. Each example includes an edit to try in your own copy.

## Manual layout

Manual layout means the author supplies coordinates. This is the right mode for diagrams where placement carries meaning.

### Expected Result

Manual layout preserves authored positions.

### Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, change node `A`'s `position` from `[120,140]` to `[120,240]`.
3. Reload. That node moves down relative to the other authored positions, and its connected links follow it.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: manual/topology.yaml
    stylesheet: manual/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Manual layout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/manual/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/manual/stylesheet.yaml"
    ```

## Force layout

Force layout is auto-layout assistance. It is useful when topology data exists but the author does not want to maintain coordinates by hand.

### Expected Result

Force layout computes positions when the author omits coordinates.

### Try It

1. Copy the two YAML tabs into your own project.
2. In stylesheet.yaml, change `layout.linkDistance` from `130` to `210`.
3. Reload and compare the recomputed node spacing. Reload once more without another edit: the same input should produce the same layout.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: force/topology.yaml
    stylesheet: force/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Force layout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/force/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/force/stylesheet.yaml"
    ```

## CLOS layout

CLOS layout infers staged placement from graph structure.

This example intentionally uses generic node names and directed links:

- no manual node positions are authored
- `source` -> `target` link direction defines the preferred root-to-leaf order
- no network-specific labels such as spine or leaf are required

If your topology already has explicit stages, use `layout.clos.stageKey` and
`stageOrder`. If the graph is not staged, use `force`; if placement must be
operator-approved, use `manual`.

### Expected Result

CLOS layout infers staged placement from graph structure.

### Try It

1. Copy the two YAML tabs into your own project.
2. In stylesheet.yaml, change `layout.clos.direction` from `topToBottom` to `leftToRight`.
3. Reload. The stages or hierarchy turn to the new orientation while node IDs and link endpoints stay the same.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: clos/topology.yaml
    stylesheet: clos/stylesheet.yaml
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

## Tree layout

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

### Expected Result

Tree layout computes deterministic levels for directed hierarchies and disconnected components.

### Try It

1. Copy the two YAML tabs into your own project.
2. In stylesheet.yaml, change `layout.tree.direction` from `leftToRight` to `topToBottom`.
3. Reload. The stages or hierarchy turn to the new orientation while node IDs and link endpoints stay the same.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: tree/topology.yaml
    stylesheet: tree/stylesheet.yaml
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
