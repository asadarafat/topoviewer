# Static HTML / Zensical Adapter

**Support status:** Supported Adapter

Zensical can host TopoViewer through HTML containers and the published browser
embed bundle. There is no installable TopoViewer Zensical plugin. The recipe
below works in your own site; the final section explains how this repository
additionally converts its shared MkDocs content for publication.

## Create Your Own Zensical Site

This recipe uses Python 3.10 or newer, Zensical 0.0.45, and TopoViewer 0.5.0.
The commands use a macOS/Linux shell. For other environments, follow
[Zensical's installation instructions](https://zensical.org/docs/get-started/).

```bash
mkdir network-zensical
cd network-zensical
python3 -m venv .venv
source .venv/bin/activate
python -m pip install zensical==0.0.45
zensical new .
mkdir -p docs/assets/topoviewer docs/diagrams
curl --fail --location https://cdn.jsdelivr.net/npm/topoviewer@0.5.0/dist/embed/topoviewer-embed.css --output docs/assets/topoviewer/topoviewer-embed.css
curl --fail --location https://cdn.jsdelivr.net/npm/topoviewer@0.5.0/dist/embed/topoviewer-embed.iife.js --output docs/assets/topoviewer/topoviewer-embed.iife.js
```

The downloaded files are served by your site. Keep their versions together when
upgrading. Copy the two YAML files from the
[MkDocs example](mkdocs.md#add-the-diagram-files) into
`docs/diagrams/topology.yaml` and `docs/diagrams/stylesheet.yaml`.

Replace `zensical.toml` with:

```toml
[project]
site_name = "Network docs"
site_url = "http://127.0.0.1:8000/"
docs_dir = "docs"
site_dir = "site"
nav = [{ "Home" = "index.md" }, { "Network" = "network.md" }]
extra_css = ["assets/topoviewer/topoviewer-embed.css"]
extra_javascript = [
  "assets/topoviewer/topoviewer-embed.iife.js",
  "assets/topoviewer/mount.js",
]

[project.theme]
features = ["navigation.instant"]
```

These are Zensical's standard
[additional asset settings](https://zensical.org/docs/customization/#adding-assets).
Set `site_url` to the final public URL, including any path prefix, before
publishing. Zensical requires it for
[instant navigation](https://zensical.org/docs/setup/navigation/#instant-navigation).

## Add A Diagram Page

Replace `docs/index.md` with:

```markdown
# Network docs

Open the [network diagram](network.md).
```

Create `docs/network.md`:

```html
# Network

<div
  class="topoviewer-embed topoviewer-parity-theme"
  data-topology="../diagrams/topology.yaml"
  data-stylesheet="../diagrams/stylesheet.yaml"
  data-controls="true"
  style="height: 420px"
></div>
```

Paste the HTML directly into the Markdown file, without a code fence. Unlike
the MkDocs plugin, a static HTML embed resolves its data URLs from the
**rendered page URL**. With Zensical's default directory URLs, `network.md`
becomes `/network/`, so `../diagrams/` reaches the site's diagram directory.
Relative URLs also preserve a deployment prefix such as `/team-docs/`.

Create `docs/assets/topoviewer/mount.js`:

```js
(() => {
  let scheduled = false;
  function mount() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      window.TopoViewerEmbed?.mountAll();
    });
  }
  function start() {
    mount();
    new MutationObserver((records) => {
      if (records.some((record) => [...record.addedNodes].some((node) =>
        node instanceof Element &&
        (node.matches('.topoviewer-embed') || node.querySelector('.topoviewer-embed'))
      ))) mount();
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
```

The embed bundle mounts containers on the initial page load. This small adapter
also mounts containers inserted by instant navigation. `mountAll()` skips
containers that already have a viewer.

## Preview And Publish

Your files should now be:

```text
network-zensical/
  zensical.toml
  docs/
    index.md
    network.md
    diagrams/
      topology.yaml
      stylesheet.yaml
    assets/topoviewer/
      topoviewer-embed.css
      topoviewer-embed.iife.js
      mount.js
```

Run:

```bash
zensical serve
```

Open `http://127.0.0.1:8000/`, follow **Network**, and expect R01 and R02 joined
by a link. Navigate Home and back to Network to check that instant navigation
remounts the viewer. If the frame is empty, check the script requests; if it
reports a document load error, check the YAML requests and the relative URLs.

After setting the final `site_url`, build and publish the resulting `site/`
directory:

```bash
zensical build
```

For ordinary static HTML, use the same embed container, stylesheet, and script.
Adjust the two data URLs to that page's location and serve the files over HTTP.
See [Single Page HTML](single-page-html.md) for a complete no-build application.

## This Repository's Shared Documentation Workflow

TopoViewer maintains the source pages in
`packages/topoviewer/content/pages/` and example YAML in
`packages/topoviewer/content/examples/`. `npm run sync:docs` generates the
`docs/topoviewer/` projection consumed by MkDocs. Edit the canonical content,
because syncing replaces edits to the generated projection.

The Zensical build runs `scripts/sync-zensical-docs.mjs` to copy that projection
into its generated staging directory, expand source snippets, and convert this
repository's `topoviewer` fences into HTML. It accepts the fence options listed
in the [MkDocs guide](mkdocs.md#fenced-block-options).

That conversion is repository-specific: referenced topology and stylesheet
files must resolve inside the projected `docs/topoviewer/examples/` tree.
Fences using files outside that tree remain code blocks. Installing Zensical
alone does not provide this conversion. Use the HTML recipe above for your own
site and page-relative YAML files.

After following the [repository setup](../../maintainers/monorepo.md), run
these commands from its root:

| Command | Result |
|---|---|
| `npm run zensical:serve` | Generate the Zensical staging tree and open its development server. |
| `npm run zensical:build` | Build the Zensical output under `site/docs/zensical/`. |
| `npm run docs:preview` | Build and preview both documentation hosts and Studio under `/topoviewer/`. |
| `npm run docs:build:parallel` | Build the combined publication artifact. |

The combined preview serves MkDocs at
`http://127.0.0.1:8001/topoviewer/docs/mkdocs/` and Zensical at
`http://127.0.0.1:8001/topoviewer/docs/zensical/`. The corresponding published
sites are [MkDocs](https://asadarafat.github.io/topoviewer/docs/mkdocs/) and
[Zensical](https://asadarafat.github.io/topoviewer/docs/zensical/).
