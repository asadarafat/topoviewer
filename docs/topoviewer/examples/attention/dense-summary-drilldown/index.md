---
hide:
  - toc
---

# Dense summary drill-down

Dense summary drill-down keeps a busy topology useful without making zoom decide what the operator meant. The overview shows one summary per metro, including hidden node count, link count, and worst severity. The PE full mesh between metros is represented as counted aggregate links instead of a pile of individual transport links. Click a metro summary to inspect that region while the rest of the topology stays compressed; drag the expanded region hull to reposition its members, or click the hull to collapse it again.

## Expected Result

Keep dense metro topologies readable with summary nodes, counted full-mesh links, and explicit click-to-expand drill-down.

## Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, add `expandedGroupIds: [north-metro]` under `attention.aggregate`, alongside `groups`.
3. Reload. `NORTH metro` starts expanded into its member nodes; other configured groups remain collapsed. This sets the initial view without a click.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
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
