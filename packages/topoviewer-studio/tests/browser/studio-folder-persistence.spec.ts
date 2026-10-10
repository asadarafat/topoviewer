import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test as base, type BrowserContext, type Page } from '@playwright/test';
import { activateStudioPaletteTemplate } from '../support/workbench';

const test = base.extend<{ launchFolderContext(): Promise<BrowserContext> }>({
  launchFolderContext: async ({ playwright, browserName, baseURL }, use) => {
    // Chromium 153 crashes when deserializing OPFS handles from IndexedDB in an
    // incognito context. A fresh normal profile exercises the real storage APIs
    // used by folder projects and also lets us verify a full browser restart.
    // Playwright still applies configured launch options and captures artifacts.
    const profile = await mkdtemp(join(tmpdir(), 'topoviewer-studio-folder-'));
    const contexts: BrowserContext[] = [];
    try {
      await use(async () => {
        const context = await playwright[browserName].launchPersistentContext(profile, { baseURL });
        contexts.push(context);
        return context;
      });
    } finally {
      try {
        await Promise.all(contexts.map((context) => context.close()));
      } finally {
        await rm(profile, { recursive: true, force: true });
      }
    }
  },
  context: async ({ launchFolderContext }, use) => {
    await use(await launchFolderContext());
  }
});

async function diskTopology(page: Page) {
  return page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const directory = await root.getDirectoryHandle('Folder project');
    return (await (await directory.getFileHandle('topology.yaml')).getFile()).text();
  });
}

async function recoveryCount(page: Page) {
  return page.evaluate(() => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('topoviewer-studio');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('recoveries', 'readonly');
      const count = transaction.objectStore('recoveries').count();
      count.onsuccess = () => resolve(count.result);
      count.onerror = () => reject(count.error);
      transaction.oncomplete = () => database.close();
    };
  }));
}

test.beforeEach(async ({ page }) => {
  // Use real structured-cloneable file handles. Only the user picker is replaced.
  await page.addInitScript(() => {
    Object.assign(window, {
      showDirectoryPicker: async () => (await navigator.storage.getDirectory()).getDirectoryHandle('Folder project')
    });
  });
  await page.goto('/');
  await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const directory = await root.getDirectoryHandle('Folder project', { create: true });
    for (const [name, text] of Object.entries({
      'topology.yaml': 'graph:\n  id: folder-project\n  nodes: []\n  links: []\n',
      'stylesheet.yaml': 'layout:\n  mode: manual\nstylesheet: []\n'
    })) {
      const writable = await (await directory.getFileHandle(name, { create: true })).createWritable();
      await writable.write(text);
      await writable.close();
    }
  });
  await page.getByRole('button', { name: 'Project menu' }).click();
  await page.getByRole('button', { name: 'Open folder', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Project menu' })).toContainText('Folder project');
});

test('restores real folder handles after reload and saves to the original directory', async ({ page }) => {
  await page.reload();
  await expect(page.getByRole('button', { name: 'Project menu' })).toContainText('Folder project');
  await activateStudioPaletteTemplate(page, 'router');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  await expect(page.locator('.studio-saved-state')).toHaveAttribute('data-status', 'saved');
  await expect.poll(() => diskTopology(page)).toContain('router-1');
});

test('restores recovery and folder access after closing and reopening the browser', async ({ page, context, launchFolderContext }) => {
  await activateStudioPaletteTemplate(page, 'router');
  await expect.poll(() => recoveryCount(page)).toBeGreaterThan(0);
  await context.close();

  const reopened = await launchFolderContext();
  const restored = await reopened.newPage();
  await restored.goto('/');
  await expect(restored.getByRole('button', { name: 'Project menu' })).toContainText('Folder project');
  await expect(restored.locator('.react-flow__node[data-id="router-1"]')).toBeVisible();
  // No picker is installed in the new browser: saving must use the persisted handle.
  await restored.getByRole('button', { name: 'Save project', exact: true }).click();
  await expect(restored.locator('.studio-saved-state')).toHaveAttribute('data-status', 'saved');
  await expect.poll(() => diskTopology(restored)).toContain('router-1');
});

test('reports external folder edits without overwriting them or losing the draft', async ({ page }) => {
  await activateStudioPaletteTemplate(page, 'router');
  await page.evaluate(async () => {
    const directory = await (await navigator.storage.getDirectory()).getDirectoryHandle('Folder project');
    const writable = await (await directory.getFileHandle('topology.yaml')).createWritable();
    await writable.write('graph:\n  id: externally-edited\n  nodes: []\n');
    await writable.close();
  });
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  await expect(page.locator('.studio-saved-state')).toHaveAttribute('data-status', 'conflict');
  expect(await diskTopology(page)).toContain('externally-edited');
  await expect(page.locator('.react-flow__node[data-id="router-1"]')).toBeVisible();
  await expect.poll(() => recoveryCount(page)).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('.react-flow__node[data-id="router-1"]')).toBeVisible();
  expect(await diskTopology(page)).toContain('externally-edited');
});
