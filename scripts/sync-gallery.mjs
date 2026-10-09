#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { gallery, galleryRoot, galleryAssetRoot, galleryCardHtml, gallerySources, galleryProjectIdentity, galleryBundleInstructions } from './lib/docs-gallery.mjs';

const check = process.argv.includes('--check');
const bundles = process.argv.includes('--bundles');
function output(file, bytes) {
  const contents = typeof bytes === 'string' ? Buffer.from(bytes) : Buffer.from(bytes);
  if (fs.existsSync(file) && fs.readFileSync(file).equals(contents)) return;
  if (check) throw new Error(`Gallery output is stale: ${path.relative(galleryRoot, file)}. Run node scripts/sync-gallery.mjs${bundles ? ' --bundles' : ''}.`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

const landing = `---
hide:
  - toc
---
<!-- Generated from packages/topoviewer/content/gallery.json by scripts/sync-gallery.mjs. -->
# Explore what your topology can tell you

<p class="tv-gallery-intro">Trace a service across a network. Follow a packet through a fabric. Unfold the workloads behind an endpoint. Start with a question, then explore the diagram.</p>

<nav class="tv-gallery-links" aria-label="Browse examples"><a href="#guided-scenarios">Guided scenarios</a><a href="#patterns-to-borrow">Patterns to borrow</a><a href="../start/first-topology/">Build your first diagram</a></nav>

## Guided Scenarios

Three small investigations, with live diagrams, things to try, and source files to keep.

<div class="tv-gallery-grid">
${gallery.featured.map((card) => galleryCardHtml(card, true)).join('\n')}
</div>

<p class="tv-gallery-note">These are reproducible examples with authored states. Each walkthrough explains its data and assumptions. Download the YAML bundle or import its <code>.tvstudio</code> archive to make it your own.</p>

## Patterns To Borrow

Learn one visual technique, then bring it into your own diagram.

<div class="tv-gallery-grid tv-gallery-patterns">
${gallery.patterns.map((card) => galleryCardHtml(card)).join('\n')}
</div>

## Find A Specific Feature

The focused examples stay small so you can see exactly which source field changes the result.

| Build the model | Shape the view | Explain and inspect |
|---|---|---|
| [Graph](graph/index.md) · [Nodes](nodes/index.md) | [Edges](edges/index.md) · [Paths](paths/index.md) | [Attention](attention/index.md) · [Regions](regions/index.md) |
| [Authoring](authoring/index.md) | [Styling](styling/index.md) · [Layout](layout/index.md) | [Callouts](callouts/index.md) · [Shapes](shapes/index.md) |
| [Validate your files](../author/validate-yaml.md) | [Text](text/index.md) | [Object family lookup](object-family-examples.md) |

To embed a diagram in your own product or documentation, use the [integration guides](use-cases/index.md).
`;
output(path.join(galleryRoot, 'packages/topoviewer/content/pages/examples/index.md'), landing);

if (bundles) {
  // fflate encodes ZIP timestamps in local time, including timestamps produced by
  // the Studio codec. Pin UTC before either archive is encoded on every machine.
  process.env.TZ = 'UTC';
  const { zipSync, strToU8 } = await import('fflate');
  const { rolldown } = await import('rolldown');
  // Use the Studio encoder and decoder themselves so downloadable archives follow
  // the same validation and integrity contract as exports made in the application.
  const toolDirectory = path.join(galleryRoot, '.artifacts/gallery-tools');
  fs.mkdirSync(toolDirectory, { recursive: true });
  const archiveModule = path.join(toolDirectory, 'archive.mjs');
  const build = await rolldown({
    input: path.join(galleryRoot, 'packages/topoviewer-studio/src/archive/projectArchive.ts'),
    platform: 'node',
    external: (id) => !id.startsWith('.') && !path.isAbsolute(id)
  });
  try { await build.write({ file: archiveModule, format: 'esm' }); } finally { await build.close(); }
  const { encodeStudioProjectArchive, decodeStudioProjectArchive, fileHash, fixedZipTime } = await import(pathToFileURL(archiveModule).href);

  for (const card of gallery.featured) {
    const sources = gallerySources(card);
    const yaml = (kind) => {
      const file = sources.find((source) => source.name === `${kind}.yaml`);
      return { kind, path: file.name, text: file.bytes.toString('utf8'), contentHash: fileHash(file.bytes) };
    };
    const project = {
      ...galleryProjectIdentity(card, sources),
      assets: [],
      documents: { topology: yaml('topology'), stylesheet: yaml('stylesheet') }
    };
    const archive = encodeStudioProjectArchive(project);
    const decoded = decodeStudioProjectArchive(archive);
    if (decoded.project.documents.topology.text !== project.documents.topology.text || decoded.project.documents.stylesheet.text !== project.documents.stylesheet.text) throw new Error(`Archive round trip changed ${card.id}.`);
    output(path.join(galleryAssetRoot, `${card.id}.tvstudio`), archive);
    const files = Object.fromEntries(sources.map((file) => [file.name, file.bytes]));
    files['IMPORT.md'] = strToU8(galleryBundleInstructions(card));
    files[`${card.id}.tvstudio`] = archive;
    output(path.join(galleryAssetRoot, `${card.id}.zip`), zipSync(files, { level: 6, mtime: fixedZipTime }));
  }
}
console.log(`Gallery ${check ? 'check passed' : 'synced'}: ${gallery.featured.length} scenarios, ${gallery.patterns.length} patterns${bundles ? ', source bundles and verified Studio archives' : ', landing page only'}.`);
