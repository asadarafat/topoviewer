---
hide:
  - toc
---

# Change focus

Change focus is a declarative attention query for operational change. This small topology starts with attention already applied: `CORE-1` and the degraded `core-1-core-2` link changed after the selected timestamp, so they are highlighted while the unchanged objects remain visible but muted.

## Expected Result

Focus objects with recent change metadata while preserving topology context.

## Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, change `attention.query.changes.since` to `"2026-06-16T00:00:00Z"`, after this example's recorded changes.
3. Reload. CORE-1 and the degraded core link are no longer matched by the change query; their stored timestamps and status stay unchanged.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
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
