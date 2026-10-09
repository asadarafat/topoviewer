# MkDocs

**Support status:** Supported

Use `mkdocs-topoviewer` to render topology YAML inside Markdown pages. The Python
package includes the browser JavaScript and CSS; a site author needs Python
3.9 or newer and MkDocs 1.6 or newer, below 2.0. Installing the plugin installs
a compatible MkDocs version. Node.js and a TopoViewer repository checkout are
not required.

## Create A Site

In a terminal on macOS or Linux:

```bash
mkdir network-docs
cd network-docs
python3 -m venv .venv
source .venv/bin/activate
python -m pip install mkdocs-topoviewer==0.5.0
mkdocs new .
mkdir -p docs/diagrams
```

On Windows, create the environment with `python -m venv .venv` and activate it
with `.venv\Scripts\activate` in Command Prompt. Create `docs\diagrams` before
adding the files below.

Replace `mkdocs.yml` with:

```yaml
site_name: Network docs
plugins:
  - search
  - topoviewer
```

Your site will contain these files:

```text
network-docs/
  mkdocs.yml
  docs/
    index.md
    diagrams/
      topology.yaml
      stylesheet.yaml
```

## Add The Diagram Files

Save the following as `docs/diagrams/topology.yaml`. It is the same R01/R02
example used in [First Topology](../../start/first-topology.md).

<!-- docs-check: topology mkdocs-first -->
```yaml
--8<-- "docs/topoviewer/examples/graph/basic/topology.yaml"
```

Save the following as `docs/diagrams/stylesheet.yaml`:

<!-- docs-check: stylesheet mkdocs-first -->
```yaml
--8<-- "docs/topoviewer/examples/graph/basic/stylesheet.yaml"
```

Replace `docs/index.md` with:

````markdown
# Network

```topoviewer
topology: ./diagrams/topology.yaml
stylesheet: ./diagrams/stylesheet.yaml
height: 420px
title: R01 to R02
controls: true
```
````

The file paths in a `topoviewer` fence are relative to the Markdown source
file. For example, a page at `docs/guides/network.md` would use
`../diagrams/topology.yaml` and `../diagrams/stylesheet.yaml`.

## Preview And Publish

From `network-docs`, with the virtual environment active:

```bash
mkdocs serve
```

Open `http://127.0.0.1:8000/`. Expect two nodes labeled **R01** and **R02**,
a link between them, and a layer control for **Physical**. R02 has the cyan
style selected by its Cisco vendor label. Edit either YAML file and check the
preview again.

Build the static site before publishing:

```bash
mkdocs build --strict
```

Publish the generated `site/` directory with your usual static hosting process.
The plugin copies the referenced documents and embed assets into the build.
Test the page at its final URL, especially when the site is hosted under a
subpath. If the diagram reports a load error, check the two source file paths
and the browser's failed requests first.

## Fenced-Block Options

Keep graph objects and style rules in their YAML files. The fence configures
one viewport:

| Option | Use |
|---|---|
| `topology` | Required topology YAML path, relative to the Markdown file. |
| `stylesheet` | Optional stylesheet YAML path, relative to the Markdown file. |
| `height` | CSS viewport height, such as `420px`. |
| `width` | CSS width; defaults to the available content width. |
| `title` | Optional caption. |
| `controls` | Show layer/display controls; defaults to `true`. |
| `controlsOpen` | Open controls initially; defaults to `false`. |
| `helperLines` | Drag alignment guides and snapping; enabled by default. Set `false` to disable, `{snap: false}` for guides only, or `{snapMode: live}` for live snapping. |
| `selectedLayerIds` | Initial checked layer IDs; defaults to all graph layers. |
| `attention` | Runtime attention override for this viewport. |

For example, add `selectedLayerIds: [physical]` to the first fence to select
the physical layer explicitly. An attention query must reference objects that
exist in the topology:

````markdown
```topoviewer
topology: ./diagrams/topology.yaml
stylesheet: ./diagrams/stylesheet.yaml
height: 420px
attention:
  query:
    ids: [R02]
    mode: dim-context
```
````

See [Topology attention](../../author/attention.md) and the
[attention examples](../attention/index.md) for paths, change focus, and
collapsed regions. For a page outside MkDocs, use the
[static HTML / Zensical adapter](static-html-zensical-adapter.md).

## Repository Maintainers: Rebuild The Packaged Assets

This section applies when changing TopoViewer itself. A site installed from
PyPI already has the assets it needs. Follow the repository
[tooling prerequisites](../../maintainers/monorepo.md) before running these
commands from the TopoViewer repository root:

```bash
npm run build
npm run sync:mkdocs
```

The embed files are copied to
`packages/mkdocs-topoviewer/mkdocs_topoviewer/assets/`. To refresh only those
files, run `npm run sync:mkdocs-assets`. To regenerate this project's public
documentation from `packages/topoviewer/content/`, run `npm run sync:docs`.

The example projection script can also target a separate docs tree:

```bash
node packages/topoviewer/scripts/sync-examples.mjs --docs-root /path/to/site/docs
```

This writes TopoViewer's example catalog into that tree; it is not needed to
embed your own YAML. `TOPOVIEWER_DOCS_ROOT` is the equivalent environment
override. Use `npm run check:content` and `npm run check:examples` to check
repository projection drift.
