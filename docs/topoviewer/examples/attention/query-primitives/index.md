---
hide:
  - toc
---

# Query primitives

Query primitives demonstrates the general focus query surface. The topology declares stable IDs, labels, nested data, and link media metadata; the MkDocs attention block focuses `CORE-1`, all access nodes, objects with critical severity or fanout 12, and the fiber link selected through a stylesheet-compatible selector.

## Expected Result

Focus by explicit IDs, labels, data fields, and stylesheet-compatible selectors.

## Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, replace the entire `attention.query` value with `{ ids: [NOC], mode: dim-context }`. Remove its other criteria; focus criteria are combined.
3. Reload. NOC is the only focused object, while the previous role, severity, and fiber-link matches return to context.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
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
