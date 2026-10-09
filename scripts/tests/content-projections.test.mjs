import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../sync-docs-site.mjs', import.meta.url));

function snapshot(root) {
  return fs.readdirSync(root, { recursive: true }).sort().map((relative) => {
    const file = path.join(root, relative);
    return [relative, fs.statSync(file).isDirectory() ? null : fs.readFileSync(file, 'utf8')];
  });
}

test('projection check detects missing, changed and stale pages without changing files', (t) => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'topoviewer-doc-projections-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const docsRoot = path.join(temporary, 'docs');
  function run(check = false) {
    return spawnSync(process.execPath, [script, ...(check ? ['--check'] : [])], {
      encoding: 'utf8', env: { ...process.env, TOPOVIEWER_DOCS_ROOT: docsRoot }
    });
  }
  const absent = run(true);
  assert.equal(absent.status, 1, absent.stderr);
  assert.equal(fs.existsSync(docsRoot), false, 'check must not create missing directories');
  assert.equal(run().status, 0);
  assert.equal(run(true).status, 0);

  const projected = path.join(docsRoot, 'topoviewer');
  const manifestPath = path.join(projected, '.content-projection-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const [changed, missing] = manifest.files;
  fs.writeFileSync(path.join(projected, changed), 'stale projected content');
  fs.rmSync(path.join(projected, missing));
  manifest.files.push('obsolete.md');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  fs.writeFileSync(path.join(projected, 'obsolete.md'), 'removed canonical source');
  fs.mkdirSync(path.join(projected, 'empty-directory'));
  const before = snapshot(docsRoot);
  const drift = run(true);
  assert.equal(drift.status, 1, drift.stderr);
  for (const file of [changed, missing, 'obsolete.md', '.content-projection-manifest.json']) {
    assert.ok(drift.stderr.includes(file), `missing diagnostic for ${file}: ${drift.stderr}`);
  }
  assert.deepEqual(snapshot(docsRoot), before, 'check must not write, prune or remove empty directories');

  assert.equal(run().status, 0);
  assert.equal(fs.existsSync(path.join(projected, 'obsolete.md')), false);
  assert.equal(run(true).status, 0);
});
