---
hide:
  - toc
---

# Card node layout

Card node layout is for nodes that need to read like compact operational
records instead of plain device glyphs.

The node is still a `roundRectangle`. The nested `nodeLayout` object only
changes the internal arrangement: icon box on the left, title and subtitle on
the right. Badges and status markers stay node-level controls, so a card can
keep a TurboFlow-style badge on the top-right shell while its icon cell renders
either a glyph or an inline SVG. Use the badge size keys when the compact
defaults are too small for the card body.

Use this pattern for service maps, application dependencies, Kubernetes
objects, or operations views where every node needs a name plus one short piece
of metadata.

## Expected Result

Nested `nodeLayout` makes round-rectangle nodes read like compact service cards.

## Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `link`.
2. Change its `lineColor` from `"#64748b"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Card node layout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/card-node-layout/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/card-node-layout/stylesheet.yaml"
    ```
