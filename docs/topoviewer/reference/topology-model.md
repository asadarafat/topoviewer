# Topology Model

Use this page to choose the right object for what you want to describe. The
[Authoring Model](../author/authoring-model.md) provides a runnable two-file
bundle; [Reference Model](./reference-model.md) defines field ownership and
relationships; [Object Attribute Reference](./object-attributes.md) lists the
schema fields.

Keep network or application facts in `graph`. Use `diagram` for explanations
that help a reader understand those facts.

| What you need to represent | Object |
|---|---|
| A router, service, application, interface, or resource | Node |
| A direct relationship between two nodes | Link |
| An ordered route across several nodes | Path |
| Membership in a site, tenant, rack, or failure domain | Region |
| A note, drawing, or explanatory arrow | Diagram primitive |

## Layers

Layers are visibility groups, such as `physical`, `transport`, or `service`.
Declare the available IDs in `graph.layers`, then assign each renderable object
one or more of those IDs in its `layers` list. An object renders when at least
one of its layers is selected. An object without layer membership stays hidden.

Layer membership does not imply containment or connectivity. A node may belong
to several views while keeping the same identity. Links also need their source
and target nodes visible; selecting a link's layer alone cannot reveal hidden
endpoints.

## Nodes

A node represents an entity whose identity matters to the topology. Keep its
ID stable even if its visible name changes. Use `labels.name` for a display
alias, classification labels for reusable style selectors, and `data` for
operational facts.

An authored `position` belongs to the node's topology facts. Manual layout uses
that position; force layout treats it as a seed. CLOS and tree calculate their
own placement. CLOS can preserve explicitly pinned nodes. See
[Layout](../author/layout.md) for the stylesheet options.

`node.parent` represents containment inside another node. For example, a
service endpoint may belong to a router. The `showChildNodesInsideParents`
toggle controls whether child nodes are shown inside the parent; the renderer
expands the parent around its visible children. Use a region when you need a
membership boundary around independent nodes instead.

## Links

A link connects exactly two nodes through `source` and `target`. It may stand
for a physical connection, protocol adjacency, dependency, or service
relationship. Its direction also provides input to tree/CLOS layout and
attention dependency traversal.

Use two link objects when you have two distinct relationships. Use one link
with `directions.sourceToTarget` and `directions.targetToSource` when a single
adjacency has measurements in both directions. Direction labels can show
bandwidth or loss; `linkDirection` stylesheet rules control their strokes.
Endpoint labels such as `sourceLabel` and `targetLabel` can show port names.

`link.parent` means a link is visually carried by another link. The child keeps
its real endpoints while its rendered lane follows the parent route. This is
useful for an overlay carried by a transport pipe; it is different from node
containment. See the [Link field contract](./reference-model.md#link).

## Paths

Use a path when the route itself has identity: an LSP, traffic-engineering
policy, service route, or ordered dependency chain. A `sequence` lists the
visited node IDs in order. The renderer draws a segment between each
consecutive pair; a sequence does not require separate graph links for those
segments.

A stitched child path instead declares `source`, `target`, and a `parent` path
that has a sequence. It draws an endpoint stub, follows the parent's segments,
and draws a final stub to the child target. These relationships remain topology
facts; lane widths and pipe appearance belong to the stylesheet. See the
[Path field contract](./reference-model.md#path).

## Regions

Regions express scope or membership: a site, AS, availability zone, rack, or
failure domain. `members` can contain node IDs and region IDs; `region.parent`
also establishes nested containment. Containment must be acyclic.

By default, the hull fits its visible members and child regions. Moving a
member therefore changes the hull. For a fixed boundary, keep the region's
origin in topology `position` and author both `width` and `height` in a matching
region stylesheet rule. Those explicit dimensions remain authoritative when
members move. Padding, minimum dimensions, and nested-region spacing also
belong to the stylesheet.

Region membership can drive attention focus and aggregation. A decorative box
cannot replace that relationship. See [Attention](../author/attention.md) for
the supported queries and direct-member aggregation behavior.

## Toggles

Topology `toggles` declares reader-visible switches with stable IDs, optional
`labels.name`, and boolean defaults. Built-in switches include `showRegions`,
`showChildNodesInsideParents`, and `showEdgeLabels`. The historical
`showServicesInsideNodes` alias maps to `showChildNodesInsideParents`.

Extra toggles can be preserved for host-owned behavior. They do not create a
new renderer feature by themselves. See the
[Toggle field contract](./reference-model.md#toggles).

## Validation Contract

Schema validation checks the authored shape. Semantic lint checks relationships
such as endpoint IDs, layers, duplicate identities, and region cycles. A file
can be valid YAML and still describe a topology that cannot render correctly.
Follow [Validate YAML](../author/validate-yaml.md) to check your bundle.

Persistent visual properties belong in the stylesheet. Canonical topology
objects reject inline `style`, object-level `icon`, generic `name`/`label`, and
primitive dimensions. Use explicit migration for old bundles; see
[Identity And Source Ownership](../author/identity-and-source-ownership.md).

## Diagram Primitive Layer

Use diagram primitives for explanatory content. They can be positioned, placed
on layers, and locked for authoring, but are not indexed by graph attention
queries. If an object needs graph relationships or operational focus, model it
as a node instead.

### Shapes

Shapes provide decorative geometry such as a background panel, disk, or simple
solid. Their topology owns identity, position, pins, and lock state. A `shape`
stylesheet rule owns the geometry, dimensions, rotation, fill, and stroke.
Shapes display their name over the geometry. Use a text object or callout for
separately positioned or longer text, and a node icon for an image.

### Callouts

A callout can be a Markdown explanation box, a leader line, or a line-only
relationship between visual objects. Topology owns its text, position, and
attachments. Stylesheet rules own the box dimensions, alignment, and leader
appearance. A plain text object is a simpler choice when no leader is needed.

### Pins

Pins are named local attachment points on nodes, shapes, or callouts. A
connector or callout can reference `sourcePin` or `targetPin` to attach to a
specific point. Pins move with their owner. For graph-link ports, use node
`handles` and link `sourceHandle`/`targetHandle`; these are a separate contract.

See [Pins And Connectors](./reference-model.md#pins-and-connectors) for the
field contract and [Examples](../examples/index.md) for complete bundles.
