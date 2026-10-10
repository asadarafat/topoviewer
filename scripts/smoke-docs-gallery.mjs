#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import { load } from 'js-yaml';
import { createDocsStaticServer, pagesBasePath } from './lib/docs-static-server.mjs';
import { gallery, galleryCards, galleryRoute, galleryRoot } from './lib/docs-gallery.mjs';

const siteRoot = path.join(galleryRoot, 'site');
const reviewRoot = path.join(galleryRoot, '.artifacts/gallery-review');
const desktop = { width: 1440, height: 1000 };
const mobile = { width: 390, height: 844 };
const failures = [];
const checks = [];
const downloads = new Map();
const browserErrors = new Set();
const networkNodes = (embed) => embed.locator('.react-flow__node-network:visible');
// Horizontal/vertical SVG groups have a zero-height/width bounding box even
// when their stroked paths are painted. Layer filtering removes their DOM nodes.
const edges = (embed) => embed.locator('.react-flow__edge');
const graphNode = (embed, id) => embed.locator(`.react-flow__node-network[data-id="${id}"]`);
const edge = (embed, id) => embed.locator(`.react-flow__edge[data-id="${id}"]`);

await fs.access(path.join(siteRoot, 'docs/mkdocs/topoviewer/examples/index.html')).catch(() => {
  throw new Error('Gallery smoke requires the assembled site/. Build both docs hosts and Studio first.');
});
await fs.mkdir(path.join(reviewRoot, 'downloads'), { recursive: true });

async function check(label, page, run) {
  try {
    await run();
    checks.push({ label, passed: true });
    console.log(`Gallery smoke passed: ${label}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${label}: ${message}`);
    checks.push({ label, passed: false, message });
    const failureName = label.replace(/[^a-z0-9]+/gi, '-');
    await page.screenshot({ path: path.join(reviewRoot, `${failureName}-failed.png`), fullPage: true }).catch(() => {});
    const geometry = await page.locator('.topoviewer-embed:visible').evaluateAll((roots) => roots.map((root) => {
      const bounds = (element) => {
        if (!element) return null;
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        topology: root.getAttribute('data-topology'),
        viewport: bounds(root.querySelector('.react-flow')),
        transform: root.querySelector('.react-flow__viewport')?.getAttribute('style'),
        nodes: [...root.querySelectorAll('.react-flow__node-network')].map((node) => ({ id: node.getAttribute('data-id'), bounds: bounds(node) }))
      };
    })).catch(() => []);
    await fs.writeFile(path.join(reviewRoot, `${failureName}-geometry.json`), JSON.stringify(geometry, null, 2));
    console.error(`Gallery smoke failed: ${label}: ${message}`);
  }
}

function watchPage(page, baseUrl) {
  page.setDefaultTimeout(15_000);
  page.setDefaultNavigationTimeout(30_000);
  page.on('pageerror', (error) => browserErrors.add(`${page.url()}: ${error.message}`));
  page.on('response', (response) => {
    if (response.url().startsWith(baseUrl) && response.status() >= 400) {
      browserErrors.add(`${response.status()} ${response.url()}`);
    }
  });
  page.on('requestfailed', (request) => {
    // A document navigation/download can intentionally abort the previous document.
    if (request.isNavigationRequest() && request.failure()?.errorText === 'net::ERR_ABORTED') return;
    if (request.url().startsWith(baseUrl)) browserErrors.add(`${request.failure()?.errorText} ${request.url()}`);
  });
}

async function setTheme(page, dark) {
  const scheme = dark ? 'slate' : 'default';
  if (await page.locator('body').getAttribute('data-md-color-scheme') !== scheme) {
    await page.locator(`label[title="Switch to ${dark ? 'dark' : 'light'} mode"]:visible`).click();
  }
  await expect(page.locator('body')).toHaveAttribute('data-md-color-scheme', scheme);
}

async function noHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth
  }));
  assert(overflow.document <= overflow.viewport + 1 && overflow.body <= overflow.viewport + 1,
    `Horizontal overflow: ${JSON.stringify(overflow)}`);
}

async function cardsFit(embed) {
  // Let initial fit, font loading, and tab resizing settle, but never repair the
  // view by invoking Fit: this check protects what readers actually open.
  await expect.poll(() => embed.evaluate((root) => {
    const viewport = root.querySelector('.react-flow')?.getBoundingClientRect();
    if (!viewport?.width) return ['Canvas has no width'];
    const nodes = [...root.querySelectorAll('.react-flow__node-network')]
      .filter((node) => node.getClientRects().length)
      .map((node) => ({ id: node.getAttribute('data-id'), box: node.getBoundingClientRect(), title: node.querySelector('.topoviewer-node-card-title') }));
    const controls = root.querySelector('.topoviewer-reactflow-controls')?.getBoundingClientRect();
    const problems = [];
    for (const { id, box, title } of nodes) {
      if (box.left < viewport.left - 1 || box.top < viewport.top - 1 || box.right > viewport.right + 1 || box.bottom > viewport.bottom + 1) {
        problems.push(`${id} is outside the canvas`);
      }
      if (title && title.scrollWidth > title.clientWidth + 1) problems.push(`${id} has a clipped card title`);
      if (controls && Math.min(box.right, controls.right) - Math.max(box.left, controls.left) > 1
        && Math.min(box.bottom, controls.bottom) - Math.max(box.top, controls.top) > 1) {
        problems.push(`${id} overlaps viewport controls`);
      }
    }
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i].box;
        const b = nodes[j].box;
        if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
          && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) {
          problems.push(`${nodes[i].id} overlaps ${nodes[j].id}`);
        }
      }
    }
    return problems;
  }), { message: 'Network cards must fit the initial viewport without overlapping', timeout: 15_000 }).toEqual([]);
}

async function readyEmbed(page, embed, count) {
  await expect(embed).toBeVisible();
  await expect(networkNodes(embed)).toHaveCount(count);
  await expect(page.locator('.topoviewer-error')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await cardsFit(embed);
}

async function captureHero(page, embed, name) {
  await embed.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  await page.mouse.move(0, 0);
  await embed.screenshot({ path: path.join(reviewRoot, `${name}.png`), animations: 'disabled' });
}

async function captureGallery(page, name) {
  await page.evaluate(async () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.screenshot({ path: path.join(reviewRoot, `${name}.png`), fullPage: true });
}

async function openControls(embed) {
  const open = embed.getByRole('button', { name: 'Show topology controls', exact: true });
  if (await open.isVisible()) await open.click();
  await expect(embed.getByRole('button', { name: 'Hide topology controls', exact: true })).toBeVisible();
}

async function closeControls(embed) {
  await embed.getByRole('button', { name: 'Hide topology controls', exact: true }).click();
}

async function clickEdge(page, target) {
  const location = await target.locator('.topoviewer-edge-visible-path').first().evaluate((element) => {
    const point = element.getPointAtLength(element.getTotalLength() * 0.4);
    const matrix = element.getScreenCTM();
    if (!matrix) throw new Error('Edge has no screen coordinates.');
    const screen = point.matrixTransform(matrix);
    return { x: screen.x, y: screen.y };
  });
  await page.mouse.click(location.x, location.y);
}

async function clickEmptyPane(page, embed) {
  const point = await embed.locator('.react-flow__pane').evaluate((pane) => {
    const box = pane.getBoundingClientRect();
    for (const [fx, fy] of [[0.98, 0.98], [0.02, 0.98], [0.02, 0.5], [0.5, 0.98], [0.02, 0.02]]) {
      const x = box.left + box.width * fx;
      const y = box.top + box.height * fy;
      if (document.elementFromPoint(x, y) === pane) return { x, y, target: pane.className };
    }
    throw new Error('No uncovered pane point is available for the documented background click.');
  });
  console.log(`Gallery background click: ${JSON.stringify(point)}`);
  await page.mouse.click(point.x, point.y);
}

async function saveArchive(page, host, card) {
  const link = page.locator(`a[href$="/${card.id}.tvstudio"]`).first();
  const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
  assert.equal(download.suggestedFilename(), `${card.id}.tvstudio`);
  const file = path.join(reviewRoot, 'downloads', `${host}-${card.id}.tvstudio`);
  await download.saveAs(file);
  assert.equal(await download.failure(), null);
  const served = await fs.readFile(file);
  assert(served.equals(await fs.readFile(path.join(galleryRoot, 'docs/assets/gallery', `${card.id}.tvstudio`))),
    `${host} served a stale ${card.id} archive`);
  downloads.set(`${host}-${card.id}`, file);
  const sourceLink = page.locator(`a[href$="/${card.id}.zip"]`).first();
  const sourceUrl = new URL(await sourceLink.getAttribute('href'), page.url()).href;
  const source = await page.request.get(sourceUrl);
  assert(source.ok(), `Source bundle failed: ${source.status()} ${sourceUrl}`);
  assert((await source.body()).equals(await fs.readFile(path.join(galleryRoot, 'docs/assets/gallery', `${card.id}.zip`))),
    `${host} served a stale ${card.id} source bundle`);
}

async function galleryLanding(page, url, host) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await setTheme(page, false);
  const cards = page.locator('.tv-gallery-card');
  await expect(cards).toHaveCount(9);
  await expect(page.locator('.tv-gallery-featured')).toHaveCount(3);
  for (let index = 0; index < galleryCards.length; index += 1) {
    const card = cards.nth(index);
    await expect(card).toHaveJSProperty('tagName', 'A');
    await expect(card.getByRole('heading', { level: 3 })).toHaveText(galleryCards[index].title);
    const image = card.locator('img');
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((item) => item.complete && item.naturalWidth > 0)).toBe(true);
    const response = await page.request.get(new URL(await card.getAttribute('href'), page.url()).href);
    assert(response.ok(), `${galleryCards[index].id} card target returned ${response.status()}`);
  }
  await page.keyboard.press('Tab');
  await cards.first().focus();
  for (let index = 0; index < galleryCards.length; index += 1) {
    const card = cards.nth(index);
    // Heading permalinks between sections are legitimate intermediate tab stops.
    for (let step = 0; step < 15 && !await card.evaluate((item) => item === document.activeElement); step += 1) {
      await page.keyboard.press('Tab');
    }
    await expect(card).toBeFocused();
    assert(await card.evaluate((item) => parseFloat(getComputedStyle(item).outlineWidth) >= 2),
      `Card has no visible keyboard focus: ${galleryCards[index].id}`);
    if (index + 1 < galleryCards.length) await page.keyboard.press('Tab');
  }
  await noHorizontalOverflow(page);
  await captureGallery(page, `${host}-gallery-light`);
  if (host === 'mkdocs') await page.screenshot({ path: path.join(reviewRoot, 'mkdocs-gallery-desktop.png') });
  await setTheme(page, true);
  await noHorizontalOverflow(page);
  await captureGallery(page, `${host}-gallery-dark`);
  await setTheme(page, false);
  await page.setViewportSize(mobile);
  await noHorizontalOverflow(page);
  for (const card of await cards.all()) {
    const bounds = await card.boundingBox();
    assert(bounds && bounds.x >= -1 && bounds.x + bounds.width <= mobile.width + 1, 'Mobile gallery card is clipped');
  }
  await captureGallery(page, `${host}-gallery-mobile`);
  await page.setViewportSize(desktop);
  await cards.first().focus();
  await Promise.all([
    page.waitForURL((value) => value.pathname.endsWith(galleryRoute(gallery.featured[0]))),
    page.keyboard.press('Enter')
  ]);
  await expect(page.locator('.topoviewer-embed').first().locator('.react-flow__node-network:visible')).toHaveCount(8);
}

async function fabric(page, host) {
  const embed = page.locator('.topoviewer-embed').first();
  await readyEmbed(page, embed, 10);
  await expect(edges(embed)).toHaveCount(16);
  await captureHero(page, embed, `${host}-fabric`);
  await openControls(embed);
  await embed.getByRole('checkbox', { name: 'Tenant 42 route', exact: true }).uncheck();
  await expect(edges(embed)).toHaveCount(12);
  await expect(networkNodes(embed)).toHaveCount(10);
  await expect(embed.locator('.react-flow__edge[data-id^="tenant-42-api-db:"]')).toHaveCount(0);
  await embed.getByRole('checkbox', { name: 'Tenant 42 route', exact: true }).check();
  await expect(edges(embed)).toHaveCount(16);
  await embed.getByRole('checkbox', { name: 'Port labels', exact: true }).check();
  await embed.getByRole('checkbox', { name: 'Sample utilization', exact: true }).check();
  const directions = embed.locator('.topoviewer-edge-direction-stroke[data-link-id="api-a-leaf-1"]');
  await expect(directions).toHaveCount(2);
  await expect(embed.getByText('18%', { exact: true })).toBeVisible();
  await expect(embed.getByText('4%', { exact: true })).toBeVisible();
  await embed.getByRole('checkbox', { name: 'Sample utilization', exact: true }).uncheck();
  await expect(directions).toHaveCount(0);
  await expect(embed.getByText('18%', { exact: true })).toHaveCount(0);
  await expect(edge(embed, 'api-a-leaf-1')).toHaveCount(1);
  await embed.getByRole('checkbox', { name: 'Sample utilization', exact: true }).check();
  await expect(directions).toHaveCount(2);
  await closeControls(embed);
  await clickEdge(page, edge(embed, 'tenant-42-api-db:1'));
  for (const id of ['api-a', 'leaf-1', 'spine-1', 'leaf-4', 'db-d']) {
    await expect(graphNode(embed, id).locator('[data-topoviewer-object-id]')).toHaveAttribute('aria-current', 'true');
  }
  await expect(graphNode(embed, 'spine-2').locator('[data-topoviewer-object-id]')).toHaveClass(/attention-dimmed/);
  await openControls(embed);
  await embed.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(embed.locator('.topoviewer-node-attention-focused')).toHaveCount(0);
  await closeControls(embed);
}

async function payments(page, host) {
  const states = [
    { tab: 'Normal · 14:02', file: 'topology.yaml', state: 'normal', via: 'ams-primary', p95: 42, color: 'rgb(51, 124, 118)' },
    { tab: 'Degraded · 14:07', file: 'degraded.yaml', state: 'impacted', via: 'ams-primary', p95: 860, color: 'rgb(146, 96, 24)' },
    { tab: 'Recovered · 14:09', file: 'recovered.yaml', state: 'protected', via: 'ams-protection', p95: 58, color: 'rgb(51, 124, 118)' }
  ];
  let positions;
  for (const snapshot of states) {
    await page.getByText(snapshot.tab, { exact: true }).click();
    const embed = page.locator(`.topoviewer-embed[data-topology$="/payments-journey/${snapshot.file}"]`);
    await readyEmbed(page, embed, 8);
    await expect(edges(embed)).toHaveCount(14);
    const response = await page.request.get(new URL(await embed.getAttribute('data-topology'), page.url()).href);
    assert(response.ok(), `Snapshot source failed: ${snapshot.file}`);
    const source = load(await response.text());
    const route = source.graph.paths.find((item) => item.id === 'payments-route');
    assert.equal(route.labels.state, snapshot.state);
    assert.equal(route.data.applicationP95Ms, snapshot.p95);
    assert(route.sequence.includes(snapshot.via));
    const currentPositions = source.graph.nodes.map(({ id, position }) => ({ id, position }));
    if (positions) assert.deepEqual(currentPositions, positions, 'Snapshot node identity or position drifted');
    else positions = currentPositions;
    await expect(edge(embed, 'payments-route:2').locator('.topoviewer-edge-visible-path').first()).toHaveCSS('stroke', snapshot.color);
    await expect(graphNode(embed, 'payments-api')).toContainText(`API p95 · ${snapshot.p95}ms`);
    if (snapshot.state !== 'normal') {
      assert.equal(source.graph.links.find((item) => item.id === 'primary-east').labels.state, 'down');
      await expect(edge(embed, 'primary-east').locator('.topoviewer-edge-visible-path').first()).toHaveCSS('stroke', 'rgb(182, 78, 91)');
    }
    await captureHero(page, embed, `${host}-payments-${snapshot.state}`);
    if (snapshot.state === 'impacted') {
      await clickEdge(page, edge(embed, 'primary-east'));
      await expect(graphNode(embed, 'checkout').locator('[data-topoviewer-object-id]')).not.toHaveAttribute('aria-current', 'true');
      await expect(edge(embed, 'primary-east').locator('.topoviewer-edge-visible-path').first()).toHaveClass(/attention-focused/);
      await clickEmptyPane(page, embed);
      await expect(graphNode(embed, 'checkout').locator('[data-topoviewer-object-id]')).toHaveAttribute('aria-current', 'true');
      await expect(edge(embed, 'payments-route:2').locator('.topoviewer-edge-visible-path').first()).toHaveClass(/attention-focused/);
    }
  }
  await page.getByText(states[0].tab, { exact: true }).click();
  const initial = page.locator('.topoviewer-embed').first();
  await openControls(initial);
  await initial.getByRole('checkbox', { name: 'Transport circuits', exact: true }).uncheck();
  await expect(edges(initial)).toHaveCount(6);
  await expect(networkNodes(initial)).toHaveCount(8);
  await initial.getByRole('checkbox', { name: 'Transport circuits', exact: true }).check();
  await expect(edges(initial)).toHaveCount(14);
  await closeControls(initial);
}

async function endpoint(page, host) {
  const embed = page.locator('.topoviewer-embed').first();
  await expect(embed).toHaveAttribute('data-topology', /endpoint-journey\/topology\.yaml$/);
  await readyEmbed(page, embed, 6);
  await expect(edges(embed)).toHaveCount(5);
  await captureHero(page, embed, `${host}-endpoint`);
  await graphNode(embed, 'aggregate:managed-runtime').click();
  await expect(networkNodes(embed)).toHaveCount(8);
  for (const id of ['toponode-leaf1', 'deploy-cx-eda-leaf1-sim', 'pod-cx-eda-leaf1-sim-777d7654d8-rj7vt']) {
    await expect(graphNode(embed, id)).toBeVisible();
  }
  const region = embed.locator('.react-flow__node-region[data-id="region:managed-runtime"]');
  await region.click({ position: { x: 8, y: 8 } });
  await expect(networkNodes(embed)).toHaveCount(6);
  await expect(graphNode(embed, 'aggregate:managed-runtime')).toBeVisible();
  await openControls(embed);
  await embed.getByRole('checkbox', { name: 'Managed runtime', exact: true }).uncheck();
  await expect(networkNodes(embed)).toHaveCount(4);
  await expect(edges(embed)).toHaveCount(3);
  await expect(graphNode(embed, 'svc-eda-api')).toBeVisible();
  await expect(graphNode(embed, 'deploy-eda-api')).toBeVisible();
  await embed.getByRole('checkbox', { name: 'Managed runtime', exact: true }).check();
  await expect(networkNodes(embed)).toHaveCount(6);
  await closeControls(embed);
}

async function importArchives(page, baseUrl) {
  assert.equal(downloads.size, 6, 'Both docs hosts must serve all three downloadable Studio projects');
  await page.goto(`${baseUrl}${pagesBasePath}/studio/`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
  const knownIds = { fabric: 'spine-1', payments: 'checkout', endpoint: 'svc-eda-api' };
  for (const card of gallery.featured) {
    await page.getByRole('button', { name: 'Project menu', exact: true }).click();
    const manager = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: 'Projects', exact: true })
    });
    await expect(manager).toBeVisible();
    await expect(manager.getByRole('button', { name: 'Open archive', exact: true })).toBeEnabled();
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      manager.getByRole('button', { name: 'Open archive', exact: true }).click()
    ]);
    await chooser.setFiles(downloads.get(`mkdocs-${card.id}`));
    await expect(manager).toBeHidden();
    await expect(page.locator(`.react-flow__node-network[data-id="${knownIds[card.id]}"]`)).toBeVisible();
    await page.getByRole('button', { name: 'Project menu', exact: true }).click();
    await expect(manager.getByRole('listitem').filter({ hasText: 'Current' })).toContainText(card.title);
    await page.keyboard.press('Escape');
    await expect(manager).toBeHidden();
    console.log(`Gallery archive imported in Studio: ${card.id}`);
  }
}

const { server, baseUrl } = await createDocsStaticServer({ siteRoot });
let browser;
try {
  browser = await chromium.launch();
  for (const host of ['mkdocs', 'zensical']) {
    const context = await browser.newContext({ viewport: desktop, reducedMotion: 'reduce', acceptDownloads: true });
    const page = await context.newPage();
    watchPage(page, baseUrl);
    const hostRoot = `${baseUrl}${pagesBasePath}/docs/${host}/`;
    await check(`${host} gallery`, page, () => galleryLanding(page, `${hostRoot}topoviewer/examples/`, host));
    await page.setViewportSize(desktop);
    for (const card of gallery.featured) {
      await check(`${host} ${card.id}`, page, async () => {
        await page.goto(`${hostRoot}${galleryRoute(card)}`, { waitUntil: 'domcontentloaded' });
        await setTheme(page, false);
        await ({ fabric, payments, endpoint })[card.id](page, host);
        await noHorizontalOverflow(page);
      });
      await check(`${host} ${card.id} downloads`, page, () => saveArchive(page, host, card));
    }
    await context.close();
    const narrowContext = await browser.newContext({ viewport: { width: 1024, height: 900 }, reducedMotion: 'reduce' });
    const narrowPage = await narrowContext.newPage();
    watchPage(narrowPage, baseUrl);
    for (const card of gallery.featured) {
      await check(`${host} ${card.id} initial 1024`, narrowPage, async () => {
        await narrowPage.goto(`${hostRoot}${galleryRoute(card)}`, { waitUntil: 'domcontentloaded' });
        await setTheme(narrowPage, false);
        const embed = narrowPage.locator('.topoviewer-embed').first();
        await readyEmbed(narrowPage, embed, { fabric: 10, payments: 8, endpoint: 6 }[card.id]);
        await noHorizontalOverflow(narrowPage);
        await captureHero(narrowPage, embed, `${host}-${card.id}-1024`);
      });
    }
    await narrowContext.close();
  }
  const studio = await browser.newPage({ viewport: desktop });
  watchPage(studio, baseUrl);
  await check('downloaded archives import into Studio', studio, () => importArchives(studio, baseUrl));
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}

if (browserErrors.size) failures.push(`Browser/resource errors:\n${[...browserErrors].join('\n')}`);
await fs.writeFile(path.join(reviewRoot, 'results.json'), JSON.stringify({ checks, browserErrors: [...browserErrors], failures }, null, 2));
if (failures.length) throw new Error(`Gallery smoke failed:\n${failures.join('\n\n')}`);
console.log(`Gallery acceptance passed on both docs hosts; screenshots and downloads: ${reviewRoot}`);
