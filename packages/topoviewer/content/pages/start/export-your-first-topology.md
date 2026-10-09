# Export Your First Topology

After [styling](style-your-first-topology.md) and
[validating](../author/validate-yaml.md) the two-router example, keep both the
editable YAML and the rendered documentation site.

## Build And Check The Site

From your `router-docs` directory, with the Python environment active, run:

```bash
mkdocs build --strict
python -m http.server 8001 --directory site
```

Open `http://127.0.0.1:8001/`. Confirm that R01 and R02 render and that the
Ethernet link uses the styling you just authored. Open
`http://127.0.0.1:8001/diagrams/topology.yaml` to check that the source asset was
included. Stop the server with `Ctrl+C` when finished.

The output is **site/**. Copy that complete directory to your static host;
`index.html` alone does not include the JavaScript, CSS, or YAML it loads.
Serve it over HTTP rather than opening the HTML through a `file://` URL.

## Keep An Editable Copy

Save `mkdocs.yml`, `docs/index.md`, `docs/diagrams/topology.yaml`, and
`docs/diagrams/stylesheet.yaml` in version control. Record your working Python
dependencies alongside them:

```bash
python -m pip freeze > requirements.txt
```

To verify portability, copy those source files and `requirements.txt` into a
fresh directory, preserving the folder structure. In a new Python environment,
run `python -m pip install -r requirements.txt`, then `mkdocs build --strict`.
Check the rebuilt site with the HTTP server above.

The exported site contains readable topology YAML as well as the diagram.
Publish it with the access controls appropriate for that topology.

## Other Destinations

| Desired result | Procedure |
|---|---|
| PNG/SVG, a portable Studio archive, or a Grafana bundle | Follow [Studio First Project](../author/studio/first-project.md) and its export/reimport check. |
| A topology view inside an application | Use the [React integration](../examples/use-cases/react.md). |
| Another static documentation engine | Use the [Static HTML / Zensical adapter](../examples/use-cases/static-html-zensical-adapter.md). |

For Studio, a `.tvstudio` archive preserves accepted source and assets. It is
not a backup of unresolved editor drafts; follow the
[draft recovery procedure](../author/studio/troubleshooting.md) before resetting
browser storage.
