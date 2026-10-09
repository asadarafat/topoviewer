---
hide:
  - toc
---

# Region collapse

Region collapse demonstrates progressive disclosure. The access metro region starts declaratively collapsed into one aggregate summary node; click the `Access metro` summary in the live viewport to expand the region and reveal its member nodes and internal links. Click the expanded region hull to collapse it back into the summary node.

## Expected Result

Collapse a region into an aggregate summary, then click it to expand member nodes.

## Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, add `expandedGroupIds: [access-metro]` under `attention.aggregate`, alongside `groups`.
3. Reload. `Access metro` starts expanded into its member nodes; other configured groups remain collapsed. This sets the initial view without a click.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
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
