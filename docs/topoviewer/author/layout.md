# Layout

TopoViewer layout is deterministic model preparation. A layout provider
calculates node positions; the renderer then draws the same compiled graph in
React, documentation embeds, Studio, and Grafana.

The portable YAML contract supports four modes:

| Mode | Best use |
|---|---|
| `manual` | Curated diagrams where authored positions are part of the artifact. |
| `force` | General connected graphs that need deterministic automatic spacing. |
| `clos` | Layered fabrics and staged network structures. |
| `tree` | Directed hierarchies, dependency trees, and disconnected forests. |

## Manual Layout

Layout belongs in **stylesheet.yaml**. Start with this complete manual bundle;
the automatic-layout examples below replace its stylesheet `layout` block.

**topology.yaml**

<!-- docs-check: topology layout-manual -->
```yaml
version: "0.2"
graph:
  layers:
    - id: physical
  nodes:
    - id: spine-1
      layers: [physical]
      position: [260, 80]
    - id: leaf-1
      layers: [physical]
      position: [260, 260]
  links:
    - id: spine-leaf
      source: spine-1
      target: leaf-1
      layers: [physical]
```

**stylesheet.yaml**

<!-- docs-check: stylesheet layout-manual -->
```yaml
version: "0.2"
layout:
  mode: manual
  width: 860
  height: 420
```

The result contains two nodes and one link. Both the layer declaration and each
object's layer membership are needed for visibility.

Manual layout is the safest choice for product screenshots, small examples, and
network diagrams whose placement carries domain meaning.

## Force Layout

Force layout uses a seeded simulation, so the same document and options produce
stable output. Replace the `layout` block in **stylesheet.yaml** with:

```yaml
layout:
  mode: force
  width: 1280
  height: 720
  iterations: 180
  linkDistance: 160
  chargeStrength: -520
  collideRadius: 58
  centerStrength: 0.08
```

Force layout is useful for exploratory dependency graphs. It is less suitable
than manual or tree layout when readers need a strict hierarchy.

`iterations` must be a finite integer from 1 to 1000 (default: 180). The same
bound applies to runtime layout overrides and direct layout-provider calls so a
document cannot request an unbounded synchronous simulation.
Force parameters must be finite with absolute values at most 1,000,000.
Initial and simulated coordinates must stay finite and within ±1,000,000,000,000;
divergent simulations fail with a diagnostic instead of entering the next tick.

## Generic CLOS Layout

Use CLOS layout when the graph is layered and dense. Replace the stylesheet's
`layout` block with this fragment; CLOS options belong under `layout.clos`:

```yaml
layout:
  mode: clos
  width: 1200
  height: 720
  clos:
    direction: topToBottom
    maxStages: 10
    stageGap: 180
    nodeGap: 96
    groupGap: 48
```

Inference prefers graph structure over names. Explicit `stageKey`, `stageOrder`,
`groupKey`, and `inferLabelRole` values are overrides for topology facts that
cannot be inferred reliably from connectivity.

To keep `spine-1` at its authored position, use this alternative stylesheet
`layout` block. The other node remains automatically placed:

```yaml
layout:
  mode: clos
  clos:
    preservePinned: true
    pinnedNodeIds: [spine-1]
```

Use pinned nodes for clouds, external systems, or manually positioned service
endpoints.

## Tree Layout

Tree layout follows directed links from roots to children. Ordering is based on
stable IDs and links, not input-array order, so equivalent documents produce the
same result. Replace the stylesheet's `layout` block with:

```yaml
layout:
  mode: tree
  width: 1040
  height: 620
  tree:
    direction: topToBottom
    levelGap: 160
    nodeGap: 140
    componentGap: 220
```

Accepted directions are `topToBottom`, `bottomToTop`, `leftToRight`, and
`rightToLeft`. Gaps are bounded to protect the viewport:

| Option | Accepted range | Purpose |
|---|---:|---|
| `levelGap` | 40-1000 | Distance between hierarchy levels. |
| `nodeGap` | 40-800 | Distance between siblings. |
| `componentGap` | 40-1600 | Distance between disconnected components. |

Disconnected graphs render as a deterministic forest. If a graph contains a
cycle or has no natural root, the provider uses stable fallback roots so layout
still completes. This fallback does not declare the graph to be a valid tree;
semantic validation remains the responsibility of the topology model and host.

See the [Tree Layout example](../examples/layout/tree/index.md) for a complete
portable bundle.

## TypeScript Providers

The root package exposes `BUILT_IN_LAYOUT_PROVIDERS`, `computeLayoutPositions`,
and the advanced `LayoutProvider` contract. A trusted host can pass a read-only
registry to `computeLayoutPositions` when it needs private placement behavior.
This complete TypeScript example overrides `manual` for one direct API call:

```ts
import {
  BUILT_IN_LAYOUT_PROVIDERS,
  computeLayoutPositions,
  type LayoutProvider,
  type LayoutProviderRegistry
} from 'topoviewer';

const rowProvider: LayoutProvider = {
  mode: 'manual',
  compute: ({ nodes }) => new Map(nodes.map((node, index) => [
    node.id, { x: 100 + index * 180, y: 100 }
  ]))
};
const providers: LayoutProviderRegistry = new Map([
  ...BUILT_IN_LAYOUT_PROVIDERS,
  ['manual', rowProvider]
]);

const positions = computeLayoutPositions(
  [{ id: 'edge-a' }, { id: 'edge-b' }],
  [],
  { mode: 'manual' },
  providers
);
```

The JSON Schema still accepts only `manual`, `force`, `clos`, and `tree`.
Provider registration is executable host code, not a way to create a hidden,
non-portable YAML mode.

## Diagnostics

Layout diagnostics should remain visible when:

- CLOS stage inference has low confidence or conflicting hints;
- a CLOS graph needs more stages than `maxStages`;
- pinned positions prevent clean CLOS spacing;
- an unknown provider is requested through the TypeScript API;
- authored dimensions or gaps fail schema bounds.

TopoViewer provides logical Cartesian layout. Geographic coordinates, map
projection, map tiles, and hybrid geo/logical composition are outside the
current core contract.
