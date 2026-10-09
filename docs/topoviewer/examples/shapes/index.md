# Shapes

Explore shapes behavior with a live diagram and its two source files. Each example includes an edit to try in your own copy.

## Two-dimensional shapes

2D shapes are annotation primitives. They remain separate from graph nodes, while topology labels provide stable selector facts and the stylesheet owns visual geometry and dimensions.

### Expected Result

2D geometry primitives are diagram objects, not graph facts.

### Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `shape`.
2. Change its `borderWidth` from `2` to `4`, then reload your page. Compare the stroke thickness of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: two-dimensional/topology.yaml
    stylesheet: two-dimensional/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Two-dimensional shapes
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/two-dimensional/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/two-dimensional/stylesheet.yaml"
    ```

## Three-dimensional shapes

3D shapes cover the common diagram metaphors: cube, cuboid, sphere, cone, cylinder, pyramid, and prism. Topology labels classify each primitive and stylesheet selectors own its geometry and dimensions. Use callouts when text needs to sit near them.

### Expected Result

3D geometry primitives are available for common diagram metaphors.

### Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `shape`.
2. Change its `borderWidth` from `2` to `4`, then reload your page. Compare the stroke thickness of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: three-dimensional/topology.yaml
    stylesheet: three-dimensional/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Three-dimensional shapes
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/three-dimensional/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/three-dimensional/stylesheet.yaml"
    ```

## Shape rotation

Shape geometry, dimensions, and rotation are stylesheet policy. The topology keeps stable shape identity, position, layers, and selector labels; text remains a separate annotation concern.

### Expected Result

Shape geometry can be rotated directly or through a stylesheet rule.

### Try It

1. Copy the two YAML tabs into your own project. In stylesheet.yaml, find selector `shape`.
2. Change its `borderWidth` from `2` to `4`, then reload your page. Compare the stroke thickness of objects matching that selector; their IDs and relationships should stay unchanged.
3. If another rule masks the edit, check its specificity in the [stylesheet guide](../../reference/topoviewer-stylesheet.md). Restore the original value to compare the two views.

=== "Live Viewport"

    ```topoviewer
    topology: rotation/topology.yaml
    stylesheet: rotation/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Shape rotation
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/rotation/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/rotation/stylesheet.yaml"
    ```
