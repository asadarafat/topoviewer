# Validate YAML

Validate the files you plan to publish, not just whether YAML parses. Structural
validation checks field types and source ownership; semantic lint checks IDs,
endpoints, layers, selectors, and other relationships.

For the [two-router tutorial](../start/first-topology.md), use the exact paths
below. For another project, pass your own topology and stylesheet paths.

## Check In Studio

If you prefer a visual workflow, open [Studio](https://asadarafat.github.io/topoviewer/studio/),
select each source file in Project Source, replace its contents with your YAML,
and choose **Apply**. Follow linked diagnostics to the failing range. A visible
last-valid diagram does not mean a pending or invalid draft has been accepted.
See [YAML Recovery](studio/yaml-recovery.md) for the source states.

## Check Your Files From A Terminal

This optional JavaScript validation path requires Node.js 22.12 or newer. It is
independent of the Python-only MkDocs installation. From your own project
folder, initialize npm once if it does not already contain `package.json`:

```bash
npm init -y
npm install topoviewer @xyflow/react react react-dom js-yaml
```

Save **validate-topology.mjs** beside `package.json`:

<!-- docs-check: validator -->
```js
import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { composeTopoViewerDocument, lintTopoDocument } from 'topoviewer';

const [topologyPath, stylesheetPath] = process.argv.slice(2);
if (!topologyPath || !stylesheetPath) {
  throw new Error('Usage: node validate-topology.mjs topology.yaml stylesheet.yaml');
}

const topology = load(readFileSync(topologyPath, 'utf8'));
const stylesheet = load(readFileSync(stylesheetPath, 'utf8'));
const document = composeTopoViewerDocument(topology, stylesheet);
const issues = lintTopoDocument(document);
for (const issue of issues) {
  console.log(`${issue.severity}: ${issue.code}: ${issue.message}`);
}
if (issues.some((issue) => issue.severity === 'error')) {
  process.exitCode = 1;
} else {
  console.log(`Valid topology: ${document.graph?.nodes?.length ?? 0} nodes, ${document.graph?.links?.length ?? 0} links.`);
}
```

Run the script against the tutorial files:

```bash
node validate-topology.mjs docs/diagrams/topology.yaml docs/diagrams/stylesheet.yaml
```

The tutorial should report `Valid topology: 2 nodes, 1 links.` and exit with
status 0. Warnings are printed for review but do not change that exit status.
Parsing, composition, or semantic errors produce a nonzero status suitable for
CI.

Try changing a link endpoint to `MISSING` in a copy of `topology.yaml`: validation
must fail. Restore the original ID and run again. This confirms that the check
is inspecting your files, rather than a sample catalog.

## Understand A Failure

| Finding | What to inspect | Verify the repair |
|---|---|---|
| YAML parse error | Indentation and unclosed quotes/brackets at the reported line. | Run the same command again. |
| Presentation field in topology | Move `layout`, icons, and persistent appearance into the stylesheet. | Composition succeeds. |
| Missing endpoint or duplicate ID | Exact `id`, `source`, and `target` values in topology YAML. | Semantic lint has no reference errors. |
| Unknown layer or empty view | Define the layer and give objects matching `layers` memberships; select it in the viewer. | The intended objects become visible. |
| Invalid style value | Check bounds and allowed values in the [stylesheet reference](../reference/stylesheet-reference.md). | The style diagnostic disappears. |

For editor autocomplete, use the [published YAML schemas](../reference/yaml-schemas.md).
Validation does not check your hosting paths or guarantee a legible layout;
[build and inspect the exported site](../start/export-your-first-topology.md)
after the source passes.

## Repository Maintainers

The following commands require a checkout of the TopoViewer repository with its
development dependencies installed. They check maintained fixtures and docs,
not arbitrary files in an installed consumer project:

```bash
npm run validate:schemas
npm run validate:semantics
npm run docs:examples:check
```

Use the consumer script above, with explicit paths, to validate external files.
