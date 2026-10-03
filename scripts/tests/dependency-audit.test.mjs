import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { readAuditResult, triageAudit } from '../lib/dependency-audit.mjs';

const policy = JSON.parse(fs.readFileSync(new URL('../dependency-audit-exceptions.json', import.meta.url), 'utf8'));
const reviewedDate = new Date('2026-10-03T12:00:00Z');
const node = 'node_modules/react-router-dom-v5-compat/node_modules/react-router';
const lock = { packages: { [node]: { dev: true, version: '6.30.4' } } };
function report(vulnerabilities = {}) {
  return { auditReportVersion: 2, vulnerabilities, metadata: { vulnerabilities: { total: Object.keys(vulnerabilities).length } } };
}
function result(audit, status = Object.keys(audit.vulnerabilities || {}).length ? 1 : 0) {
  return { status, stdout: JSON.stringify(audit) };
}
function acceptedReport() {
  return report({ 'react-router': {
    name: 'react-router', severity: 'moderate', nodes: [node], via: [{
      name: 'react-router', dependency: 'react-router', severity: 'moderate',
      url: 'https://github.com/advisories/GHSA-wrjc-x8rr-h8h6', range: '>=6.0.0 <7.18.0'
    }]
  } });
}

test('accepts complete clean and known-vulnerability audit responses', () => {
  assert.deepEqual(readAuditResult(result(report()), 'audit'), report());
  assert.deepEqual(readAuditResult(result(acceptedReport()), 'audit'), acceptedReport());
});

test('fails closed on registry errors, invalid JSON, process failure and incomplete reports', () => {
  for (const invalid of [
    result({ error: { code: 'ENOTFOUND', summary: 'registry unavailable' } }, 1),
    result({ error: { code: 'E503' } }, 0),
    { status: 0, stdout: '{' }, { status: null, error: new Error('ENOENT') },
    { status: null, signal: 'SIGTERM' }, result(report(), 2), result(report(), 1),
    result({}), result({ vulnerabilities: {} }),
    result({ ...report(), metadata: { vulnerabilities: { total: 1 } } }),
    result(report({ 'react-router': { name: 'react-router' } }), 1)
  ]) assert.throws(() => readAuditResult(invalid, 'audit'));
});

test('accepts only a reviewed advisory on the reviewed development path/version', () => {
  assert.deepEqual(triageAudit(acceptedReport(), lock, policy, reviewedDate), []);
});

test('rejects new advisories, elevated severity, changed ranges and malformed advisory references', () => {
  for (const mutate of [
    (via) => { via.url = 'https://github.com/advisories/GHSA-new-untriaged'; },
    (via) => { via.severity = 'critical'; },
    (via) => { via.range = '*'; },
    (via) => { delete via.url; },
    (via) => { via.dependency = 'other-package'; }
  ]) {
    const audit = acceptedReport();
    mutate(audit.vulnerabilities['react-router'].via[0]);
    assert.notDeepEqual(triageAudit(audit, lock, policy, reviewedDate), []);
  }
  const audit = acceptedReport();
  audit.vulnerabilities['react-router'].via.push('missing-advisory-dependency');
  assert.notDeepEqual(triageAudit(audit, lock, policy, reviewedDate), []);
});

test('rejects changed dependency versions, production placement, paths and expired exceptions', () => {
  for (const changed of [
    { packages: { [node]: { dev: true, version: '6.30.5' } } },
    { packages: { [node]: { version: '6.30.4' } } }, { packages: {} }
  ]) assert.notDeepEqual(triageAudit(acceptedReport(), changed, policy, reviewedDate), []);
  assert.notDeepEqual(triageAudit(acceptedReport(), lock, policy, new Date('2026-11-03')), []);
  const audit = acceptedReport();
  audit.vulnerabilities['react-router'].nodes.push('node_modules/react-router');
  assert.notDeepEqual(triageAudit(audit, lock, policy, reviewedDate), []);
});

test('traces transitive findings to reviewed advisories instead of trusting package names', () => {
  const audit = acceptedReport();
  const compatNode = 'node_modules/react-router-dom-v5-compat';
  audit.vulnerabilities['react-router-dom-v5-compat'] = {
    name: 'react-router-dom-v5-compat', severity: 'moderate', nodes: [compatNode], via: ['react-router']
  };
  const withCompat = { packages: { ...lock.packages, [compatNode]: { dev: true, version: '6.30.4' } } };
  assert.deepEqual(triageAudit(audit, withCompat, policy, reviewedDate), []);
  audit.vulnerabilities['react-router'].via[0].url = 'https://github.com/advisories/NEW';
  assert.notDeepEqual(triageAudit(audit, withCompat, policy, reviewedDate), []);
});
