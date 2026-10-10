#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

const [inventoryDir = 'eda-kubernetes-inventory', outputFile = 'topology.yaml'] = process.argv.slice(2);
const knownFiles = new Set(['services.json', 'deployments.json', 'replicasets.json', 'pods.json']);
const read = (file, fallback = { items: [] }) => {
  const filePath = path.join(inventoryDir, file);
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : fallback;
};
const items = (doc) => Array.isArray(doc?.items) ? doc.items : doc?.metadata?.name ? [doc] : [];
const slug = (value) => String(value ?? 'unknown').trim().toLowerCase()
  .replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
const id = (prefix, object) =>
  `${prefix}-${slug(object.metadata?.namespace ?? 'cluster')}-${slug(object.metadata?.name ?? object.kind)}`;
const empty = (item) => item === undefined || item === null || item === ''
  || (Array.isArray(item) && item.length === 0)
  || (typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 0);
const pick = (value) => Object.fromEntries(Object.entries(value).filter(([, item]) => !empty(item)));
const labels = (object) => object.metadata?.labels ?? {};
const role = (object, fallback) => labels(object).app ?? labels(object)['eda.nokia.com/app'] ?? fallback;
const match = (selector = {}, candidate = {}) =>
  Object.entries(selector).length > 0 && Object.entries(selector).every(([key, value]) => candidate[key] === value);
const ports = (specPorts = []) =>
  specPorts.map((port) => `${port.name ? `${port.name}:` : ''}${port.port}/${port.protocol ?? 'TCP'}`);
const status = (object) => {
  if (object.kind === 'Pod') {
    const ready = object.status?.conditions?.find((condition) => condition.type === 'Ready');
    return ready ? (ready.status === 'True' ? 'ready' : ready.status === 'False' ? 'not-ready' : 'unknown') : 'unknown';
  }
  if (object.kind === 'Deployment') {
    const desired = object.spec?.replicas ?? 1;
    if (desired === 0) return 'scaled-down';
    if (object.status?.observedGeneration === undefined || object.metadata?.generation === undefined
      || object.status.observedGeneration < object.metadata.generation) return 'unknown';
    return (object.status?.availableReplicas ?? 0) >= desired ? 'ready' : 'degraded';
  }
  return slug(object.status?.phase ?? object.status?.state ?? object.status?.operState ?? 'unknown');
};
const xy = (index, row) => [120 + (index % 8) * 170, rowOffsets[row] + Math.floor(index / 8) * 150];
const node = (object, prefix, objectType, index, row, data, layer = 'control-plane') => ({
  id: id(prefix, object),
  labels: pick({ name: object.metadata?.labels?.['app.kubernetes.io/name'] ?? object.metadata?.name ?? object.kind,
    object: objectType, namespace: object.metadata?.namespace, role: role(object, objectType), status: status(object) }),
  data: pick(data), layers: [layer], position: xy(index, row),
});
const region = (idValue, name, members, layers) =>
  ({ id: idValue, labels: { name, region: 'generated' }, members, layers });

const services = items(read('services.json'));
const deployments = items(read('deployments.json'));
const pods = items(read('pods.json'));
const replicaSets = items(read('replicasets.json'));
const sameNamespace = (a, b) => typeof a.metadata?.namespace === 'string' && a.metadata.namespace.length > 0
  && a.metadata.namespace === b.metadata?.namespace;
const extras = fs.existsSync(inventoryDir)
  ? fs.readdirSync(inventoryDir).filter((file) => file.endsWith('.json') && !knownFiles.has(file)).flatMap((file) => items(read(file)))
  : [];
let rowY = 110;
const rowOffsets = [services.length, deployments.length, replicaSets.length, pods.length,
  extras.filter(resource => !/networktopology|toponode/i.test(resource.kind ?? '')).length,
  extras.filter(resource => /networktopology|toponode/i.test(resource.kind ?? '')).length,
].map(count => { const start = rowY; if (count) rowY += Math.ceil(count / 8) * 150 + 100; return start; });
const serviceNodes = services.map((service, index) => node(service, 'svc', 'service', index, 0, {
  kind: service.kind, type: service.spec?.type, clusterIP: service.spec?.clusterIP,
  externalIPs: service.spec?.externalIPs, ports: ports(service.spec?.ports), selector: service.spec?.selector,
}));
const deploymentNodes = deployments.map((deployment, index) => node(deployment, 'deploy', 'deployment', index, 1, {
  kind: deployment.kind, replicas: deployment.status?.replicas, readyReplicas: deployment.status?.readyReplicas,
  selector: deployment.spec?.selector?.matchLabels,
  containers: deployment.spec?.template?.spec?.containers?.map((container) => container.name),
  images: deployment.spec?.template?.spec?.containers?.map((container) => container.image),
}));
const replicaSetNodes = replicaSets.map((resource, index) => node(resource, 'rs', 'replicaSet', index, 2, { kind: resource.kind, replicas: resource.status?.replicas, readyReplicas: resource.status?.readyReplicas }));
const podNodes = pods.map((pod, index) => node(pod, 'pod', 'pod', index, 3, {
  kind: pod.kind, pod: pod.metadata?.name, phase: pod.status?.phase, podIP: pod.status?.podIP,
  node: pod.spec?.nodeName, containers: pod.spec?.containers?.map((container) => container.name),
  images: pod.spec?.containers?.map((container) => container.image),
}));
const extraIndices = { control: 0, runtime: 0 };
const extraNodes = extras.map((resource) => {
  const layer = /networktopology|toponode/i.test(resource.kind ?? '') ? 'topology-runtime' : 'control-plane';
  return node(resource, `cr-${slug(resource.kind)}`, 'customResource', layer === 'topology-runtime' ? extraIndices.runtime++ : extraIndices.control++, layer === 'topology-runtime' ? 5 : 4,
    { kind: resource.kind, apiVersion: resource.apiVersion, status: resource.status }, layer);
});
const links = [];
services.forEach((service) => {
  pods.forEach((pod) => {
    if (sameNamespace(service, pod) && match(service.spec?.selector, labels(pod))) links.push({
      id: `${id('svc', service)}-selects-${id('pod', pod)}`,
      source: id('svc', service), target: id('pod', pod), labels: { name: 'selects Pods', link: 'selector' },
      data: { provenance: 'Service selector matches Pod labels; not a readiness or observed traffic claim.' }, layers: ['control-plane'],
    });
  });
  deployments.forEach((deployment) => {
    if (sameNamespace(service, deployment) && match(service.spec?.selector, deployment.spec?.template?.metadata?.labels)) links.push({
      id: `${id('svc', service)}-template-match-${id('deploy', deployment)}`,
      source: id('svc', service), target: id('deploy', deployment), labels: { name: 'template match', link: 'template-match' },
      data: { provenance: 'inferred', detail: 'Selector matches the Pod template. A Service selects Pods, not Deployments.' }, layers: ['control-plane'],
    });
  });
});
// Ownership requires captured UID references. Matching labels and object kinds
// alone cannot establish ownership, containment, or a Deployment-to-Pod chain.
const resources = [...services, ...deployments, ...replicaSets, ...pods, ...extras];
const nodes = [...serviceNodes, ...deploymentNodes, ...replicaSetNodes, ...podNodes, ...extraNodes];
const byUid = new Map(resources.flatMap((resource, index) => resource.metadata?.uid ? [[resource.metadata.uid, { resource, node: nodes[index] }]] : []));
resources.forEach((resource, index) => {
  (resource.metadata?.ownerReferences ?? []).forEach((reference) => {
    const owner = byUid.get(reference.uid);
    if (!owner || owner.resource.kind !== reference.kind || owner.resource.metadata?.name !== reference.name) return;
    if ((owner.resource.metadata?.namespace || ['Service', 'Deployment', 'ReplicaSet', 'Pod'].includes(owner.resource.kind))
      && !sameNamespace(owner.resource, resource)) return;
    links.push({
      id: `${owner.node.id}-owner-${nodes[index].id}`,
      source: owner.node.id, target: nodes[index].id, labels: { name: reference.controller ? 'controller owner' : 'owner', link: 'owns' },
      data: { provenance: 'metadata.ownerReferences', ownerUid: reference.uid }, layers: [...new Set([...owner.node.layers, ...nodes[index].layers])],
    });
  });
});
const regions = [
  region('region-services', 'Services', serviceNodes.map((item) => item.id), ['control-plane']),
  region('region-workloads', 'Workloads and Pods', [...deploymentNodes, ...replicaSetNodes, ...podNodes].map((item) => item.id), ['control-plane']),
  region('region-runtime', 'Topology runtime', extraNodes.filter((item) => item.layers.includes('topology-runtime')).map((item) => item.id), ['topology-runtime']),
].filter((item) => item.members.length > 0);
const graph = { id: 'kubernetes-inventory-service-map', data: { scope: 'Collected inventory; selector matches are not traffic traces. Only captured ownerReferences establish ownership.' }, layers: [
  { id: 'control-plane', labels: { name: 'Control plane' } }, { id: 'topology-runtime', labels: { name: 'Topology runtime' } },
], nodes, links, regions };
const attention = { aggregate: {
  groups: regions.map((item) => ({ id: item.id, by: 'region', regionId: item.id, label: item.labels.name })),
  expandedGroupIds: regions.map((item) => item.id), expandOnClick: true,
}};
fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, yaml.dump({ graph, attention }, { lineWidth: 120 }), 'utf8');
console.log(`Wrote ${graph.nodes.length} nodes, ${graph.links.length} links, ${regions.length} regions to ${outputFile}`);
