import { expect, test } from '@playwright/test';
import { parse } from 'yaml';
import { editStyleAttribute, openStyleWorkspace } from '../support/basicStyle';
import { openCurrentProjectActions, openProjectManager, readStudioProjectArchive } from '../support/goldenAuthoringJourney';
import { selectStudioOption } from '../support/mui';
import { activateStudioPaletteTemplate, openPropertiesCodeDocument } from '../support/workbench';
import { expectEditorContains } from './helpers/monaco';

test.use({ viewport: { width: 1440, height: 1000 } });

// Keep this sequence and these values aligned with author/studio/first-project.md.
test('documented first project applies, saves, and reopens the same source and appearance', async ({ page }) => {
  await page.goto('/');
  await (await openProjectManager(page)).getByRole('button', { name: 'New project' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(0);
  await (await openCurrentProjectActions(page)).getByRole('menuitem', { name: 'Rename', exact: true }).click();
  const rename = page.getByRole('dialog', { name: /^Rename / });
  await rename.getByRole('textbox', { name: 'Project name' }).fill('First network');
  await rename.getByRole('button', { name: 'Rename', exact: true }).click();
  await expect(rename).toBeHidden();

  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');
  const edge = page.locator('.react-flow__node[data-id="router-1"]');
  const core = page.locator('.react-flow__node[data-id="router-2"]');
  for (const [node, label] of [[edge, 'Edge A'], [core, 'Core B']] as const) {
    await node.click();
    const properties = await openStyleWorkspace(page);
    await properties.getByRole('textbox', { name: 'Visible label', exact: true }).fill(label);
    await properties.getByRole('textbox', { name: 'Visible label', exact: true }).press('Enter');
    await expect(node).toContainText(label);
  }
  await edge.click();
  await core.click({ modifiers: ['ControlOrMeta'] });
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);
  await openPropertiesCodeDocument(page, 'topology');
  await expectEditorContains(page, 'topology', 'router-1');
  await expectEditorContains(page, 'topology', 'router-2');

  await edge.click();
  const appearance = await openStyleWorkspace(page);
  await editStyleAttribute(appearance, 'Shape');
  await selectStudioOption(page, appearance.getByRole('combobox', { name: 'Shape' }), 'roundRectangle');
  const source = await openPropertiesCodeDocument(page, 'stylesheet');
  await expectEditorContains(page, 'stylesheet', 'node[id = "router-1"]');
  await expectEditorContains(page, 'stylesheet', 'roundRectangle');
  await source.getByRole('button', { name: 'Apply stylesheet', exact: true }).click();
  await expect(source.getByRole('button', { name: 'Apply stylesheet', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved · recovery current');

  const actions = await openCurrentProjectActions(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    actions.getByRole('menuitem', { name: 'Export archive' }).click()
  ]);
  expect(download.suggestedFilename()).toBe('first-network.tvstudio');
  const archivePath = await download.path();
  if (!archivePath) throw new Error('Documented archive did not download.');
  const archive = await readStudioProjectArchive(archivePath);
  const topology = parse(archive.project.documents.topology.text);
  expect(topology.graph.nodes.map((node: { id: string; labels: { name: string } }) => [node.id, node.labels.name])).toEqual([
    ['router-1', 'Edge A'], ['router-2', 'Core B']
  ]);
  expect(topology.graph.links).toHaveLength(1);

  const projects = await openProjectManager(page);
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    projects.getByRole('button', { name: 'Open archive' }).click()
  ]);
  await chooser.setFiles(archivePath);
  await expect(projects).toBeHidden();
  await expect(page.locator('.react-flow__node')).toHaveCount(2);
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);
  await expect(edge).toContainText('Edge A');
  await expect(core).toContainText('Core B');
  await expect(edge.locator('[data-node-shape="roundRectangle"]').first()).toBeVisible();
  await openPropertiesCodeDocument(page, 'topology');
  await expectEditorContains(page, 'topology', 'router-1');
  await expectEditorContains(page, 'topology', 'router-2');
  const reopened = await openProjectManager(page);
  await expect(reopened.getByRole('listitem').filter({ hasText: 'First network' })).toHaveCount(2);
});
