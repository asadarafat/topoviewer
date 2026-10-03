const severities = ['info', 'low', 'moderate', 'high', 'critical'];
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function readAuditResult(result, label) {
  if (result.error || result.signal || ![0, 1].includes(result.status)) {
    throw new Error(`${label} failed to complete: ${result.error?.message || result.signal || `exit ${result.status}`}`);
  }
  let audit;
  try {
    audit = JSON.parse(result.stdout);
  } catch {
    throw new Error(`${label} did not produce valid audit JSON.`);
  }
  if (!isObject(audit) || audit.error) {
    throw new Error(`${label} failed: ${audit?.error?.code || 'invalid report'} ${audit?.error?.summary || ''}`.trim());
  }
  const total = audit.metadata?.vulnerabilities?.total;
  if (audit.auditReportVersion !== 2 || !isObject(audit.vulnerabilities)
    || !Number.isInteger(total) || total < 0 || total !== Object.keys(audit.vulnerabilities).length
    || (result.status === 1 && total === 0)) {
    throw new Error(`${label} returned an incomplete or inconsistent audit report.`);
  }
  for (const [name, vulnerability] of Object.entries(audit.vulnerabilities)) {
    if (!isObject(vulnerability) || vulnerability.name !== name || !severities.includes(vulnerability.severity)
      || !Array.isArray(vulnerability.nodes) || !vulnerability.nodes.length
      || !vulnerability.nodes.every((node) => typeof node === 'string' && node.length)
      || !Array.isArray(vulnerability.via) || !vulnerability.via.length) {
      throw new Error(`${label} returned an incomplete vulnerability record for ${name}.`);
    }
  }
  return audit;
}

export function triageAudit(audit, lock, policy, now = new Date()) {
  const failures = [];
  if (!Object.keys(audit.vulnerabilities).length) return failures;
  if (!policy.owner || !/^\d{4}-\d{2}-\d{2}$/.test(policy.expires)
    || !Number.isFinite(Date.parse(`${policy.expires}T23:59:59.999Z`))
    || now.getTime() > Date.parse(`${policy.expires}T23:59:59.999Z`)) {
    return ['Development advisory exceptions are expired or lack an owner/expiry; review the current audit before renewing.'];
  }

  const inspect = (name, ancestors = new Set()) => {
    if (ancestors.has(name)) throw new Error(`cyclic advisory dependency at ${name}`);
    const vulnerability = audit.vulnerabilities[name];
    const accepted = policy.packages[name];
    if (!vulnerability || !accepted) throw new Error(`${name}: package is not an accepted development risk`);
    if (severities.indexOf(vulnerability.severity) > severities.indexOf(accepted.maxSeverity)) {
      throw new Error(`${name}: severity ${vulnerability.severity} exceeds reviewed ${accepted.maxSeverity}`);
    }
    for (const node of vulnerability.nodes) {
      const expectedVersion = accepted.nodes[node];
      const installed = lock.packages[node];
      if (!expectedVersion || !installed?.dev || installed.version !== expectedVersion) {
        throw new Error(`${name}: unreviewed install path/version ${node}@${installed?.version || 'unknown'}`);
      }
    }
    for (const via of vulnerability.via) {
      if (typeof via === 'string') {
        inspect(via, new Set([...ancestors, name]));
      } else {
        const advisory = isObject(via) && accepted.advisories?.[via.url];
        if (!advisory || via.name !== name || via.dependency !== name
          || via.range !== advisory.range || !severities.includes(via.severity)
          || severities.indexOf(via.severity) > severities.indexOf(advisory.maxSeverity)) {
          throw new Error(`${name}: unreviewed advisory ${via?.url || 'missing advisory identity'}, range, or severity`);
        }
      }
    }
  };
  for (const name of Object.keys(audit.vulnerabilities)) {
    try {
      inspect(name);
    } catch (error) {
      failures.push(error.message);
    }
  }
  return [...new Set(failures)];
}
