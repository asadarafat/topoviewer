import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { documentationBlocks, expandDocumentationSnippets } from '../lib/docs-code-blocks.mjs';

test('nested Markdown demonstrations do not become standalone YAML blocks', () => {
  const source = '````markdown\n```yaml\nnot: [a complete example\n```\n````\n\n<!-- docs-check: topology small -->\n```yaml\ngraph: {}\n```';
  const blocks = documentationBlocks(source);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].language, 'markdown');
  assert.deepEqual(blocks[1].marker, { kind: 'topology', id: 'small' });
  assert.equal(blocks[1].line, 8);
  assert.equal(blocks[1].text, 'graph: {}');
});

test('indented fences keep YAML indentation and reject unclosed fences', () => {
  const source = '    ```yaml\n    graph:\n      nodes: []\n    ```';
  assert.equal(documentationBlocks(source)[0].text, 'graph:\n  nodes: []');
  assert.throws(() => documentationBlocks('```yaml\ngraph: {}'), /Unclosed/);
});

test('snippet expansion reads source, preserves indentation, and rejects cycles', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-snippets-'));
  try {
    fs.writeFileSync(path.join(root, 'topology.yaml'), 'graph:\n  nodes: []\n');
    assert.equal(expandDocumentationSnippets('  --8<-- "topology.yaml"', root), '  graph:\n    nodes: []');
    fs.writeFileSync(path.join(root, 'cycle.yaml'), '--8<-- "cycle.yaml"');
    assert.throws(() => expandDocumentationSnippets('--8<-- "cycle.yaml"', root), /Cyclic/);
    assert.throws(() => expandDocumentationSnippets('--8<-- "../outside.yaml"', root), /outside/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
