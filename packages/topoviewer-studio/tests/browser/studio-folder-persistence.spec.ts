import { expect, test, type Page } from '@playwright/test';
import { activateStudioPaletteTemplate } from '../support/workbench';

async function diskTopology(page: Page) {
  return page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const directory = await root.getDirectoryHandle('Folder project');
    return (await (await directory.getFileHandle('topology.yaml')).getFile()).text();
  });
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
  await expect.poll(() => page.evaluate(() => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('topoviewer-studio');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('recoveries', 'readonly');
      const count = transaction.objectStore('recoveries').count();
      count.onsuccess = () => resolve(count.result);
      transaction.oncomplete = () => database.close();
    };
  }))).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('.react-flow__node[data-id="router-1"]')).toBeVisible();
  expect(await diskTopology(page)).toContain('externally-edited');
});
