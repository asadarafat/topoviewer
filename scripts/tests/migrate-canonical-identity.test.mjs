import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const script = path.join(repoRoot, 'scripts/migrate-canonical-identity.mjs');

function fixture(t, topology, stylesheet) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'topoviewer-identity-gate-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'packages/topoviewer'), { recursive: true });
  fs.symlinkSync(path.join(repoRoot, 'packages/topoviewer/dist'), path.join(root, 'packages/topoviewer/dist'), 'dir');
  const topologyPath = path.join(root, 'topology.yaml');
  const stylesheetPath = path.join(root, 'stylesheet.yaml');
  fs.writeFileSync(topologyPath, topology);
  if (stylesheet !== undefined) fs.writeFileSync(stylesheetPath, stylesheet);
  return {
    topologyPath, stylesheetPath,
    run: (write = false) => spawnSync(process.execPath, [script, ...(write ? ['--write'] : []), 'topology.yaml'], { cwd: root, encoding: 'utf8' })
  };
}

function succeeds(result) {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
}

test('canonical folded SVG sources stay byte-identical in check and write mode', (t) => {
  const source = path.join(repoRoot, 'packages/topoviewer/content/examples/integration/payments-journey');
  const topology = fs.readFileSync(path.join(source, 'topology.yaml'), 'utf8');
  const stylesheet = fs.readFileSync(path.join(source, 'stylesheet.yaml'), 'utf8');
  const files = fixture(t, topology, stylesheet);
  succeeds(files.run());
  succeeds(files.run(true));
  assert.equal(fs.readFileSync(files.topologyPath, 'utf8'), topology);
  assert.equal(fs.readFileSync(files.stylesheetPath, 'utf8'), stylesheet);
});

test('legacy identity and presentation still fail check, migrate explicitly and become idempotent', (t) => {
  const topology = `# Keep this author comment\ngraph:\n  id: legacy\n  nodes:\n    - id: router-a\n      name: Router A\n      position: [100, 100]\n      style:\n        backgroundColor: '#123456'\n`;
  const files = fixture(t, topology);
  const check = files.run();
  assert.equal(check.status, 1);
  assert.match(check.stderr, /Canonical identity migration is required for 2 file\(s\)/);
  assert.equal(fs.readFileSync(files.topologyPath, 'utf8'), topology, 'check mode must not rewrite legacy source');
  assert.equal(fs.existsSync(files.stylesheetPath), false, 'check mode must not create the proposed stylesheet');
  succeeds(files.run(true));
  const migratedTopologyText = fs.readFileSync(files.topologyPath, 'utf8');
  const migratedStylesheetText = fs.readFileSync(files.stylesheetPath, 'utf8');
  const migratedTopology = parse(migratedTopologyText);
  const migratedStylesheet = parse(migratedStylesheetText);
  assert.equal(migratedTopology.version, '0.2');
  assert.equal(migratedTopology.graph.nodes[0].labels.name, 'Router A');
  assert.equal(migratedTopology.graph.nodes[0].name, undefined);
  assert.equal(migratedTopology.graph.nodes[0].style, undefined);
  assert.match(migratedTopologyText, /# Keep this author comment/);
  assert.equal(migratedStylesheet.stylesheet[0].selector, 'node[id = "router-a"]');
  assert.equal(migratedStylesheet.stylesheet[0].style.backgroundColor, '#123456');
  succeeds(files.run());
  succeeds(files.run(true));
  assert.equal(fs.readFileSync(files.topologyPath, 'utf8'), migratedTopologyText);
  assert.equal(fs.readFileSync(files.stylesheetPath, 'utf8'), migratedStylesheetText);
});

test('canonical-looking invalid documents still fail validation', (t) => {
  const files = fixture(t, 'version: "0.2"\ngraph:\n  nodes:\n    - id: invalid\n      position: [bad, 20]\n', 'version: "0.2"\nstylesheet: []\n');
  const check = files.run();
  assert.equal(check.status, 1);
  assert.match(check.stderr, /position|invalid/i);
});
