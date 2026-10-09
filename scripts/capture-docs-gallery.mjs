#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import { createDocsStaticServer } from './lib/docs-static-server.mjs';
import { gallery, galleryCards, galleryRoot, galleryAssetRoot, galleryManifestPath, galleryExample, gallerySources, gallerySourceFingerprint, galleryHash, galleryRendererAssets, galleryCaptureProvenance } from './lib/docs-gallery.mjs';

fs.mkdirSync(galleryAssetRoot, { recursive: true });
const previewRoot = path.join(galleryRoot, '.artifacts/gallery-capture');
fs.mkdirSync(previewRoot, { recursive: true });
const { server, baseUrl } = await createDocsStaticServer({ siteRoot: galleryRoot, basePath: '/gallery' });
const browser = await chromium.launch();
const manifest = {
  version: 1,
  generator: 'scripts/capture-docs-gallery.mjs',
  ...galleryCaptureProvenance(),
  captures: []
};
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

try {
  for (const card of galleryCards) {
    const example = galleryExample(card);
    const sources = gallerySources(card);
    const url = (name) => `/gallery/${path.relative(galleryRoot, sources.find((file) => file.name === name).path).split(path.sep).join('/')}`;
    const height = card.height || 500;
    const render = example.render || {};
    const attributes = {
      'data-topology': url('topology.yaml'),
      'data-stylesheet': url('stylesheet.yaml'),
      'data-controls': render.controls !== false,
      'data-controls-open': false,
      'data-helper-lines': JSON.stringify(render.helperLines ?? true),
      ...(render.attention ? { 'data-attention': JSON.stringify(render.attention) } : {}),
      ...(render.selectedLayerIds ? { 'data-selected-layer-ids': JSON.stringify(render.selectedLayerIds) } : {})
    };
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escape(card.title)}</title><link rel="stylesheet" href="/gallery/${galleryRendererAssets.stylesheet}"><style>html,body{margin:0;width:1120px;height:${height}px;background:#0b1118}*{box-sizing:border-box}.topoviewer-embed{width:1120px;height:${height}px}</style></head><body><div class="topoviewer-embed topoviewer-parity-theme" ${Object.entries(attributes).map(([key, value]) => `${key}="${escape(value)}"`).join(' ')}></div><script src="/gallery/${galleryRendererAssets.javascript}"></script></body></html>`;
    fs.writeFileSync(path.join(previewRoot, `${card.id}.html`), html);
    const page = await browser.newPage({ viewport: { width: 1120, height }, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: 'reduce', locale: 'en-US', timezoneId: 'UTC' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${baseUrl}/gallery/.artifacts/gallery-capture/${card.id}.html`, { waitUntil: 'networkidle' });
    await expect(page.locator('.react-flow__node').first()).toBeVisible();
    await expect(page.locator('.topoviewer-error')).toHaveCount(0);
    await page.evaluate(async () => { await document.fonts.ready; await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
    const png = await page.locator('.topoviewer-embed').screenshot({ animations: 'disabled' });
    if (errors.length) throw new Error(`${card.id}: ${errors.join('; ')}`);
    fs.writeFileSync(path.join(galleryAssetRoot, `${card.id}.png`), png);
    manifest.captures.push({ id: card.id, path: `docs/assets/gallery/${card.id}.png`, width: 1120, height, sha256: galleryHash(png), sourceFingerprint: gallerySourceFingerprint(card) });
    console.log(`Captured gallery ${card.id}: 1120×${height}`);
    await page.close();
  }
  manifest.bundles = gallery.featured.flatMap((card) => ['zip', 'tvstudio'].map((extension) => {
    const name = `${card.id}.${extension}`;
    return { path: `docs/assets/gallery/${name}`, sha256: galleryHash(fs.readFileSync(path.join(galleryAssetRoot, name))) };
  }));
  fs.writeFileSync(path.join(galleryRoot, galleryManifestPath), `${JSON.stringify(manifest, null, 2)}\n`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
