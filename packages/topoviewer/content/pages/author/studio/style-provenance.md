# Style Provenance

**Support status:** Beta Preview

A rendered value may come from an implicit renderer default, one or more
stylesheet rules, or a runtime mapper overlay. **Properties > Appearance** shows
the effective value. Select `stylesheet.yaml` in project source to inspect or
edit the matching rules.

Visual appearance controls write exact-ID rules in the pending stylesheet.
This is the selection-specific equivalent of an object override while
keeping visual policy in `stylesheet.yaml`:

```yaml
stylesheet:
  - selector: 'node[id = "core-1"]'
    style:
      backgroundColor: "#123456"
```

Reusable selector rules belong in `stylesheet.yaml` in project source. Prefer a stable,
low-cardinality label when several objects should share policy:

```yaml
stylesheet:
  - selector: 'node[labels.role = "core"]'
    style:
      shape: roundRectangle
      backgroundColor: "#123456"
```

Rule precedence is deterministic. Exact-ID rules override semantic label/data
rules and object-kind rules regardless of source position. Rules with equal
specificity preserve source order. Runtime mapper styles apply last for values
owned by current telemetry.

Objects created from the Studio palette keep topology identity, relationships,
labels, positions, and data in `topology.yaml`. Their generated appearance is
written directly to exact-ID rules in `stylesheet.yaml`; Studio does not create
inline topology styles. Version `0.2` validation rejects persistent topology
appearance so there is only one persistent visual owner.

Migrate a version `0.1` or unversioned bundle with the explicit repository
migration command before editing it as canonical source. The migration moves
legacy appearance to exact-ID rules and reports conflicts without creating two
owners. See [Identity And Source Ownership](../identity-and-source-ownership.md).

Resetting a Visual field removes it from the exact-ID rule. If that rule becomes
empty, Studio removes the rule and exposes the next inherited value. Unknown
future fields are preserved during unrelated structured edits; edit those fields
in the shared source editor.

Mapper state styles are runtime overlays. They should override only values that
change with telemetry; stable shape, icon, label, and layout policy remains in
`stylesheet.yaml`. See [Telemetry Mapper](telemetry-mapper.md) for a working
sample and the [draft and save rules](yaml-recovery.md#draft-and-save-rules)
before saving or exporting a pending style change.
