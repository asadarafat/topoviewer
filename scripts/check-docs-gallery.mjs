#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { unzipSync } from 'fflate';
import { load } from 'js-yaml';
import { pngDimensions } from './lib/docs-screenshot-catalog.mjs';
import { gallery, galleryCards, galleryRoot, galleryManifestPath, galleryHash, gallerySourceFingerprint, gallerySources, galleryPage, galleryCaptureProvenance, galleryProjectIdentity, galleryBundleInstructions } from './lib/docs-gallery.mjs';

const runtime = process.argv.includes('--runtime');
const renderer = runtime ? await import('../packages/topoviewer/dist/topoviewer.mjs') : undefined;

function equalFile(actual, expected, label) {
  assert.ok(actual && Buffer.from(actual).equals(Buffer.from(expected)), `${label} differs from its canonical source.`);
}

function archiveFileHash(bytes) {
  let hash = 0x811c9dc5;
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 0x01000193);
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

// Read only known entries and enforce their expected sizes before inflating.
// The runtime --bundles check separately exercises Studio's complete codec.
function unpack(bytes, expectedSizes, label) {
  const seen = new Set();
  const entries = unzipSync(bytes, { filter(file) {
    assert.ok(Object.hasOwn(expectedSizes, file.name), `${label} has an unexpected entry: ${file.name}`);
    assert.ok(!seen.has(file.name), `${label} has a duplicate entry: ${file.name}`);
    seen.add(file.name);
    const expectedSize = expectedSizes[file.name];
    if (expectedSize === undefined) assert.ok(file.originalSize <= 1024 * 1024, `${label} manifest is too large.`);
    else assert.equal(file.originalSize, expectedSize, `${label}/${file.name} has a stale size.`);
    return true;
  } });
  assert.deepEqual(Object.keys(entries).sort(), Object.keys(expectedSizes).sort(), `${label} has missing entries.`);
  return entries;
}

const manifest = JSON.parse(fs.readFileSync(path.join(galleryRoot, galleryManifestPath), 'utf8'));
assert.equal(manifest.version, 1);
assert.equal(manifest.generator, 'scripts/capture-docs-gallery.mjs');
for (const [key, value] of Object.entries(galleryCaptureProvenance())) {
  assert.equal(manifest[key], value, `Gallery ${key} changed; recapture actual diagrams.`);
}
assert.deepEqual(manifest.captures.map((item) => item.id).sort(), galleryCards.map((card) => card.id).sort());
assert.deepEqual(manifest.bundles.map((item) => item.path).sort(), gallery.featured.flatMap((card) => ['zip', 'tvstudio'].map((extension) => `docs/assets/gallery/${card.id}.${extension}`)).sort());
for (const card of galleryCards) {
  const capture = manifest.captures.find((item) => item.id === card.id);
  assert.equal(capture.path, `docs/assets/gallery/${card.id}.png`);
  assert.equal(capture.sourceFingerprint, gallerySourceFingerprint(card), `${card.id} source changed; run npm run docs:gallery:capture.`);
  const bytes = fs.readFileSync(path.join(galleryRoot, capture.path));
  assert.equal(capture.sha256, galleryHash(bytes), `${card.id} image changed without provenance.`);
  assert.deepEqual(pngDimensions(bytes), { width: capture.width, height: capture.height });
  assert.equal(capture.width, 1120);
  assert.equal(capture.height, card.height || 500);
  assert.ok(fs.existsSync(path.join(galleryRoot, 'docs', galleryPage(card))), `${card.id} links to a missing page.`);
}
for (const card of gallery.featured) {
  const sources = gallerySources(card);
  const bytesByExtension = {};
  for (const extension of ['zip', 'tvstudio']) {
    const file = `docs/assets/gallery/${card.id}.${extension}`;
    const entry = manifest.bundles.find((bundle) => bundle.path === file);
    assert.ok(entry, `${file} has no provenance.`);
    const bytes = fs.readFileSync(path.join(galleryRoot, file));
    assert.equal(entry.sha256, galleryHash(bytes), `${file} changed; refresh gallery provenance.`);
    bytesByExtension[extension] = bytes;
  }
  const documents = sources.filter((source) => ['topology.yaml', 'stylesheet.yaml'].includes(source.name));
  const archiveFiles = unpack(bytesByExtension.tvstudio, {
    'manifest.json': undefined,
    ...Object.fromEntries(documents.map((source) => [source.name, source.bytes.length]))
  }, `${card.id}.tvstudio`);
  const archiveManifest = JSON.parse(Buffer.from(archiveFiles['manifest.json']).toString('utf8'));
  assert.equal(archiveManifest.format, 'topoviewer-studio-project');
  assert.equal(archiveManifest.version, 1);
  assert.deepEqual(archiveManifest.project, galleryProjectIdentity(card, sources));
  assert.deepEqual(archiveManifest.files.map((file) => file.path).sort(), documents.map((file) => file.name).sort());
  for (const source of documents) {
    equalFile(archiveFiles[source.name], source.bytes, `${card.id}.tvstudio/${source.name}`);
    const file = archiveManifest.files.find((entry) => entry.path === source.name);
    assert.equal(file.documentKind, source.name.replace(/\.yaml$/, ''));
    assert.equal(file.mediaType, 'application/yaml');
    assert.equal(file.size, source.bytes.length);
    assert.equal(file.contentHash, archiveFileHash(source.bytes), `${card.id}.tvstudio/${source.name} has an invalid archive checksum.`);
  }
  const expectedBundleFiles = {
    ...Object.fromEntries(sources.map((source) => [source.name, source.bytes])),
    'IMPORT.md': Buffer.from(galleryBundleInstructions(card)),
    [`${card.id}.tvstudio`]: bytesByExtension.tvstudio
  };
  const bundleFiles = unpack(bytesByExtension.zip, Object.fromEntries(Object.entries(expectedBundleFiles).map(([name, bytes]) => [name, bytes.length])), `${card.id}.zip`);
  for (const [name, bytes] of Object.entries(expectedBundleFiles)) equalFile(bundleFiles[name], bytes, `${card.id}.zip/${name}`);

  if (renderer) {
    const stylesheet = load(documents.find((file) => file.name === 'stylesheet.yaml').bytes.toString('utf8'));
    for (const source of sources.filter((file) => file.name.endsWith('.yaml') && !['stylesheet.yaml', 'expected.yaml'].includes(file.name))) {
      const topology = load(source.bytes.toString('utf8'));
      const document = renderer.composeTopoViewerDocument(topology, stylesheet);
      assert.deepEqual(renderer.lintTopoDocument(document).filter((issue) => issue.severity === 'error'), [], `${card.id}/${source.name} must be semantically valid.`);
      const result = renderer.compileTopoGraphResult(document);
      assert.equal(result.ok, true);
      assert.ok(result.graph.nodes.length > 0);
    }
  }
}
console.log(`Gallery verified: ${galleryCards.length} real previews, capture provenance, and ${gallery.featured.length * 2} source-matched downloadable artifacts${runtime ? ', including runtime validation of all showcase snapshots' : ''}.`);
