#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { readAuditResult, triageAudit } from './lib/dependency-audit.mjs';

const repoRoot = new URL('../', import.meta.url);
const exceptions = JSON.parse(fs.readFileSync(new URL('scripts/dependency-audit-exceptions.json', repoRoot), 'utf8'));
const lock = JSON.parse(fs.readFileSync(new URL('package-lock.json', repoRoot), 'utf8'));

function runAudit(args, label) {
  return readAuditResult(spawnSync('npm', ['audit', ...args, '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    shell: process.platform === 'win32'
  }), label);
}

try {
  const production = runAudit(['--omit=dev', '--audit-level=moderate'], 'production npm audit');
  if (production.metadata.vulnerabilities.total !== 0) {
    throw new Error('Production npm dependency audit failed. Shipped runtime dependencies must be fixed before public readiness.');
  }

  const full = runAudit(['--audit-level=moderate'], 'full npm audit');
  const failures = triageAudit(full, lock, exceptions);
  if (failures.length) {
    throw new Error(`Full npm audit found untriaged advisories:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
  }
  for (const name of Object.keys(full.vulnerabilities)) {
    console.log(`accepted temporary npm audit risk: ${name} (specific advisories; owner ${exceptions.owner}; expires ${exceptions.expires})`);
  }
  console.log(`Dependency audits passed: production clean; ${full.metadata.vulnerabilities.total} scoped temporary development advisory path(s).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
