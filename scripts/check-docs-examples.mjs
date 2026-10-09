#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { load } from 'js-yaml';
import { composeTopoViewerDocument, lintTopoDocument, compileTopoGraphResult } from '../packages/topoviewer/dist/topoviewer.mjs';
import { documentationBlocks, expandDocumentationSnippets } from './lib/docs-code-blocks.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pagesRoot = path.join(root, 'packages/topoviewer/content/pages');
const failures = [];
let parsed = 0;
let paired = 0;
let viewports = 0;
let mappers = 0;
let validators = 0;
const ajv = new Ajv({ allErrors: true, strict: false });
const validateMapper = ajv.compile(JSON.parse(fs.readFileSync(path.join(root, 'packages/topoviewer/schemas/topoviewer-mapper.schema.json'), 'utf8')));

function markdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(file) : entry.name.endsWith('.md') ? [file] : [];
  });
}

function viewportSource(page, reference) {
  const projectedPage = path.join(root, 'docs/topoviewer', path.relative(pagesRoot, page));
  const paths = [path.resolve(path.dirname(projectedPage), reference), path.resolve(root, 'docs/topoviewer', reference)];
  const file = paths.find((candidate) => fs.existsSync(candidate));
  if (!file) throw new Error(`Missing viewport source: ${reference}`);
  return load(fs.readFileSync(file, 'utf8'));
}

function checkValidator(source) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'topoviewer-doc-validator-'));
  try {
    // Run the published code unchanged while resolving the workspace package.
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(directory, 'node_modules'), 'dir');
    const script = path.join(directory, 'validate-topology.mjs');
    fs.writeFileSync(script, source);
    const fixture = path.join(root, 'packages/topoviewer/content/examples/graph/basic');
    const topology = path.join(fixture, 'topology.yaml');
    for (const name of ['stylesheet.yaml', 'stylesheet-tutorial.yaml']) {
      const result = spawnSync(process.execPath, [script, topology, path.join(fixture, name)], { encoding: 'utf8' });
      assert.equal(result.status, 0, `Documented validator rejects ${name}: ${result.stderr || result.stdout}`);
      assert.match(result.stdout, /Valid topology: 2 nodes, 1 links\./);
    }
    const broken = load(fs.readFileSync(topology, 'utf8'));
    broken.graph.links[0].target = 'MISSING';
    const brokenPath = path.join(directory, 'broken.yaml');
    fs.writeFileSync(brokenPath, JSON.stringify(broken));
    const result = spawnSync(process.execPath, [script, brokenPath, path.join(fixture, 'stylesheet.yaml')], { encoding: 'utf8' });
    assert.equal(result.status, 1, 'The documented validator must reject a missing endpoint.');
    assert.match(result.stdout, /broken-target.*MISSING/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

for (const page of markdownFiles(pagesRoot)) {
  const pairs = new Map();
  const label = path.relative(root, page);
  for (const block of documentationBlocks(fs.readFileSync(page, 'utf8'))) {
    if (!['yaml', 'yml', 'topoviewer'].includes(block.language) && block.marker?.kind !== 'validator') continue;
    try {
      const text = expandDocumentationSnippets(block.text, root);
      if (block.marker?.kind === 'validator') {
        assert.equal(block.language, 'js', 'The file-validator example must be JavaScript.');
        checkValidator(text);
        validators += 1;
        continue;
      }
      if (block.marker?.kind === 'invalid-yaml') {
        assert.throws(() => load(text), 'An intentional invalid YAML example must still fail parsing.');
        continue;
      }
      const value = load(text);
      parsed += 1;
      if (block.marker) {
        const { kind, id } = block.marker;
        assert.ok(['topology', 'stylesheet', 'viewport', 'mapper'].includes(kind), `Unknown YAML docs-check kind: ${kind}`);
        if (kind === 'mapper') {
          assert.ok(validateMapper(value), `Invalid mapper: ${ajv.errorsText(validateMapper.errors)}`);
          mappers += 1;
        } else {
          assert.ok(id, 'A topology, stylesheet, or viewport marker needs a pair ID.');
          const pair = pairs.get(id) || {};
          assert.ok(!pair[kind], `Duplicate ${kind} for ${id}`);
          pair[kind] = value;
          pairs.set(id, pair);
        }
      }
    } catch (error) {
      failures.push(`${label}:${block.line}: ${error.message}`);
    }
  }
  for (const [id, pair] of pairs) {
    try {
      assert.ok(pair.topology && pair.stylesheet, `${id} needs both complete source documents.`);
      const document = composeTopoViewerDocument(pair.topology, pair.stylesheet);
      const errors = lintTopoDocument(document).filter((issue) => issue.severity === 'error');
      assert.deepEqual(errors, [], `${id} has semantic errors: ${errors.map((issue) => issue.message).join('; ')}`);
      const result = compileTopoGraphResult(document);
      assert.equal(result.ok, true, `${id} must compile.`);
      assert.ok(result.graph.nodes.length > 0, `${id} must render visible objects; check layer definitions and membership.`);
      paired += 1;
      if (pair.viewport) {
        assert.deepEqual(viewportSource(page, pair.viewport.topology), pair.topology, `${id} live topology differs from the displayed YAML.`);
        assert.deepEqual(viewportSource(page, pair.viewport.stylesheet), pair.stylesheet, `${id} live stylesheet differs from the displayed YAML.`);
        viewports += 1;
      }
    } catch (error) {
      failures.push(`${label} (${id}): ${error.message}`);
    }
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Documentation examples passed: ${parsed} YAML blocks, ${paired} runnable pairs, ${viewports} matching live examples, ${mappers} mapper recipes, ${validators} executable file validator.`);
}
