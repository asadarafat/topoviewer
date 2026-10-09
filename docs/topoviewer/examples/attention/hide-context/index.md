---
hide:
  - toc
---

# Hide context

Hide context mode is useful when context should be removed from the rendered view instead of muted. The topology marks two PE nodes with `labels.role: pe`; the attention query focuses that label and hides every non-matching node and link.

## Expected Result

Use hide-context mode when the focused set should be isolated instead of dimmed.

## Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, change `attention.query.mode` from `hide-context` to `dim-context`.
3. Reload. The same PE nodes remain focused, while the previously hidden core nodes and links return as muted context.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
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
