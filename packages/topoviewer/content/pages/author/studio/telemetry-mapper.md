# Telemetry Mapper

**Support status:** Beta Preview

`mapper.yaml` connects telemetry samples to stable topology IDs. It is optional:
opening **Telemetry rules** does not create a file; **Create rule** creates the
first rule and the file together.

## Create And Check A Node Rule

Use the two-router project from [First Project](first-project.md), where the
router labelled `Edge A` has ID `router-1`.

1. Select `Edge A`, then open **Telemetry rules** under Authoring in project
   source. Check that **Mapper context** identifies node `router-1`.
2. On **Rules**, enter metric `node_health`, keep join label `node_id`, and
   choose **Create rule**. A rule appears and `mapper.yaml` becomes available
   in project source.
3. Select the **Coverage** tab. Under **Local samples**, paste this into
   **Sample JSON**, then choose **Analyze samples**:

```json
[
  {
    "metric": "node_health",
    "value": 1,
    "labels": { "node_id": "router-1" }
  }
]
```

**Check:** the summary shows one resolved sample. Its finding links to
`router-1`; choosing that object selects `Edge A` on the canvas. Change
`node_id` to `missing-router` and analyze again to see an unresolved finding.
Restore `router-1` to confirm that the join is working.

The join uses the stable ID, not the visible label `Edge A`. Generic sample JSON
puts the metric at `metric`, the reading at `value`, and join keys inside
`labels`. Putting `node_id` at the record's top level does not supply that label.

For a link rule with a reusable example bundle, follow the
[Studio portable-bundle example](../../examples/use-cases/topoviewer-studio.md#try-the-authoring-loop).
It includes a complete link-health sample and expected coverage.

## Find Rules, Coverage, And Advanced Fields

- **Rules** creates and selects rules and edits their state styles. A node,
  link, or link-direction selection supplies its target kind; no selection
  uses the whole graph. Mixed or unsupported selections cannot create a rule.
- **Coverage** accepts pasted JSON or **Choose JSON** files, shows discovered
  metrics, and links resolved, unresolved, ambiguous, duplicate, ignored, and
  invalid findings back to rules and objects.
- **Advanced** exposes generated mapper fields. Use search to find a field;
  **View more** reveals less-common fields. Source links open the owning YAML.

Select `mapper.yaml` in project source to edit the complete document. Use
**Apply** and **Revert** there; switching tabs or files does not discard pending
text. Pending or invalid mapper source protects that document from conflicting
visual edits. See the [draft and save rules](yaml-recovery.md#draft-and-save-rules).

Whole-file **Export mapper** and **Remove mapper** are under **Mapper actions**.
Export requires resolved source drafts. Removal is an undoable project change
and asks for confirmation.

## Work With Larger Samples

Studio analyzes local samples; it does not connect to a telemetry endpoint.
Sample input is limited to 2 MiB and a bounded number of records. If analysis
reports truncation, reduce the sample set before using it to judge coverage.
Grafana data-frame JSON and Prometheus result JSON are also accepted.

Drag a discovered metric onto a topology object, or select an object and activate
its discovered metric, to propose a rule. Review the proposed join; ambiguous
matches require you to choose a candidate before **Create proposed rule**.

Coverage checks which objects samples resolve to. It does not turn the local
sample panel into a live telemetry feed or prove the runtime state styling.
Test state-dependent colors and labels in the consuming application with its
actual data frames.

## Keep Normal Appearance Separate From Runtime State

Use `stylesheet.yaml` for normal icons, labels, shape, and layout. Use mapper
state styles for values that change with telemetry, such as a link's color or
width. See [Style Provenance](style-provenance.md) for precedence and
[Grafana export](export.md#grafana-bundle) for packaging the accepted mapper.
