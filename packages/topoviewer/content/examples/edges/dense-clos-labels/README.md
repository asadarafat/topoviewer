Dense CLOS labels show the label-placement problem that appears in operational
fabric dashboards: region names, node names, endpoint ports, and bidirectional
bandwidth values all need space around the same set of links. The two rows have
enough separation to keep throughput labels out of the central crossing area.

The topology keeps one parent link per fabric adjacency. Physical port names
live on `sourceLabel` and `targetLabel`; bandwidth values live on
`directions.sourceToTarget.label` and `directions.targetToSource.label`. The
stylesheet assigns independent label z-index values and uses the shared
collision policy so labels can move without changing node or link geometry.

Raw node metadata and redundant relationship names stay in inspection so they
do not compete with operational names and values on the canvas. Port names
already identify each adjacency. Blue indicates leaf-to-spine traffic; teal
dashed strokes indicate spine-to-leaf traffic. Values are authored examples,
not live telemetry.
