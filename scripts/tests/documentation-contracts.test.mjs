import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { load } from 'js-yaml';
import { npmInstallCommands, npmInstallCommandProblems, adoptionGuideProblems } from '../lib/documentation-contracts.mjs';

const root = new URL('../../', import.meta.url);
const requiredPeers = ['@xyflow/react', 'react', 'react-dom'];
const install = 'npm install topoviewer @xyflow/react react react-dom';
const problems = (command, extra = {}) => npmInstallCommandProblems(command, { requiredPeers, ...extra });
const adoption = fs.readFileSync(new URL('packages/topoviewer/content/pages/evaluate/adopt-topoviewer-or-keep-topology-locked-to-a-surface.md', root), 'utf8');

test('documented npm installs accept extra packages, reordered peers, pins and comments', () => {
  for (const command of [
    install,
    `${install} js-yaml`,
    'npm install js-yaml react-dom@19.2.0 topoviewer@0.5.0 react@19.2.0 @xyflow/react@^12.10.0',
    `npm i --save-exact 'topoviewer' "@xyflow/react" react react-dom`,
    `${install} # YAML validation also needs js-yaml`
  ]) assert.deepEqual(problems(command), [], command);
});

test('command extraction ignores prose, other package managers and shell/HTML comments', () => {
  assert.deepEqual(npmInstallCommands([
    '# npm install topoviewer',
    '  # npm install topoviewer',
    '<!-- npm install topoviewer -->',
    'pnpm install topoviewer',
    'pip install topoviewer',
    'An npm install description is not a command.',
    'echo npm install topoviewer',
    `Run \`${install}\` in your project.`,
    'npm install topoviewer \\',
    '  @xyflow/react react react-dom js-yaml'
  ].join('\n')), [install, `${install} js-yaml`]);
});

test('ignoring HTML comments never joins command or package fragments', () => {
  assert.deepEqual(npmInstallCommands('n<!-- note -->pm install topoviewer'), []);
  const [command] = npmInstallCommands('npm install topoviewer @xyflow/react re<!-- note -->act react-dom');
  assert.ok(problems(command).includes('Missing required package: react'));
  const [multiline] = npmInstallCommands('npm install topoviewer<!--\r\neditor note\r\n--> @xyflow/react react react-dom');
  assert.equal(multiline, 'npm install topoviewer');
  assert.ok(problems(multiline).includes('Missing required package: @xyflow/react'));
});

test('missing peers and wrong package names remain errors even when extras are present', () => {
  for (const missing of ['topoviewer', ...requiredPeers]) {
    const command = `npm install ${['topoviewer', ...requiredPeers].filter((name) => name !== missing).join(' ')} js-yaml`;
    assert.ok(problems(command).includes(`Missing required package: ${missing}`), command);
  }
  assert.ok(problems('npm install topoviewer @xyflow/react react reactdom js-yaml').includes('Missing required package: react-dom'));
  assert.ok(problems('npm install mkdocs-topoviewer @xyflow/react react react-dom').includes('Missing required package: topoviewer'));
  assert.ok(problems('npm install topoviewer@npm:other-package @xyflow/react react react-dom').length);
  assert.ok(problems('pip install topoviewer').length);
});

test('source tarballs stay explicitly restricted to approved release/preflight commands', () => {
  const tarball = '/tmp/topoviewer-pack/topoviewer-0.5.0.tgz';
  const command = `npm install ${tarball} react @xyflow/react react-dom js-yaml`;
  assert.ok(problems(command).length);
  assert.deepEqual(problems(command, { allowedTarballs: [tarball] }), []);
  assert.ok(problems(command.replace('0.5.0', '9.9.9'), { allowedTarballs: [tarball] }).length);
});

function installFixture(t) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'topoviewer-install-docs-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(temporary, file)), { recursive: true });
    fs.writeFileSync(path.join(temporary, file), text);
  };
  for (const file of ['scripts/check-install-commands.mjs', 'scripts/lib/documentation-contracts.mjs', 'scripts/lib/docs-code-blocks.mjs']) {
    write(file, fs.readFileSync(new URL(file, root)));
  }
  fs.symlinkSync(fileURLToPath(new URL('node_modules', root)), path.join(temporary, 'node_modules'), 'dir');
  write('packages/topoviewer/package.json', JSON.stringify({ version: '0.5.0', peerDependencies: Object.fromEntries(requiredPeers.map((name) => [name, '*'])) }));
  for (const file of [
    'packages/mkdocs-topoviewer/README.md',
    'packages/topoviewer/content/pages/examples/use-cases/mkdocs.md',
    'docs/topoviewer/examples/use-cases/mkdocs.md'
  ]) write(file, '```bash\npip install mkdocs-topoviewer\n```\n');
  const run = () => spawnSync(process.execPath, ['scripts/check-install-commands.mjs', '--docs-only'], { cwd: temporary, encoding: 'utf8' });
  return { write, run };
}

test('install docs gate permits legitimate npm extras and public Python installs in a new guide', (t) => {
  const { write, run } = installFixture(t);
  write('docs/topoviewer/start/first-topology.md', `\`\`\`bash\npython -m pip install mkdocs-topoviewer mkdocs-material\n${install} js-yaml\n\`\`\`\n`);
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /documented install command checks passed/);
});

test('install docs gate still rejects missing peers, wrong Python packages and leaked editable installs', (t) => {
  const { write, run } = installFixture(t);
  for (const [command, expected] of [
    ['npm install topoviewer react react-dom js-yaml', /Missing required package: @xyflow\/react/],
    ['pip install topoviewer', /wrong MkDocs package/],
    ['pip install -e packages/mkdocs-topoviewer', /local editable MkDocs install leaked/]
  ]) {
    write('docs/topoviewer/start/first-topology.md', `\`\`\`bash\n${command}\n\`\`\`\n`);
    const result = run();
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, expected);
  }
});

test('adoption checks accept editorial rewrites while preserving actionable contracts', () => {
  assert.deepEqual(adoptionGuideProblems(adoption), []);
  const reworded = adoption.replace(/^#+ .+$/gm, '## Reworded section');
  assert.deepEqual(adoptionGuideProblems(reworded), []);
  assert.ok(adoptionGuideProblems('## Why The YAML Bundle Matters\n## Final Position').length);
});

test('adoption checks ignore commented contracts without joining links or shifting diagnostics', () => {
  const hidden = adoptionGuideProblems([
    '<!--',
    '[Status](integration-roadmap.md)',
    'topology.yaml',
    '```topoviewer',
    'topology: examples/integration/adoption-portability/topology.yaml',
    'stylesheet: examples/integration/adoption-portability/stylesheet.yaml',
    '```',
    '-->'
  ].join('\n'));
  assert.ok(hidden.includes('Missing adoption guidance link: integration-roadmap.md'));
  assert.ok(hidden.includes('Missing portable bundle document: topology.yaml'));
  assert.ok(hidden.includes('Missing runnable TopoViewer adoption example.'));
  assert.ok(adoptionGuideProblems(adoption.replace('integration-roadmap.md', 'integration-road<!-- note -->map.md'))
    .includes('Missing adoption guidance link: integration-roadmap.md'));

  const note = '<!-- editor note\r\nnot a guide\r\n-->\r\n';
  assert.deepEqual(adoptionGuideProblems(note + adoption), []);
  const openingLine = adoption.split('\n').indexOf('```topoviewer') + 1;
  const invalid = adoptionGuideProblems(note + adoption.replace(/^stylesheet: .+$/m, 'style: missing.yaml'));
  assert.ok(invalid.includes(`Adoption example at line ${openingLine + 3} needs an examples/ YAML stylesheet reference.`));
});

test('adoption checks reject missing support/trial links and broken runnable examples', () => {
  assert.ok(adoptionGuideProblems(adoption.replace('integration-roadmap.md#status-summary', 'missing-status.md'))
    .some((problem) => problem.includes('integration-roadmap.md')));
  assert.ok(adoptionGuideProblems(adoption.replace('../examples/use-cases/mkdocs.md', 'wrong-host.md'))
    .some((problem) => problem.includes('mkdocs.md')));
  assert.ok(adoptionGuideProblems(adoption.replace(/^stylesheet: .+$/m, 'style: missing.yaml'))
    .some((problem) => problem.includes('stylesheet reference')));
  assert.ok(adoptionGuideProblems(adoption.replace(/^topology: .+$/m, 'topology: ['))
    .some((problem) => problem.includes('Invalid adoption example')));
  assert.ok(adoptionGuideProblems(adoption, { sourceExists: () => false })
    .some((problem) => problem.includes('Missing adoption example source')));
  assert.ok(adoptionGuideProblems(adoption.replace('```topoviewer', '```text'))
    .some((problem) => problem.includes('Missing runnable')));
});

const security = load(fs.readFileSync(new URL('.github/workflows/security.yml', root), 'utf8'));
const scannerJob = security.jobs['dependency-and-secret-checks'];
const scanner = (name) => scannerJob.steps.find((step) => step.name === name);
function eligible(step, overrides = {}, cancelled = false) {
  const steps = Object.fromEntries(scannerJob.steps.filter((item) => item.id)
    .map((item) => [item.id, { outcome: overrides[item.id] || 'success' }]));
  if (!step.if) return false; // Default success() would skip after another failure.
  const expression = step.if.replace(/^\$\{\{\s*|\s*\}\}$/g, '');
  return Function('steps', 'cancelled', `return (${expression})`)(steps, () => cancelled);
}

test('documentation readiness runs separately and cannot suppress required security scans', () => {
  assert.equal(scannerJob.needs, undefined);
  assert.ok(security.jobs['public-readiness']);
  assert.equal(security.jobs['public-readiness'].needs, undefined);
  assert.ok(!scannerJob.steps.some((step) => step.run?.includes('ci:public-readiness')));
  for (const name of ['npm dependency advisory triage', 'Go vulnerability check', 'Secret scan']) {
    const step = scanner(name);
    assert.ok(step, name);
    assert.equal(step['continue-on-error'], undefined, `${name} must still fail the job`);
    assert.equal(eligible(step), true, `${name} must run after an unrelated failure`);
    assert.equal(eligible(step, {}, true), false, `${name} must stop on cancellation`);
  }
  assert.equal(scannerJob['continue-on-error'], undefined);
  assert.equal(eligible(scanner('npm dependency advisory triage'), { dependencies: 'failure' }), false);
  assert.equal(eligible(scanner('Go vulnerability check'), { dependencies: 'failure' }), true);
  assert.equal(eligible(scanner('Go vulnerability check'), { go: 'failure' }), false);
  assert.equal(eligible(scanner('Secret scan'), { dependencies: 'failure', go: 'failure' }), true);
  assert.equal(eligible(scanner('Secret scan'), { checkout: 'failure' }), false);
});

test('security health report records documentation readiness separately from scanner success', (t) => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'topoviewer-security-report-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('scripts/write-security-health-report.mjs', root))], {
    cwd: temporary,
    encoding: 'utf8',
    env: { ...process.env, SECURITY_JOB_DEPENDENCY_AND_SECRET_CHECKS: 'success', SECURITY_JOB_PUBLIC_READINESS: 'failure' }
  });
  assert.equal(result.status, 0, result.stderr);
  const report = fs.readFileSync(path.join(temporary, '.artifacts/security-health/security-health-report.md'), 'utf8');
  assert.ok(report.includes('| Dependency, Go, and secret checks | success |'));
  assert.ok(report.includes('| Public readiness guardrails | failure |'));
  assert.ok(security.jobs['security-health-report'].needs.includes('public-readiness'));
  const reportStep = security.jobs['security-health-report'].steps.find((step) => step.run === 'npm run security:health-report');
  assert.equal(reportStep.env.SECURITY_JOB_PUBLIC_READINESS, '${{ needs.public-readiness.result }}');
});
