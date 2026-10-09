import { expect, test, type Locator, type Page } from '@playwright/test';
import { openMapperCode, openPropertiesCodeDocument, openStudioWorkspace, waitForStudioCanvasGeometry } from '../support/workbench';
import { expectEditorContains, replaceEditorMatch } from './helpers/monaco';
import { invokeStudioHeaderAction } from '../support/headerActions';

async function dragNode(page: Page, node: Locator) {
  const box = await node.boundingBox();
  if (!box) throw new Error('Node is not visible');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 45, y + 30, { steps: 10 });
  await page.mouse.up();
}

test('unapplied topology YAML prevents canvas movement and resumes after Apply', async ({ page }) => {
  await page.goto('/?__studio-test-state=overlay');
  const source = await openPropertiesCodeDocument(page, 'topology');
  await waitForStudioCanvasGeometry(page);
  const node = page.locator('.react-flow__node[data-id="spine"]');
  const canvas = page.getByTestId('studio-canvas');
  await expect(node).toHaveClass(/draggable/);
  const originalPosition = await node.evaluate((element) => (element as HTMLElement).style.transform);
  await replaceEditorMatch(page, 'topology', 'name: Spine', 'name: Draft spine');
  await expect(canvas).toHaveAttribute('data-source-edit-blocked', 'topology');
  await expect(node).not.toHaveClass(/draggable/);
  await expect(canvas.getByRole('status')).toContainText('Apply or revert the topology YAML draft');
  await waitForStudioCanvasGeometry(page);
  const renderCount = await canvas.getAttribute('data-render-count');
  await page.keyboard.insertText('!');
  await expectEditorContains(page, 'topology', 'Draft spine!');
  await expect(canvas).toHaveAttribute('data-render-count', renderCount!);
  await dragNode(page, node);
  await expect.poll(() => node.evaluate((element) => (element as HTMLElement).style.transform)).toBe(originalPosition);
  await source.getByRole('button', { name: 'Apply topology', exact: true }).click();
  await expect(canvas).not.toHaveAttribute('data-source-edit-blocked', 'topology');
  await expect(node).toHaveClass(/draggable/);
  await expect(node).toContainText('Draft spine!');
  await expect.poll(() => node.evaluate((element) => (element as HTMLElement).style.transform)).toBe(originalPosition);
  await expectEditorContains(page, 'topology', 'position: [180, 260]');
  await waitForStudioCanvasGeometry(page);
  await dragNode(page, node);
  await expect.poll(() => node.evaluate((element) => (element as HTMLElement).style.transform)).not.toBe(originalPosition);
  await expectEditorContains(page, 'topology', 'position: [180, 260]', false);
  await expectEditorContains(page, 'topology', 'Draft spine');
});

test('mapper file export blocks unapplied YAML and exports the accepted revision after Apply', async ({ page }) => {
  await page.goto('/');
  const mapper = await openStudioWorkspace(page, 'Mapper');
  await mapper.getByRole('textbox', { name: 'Metric', exact: true }).fill('original_metric');
  await mapper.getByRole('button', { name: 'Create rule' }).click();
  const source = await openMapperCode(page);
  await replaceEditorMatch(page, 'mapper', 'original_metric', 'accepted_metric');
  const downloads: string[] = [];
  page.on('download', (download) => downloads.push(download.suggestedFilename()));
  const workspace = await openStudioWorkspace(page, 'Mapper');
  await workspace.getByRole('button', { name: 'Mapper actions' }).click();
  await page.getByRole('menuitem', { name: 'Export mapper' }).click();
  await expect(page.getByText('Apply or revert the mapper source draft before exporting.', { exact: true }).first()).toBeVisible();
  expect(downloads).toEqual([]);
  await source.getByRole('button', { name: 'Apply mapper', exact: true }).click();
  await workspace.getByRole('button', { name: 'Mapper actions' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: 'Export mapper' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  if (!stream) throw new Error('Missing mapper download');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString('utf8');
  expect(text).toContain('accepted_metric');
  expect(text).not.toContain('original_metric');
  expect(downloads).toEqual(['mapper.yaml']);
});

test('Undo preserves applied invalid YAML until Revert and retains the history entry', async ({ page }) => {
  await page.goto('/?__studio-test-state=overlay');
  const source = await openPropertiesCodeDocument(page, 'topology');
  const node = page.locator('.react-flow__node[data-id="spine"]');
  await replaceEditorMatch(page, 'topology', 'name: Spine', 'name: Renamed spine');
  await source.getByRole('button', { name: 'Apply topology', exact: true }).click();
  await expect(node).toContainText('Renamed spine');
  await page.getByLabel('topology YAML editor').focus();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.insertText('graph: [');
  await source.getByRole('button', { name: 'Apply topology', exact: true }).click();
  await expect(page.locator('.studio-saved-state')).toHaveAttribute('data-status', 'invalid-draft');
  // Invalid Apply transfers ownership from the transient editor draft to the
  // session's invalid draft; Undo must protect both forms of pending source.
  await expect(source.getByRole('button', { name: 'Revert invalid draft', exact: true })).toBeVisible();
  await invokeStudioHeaderAction(page, 'Undo');
  await expect(page.getByText(/Apply or revert the invalid topology draft/).first()).toBeVisible();
  await expect(page.locator('.studio-saved-state')).toHaveAttribute('data-status', 'invalid-draft');
  await expectEditorContains(page, 'topology', 'graph: [');
  await expect(node).toContainText('Renamed spine');
  await source.getByRole('button', { name: 'Revert invalid draft', exact: true }).click();
  await expectEditorContains(page, 'topology', 'name: Renamed spine');
  await invokeStudioHeaderAction(page, 'Undo');
  await expectEditorContains(page, 'topology', 'name: Spine');
  await expectEditorContains(page, 'topology', 'Renamed spine', false);
  await expect(node).toContainText('Spine');
});
