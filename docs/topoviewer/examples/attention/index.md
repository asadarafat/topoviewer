# Attention

Explore attention behavior with a live diagram and its two source files. Each example includes an edit to try in your own copy.

## Object focus

Object focus is the default interactive attention pattern. Click the Checkout flow path, a node, or a link in the live viewport; the selected object is highlighted while unrelated context stays visible but muted. Click empty viewport space to clear the focus and return to the normal topology view.

### Expected Result

Click one topology object to highlight it while dimming the surrounding context.

### Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, change `attention.clickMode` from `dim-context` to `hide-context`.
3. Reload, then click node `client`. Unrelated objects disappear instead of dimming. Click empty viewport space to restore the starting topology.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: object-focus/topology.yaml
    stylesheet: object-focus/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Object focus
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/object-focus/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/object-focus/stylesheet.yaml"
    ```

## Change focus

Change focus is a declarative attention query for operational change. This small topology starts with attention already applied: `CORE-1` and the degraded `core-1-core-2` link changed after the selected timestamp, so they are highlighted while the unchanged objects remain visible but muted.

### Expected Result

Focus objects with recent change metadata while preserving topology context.

### Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, change `attention.query.changes.since` to `"2026-06-16T00:00:00Z"`, after this example's recorded changes.
3. Reload. CORE-1 and the degraded core link are no longer matched by the change query; their stored timestamps and status stay unchanged.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: change-focus/topology.yaml
    stylesheet: change-focus/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Change focus
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/change-focus/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/change-focus/stylesheet.yaml"
    ```

## Region collapse

Region collapse demonstrates progressive disclosure. The access metro region starts declaratively collapsed into one aggregate summary node; click the `Access metro` summary in the live viewport to expand the region and reveal its member nodes and internal links. Click the expanded region hull to collapse it back into the summary node.

### Expected Result

Collapse a region into an aggregate summary, then click it to expand member nodes.

### Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, add `expandedGroupIds: [access-metro]` under `attention.aggregate`, alongside `groups`.
3. Reload. `Access metro` starts expanded into its member nodes; other configured groups remain collapsed. This sets the initial view without a click.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: region-collapse/topology.yaml
    stylesheet: region-collapse/stylesheet.yaml
    height: 500px
    controls: true
    controlsOpen: false
    title: Region collapse
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/region-collapse/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/region-collapse/stylesheet.yaml"
    ```

## Dense summary drill-down

Dense summary drill-down keeps a busy topology useful without making zoom decide what the operator meant. The overview shows one summary per metro, including hidden node count, link count, and worst severity. The PE full mesh between metros is represented as counted aggregate links instead of a pile of individual transport links. Click a metro summary to inspect that region while the rest of the topology stays compressed; drag the expanded region hull to reposition its members, or click the hull to collapse it again.

### Expected Result

Keep dense metro topologies readable with summary nodes, counted full-mesh links, and explicit click-to-expand drill-down.

### Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, add `expandedGroupIds: [north-metro]` under `attention.aggregate`, alongside `groups`.
3. Reload. `NORTH metro` starts expanded into its member nodes; other configured groups remain collapsed. This sets the initial view without a click.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: dense-summary-drilldown/topology.yaml
    stylesheet: dense-summary-drilldown/stylesheet.yaml
    height: 560px
    controls: true
    controlsOpen: false
    title: Dense summary drill-down
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/dense-summary-drilldown/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/dense-summary-drilldown/stylesheet.yaml"
    ```

## Advanced zoom policy

Advanced zoom policy is an optional host-controlled behavior for map-style overview/detail transitions. The recommended operator workflow is still explicit: click an aggregate summary to expand it, then click the expanded region hull or parent object to collapse it. Use zoom thresholds only when the embedding experience intentionally wants detail to follow viewport scale.

### Expected Result

Optionally bind aggregate expansion to zoom thresholds when a host needs map-style overview/detail transitions.

### Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, set `attention.aggregate.viewport.collapseBelowZoom: 0.7` and `expandAboveZoom: 1.0`.
3. Reload, then use the zoom controls to move below 0.7: both metros collapse. Zoom above 1.0: their member nodes return. Cross each threshold without clicking summaries so the zoom policy drives this comparison.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: advanced-zoom-policy/topology.yaml
    stylesheet: advanced-zoom-policy/stylesheet.yaml
    height: 500px
    controls: true
    controlsOpen: false
    title: Advanced zoom policy
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/advanced-zoom-policy/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/advanced-zoom-policy/stylesheet.yaml"
    ```

## Link grouping

Link grouping demonstrates threshold-based edge aggregation. Three transport links between the same two routers start as one summary link labeled `3 links`; click the summary link to reveal each member as a Cytoscape-style bundled Bezier edge. Use the explicit `Collapse 3 links` control to return to the summary without turning member-edge selection into a hidden toggle.

### Expected Result

Group parallel links by endpoint and layer when the count crosses a threshold.

### Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, change `attention.links.grouping.threshold` from `2` to `4`.
3. Reload. These three parallel links no longer meet the threshold, so they render individually instead of as one counted summary.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: link-grouping/topology.yaml
    stylesheet: link-grouping/stylesheet.yaml
    height: 440px
    controls: true
    controlsOpen: false
    title: Link grouping
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/link-grouping/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/link-grouping/stylesheet.yaml"
    ```

## Query primitives

Query primitives demonstrates the general focus query surface. The topology declares stable IDs, labels, nested data, and link media metadata; the MkDocs attention block focuses `CORE-1`, all access nodes, objects with critical severity or fanout 12, and the fiber link selected through a stylesheet-compatible selector.

### Expected Result

Focus by explicit IDs, labels, data fields, and stylesheet-compatible selectors.

### Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, replace the entire `attention.query` value with `{ ids: [NOC], mode: dim-context }`. Remove its other criteria; focus criteria are combined.
3. Reload. NOC is the only focused object, while the previous role, severity, and fiber-link matches return to context.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: query-primitives/topology.yaml
    stylesheet: query-primitives/stylesheet.yaml
    height: 460px
    controls: true
    controlsOpen: false
    title: Query primitives
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/query-primitives/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/query-primitives/stylesheet.yaml"
    ```

## Region focus

Region focus uses `graph.regions[].members` as the declarative grouping source. The attention query focuses the access metro region, so its member nodes become prominent while the PE outside the region and the surrounding links stay as dimmed context.

### Expected Result

Focus a region and its member nodes while preserving surrounding context.

### Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, remove `ACC-2` only from region `access-metro`'s `members` list. Keep the node and its links.
3. Reload. That node becomes dimmed context instead of a focused region member, and the auto-fit hull adjusts to its remaining members.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: region-focus/topology.yaml
    stylesheet: region-focus/stylesheet.yaml
    height: 460px
    controls: true
    controlsOpen: false
    title: Region focus
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/region-focus/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/region-focus/stylesheet.yaml"
    ```

## Dependency focus

Dependency focus uses directed links and path sequences as an adjacency graph. This example starts from `CORE-1`, walks two downstream hops, marks reached nodes as related, and leaves the links as dimmed context so the blast radius is visible without hiding the topology.

### Expected Result

Traverse directed topology relationships to show downstream blast radius.

### Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, change `attention.query.dependency.depth` from `2` to `1`.
3. Reload. The seed and its immediate downstream neighbors remain emphasized; the access nodes two hops away return to dimmed context.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: dependency-focus/topology.yaml
    stylesheet: dependency-focus/stylesheet.yaml
    height: 460px
    controls: true
    controlsOpen: false
    title: Dependency focus
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/dependency-focus/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/dependency-focus/stylesheet.yaml"
    ```

## Hide context

Hide context mode is useful when context should be removed from the rendered view instead of muted. The topology marks two PE nodes with `labels.role: pe`; the attention query focuses that label and hides every non-matching node and link.

### Expected Result

Use hide-context mode when the focused set should be isolated instead of dimmed.

### Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, change `attention.query.mode` from `hide-context` to `dim-context`.
3. Reload. The same PE nodes remain focused, while the previously hidden core nodes and links return as muted context.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: hide-context/topology.yaml
    stylesheet: hide-context/stylesheet.yaml
    height: 440px
    controls: true
    controlsOpen: false
    title: Hide context
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/hide-context/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/hide-context/stylesheet.yaml"
    ```

## Parent and label collapse

Parent and label collapse shows the other aggregate group types. Service child nodes under `PE-1` collapse by parent-child relationship, and access nodes collapse by `labels.role: access`; clicking the `PE-1 services` summary expands only that parent-derived group.

### Expected Result

Collapse parent-child objects and label-defined groups into aggregate summaries.

### Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, add `expandedGroupIds: [pe-services]` under `attention.aggregate`, alongside `groups`.
3. Reload. `PE-1 services` starts expanded into its member nodes; other configured groups remain collapsed. This sets the initial view without a click.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: parent-label-collapse/topology.yaml
    stylesheet: parent-label-collapse/stylesheet.yaml
    height: 500px
    controls: true
    controlsOpen: false
    title: Parent and label collapse
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/parent-label-collapse/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/parent-label-collapse/stylesheet.yaml"
    ```

## Aggregate badge and status

Aggregate badge and status defaults make a collapsed group useful before drill-down. The summary node shows the hidden member count as a badge and the worst member severity as a status marker.

### Expected Result

Collapsed aggregate summaries can expose hidden member count and worst severity as compact node cues.

### Try It

1. Copy the two YAML tabs into your own project.
2. Keep the Access region summary collapsed. In topology.yaml, change ACC-2's data.severity from critical to normal.
3. Reload. The summary's worst severity changes from critical to major because AGG-1 is still major. Its member-count badge remains 3.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: aggregate-badge-status/topology.yaml
    stylesheet: aggregate-badge-status/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Aggregate badge and status
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/aggregate-badge-status/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/aggregate-badge-status/stylesheet.yaml"
    ```
