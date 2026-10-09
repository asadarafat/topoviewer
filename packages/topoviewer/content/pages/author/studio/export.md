# Export

**Support status:** Beta Preview

Choose an export for the job: a source archive for continued editing, an image
for a report, or a bundle for documentation or Grafana. The header's **Open
export panel** opens the **Export project** dialog.

Resolve topology and mapper drafts first. Opening the export panel applies a
valid pending stylesheet; an invalid or checking style draft blocks it. The
export then uses the accepted project. See the [draft and save rules](yaml-recovery.md#draft-and-save-rules).

## Project Archive

Open **Project menu**, open the project's action menu, and choose **Export
archive** for a deterministic `.tvstudio` project. This is the portable Studio
interchange format and includes accepted source, metadata, and validated local
assets. This separate action does not include unresolved topology, mapper, or
stylesheet drafts. Apply intended changes before exporting, or follow
[the backup procedure](yaml-recovery.md#back-up-before-resetting-storage) to copy
unresolved text separately. [First Project](first-project.md#export-and-reopen-the-archive)
shows how to verify an archive by reopening it.

## Images

Open **Export project > Image** to select PNG or SVG, bounded output dimensions,
and the canvas, transparent, light, or dark background. Studio reports the
resulting file name and size after download. SVG exports keep font references
instead of embedding the complete application font surface, which keeps the
artifact portable and bounded. Remote assets are not fetched during export.
Presentation mode can be used to inspect framing; leaving it restores authoring
selection and viewport.

## Documentation Bundle

Open **Export project > Documentation** and choose MkDocs or Static HTML. Copying
the embed snippet is useful when the destination already owns the YAML files.
Exporting the documentation bundle produces a deterministic ZIP containing:

```text
topology.yaml
stylesheet.yaml
mapper.yaml, when needed
project assets
embed.mkdocs.md or embed.static.html
README.md
manifest.json
```

The embed file and its referenced YAML paths share the bundle root. The README
records the target-specific deployment steps. Private Studio state is not
included.

## Grafana Bundle

Open **Export project > Grafana** to see bundle readiness before export. Grafana
packaging requires valid mapper YAML. When it is missing or invalid, Studio
links directly to the Mapper workspace instead of starting an export that must
fail. A ready project emits the mounted-bundle filenames and manifest expected
by the TopoViewer panel. Containerlab is not a runtime requirement; it is only
used by the repository demo to produce telemetry.

For the source files and sample behind a complete export, see the
[Studio portable-bundle example](../../examples/use-cases/topoviewer-studio.md).
If export fails, correct the reported draft, limit, or storage error and retry;
do not recreate the project. See [Troubleshooting](troubleshooting.md#save-or-export-failed).
