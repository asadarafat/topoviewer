import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { load } from 'js-yaml';
import { sourceFileFor } from './content-examples.mjs';

export const galleryRoot = path.resolve(import.meta.dirname, '../..');
export const galleryMetadataPath = 'packages/topoviewer/content/gallery.json';
export const galleryManifestPath = 'docs/assets/gallery/manifest.json';
export const galleryRendererAssets = {
  javascript: 'packages/mkdocs-topoviewer/mkdocs_topoviewer/assets/topoviewer-embed.iife.js',
  stylesheet: 'packages/mkdocs-topoviewer/mkdocs_topoviewer/assets/topoviewer-embed.css'
};
export const galleryAssetRoot = path.join(galleryRoot, 'docs/assets/gallery');
export const gallery = JSON.parse(fs.readFileSync(path.join(galleryRoot, galleryMetadataPath), 'utf8'));
export const galleryCards = [...gallery.featured, ...gallery.patterns];
export const galleryRasterAssets = galleryCards.map((card) => ({ path: `docs/assets/gallery/${card.id}.png`, id: card.id }));
export const galleryHash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

// Fingerprint the committed renderer used by the published docs and the code
// that frames its captures. This remains usable before any package is built.
export function galleryCaptureProvenance() {
  const generatorFiles = ['scripts/capture-docs-gallery.mjs', 'scripts/lib/docs-gallery.mjs', 'scripts/lib/docs-static-server.mjs'];
  return {
    rendererSha256: galleryHash(fs.readFileSync(path.join(galleryRoot, galleryRendererAssets.javascript))),
    rendererCssSha256: galleryHash(fs.readFileSync(path.join(galleryRoot, galleryRendererAssets.stylesheet))),
    generatorFingerprint: galleryHash(JSON.stringify(generatorFiles.map((file) => ({ file, sha256: galleryHash(fs.readFileSync(path.join(galleryRoot, file))) }))))
  };
}

export function galleryExample(card) {
  const catalog = load(fs.readFileSync(path.join(galleryRoot, 'packages/topoviewer/content/examples/catalog.yaml'), 'utf8'));
  const example = catalog.examples.find((item) => item.id === card.exampleId);
  if (!example) throw new Error(`Gallery example is missing: ${card.exampleId}`);
  return example;
}

export function gallerySources(card) {
  const example = galleryExample(card);
  const root = path.join(galleryRoot, 'packages/topoviewer/content/examples');
  const files = ['topology.yaml', 'stylesheet.yaml', 'README.md'].map((name) => ({ name, path: sourceFileFor(root, example, name) }));
  const expected = sourceFileFor(root, example, 'expected.yaml');
  if (gallery.featured.some((featured) => featured.id === card.id) && fs.existsSync(expected)) files.push({ name: 'expected.yaml', path: expected });
  for (const name of example.extraFiles || []) files.push({ name, path: path.join(root, example.sourcePath || example.path, name) });
  return files.map((file) => ({ ...file, bytes: fs.readFileSync(file.path) }));
}

export function gallerySourceFingerprint(card) {
  const sources = gallerySources(card).map(({ name, bytes }) => ({ name, sha256: galleryHash(bytes) }));
  return galleryHash(JSON.stringify({ card, render: galleryExample(card).render, sources }));
}

export function galleryPage(card) {
  return card.page || `${galleryExample(card).page}/index.md`;
}

export function galleryRoute(card) {
  return galleryPage(card).replace(/(?:index)?\.md$/, '').replace(/\/?$/, '/');
}

export function galleryProjectIdentity(card, sources = gallerySources(card)) {
  return {
    id: `gallery-${card.id}`,
    name: card.title,
    revision: `source-${galleryHash(Buffer.concat(sources.map((file) => file.bytes))).slice(0, 16)}`,
    metadata: { createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', profileVersion: 1, schemaVersion: 1 }
  };
}

export function galleryBundleInstructions(card) {
  return `# ${card.title}\n\nOpen the .tvstudio file with Project menu > Open archive in TopoViewer Studio. It opens the initial view. The YAML files include the documented alternate states, where provided.\n\nEach topology is paired with stylesheet.yaml unless a state-specific stylesheet is supplied. These are authored examples, not live telemetry or routing simulation.\n\nGuide: https://asadarafat.github.io/topoviewer/docs/mkdocs/${galleryRoute(card)}\n`;
}

export function galleryCardHtml(card, featured = false) {
  const relativeRoute = galleryRoute(card).replace(/^topoviewer\/examples\//, '');
  const escape = (text) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<a class="tv-gallery-card${featured ? ' tv-gallery-featured' : ''}" href="${relativeRoute}">
  <img src="../../assets/gallery/${card.id}.png" alt="" width="1120" height="${card.height || 500}" loading="${featured ? 'eager' : 'lazy'}">
  <div class="tv-gallery-card-body">
    ${featured ? `<span class="tv-gallery-eyebrow">${escape(card.eyebrow)}</span>` : ''}
    <h3>${escape(card.title)}</h3>
    <p>${escape(card.summary)}</p>
    <span class="tv-gallery-action">${escape(card.action || 'Open the pattern')} <span aria-hidden="true">↗</span></span>
  </div>
</a>`.replace(/[ \t]+$/gm, '');
}
