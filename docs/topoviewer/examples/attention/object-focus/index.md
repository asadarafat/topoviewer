---
hide:
  - toc
---

# Object focus

Object focus is the default interactive attention pattern. Click the Checkout flow path, a node, or a link in the live viewport; the selected object is highlighted while unrelated context stays visible but muted. Click empty viewport space to clear the focus and return to the normal topology view.

## Expected Result

Click one topology object to highlight it while dimming the surrounding context.

## Try It

1. Copy the two YAML tabs into your own project.
2. In topology.yaml, change `attention.clickMode` from `dim-context` to `hide-context`.
3. Reload, then click node `client`. Unrelated objects disappear instead of dimming. Click empty viewport space to restore the starting topology.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
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
