---
hide:
  - toc
---

# Unsafe image validation

This fixture is intentionally invalid. It documents the security lint rule that rejects unsafe image references such as `javascript:` URLs.

## Expected Result

This example intentionally produces a validation diagnostic. Inspect the message and source together before trying the repair below.

## Try It

1. Copy the two YAML tabs into local files and [run the file validator](../../../author/validate-yaml.md) with those paths. It should exit with an error.
2. Find the diagnostic `unsafe-image-reference` and locate the offending source field.
3. Correct that field in a local copy, then [validate the same files again](../../../author/validate-yaml.md). The intended failure should disappear before you publish the diagram.

=== "Live Viewport"

    !!! warning "Intentional validation failure"
        This source is deliberately invalid. Copy the two YAML tabs and run the linked validator to see the diagnostic before repairing it.

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/validation/unsafe-image/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/validation/unsafe-image/stylesheet.yaml"
    ```
