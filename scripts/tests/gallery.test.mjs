import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { unzipSync, zipSync } from 'fflate';
import { gallery, galleryRoot, gallerySources } from '../lib/docs-gallery.mjs';

const fixtureScripts = [
  'scripts/sync-gallery.mjs', 'scripts/check-docs-gallery.mjs', 'scripts/capture-docs-gallery.mjs',
  'scripts/lib/docs-gallery.mjs', 'scripts/lib/docs-static-server.mjs',
  'scripts/lib/docs-screenshot-catalog.mjs', 'scripts/lib/content-examples.mjs'
];
const zipOptions = { level: 6, mtime: new Date(1980, 0, 1) };

function write(root, file, bytes) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), bytes);
}

function run(root, file, args = [], env = {}) {
  return spawnSync(process.execPath, [file, ...args], { cwd: root, encoding: 'utf8', env: { ...process.env, ...env } });
}

function succeeded(result) {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
}

function archiveHash(bytes) {
  let hash = 0x811c9dc5;
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 0x01000193);
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

async function fixture(t, { runtime = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'topoviewer-gallery-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.symlinkSync(path.join(galleryRoot, 'node_modules'), path.join(root, 'node_modules'), 'dir');
  const card = gallery.featured[0];
  const copy = (file) => write(root, file, fs.readFileSync(path.join(galleryRoot, file)));
  for (const file of fixtureScripts) copy(file);
  copy('packages/topoviewer/content/examples/catalog.yaml');
  write(root, 'packages/topoviewer/content/gallery.json', JSON.stringify({ version: 1, featured: [card], patterns: [] }));
  for (const source of gallerySources(card)) copy(path.relative(galleryRoot, source.path));
  const library = await import(pathToFileURL(path.join(root, 'scripts/lib/docs-gallery.mjs')).href);
  for (const file of Object.values(library.galleryRendererAssets)) copy(file);
  copy(`docs/assets/gallery/${card.id}.png`);
  write(root, `docs/${library.galleryPage(card)}`, '# Fixture guide\n');

  if (runtime) {
    const studioSource = 'packages/topoviewer-studio/src';
    fs.cpSync(path.join(galleryRoot, studioSource), path.join(root, studioSource), { recursive: true });
    fs.symlinkSync(path.join(galleryRoot, 'packages/topoviewer/dist'), path.join(root, 'packages/topoviewer/dist'), 'dir');
  } else {
    // A small archive-format fixture lets preflight exercise byte integrity
    // without importing the Studio codec or any compiled renderer package.
    const sources = library.gallerySources(card);
    const documents = sources.filter((source) => ['topology.yaml', 'stylesheet.yaml'].includes(source.name));
    const archiveManifest = {
      format: 'topoviewer-studio-project', version: 1,
      project: library.galleryProjectIdentity(card, sources),
      files: documents.map((source) => ({
        path: source.name, documentKind: source.name.replace(/\.yaml$/, ''),
        mediaType: 'application/yaml', size: source.bytes.length, contentHash: archiveHash(source.bytes)
      }))
    };
    const archive = zipSync({
      'manifest.json': Buffer.from(JSON.stringify(archiveManifest)),
      ...Object.fromEntries(documents.map((source) => [source.name, source.bytes]))
    }, zipOptions);
    write(root, `docs/assets/gallery/${card.id}.tvstudio`, archive);
    write(root, `docs/assets/gallery/${card.id}.zip`, zipSync({
      ...Object.fromEntries(sources.map((source) => [source.name, source.bytes])),
      'IMPORT.md': Buffer.from(library.galleryBundleInstructions(card)),
      [`${card.id}.tvstudio`]: archive
    }, zipOptions));
  }
  const refreshManifest = () => {
    const imagePath = `docs/assets/gallery/${card.id}.png`;
    const manifest = {
      version: 1, generator: 'scripts/capture-docs-gallery.mjs', ...library.galleryCaptureProvenance(),
      captures: [{ id: card.id, path: imagePath, width: 1120, height: card.height || 500,
        sha256: library.galleryHash(fs.readFileSync(path.join(root, imagePath))), sourceFingerprint: library.gallerySourceFingerprint(card) }],
      bundles: ['zip', 'tvstudio'].map((extension) => {
        const file = `docs/assets/gallery/${card.id}.${extension}`;
        return { path: file, sha256: library.galleryHash(fs.readFileSync(path.join(root, file))) };
      })
    };
    write(root, library.galleryManifestPath, JSON.stringify(manifest));
  };
  if (!runtime) refreshManifest();
  return { root, card, library, refreshManifest };
}

test('source-only sync and provenance checks work without any dist or Studio source', async (t) => {
  const { root, card } = await fixture(t);
  assert.equal(fs.existsSync(path.join(root, 'packages/topoviewer/dist')), false);
  assert.equal(fs.existsSync(path.join(root, 'packages/topoviewer-studio/src')), false);
  succeeded(run(root, 'scripts/sync-gallery.mjs'));
  succeeded(run(root, 'scripts/sync-gallery.mjs', ['--check']));
  succeeded(run(root, 'scripts/check-docs-gallery.mjs'));
  assert.equal(fs.existsSync(path.join(root, '.artifacts')), false, 'source-only checks must not bundle runtime code');
  const landing = fs.readFileSync(path.join(root, 'packages/topoviewer/content/pages/examples/index.md'), 'utf8');
  assert.ok(landing.includes(`height="${card.height}"`), 'preview uses the configured capture height');
});

test('landing --check reports drift without rewriting it', async (t) => {
  const { root } = await fixture(t);
  succeeded(run(root, 'scripts/sync-gallery.mjs'));
  const landing = 'packages/topoviewer/content/pages/examples/index.md';
  write(root, landing, 'stale landing\n');
  const result = run(root, 'scripts/sync-gallery.mjs', ['--check']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Gallery output is stale/);
  assert.equal(fs.readFileSync(path.join(root, landing), 'utf8'), 'stale landing\n');
});

test('bundle checks reject stale source bytes even when its outer provenance hash matches', async (t) => {
  const { root, card, refreshManifest } = await fixture(t);
  const file = `docs/assets/gallery/${card.id}.zip`;
  const entries = unzipSync(fs.readFileSync(path.join(root, file)));
  entries['topology.yaml'][0] ^= 1;
  write(root, file, zipSync(entries, zipOptions));
  refreshManifest();
  const result = run(root, 'scripts/check-docs-gallery.mjs');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /topology.yaml differs from its canonical source/);
});

test('archive checks reject invalid import checksums even when provenance matches', async (t) => {
  const { root, card, refreshManifest } = await fixture(t);
  const file = `docs/assets/gallery/${card.id}.tvstudio`;
  const entries = unzipSync(fs.readFileSync(path.join(root, file)));
  const manifest = JSON.parse(Buffer.from(entries['manifest.json']).toString('utf8'));
  manifest.files[0].contentHash = 'fnv1a-00000000';
  entries['manifest.json'] = Buffer.from(JSON.stringify(manifest));
  write(root, file, zipSync(entries, zipOptions));
  refreshManifest();
  const result = run(root, 'scripts/check-docs-gallery.mjs');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /invalid archive checksum/);
});

test('capture provenance detects renderer and generator changes', async (t) => {
  const { root, library } = await fixture(t);
  const renderer = library.galleryRendererAssets.stylesheet;
  const original = fs.readFileSync(path.join(root, renderer));
  fs.appendFileSync(path.join(root, renderer), '\n/* changed renderer */');
  const rendererResult = run(root, 'scripts/check-docs-gallery.mjs');
  assert.equal(rendererResult.status, 1);
  assert.match(rendererResult.stderr, /rendererCssSha256 changed/);
  write(root, renderer, original);
  fs.appendFileSync(path.join(root, 'scripts/capture-docs-gallery.mjs'), '\n// changed framing\n');
  const generatorResult = run(root, 'scripts/check-docs-gallery.mjs');
  assert.equal(generatorResult.status, 1);
  assert.match(generatorResult.stderr, /generatorFingerprint changed/);
});

test('Studio codec bundles are byte-identical in UTC, Berlin and Los Angeles', {
  skip: process.env.TOPOVIEWER_GALLERY_RUNTIME_TESTS !== '1'
}, async (t) => {
  assert.ok(fs.existsSync(path.join(galleryRoot, 'packages/topoviewer/dist/topoviewer.mjs')), 'build core before running the gallery runtime tests');
  const { root, card, refreshManifest } = await fixture(t, { runtime: true });
  let baseline;
  for (const TZ of ['UTC', 'Europe/Berlin', 'America/Los_Angeles']) {
    succeeded(run(root, 'scripts/sync-gallery.mjs', ['--bundles'], { TZ }));
    const bytes = ['zip', 'tvstudio'].map((extension) => fs.readFileSync(path.join(root, `docs/assets/gallery/${card.id}.${extension}`)));
    if (baseline) assert.deepEqual(bytes, baseline, `bundle bytes changed under ${TZ}`);
    else baseline = bytes;
    succeeded(run(root, 'scripts/sync-gallery.mjs', ['--bundles', '--check'], { TZ }));
  }
  refreshManifest();
  succeeded(run(root, 'scripts/check-docs-gallery.mjs', ['--runtime']));
  const sourceBundle = unzipSync(fs.readFileSync(path.join(root, `docs/assets/gallery/${card.id}.zip`)));
  assert.ok(sourceBundle['expected.yaml'], 'featured downloads include their fixture checks');
  const archivePath = `docs/assets/gallery/${card.id}.tvstudio`;
  write(root, archivePath, 'stale archive');
  const stale = run(root, 'scripts/sync-gallery.mjs', ['--bundles', '--check'], { TZ: 'America/Los_Angeles' });
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /Gallery output is stale/);
  assert.equal(fs.readFileSync(path.join(root, archivePath), 'utf8'), 'stale archive', 'bundle check must not rewrite stale outputs');
});
