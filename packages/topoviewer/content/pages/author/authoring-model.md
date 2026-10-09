# Authoring Model

Author a TopoViewer bundle as two files. `topology.yaml` owns objects and their
relationships; `stylesheet.yaml` owns how those objects look and where automatic
layout places them. Keep the files together so the same bundle can be opened in
Studio or rendered by React, MkDocs, Zensical, and Grafana.

## Top-Level Shape

This complete pair renders two nodes and one link.

**topology.yaml**

<!-- docs-check: topology authoring-model -->
```yaml
version: "0.2"
graph:
  layers:
    - id: physical
      labels: { name: Physical }
  nodes:
    - id: edge-a
      labels: { name: Edge A, role: access }
      layers: [physical]
      position: [120, 100]
    - id: edge-b
      labels: { name: Edge B, role: access }
      layers: [physical]
      position: [380, 100]
  links:
    - id: edge-a-edge-b
      source: edge-a
      target: edge-b
      layers: [physical]
```

**stylesheet.yaml**

<!-- docs-check: stylesheet authoring-model -->
```yaml
version: "0.2"
layout:
  mode: manual
stylesheet:
  - selector: node[labels.role = "access"]
    style:
      shape: rectangle
      width: 82
      height: 60
  - selector: link
    style:
      curveStyle: straight
```

Every visible object needs a nonempty `layers` list containing a declared layer.
Selecting that layer shows the object; selecting an empty set hides it. A link
also needs both endpoint nodes visible. Omitting layers does not create an
implicit default layer.

| Put in topology.yaml | Put in stylesheet.yaml |
|---|---|
| `graph`, `diagram`, `toggles`, `attention` | `layout`, `limits`, `icons`, `labelFields`, `stylesheet` |
| IDs, labels, data, endpoints, membership, authored positions, pins, locks | Dimensions, shapes, colors, spacing, typography, selector rules |

Composition rejects misplaced fields. Keep `layout` out of topology YAML and
avoid object-level `style` or `icon`. For a legacy bundle, use the explicit
migration described in [Identity And Source Ownership](./identity-and-source-ownership.md).

## Layout Modes

Choose `manual`, `force`, `clos`, or `tree` in **stylesheet.yaml**. Manual layout
uses the authored positions above; the other modes calculate positions from the
graph and layout options. See [Layout](./layout.md) for complete examples,
pinning, bounds, and algorithm tradeoffs.

## Common Entity Fields

Use stable, unique `id` values for references. `labels.name` is an optional
visible alias; other labels classify objects for reusable style selectors. Put
metrics, addresses, timestamps, and other domain facts in `data`. See
[Topology Model](../reference/topology-model.md) to choose between nodes, links,
paths, regions, and explanatory diagram primitives.

## Authoring For Attention

Add `attention` to topology YAML when focus or aggregation should be part of the
default view. Attention indexes graph nodes, links, link directions, paths, and
regions. Diagram shapes, callouts, connectors, and text are annotations, not
attention-query targets. Follow [Attention](./attention.md) for a complete
baseline and queries that operate on it.

## Model Details

Use [Reference Model](../reference/reference-model.md) for field ownership and
relationships, [Object Attribute Reference](../reference/object-attributes.md)
for schema fields, and [Stylesheet Reference](../reference/stylesheet-reference.md)
for style keys. [Validate YAML](./validate-yaml.md) explains how to check your
own files before publishing them.
