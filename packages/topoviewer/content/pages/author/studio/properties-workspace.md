# Properties Workspace

**Support status:** Beta Preview

Studio puts topology properties and appearance controls in one preview-local
drawer without merging their source documents. Select an object and Studio
opens **Properties**. Select empty preview and Studio opens canvas
**Properties**.

Edits appear in the document that owns the value:

- topology fields write to `topology.yaml`;
- appearance fields write to the pending `stylesheet.yaml`;
- **Telemetry rules** edits rules in `mapper.yaml`.

## Visual Editing

Check the selection strip before editing: it identifies the object whose ID,
visible label, position, layers, and appearance you are changing.

**Topology** edits object facts such as its stable ID, visible label
(`labels.name`), and position. These changes are undoable. ID and layer
membership are visible without opening a secondary Advanced form. Use
the source button beside **Topology** when the object needs fields that are not
exposed as a visual control.

**Appearance** edits the selected object's style. It supports nodes, links,
link directions, paths, regions, shapes,
callouts, and text objects. Controls include colors with opacity, switches,
bounded numbers, enumerated values, icons, text, and supported nested styles.

Search covers labels, canonical property names, descriptions, groups, and
aliases. Common fields appear first; use label help for their descriptions.
Choose **View more** to reveal applicable
less-common and nested fields in the same list; there is no separate Advanced
mode for appearance. **Attention**, when available for the selection, provides
[focus and aggregation shortcuts](palette-and-direct-manipulation.md#attention-authoring).

The **Icon** control combines project-defined icons with Studio's trusted Nokia
catalog: router, switch, spine, data-center gateway, controller, NSP, server,
cloud, PON, residential gateway, user equipment, and client. Selecting a
catalog icon that is not already present writes its complete SVG declaration to
`stylesheet.yaml`; the exported bundle never depends on a private Studio asset.
Catalog icons follow node colors. For a project-defined SVG, use `${fillColor}`
and `${strokeColor}` where colors should follow the node; hardcoded fills and
strokes retain their authored color.

## Selected Object Appearance

Appearance controls create or update exact-ID rules for the current
selection in the pending stylesheet:

```yaml
stylesheet:
  - selector: 'node[id = "core-1"]'
    style:
      backgroundColor: "#1565c0"
```

It does not add an inline `style` to `topology.yaml`. Reset removes only that
pending field so the object inherits from other matching rules again.

Properties stays scoped to direct visual editing of the selected object.
Author reusable selector policy by selecting `stylesheet.yaml` in project
source:

```yaml
stylesheet:
  - selector: 'node[labels.role = "router"]'
    style:
      backgroundColor: "#1565c0"
```

The source editor suggests selectors from topology IDs, labels, and data.

Same-kind multi-selection remains available in Properties. Mixed values are
identified explicitly; changing a field updates the selected exact-ID rules
together. Use source editing for mixed-kind selections.

## Shared Source Editing

Properties and source are two representations of the same project. Keep
**Split** active or choose **Source**, then select an actual project file:

- `topology.yaml` for graph and diagram facts;
- `stylesheet.yaml` for reusable visual policy.

Switching files preserves each file's unapplied draft, so inspecting another
document does not discard work.
The question-mark command in each YAML toolbar opens context help at the active
cursor: documented fields open hover documentation, while insertion points
open compatible completion. `Ctrl+Space`, field hover, and standalone `?`
discovery remain available directly in Monaco.

`topology.yaml` reveals the selected object when a source range is available.
Apply accepts your changes. Invalid text remains in
the editor with diagnostics while the canvas keeps the last valid topology.

`stylesheet.yaml` edits the same pending style used by Appearance. It provides
source-mapped diagnostics, hover help, target-compatible property and value
completion, project icon completion, and selectors derived from topology IDs,
labels, and data. The toolbar can search, reveal a matching rule, or format
after an explicit warning.

Structural completion covers stylesheet root fields and the supported nested
contracts under `layout`, `layout.clos`, `limits`, `toggles`, icons, and
`nodeLayout`. A standalone `?` in a supported property or value position opens
contextual discovery. Comments, quoted strings, block scalars, URLs, and SVG
source remain unchanged.

## Apply Appearance Changes

Appearance and stylesheet YAML share the same style draft. The canvas previews
its latest valid version. **Apply** accepts it as one undoable change; **Revert**
restores the applied style. Both buttons disappear when no draft remains.

Use the [draft and save rules](yaml-recovery.md#draft-and-save-rules) for Save,
export, and invalid text. A pending topology or mapper draft also protects its
document from visual edits; Apply or Revert it before changing the same facts
in Properties.

## Older Bundles And Formatting

Version `0.2` keeps appearance in `stylesheet.yaml`. For a version `0.1` or
unversioned bundle with inline appearance, use the migration command in
[Identity And Source Ownership](../identity-and-source-ownership.md) before editing.
See [Style Provenance](style-provenance.md) to understand inherited values and
runtime mapper overrides.

Structured edits preserve comments, blank lines, scalar style, aliases, unknown
keys, line endings, and rule order when a safe local mutation exists. Operations
that require broader normalization require explicit review.

Select `mapper.yaml` in project source to edit mapper source, or use
[Telemetry rules](telemetry-mapper.md) to create a rule and check sample coverage.
