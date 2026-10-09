# TopoViewer Studio

**Support status:** Beta Preview

This example uses one bundle in Studio, a documentation page, and Grafana without
changing object IDs. The graph below renders that bundle. For a walkthrough that
starts in hosted Studio without a repository checkout, use
[First Project](../../author/studio/first-project.md).

```topoviewer
topology: examples/integration/studio-portable-bundle/topology.yaml
stylesheet: examples/integration/studio-portable-bundle/stylesheet.yaml
height: 420px
controls: true
controlsOpen: false
title: Studio portable bundle
```

## Try The Authoring Loop

For this folder-based walkthrough, follow [Run Studio locally](../../author/studio/index.md#run-studio-locally),
then start Studio from the repository root:

```bash
npm run studio:dev
```

In a browser that supports directory selection, open **Project menu**, choose
**Open folder**, and select:

```text
packages/topoviewer/content/examples/integration/studio-portable-bundle
```

Studio opens one YAML-first workbench: project source on the left, the selected
YAML document in one shared editor, and the real TopoViewer preview beside it.
Use **Source**, **Split**, and **Preview** to change presentation without
changing the project. Split defaults to one-quarter source and three-quarters
preview.

Open **Object drawer** under Authoring to place an object. Selecting an object
opens preview-local **Properties** for its topology and appearance. Clicking
empty preview opens canvas, grid, interaction, and layer settings.
**Telemetry rules** opens the Mapper drawer, which stays open while you inspect
other topology objects.

Select `edge-a`, change its **Visible label** in Properties, then select
`topology.yaml` in project source to inspect the committed source and undo the
change. Open **Telemetry rules > Coverage**, paste this into **Sample JSON**,
then choose **Analyze samples**:

```json
[
  {
    "metric": "topoviewer_link_up",
    "value": 0,
    "labels": {
      "source_id": "studio-portable-consumer",
      "link_id": "edge-a-core-b"
    }
  }
]
```

Coverage should show one resolved sample and an object link to `edge-a-core-b`.
Join keys belong inside `labels`; putting them at the top level leaves the
target unresolved. Coverage checks the binding, not runtime state coloring.
Use the Grafana consumer with actual data frames to check the rule's `down`
style. The topology ID and link ID do not change with runtime state.

Use **Appearance** in the header to choose **System**, **Light**, or **Dark**.
System follows the operating system. Theme-owned canvas and grid colors follow
that choice; explicit project colors remain unchanged.

??? example "Use archive import when folder access is unavailable"

    If someone has exported this bundle as `.tvstudio`, use **Project menu >
    Open archive**. If you only have the YAML files, create a project and replace
    its topology and stylesheet in the source editor, applying each. Create a
    first mapper rule to make `mapper.yaml` available, then replace its source
    with this bundle's mapper and Apply. Follow the
    [draft and save rules](../../author/studio/yaml-recovery.md#draft-and-save-rules)
    before exporting a verified archive for future imports.

## Publish The Documentation

Open **Export project > Documentation**, choose MkDocs or Static HTML, and export
the documentation bundle. Its README explains where to put the YAML and embed
snippet. See [Export](../../author/studio/export.md#documentation-bundle) for the
bundle contents and deployment steps.

??? example "Inspect the canonical mapper"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/studio-portable-bundle/mapper.yaml"
    ```

## Package It For Grafana

In Studio, open **Export project > Grafana**. The readiness check confirms that
`mapper.yaml` is present and valid before **Export Grafana bundle** becomes
available. Studio then emits the mounted-bundle layout:

```text
studio-portable-consumer/
  studio-portable-consumer.topo.tv.yaml
  studio-portable-consumer.style.tv.yaml
  studio-portable-consumer.mapper.tv.yaml
  manifest.json
```

Grafana receives runtime data frames and applies mapper overlays, but it does
not own a different topology. Tests compile this canonical bundle through both
the core renderer and the Grafana runtime model to detect semantic drift.

## Reuse The Pattern

Keep one directory as the canonical bundle owner. Make authoring tools read and
write those files, make docs embed them, and make operational packaging rename
or wrap them without changing graph identity. Add a source-specific converter
before the bundle when inventory comes from Kubernetes, NetBox, Infrahub, or an
internal API; do not put source normalization inside each render surface.
