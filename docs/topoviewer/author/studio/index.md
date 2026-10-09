# Studio

**Support status:** Beta Preview

TopoViewer Studio is the YAML-first authoring application for portable
TopoViewer projects. It edits the same topology, stylesheet, mapper, and asset
files consumed by documentation, React applications, exports, and Grafana.
Start with [First Project](first-project.md) to create, save, export, and reopen
a two-router network. For an existing bundle, use [Browser Projects](browser-projects.md)
or [Desktop Studio](desktop-studio.md).

```text
project source + shared YAML editor + real TopoViewer preview
                              |
                              v
topology.yaml + stylesheet.yaml + optional mapper.yaml + assets
```

Project source is the file navigator on the left of the desktop layout. Its
editor opens `topology.yaml`, `stylesheet.yaml`, and optional `mapper.yaml`.
**Source**, **Split**, and **Preview** change only presentation; Split defaults
to one-quarter source and three-quarters preview.

Open **Object drawer** to add objects. Selecting an object opens preview-local
Properties for topology and appearance; selecting empty preview opens canvas,
grid, interaction, and layer settings. Telemetry rules can remain open while
selection changes. Accepted visual edits appear in those same YAML documents.
Pending source can pause visual editing; see the [draft and save rules](yaml-recovery.md#draft-and-save-rules).

## Open Studio

Open [TopoViewer Studio](https://asadarafat.github.io/topoviewer/studio/) in a
current desktop Chrome or Edge browser. Studio stores browser projects locally;
export a portable project archive or source bundle before moving work between
browsers or machines.

Use the **Preview feedback** action in Studio to report the completed workflow,
hesitation points, recovery behavior, and unsupported expectations through the
structured [Studio preview feedback form](https://github.com/asadarafat/topoviewer/issues/new?template=studio_preview_feedback.yml).

## Run Studio Locally

From the repository root, with Node.js 24 installed:

```bash
npm ci
npm run studio:dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5175/`.

Browser Studio is available as a Beta Preview. Desktop Studio is an
Experimental Wails distribution of the same application for native directory
projects. The exported TopoViewer YAML bundle is the compatibility boundary;
Studio's internal React and native bridge APIs are not public, and
collaborative editing is not provided. Firefox and WebKit run the golden
compatibility journey, but they are not yet primary supported browser targets;
use archive import/export where directory access is unavailable.

## Workspace Areas

- **Project source:** project identity, YAML documents, optional mapper, assets,
  project-level view policies such as Attention, layers, problems, topology
  outline, and authoring entry points.
- **Shared source workspace:** YAML editing with schema assistance,
  diagnostics, search, context help, Apply, Revert, and source-range
  navigation.
- **Source/Split/Preview:** one presentation choice that preserves source
  drafts, selection, viewport, history, and contextual authoring state.
- **Topology preview:** selection, connection, movement, resize, grouping,
  alignment, layers, overlays, and presentation.
- **Contextual drawer:** Add, Properties, canvas Properties, or Telemetry rules
  for the current task.
- **Telemetry mapper:** optional rule forms, local sample analysis, coverage,
  object-aware suggestions, and source navigation to shared `mapper.yaml`.
- **Appearance menu:** follows the operating system or pins Studio to Light or
  Dark without changing project YAML.
- **Project menu:** create, open, rename, duplicate, and export source archives.
- **Export panel:** image output, documentation snippets, and Grafana bundles.
- **Session dock:** Problems, Changes, Selection, History, and storage details.
- **Status bar:** problem count, project revision, selection, source position,
  zoom, and active host. Save state stays beside Save in the command bar.

Next: [create a project](first-project.md), [analyze a telemetry sample](telemetry-mapper.md),
or [troubleshoot a blocked action](troubleshooting.md).
