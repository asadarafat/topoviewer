---
hide:
  - toc
---

# Parent and label collapse

Parent and label collapse shows the other aggregate group types. Service child nodes under `PE-1` collapse by parent-child relationship, and access nodes collapse by `labels.role: access`; clicking the `PE-1 services` summary expands only that parent-derived group.

## Expected Result

Collapse parent-child objects and label-defined groups into aggregate summaries.

## Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, add `expandedGroupIds: [pe-services]` under `attention.aggregate`, alongside `groups`.
3. Reload. `PE-1 services` starts expanded into its member nodes; other configured groups remain collapsed. This sets the initial view without a click.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
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
