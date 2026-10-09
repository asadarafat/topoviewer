# Graph

Explore graph behavior with a live diagram and its two source files. Each example includes an edit to try in your own copy.

## Graph basic

A minimal TopoViewer graph starts with named nodes and named links. Keep topology facts in `graph.nodes` and `graph.links`; let the stylesheet decide how those facts are presented.

### Expected Result

A minimal graph with two nodes and one named link.

### Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `node[labels.vendor = "cisco"]`.
2. Change its `borderColor` from `"#cffafe"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: basic/topology.yaml
    stylesheet: basic/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Graph basic
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/basic/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/basic/stylesheet.yaml"
    ```

## Labels and data

`labels` are for classification and selector matching. `data` carries facts like metrics, delay, loopback, or counters that tools can inspect without making the visual stylesheet brittle.

### Expected Result

Classification lives in `labels`; operational values live in `data`.

### Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `link[labels.protocol = "isis"]`.
2. Change its `lineColor` from `"#22c55e"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: labels-and-data/topology.yaml
    stylesheet: labels-and-data/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Labels and data
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/labels-and-data/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/labels-and-data/stylesheet.yaml"
    ```

## Parent and child nodes

Parent and child nodes model ownership without losing graph semantics. The child remains selectable and linkable, while the parent can auto-expand when child nesting is enabled.

### Expected Result

Logical nodes can be nested inside physical parent nodes.

### Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `link[labels.link = "service"]`.
2. Change its `lineColor` from `"#c084fc"` to `"#e11d48"`, then reload your page. Compare the color of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: parent-child-nodes/topology.yaml
    stylesheet: parent-child-nodes/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Parent and child nodes
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/parent-child-nodes/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/parent-child-nodes/stylesheet.yaml"
    ```
