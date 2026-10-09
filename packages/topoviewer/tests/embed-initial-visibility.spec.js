import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const fixture = new URL('../content/examples/integration/payments-journey/', import.meta.url);

test('hidden embeds wait for dimensions, fit on first reveal, and preserve zoom when reopened', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/initial-visibility/topology.yaml', (route) => route.fulfill({
    contentType: 'application/yaml', body: fs.readFileSync(new URL('topology.yaml', fixture), 'utf8')
  }));
  await page.route('**/initial-visibility/stylesheet.yaml', (route) => route.fulfill({
    contentType: 'application/yaml', body: fs.readFileSync(new URL('stylesheet.yaml', fixture), 'utf8')
  }));
  await page.goto('/tests/fixtures/hidden-docs-embed.html');
  const embed = page.locator('.topoviewer-embed');
  await expect(embed.locator('.topoviewer-embed-viewport')).toBeAttached();
  await expect(embed.locator('.react-flow')).toHaveCount(0);
  await page.getByRole('button', { name: 'Show diagram', exact: true }).click();
  await expect(embed.locator('.react-flow__node-network')).toHaveCount(8);
  await expect.poll(() => embed.evaluate((root) => {
    const canvas = root.querySelector('.react-flow').getBoundingClientRect();
    return [...root.querySelectorAll('.react-flow__node-network')].every((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.left >= canvas.left - 1 && rect.top >= canvas.top - 1
        && rect.right <= canvas.right + 1 && rect.bottom <= canvas.bottom + 1;
    });
  })).toBe(true);
  const viewport = embed.locator('.react-flow__viewport');
  const fitted = await viewport.getAttribute('style');
  await embed.getByRole('button', { name: 'Zoom In', exact: true }).click();
  await expect(viewport).not.toHaveAttribute('style', fitted);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const zoomed = await viewport.getAttribute('style');
  await viewport.evaluate((element) => { element.dataset.preservedInstance = 'true'; });
  await page.getByRole('button', { name: 'Hide diagram', exact: true }).click();
  await expect(viewport).toBeHidden();
  await page.getByRole('button', { name: 'Show diagram', exact: true }).click();
  await expect(viewport).toBeVisible();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect(viewport).toHaveAttribute('data-preserved-instance', 'true');
  await expect(viewport).toHaveAttribute('style', zoomed);
  expect(errors).toEqual([]);
});
