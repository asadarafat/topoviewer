# Should You Adopt TopoViewer?

TopoViewer fits teams that need the same identified topology objects in more
than one place: documentation, a React application, a topology editor, or an
operational dashboard. You maintain topology facts in YAML and visual rules
in a separate stylesheet, then reuse those files across hosts.

The tradeoff is ownership. Someone must maintain the data, stable IDs, styles,
and integrations. A diagram that is drawn once and rarely updated may not
justify that work.

## Choose By The Job

| Your requirement | Practical choice |
|---|---|
| A one-off sketch, presentation, or freeform workshop | Keep your drawing tool. A shared topology model adds little value here. |
| A small diagram that only belongs in one documentation page | Start with your existing docs diagram tool. Evaluate TopoViewer if you need reusable object IDs, styles, or interaction. |
| The same infrastructure map in documentation and a React product | Try TopoViewer with one shared topology and stylesheet. Both integrations are supported. |
| A custom graph application with its own model and interactions | Compare a rendering library with TopoViewer's authored model; adopting the model is part of the cost. |
| Inventory-derived views from NetBox, Infrahub, or a private API | Budget for a converter you own. Packaged NetBox and Infrahub integrations are roadmap items. |
| Telemetry mapped onto stable nodes, links, or paths | Evaluate the Grafana lab. The panel is Experimental, with separate operational and distribution requirements. |
| An established hosted collaboration service or a supported native editor | Assess other products. Browser Studio is a Beta Preview; Desktop Studio is Experimental. |

Check the [integration status table](integration-roadmap.md#status-summary)
before choosing a host. “Supported Adapter” for Zensical means a static embed
integration, not an installable Zensical plugin.

## What You Reuse

A small project starts with two files. Telemetry adds a mapper; icons and images
may add assets:

```text
topology.yaml      object IDs, connectivity, layers, and metadata
stylesheet.yaml    selectors, visual rules, and layout settings
mapper.yaml        optional telemetry joins and runtime styles
assets/            optional images and icons
```

A node ID remains the join key when a host changes its controls or surrounding
UI. Styles can select labels such as vendor or role across several diagrams.
The Grafana mapper applies runtime values without writing those values back to
the source topology. Your inventory system still owns the infrastructure facts;
TopoViewer provides an authored representation and renderer.

This example illustrates the shared-bundle workflow:

```topoviewer
topology: examples/integration/adoption-portability/topology.yaml
stylesheet: examples/integration/adoption-portability/stylesheet.yaml
height: 320px
controls: false
controlsOpen: false
title: Portable topology bundle
```

## Costs And Limits To Budget For

| Responsibility | What the adopting team must decide |
|---|---|
| Data ownership | Which system owns topology facts, who updates them, and how stale views are detected. |
| Stable identity | How IDs survive renames and how links, paths, and telemetry refer to those IDs. |
| Conversion | How inventory records become TopoViewer objects, and how the converter is tested as either schema changes. |
| Visual policy | Which stylesheet rules communicate role and state, and who reviews changes to that policy. |
| Host integration | Loading, permissions, project persistence, publication, and application-specific controls. |
| Upgrades | Dependency pinning, fixture validation, and review of changes to the pre-1.0 public API. |
| Operational acceptance | Your required performance, accessibility, security, and telemetry coverage on representative data. |

There is no automatic converter for every inventory system. A graph that can be
rendered is not evidence that the source data is complete or current. A sample
diagram also does not establish a performance ceiling for your largest map.
Read the [compatibility contract](../reference/compatibility.md),
[performance and accessibility limits](performance-reliability-accessibility.md),
and [threat model](threat-model.md) against your requirements.

If inventory conversion is necessary, keep it at an explicit boundary:

```text
inventory/API -> your converter -> validated topology + stylesheet -> host
telemetry ----------------------> mapper runtime ------------------> overlay
```

Treat missing IDs, dangling references, and ambiguous telemetry joins as things
to inspect during the trial. Decide whether failures should stop publication
or produce a visible diagnostic in your workflow.

## Try One Real Diagram Before Committing

1. Choose a topology that already causes duplicate work. Use representative
   labels, link identities, and a realistic size.
2. Follow [First Topology](../start/first-topology.md), then replace the sample
   objects with yours. Keep the stylesheet separate.
3. Render the same files in your required hosts using the
   [MkDocs](../examples/use-cases/mkdocs.md),
   [React](../examples/use-cases/react.md), or
   [Zensical](../examples/use-cases/static-html-zensical-adapter.md) guide.
4. Change a real fact and a style rule. Check which files and hosts need manual
   updates, and whether review is easier than your current process.
5. Validate the YAML, measure load and interaction on your target devices, and
   check keyboard access and readable output at your normal zoom levels.
6. If telemetry is required, use the
   [Grafana lab](../examples/use-cases/grafana-topoviewer-panel.md) to check joins
   and unresolved samples before interpreting the colors as operational truth.

The repository's runnable examples and integration guides demonstrate these
workflows. They are starting evidence for a trial, not a guarantee for a custom
inventory pipeline or production dashboard. Continue when the shared files
remove meaningful duplicate maintenance and the required host meets your
acceptance criteria. Otherwise, keep the simpler workflow you already have.
